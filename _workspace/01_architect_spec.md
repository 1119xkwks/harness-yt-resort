# 01. 기능 명세 (YT 리조트 예약 시스템)

> 프로토타입(`docs/prototype/yt_resort`)의 화면 흐름과 비즈니스 규칙을 기준으로 작성.
> 기술 스택: FE Next.js 14+ (App Router, TS) / Tailwind / Redux Toolkit / Zod / middleware.ts — BE Spring Boot / Gradle / PostgreSQL / JPA(ddl-auto=update) / Flyway / Spring Security / JWT.

---

## 1. 기능 목록

| # | 기능 | 요약 | 로그인 필요 |
|---|------|------|:---:|
| F1 | 회원가입 | 분양회원번호 유무로 OWNER/GENERAL 결정, 가입 즉시 자동 로그인 | × |
| F2 | 로그인 | 아이디/비밀번호 → JWT 발급 | × |
| F3 | 내 정보 조회 | `/api/users/me` — 최소 정보(ID, 이름, memberType) | ○ |
| F4 | 객실 목록 조회 | 6종 객실 리스트. 회원유형별 노출 가격 포함 | × (비로그인 = 가격 미표시) |
| F5 | 객실 상세 조회 | 단일 객실 상세 + 회원유형별 가격/예약가능여부 | × |
| F6 | 예약 생성 | 회원유형+재고 검증 후 재고 -1, 예약 생성 (1박 1실) | ○ |
| F7 | 내 예약 목록 | 본인 예약만 조회 | ○ |

> PRD는 예약 취소를 정의하지 않음. **본 단계에서는 취소 기능을 스코프 밖으로 둔다.** 프로토타입에 취소 UI가 있으나 구현 대상 아님.

---

## 2. 권한 매트릭스

| 페이지 / API | 공개 | 로그인 필요 |
|---|:---:|:---:|
| `/` (홈) | ○ | |
| `/login`, `/signup` | ○ | |
| `/rooms`, `/rooms/[roomCode]` | ○ | |
| `/booking/[roomCode]`, `/booking/complete/[reservationNumber]` | | ○ |
| `/reservations` | | ○ |
| `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/rooms`, `GET /api/rooms/{roomCode}` | ○ | |
| `GET /api/users/me`, `POST /api/reservations`, `GET /api/reservations` | | ○ |

### 2.1 인증 메커니즘
- 백엔드는 JWT(subject=loginId)를 HS256 또는 RS256으로 서명. 만료 24h.
- 프론트는 JWT를 `localStorage`에 보관 + Redux `auth.token`에 세팅. 요청 시 `Authorization: Bearer <token>` 헤더.
- `middleware.ts`가 `/booking/*`, `/reservations` 경로에서 쿠키 기반 token 존재 여부를 확인. (→ 로그인 후 JWT를 `Authorization` 헤더로도 보내고, 동시에 `token` 이름의 HttpOnly=false 쿠키에도 저장해서 middleware가 SSR 단계에서 읽을 수 있게 한다.)

---

## 3. 회원 유형(OWNER / GENERAL) 결정 규칙

| 입력 | memberType |
|---|---|
| 회원가입 폼의 `ownerNumber`가 **공백이 아닌 유효한 형식** (`^YT-\d{4}-\d{4}$`) | `OWNER` |
| `ownerNumber` 공백 또는 미입력 | `GENERAL` |
| `ownerNumber` 입력했으나 형식 불일치 | 422 Unprocessable — `OWNER_NUMBER_FORMAT` |

- 회원 유형은 **가입 시 확정**. 이후 변경 API는 없음 (본 스코프).
- 분양회원번호 유일성: DB에 unique 인덱스를 두되 NULL 허용. 같은 번호 재사용 방지.

---

## 4. 회원가입 입력 및 검증

| 필드 | 필수 | 검증 |
|---|:---:|---|
| `loginId` | ○ | 4자 이상 20자 이하, 영문/숫자, 중복 불가 |
| `password` | ○ | 8자 이상, 영문+숫자 혼합 (정규식 `(?=.*[A-Za-z])(?=.*\d).{8,}`) |
| `name` | ○ | 1자 이상 30자 이하 |
| `phone` | ○ | `^01[0-9]-?\d{3,4}-?\d{4}$` (하이픈 유무 무관, 저장 시 하이픈 정규화: `010-1234-5678`) |
| `email` | × | 입력 시 RFC 5322 간이 형식. 빈 문자열은 허용, 저장 시 NULL |
| `ownerNumber` | × | 입력 시 `^YT-\d{4}-\d{4}$`. 빈 문자열은 허용, 저장 시 NULL |

