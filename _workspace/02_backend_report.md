# 02. Backend Implementation Report

## 개요
YT 리조트 예약 시스템의 백엔드(Spring Boot)가 architect 설계 문서(`_workspace/01_architect_*.md`)에 맞춰 구현되었습니다.

- 경로: `apps/api/`
- 스택: Spring Boot 3.3.4, Java 17, Gradle, PostgreSQL, JPA(ddl-auto=update), Flyway, Spring Security + JWT(jjwt 0.12.6), BCrypt

## 구현된 엔드포인트

| # | Method | Path | Auth | 설명 |
|---|--------|------|:---:|------|
| 1 | POST | `/api/auth/signup` | × | 회원가입 + 즉시 JWT 발급. 응답: `{ token, user: { id, loginId, name, memberType } }` |
| 2 | POST | `/api/auth/login` | × | 로그인. 응답: `{ token }` (사용자 정보는 `/me`로) |
| 3 | GET  | `/api/users/me` | ○ | 사용자 최소정보. 응답: `{ id, loginId, name, memberType }` |
| 4 | GET  | `/api/rooms` | × | 전체 객실 목록. 응답: `{ rooms: RoomSummary[] }` |
| 5 | GET  | `/api/rooms/{roomCode}` | × | 객실 상세 (부가 필드 하드코딩 포함). 응답: `RoomDetail` |
| 6 | POST | `/api/reservations` | ○ | 예약 생성. 201 + `ReservationDetail`. 재고 -1 (pessimistic lock) |
| 7 | GET  | `/api/reservations` | ○ | 본인 예약 목록. 응답: `{ reservations: ReservationDetail[] }` |

응답 shape은 `_workspace/01_architect_api_spec.md`와 1:1 일치 (camelCase, `memberTypeSnapshot → memberType`, `priceSnapshot → price` 변환 포함).

## 주요 구현 사항

### 인증/인가
- `JwtService` (HS256, sub=loginId, 24h 만료, memberType 클레임 포함).
- `JwtAuthenticationFilter`가 `Authorization: Bearer <token>` 파싱 후 `SecurityContext`에 설정.
- `/api/users/**`, `/api/reservations/**`는 인증 필수. 나머지는 공개.
- 401/403은 `RestAuthenticationEntryPoint` / `RestAccessDeniedHandler`가 공통 shape `{ code, message, field? }`로 응답.
- BCrypt strength=10 비밀번호 해싱.

### 회원가입
- `ownerNumber`가 `YT-\d{4}-\d{4}` 형식이면 OWNER, 공백/미입력은 GENERAL.
- 빈 문자열은 서버에서 `null`로 정규화 후 저장.
- `loginId` 중복 → 409 CONFLICT (field=loginId), `ownerNumber` 중복 → 409 CONFLICT (field=ownerNumber).
- `phone`은 저장 시 `010-1234-5678` 형태로 정규화.

### 예약 생성
- KST 기준 `LocalDate.now(Asia/Seoul)`로 `stayDate` 과거 여부 검증.
- `roomRepository.findWithLockByRoomCode(...)`로 PESSIMISTIC_WRITE 락 획득 후 재고 검사·차감.
- 회원유형 적합성 (`allowedMemberTypes`) + 가격 존재(`priceFor()`) + `guestCount` 범위(`1..room.capacity`) 검증.
- 예약번호: `YTYYYYMMDD-XXXX` (4자리 랜덤, 충돌 시 최대 3회 재시도).
- `memberTypeSnapshot`, `priceSnapshot` 저장 후 응답에서는 `memberType`, `price`로 매핑.

### DB / Flyway
- 마이그레이션: `apps/api/src/main/resources/db/migration/`
  - V1_1__create_users.sql
  - V1_2__create_rooms.sql
  - V1_3__create_reservations.sql
  - V1_4__seed_rooms.sql (6개 객실 시드)
- `allowed_member_types`는 VARCHAR(50) CSV + `MemberTypeListConverter` (JPA AttributeConverter).

### 에러 코드 (전역)
- `VALIDATION` (400), `UNAUTHORIZED` (401), `FORBIDDEN`/`MEMBER_TYPE_NOT_ALLOWED` (403), `NOT_FOUND`/`ROOM_NOT_FOUND` (404), `CONFLICT`/`OUT_OF_STOCK` (409), `PASSWORD_POLICY`/`PHONE_FORMAT`/`EMAIL_FORMAT`/`OWNER_NUMBER_FORMAT`/`STAY_DATE_PAST`/`GUEST_COUNT_RANGE` (422), `INTERNAL` (500).

### CORS
- 기본 허용: `http://localhost:3000` (환경변수 `APP_CORS_ALLOWED_ORIGINS`로 오버라이드).

## 실행 방법

### 요구 사항
- JDK 17
- PostgreSQL 14+ (로컬 또는 Docker)

### 환경변수 (또는 `application-local.yml` 사용)
```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ytresort
SPRING_DATASOURCE_USERNAME=ytresort
SPRING_DATASOURCE_PASSWORD=ytresort
APP_JWT_SECRET=<32자 이상의 시크릿>
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### DB 준비 (예: Docker)
```
docker run -d --name ytresort-pg \
  -e POSTGRES_DB=ytresort -e POSTGRES_USER=ytresort -e POSTGRES_PASSWORD=ytresort \
  -p 5432:5432 postgres:16
```

### 빌드 및 실행
```
cd apps/api
./gradlew bootRun
```
서버는 `http://localhost:8080` 에서 동작.

## 주의사항 / 미완료

- Gradle Wrapper (`gradlew`, `gradle-wrapper.jar`)는 포함되지 않았습니다. 최초 실행 시 `gradle wrapper --gradle-version 8.10` 또는 IntelliJ 동기화로 생성 필요.
- `APP_JWT_SECRET`은 운영 환경에서 반드시 32바이트 이상의 값을 주입해야 합니다 (HS256 요구사항).
- 운영 배포 전 `spring.jpa.hibernate.ddl-auto`는 `validate`로 전환 권장.
- 취소 기능은 스코프 밖 (spec §1 참조).

## FE 경계면 확인 포인트 (frontend-dev)
- 에러 응답의 `code` 문자열은 위 표와 정확히 일치. 실패 코드별 토스트/폼 필드 에러 매핑 시 그대로 사용 가능.
- 예약 응답의 `memberType`/`price`는 DB의 `member_type_snapshot`/`price_snapshot`에서 매퍼가 축약 변환합니다. FE는 평범한 필드로 받으면 됩니다.
- `/api/reservations` POST는 **201 Created** (not 200).