- 중복 체크: `POST /api/auth/signup` 서버 검증에서 처리. 프로토타입의 별도 "중복확인" 버튼 API는 스코프 밖. (UI는 유지하되, 가입 제출 시 중복이면 409 반환 → 토스트 표시로 대체 가능)

---

## 5. 객실(Room) 정적 데이터

관리자 등록 기능이 없으므로 **Flyway 시드**로 아래 6개 객실을 투입한다.

| roomCode | roomName | type | capacity | priceGeneral | priceOwner | allowedMemberTypes | totalStock |
|---|---|---|---|--:|--:|---|--:|
| STD-OCN | 스탠다드 오션 | STANDARD | 3 | 280000 | 180000 | GENERAL,OWNER | 12 |
| STD-MNT | 스탠다드 마운틴 | STANDARD | 3 | 250000 | 160000 | GENERAL,OWNER | 10 |
| FAM-DLX | 패밀리 디럭스 | FAMILY | 5 | 420000 | 280000 | GENERAL,OWNER | 8 |
| FAM-PRM | 패밀리 프리미엄 | FAMILY | 6 | — | 380000 | OWNER | 4 |
| SUT-EXE | 이그제큐티브 스위트 | SUITE | 4 | 780000 | 520000 | GENERAL,OWNER | 6 |
| SUT-PRE | 프레지덴셜 스위트 | SUITE | 6 | — | 1200000 | OWNER | 2 |

- `stock` 초기값 = `totalStock` (프로토타입의 부분 소진 상태는 무시).
- `priceGeneral`이 NULL인 객실은 GENERAL에게 가격 미표시 + 예약 불가.

---

## 6. 예약 검증 로직 (핵심)

```
POST /api/reservations
{ roomCode, guestName, guestPhone, guestCount, specialRequest?, stayDate }
```

### 6.1 서버 검증 순서 (하나라도 실패 시 즉시 4xx 반환)

| 순서 | 검증 | 실패 시 |
|---|---|---|
| 1 | 인증 (JWT) | 401 UNAUTHORIZED |
| 2 | 요청 바디 형식 (Zod/Bean Validation) | 400 VALIDATION |
| 3 | `stayDate >= today(KST)` | 422 STAY_DATE_PAST |
| 4 | `room = findByCode(roomCode)` 존재 | 404 ROOM_NOT_FOUND |
| 5 | `user.memberType ∈ room.allowedMemberTypes` | 403 MEMBER_TYPE_NOT_ALLOWED |
| 6 | `room.stock > 0` (with pessimistic lock) | 409 OUT_OF_STOCK |
| 7 | `guestCount` 범위 (1 ~ room.capacity) | 422 GUEST_COUNT_RANGE |

### 6.2 성공 시 트랜잭션
1. `SELECT ... FOR UPDATE`로 해당 Room 행 잠금.
2. `room.stock -= 1`.
3. Reservation insert:
   - `reservationNumber` = `YTYYYYMMDD-XXXX` (XXXX = 1000~9999 랜덤, unique 충돌 시 재시도 최대 3회)
   - `memberTypeSnapshot` = user.memberType (미래 요금 변동 대비 스냅샷)
   - `priceSnapshot` = 사용자 memberType 기준 가격 (요금 변동 대비 스냅샷)
   - `status` = `CONFIRMED`
4. 커밋 → 201 Created 반환.

### 6.3 1박 1실 제약
- 요청에 `nights`나 `checkOut` 필드 **없음**. `stayDate` 한 필드만.
- 체크인/체크아웃 시각은 고정 정책(15:00 / 다음날 11:00) — DB에 저장하지 않고 UI에서 안내만 표시.
- 한 사용자가 동일 `roomCode` + 동일 `stayDate`로 중복 예약하는 것을 막을지 여부: **본 스코프에서는 허용(중복 예약 가능)**. 필요 시 추후 unique 제약 추가.

---

## 7. 예약 확인

- `GET /api/reservations` — JWT의 loginId로 User 조회 → `reservation.userId` 매칭 건만 반환.
- 정렬: `createdAt` desc.
- 필터: 쿼리 없이 전체 반환(프로토타입의 상태 필터는 FE에서 처리).

---

## 8. 에러 코드 규약 (전역)

모든 에러 응답은 아래 shape:
```json
{ "code": "STRING_CODE", "message": "사람이 읽는 메시지", "field": "optional_field_name" }
```

| HTTP | code | 발생 위치 |
|---|---|---|
| 400 | `VALIDATION` | 스키마 위반 |
| 401 | `UNAUTHORIZED` | JWT 없음/만료/위조 |
| 403 | `FORBIDDEN` | 권한 부족 (회원유형 불일치 등) |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 아이디 중복, 분양회원번호 중복 |
| 409 | `OUT_OF_STOCK` | 재고 소진 |
| 422 | `OWNER_NUMBER_FORMAT` | 분양회원번호 형식 오류 |
| 422 | `PASSWORD_POLICY` | 비밀번호 정책 위반 |
| 422 | `PHONE_FORMAT` | 연락처 형식 오류 |
| 422 | `EMAIL_FORMAT` | 이메일 형식 오류 |
| 422 | `STAY_DATE_PAST` | 과거 투숙일 |
| 422 | `GUEST_COUNT_RANGE` | 수용 인원 초과 |
| 500 | `INTERNAL` | 서버 오류 |

---

## 9. FE/BE 경계 원칙

- **필드명 표기**: API JSON은 전부 **camelCase**.
- **DB 컬럼**은 **snake_case**, JPA `@Column(name="...")` 또는 PhysicalNamingStrategy로 매핑.
- **날짜**: ISO 8601 (`YYYY-MM-DD` for stayDate, `YYYY-MM-DDTHH:mm:ssZ` for createdAt).
- **금액**: 정수(원 단위). 소수점 없음.
- **enum**: 문자열 상수. `GENERAL`/`OWNER`, `CONFIRMED` 등 대문자 스네이크.
- **Zod와 BE DTO는 1:1 매핑** (다음 문서 `01_architect_api_spec.md`에서 상세).

---

## 10. 기대 동작 (QA 검증 기준)

### 회원가입
- `ownerNumber` 비워두고 가입 → memberType = GENERAL. 자동 로그인 후 `/` 홈으로.
- `ownerNumber` = `YT-2024-0821` 입력 → memberType = OWNER.
- `ownerNumber` = `abc` → 422 `OWNER_NUMBER_FORMAT`.
- 중복 아이디 → 409 `CONFLICT`, 프론트에서 "이미 사용 중인 아이디입니다" 표시.

### 로그인
- 성공 → JWT + User 최소정보 저장, 이전 `returnTo` 있으면 그 페이지로, 없으면 `/`.
- 실패 → 401, "아이디 또는 비밀번호가 일치하지 않습니다."

### 객실 조회
- 비로그인 → 가격 자리에 "로그인 후 확인". OWNER 전용 객실은 노출하되 "분양회원 전용" 배지.
- GENERAL 로그인 → GENERAL 전용가 표시, OWNER 전용 객실은 "예약 불가" 배지.
- OWNER 로그인 → OWNER 가격 표시. 모든 객실 예약 가능.

### 예약
- `/booking/STD-OCN`에 비로그인 진입 → middleware가 `/login?returnTo=/booking/STD-OCN`으로 리다이렉트.
- GENERAL이 `/booking/FAM-PRM` 직접 URL 진입 → 서버 403 `FORBIDDEN` 또는 페이지에서 "예약 불가" 안내.
- 예약 확정 직후 해당 객실 재고 1 감소.
- 재고 0일 때 예약 시도 → 409 `OUT_OF_STOCK` + "예약 마감" 모달.

### 예약 확인
- 로그인한 본인의 예약만 노출. 다른 사용자의 예약은 보이지 않음.

---

## 11. 비기능 요구사항

- 동시성: Reservation 생성 시 Room에 `SELECT ... FOR UPDATE` (pessimistic). DB: PostgreSQL.
- 보안: 비밀번호 BCrypt(strength=10). JWT 서명 키는 `application.yml` 외부 주입.
- 시간대: KST(`Asia/Seoul`)로 `stayDate` 비교. 서버 타임존을 강제로 KST로 설정하지 말고, `LocalDate.now(ZoneId.of("Asia/Seoul"))` 사용.
- 로깅: 예약 생성/실패를 INFO/WARN으로 기록. 인증 실패는 WARN.
