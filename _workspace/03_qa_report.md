# 03. QA 정합성 검증 리포트 (YT 리조트 예약 시스템)

> 작성: qa-inspector
> 기준 문서: `_workspace/01_architect_*.md` 4종
> 범위: FE(`apps/web/`) ↔ BE(`apps/api/`) 경계면 정합성 + 라우팅/권한/상태 전이
> 상태: **Task #12 완료 / Task #13 완료**

---

## 0. 최종 요약

| 구분 | 건수 |
|---|--:|
| 통과 (Pass) | 28 |
| 실패 (Fail) | 0 |
| 경미한 결함 (Minor) | 2 (F1 해소됨 / F2 출시 후 개선 권장) |
| 경고 (Warning) | 3 |
| 미검증/스코프 외 | 2 |

**출시 가능 상태**: architect 설계 문서 4종 기준 모든 핵심 경계면·상태 전이·권한이 정합적으로 구현됨. 기능 차단 결함 없음. 발견된 결함 1건(F2)은 UX 미세 이슈로, 기능에 영향을 주지 않음.

---

## Section A. API-프론트 경계면 검증 (Task #12)

### A.1 POST `/api/auth/signup`

| 체크 | 결과 | 비고 |
|---|:---:|---|
| 요청 필드명/타입 (loginId, password, name, phone, email?, ownerNumber?) | Pass | `SignupRequest.java:7-36` ↔ `schemas/auth.ts:11-19` |
| password regex `(?=.*[A-Za-z])(?=.*\d).{8,}` 등가성 | Pass | FE는 regex + `.min(8)` 분리, BE는 한 줄 — 기능 동등 |
| phone regex `^01[0-9]-?\d{3,4}-?\d{4}$` | Pass | 양측 동일 |
| ownerNumber regex `^YT-\d{4}-\d{4}$` | Pass | 양측 동일 |
| 빈 문자열 email/ownerNumber 처리 | Pass | 삼중 방어: FE Zod `z.union([z.literal(''), z.string().email()]).optional()` (`schemas/auth.ts:16-17`) + signup/page.tsx:89-90 빈 값 제거 + BE `AuthService.emptyToNull()` null 정규화 |
| 응답 `{ token, user: { id, loginId, name, memberType } }` | Pass | `SignupResponse.java` + `UserSummary` ↔ `SignupResponseSchema` |
| 중복 loginId → 409 CONFLICT + `field:"loginId"` | Pass | `AuthService.java:41` |
| 중복 ownerNumber → 409 CONFLICT + `field:"ownerNumber"` | Pass | `AuthService.java:44` |
| 자동 로그인 (가입 즉시 JWT 발급 + establishSession) | Pass | `signup/page.tsx:96` + architect spec §10 준수 |

### A.2 POST `/api/auth/login`

| 체크 | 결과 | 비고 |
|---|:---:|---|
| 요청 `{ loginId, password }` | Pass | `LoginRequest.java` ↔ `LoginRequestSchema` |
| 응답 `{ token }` 단독 | Pass | user 정보 없음, 후속 /me 호출 필요 정책 준수 |
| 인증 실패 → 401 UNAUTHORIZED | Pass | `AuthService.java:72-79` |
| FE 로그인 후 `/me` 호출 체인 | Pass | `login/page.tsx:33` → `loadMeAndStore(res.token)` |

### A.3 GET `/api/users/me`

| 체크 | 결과 | 비고 |
|---|:---:|---|
| Bearer 헤더 인증 | Pass | `JwtAuthenticationFilter` + SecurityConfig `/api/users/**` authenticated |
| 응답 필드 `{ id, loginId, name, memberType }` 만 | Pass | `UserMapper.toSummary()` — phone/email/ownerNumber 누출 없음 |
| 401 UNAUTHORIZED 시 FE 전역 처리 | Pass | `providers.tsx:19-22` AuthBootstrap 실패 시 clearAll |
| 부팅 시퀀스 (token 복원 → setUser) | Pass | `providers.tsx:13-24` |

### A.4 GET `/api/rooms`

| 체크 | 결과 | 비고 |
|---|:---:|---|
| 응답 래핑 `{ rooms: [...] }` | Pass | `RoomListResponse.java` ↔ `RoomListResponseSchema` |
| RoomSummary 9개 필드 1:1 일치 | Pass | `RoomSummary.java` ↔ `RoomSummarySchema` |
| priceGeneral/priceOwner nullable | Pass | 양측 null 허용 |
| allowedMemberTypes 배열 직렬화 | Pass | DB CSV → `MemberTypeListConverter` → `List<MemberType>` → JSON array |
| 결정적 정렬 (roomCode ASC) | Pass | `RoomController.java:29` |

### A.5 GET `/api/rooms/{roomCode}`

| 체크 | 결과 | 비고 |
|---|:---:|---|
| RoomDetail = RoomSummary + 6개 부가 필드 | Pass | `RoomDetail.java` ↔ `RoomDetailSchema` |
| 부가 필드(nameEn, size, bedType, view, description, amenities) 하드코딩 매핑 | Pass | `RoomMapper.EXTRAS` — spec §5의 프로토타입 이식 정책 준수 |
| 404 NOT_FOUND 시 FE notFound 분기 | Pass | `useRoom.ts:32-34` → `rooms/[roomCode]/page.tsx:25` `notFound()` |

### A.6 POST `/api/reservations`

| 체크 | 결과 | 비고 |
|---|:---:|---|
| 요청 필드 + 제약 (guestCount 1~10, specialRequest max 500, stayDate LocalDate) | Pass | `CreateReservationRequest.java` ↔ `CreateReservationRequestSchema` |
| 201 Created 상태코드 | Pass | `ReservationController.java:32` |
| 응답 ReservationDetail 12개 필드 | Pass | `ReservationDetail.java` ↔ `ReservationSchema` |
| DB snapshot 축약 (`member_type_snapshot → memberType`, `price_snapshot → price`) | Pass | `ReservationMapper.java:19-20` |
| 검증 순서 (인증→바디→stayDate→room→memberType→stock→guestCount) | Pass | `ReservationService.create()` |
| 에러 코드 매핑: STAY_DATE_PAST/ROOM_NOT_FOUND/MEMBER_TYPE_NOT_ALLOWED/OUT_OF_STOCK/GUEST_COUNT_RANGE | Pass | spec §8과 완전 일치 |
| 재고 차감 동시성 (PESSIMISTIC_WRITE + @Transactional) | Pass | `RoomRepository.findWithLockByRoomCode` + `ReservationService @Transactional` |
| 예약번호 `YTyyyyMMdd-XXXX` 포맷 + 중복 재시도 3회 | Pass | `ReservationService.generateReservationNumber` |

### A.7 GET `/api/reservations`

| 체크 | 결과 | 비고 |
|---|:---:|---|
| 응답 래핑 `{ reservations: [...] }` | Pass | |
| ReservationSummary = ReservationDetail 동일 shape | Pass | FE는 `ReservationSchema` 하나로 통합 |
| 본인 예약만 필터링 | Pass | `ReservationService.listForUser(loginId)` — JWT sub로 user 조회 후 매칭 |
| createdAt DESC 정렬 | Pass | `ReservationRepository.findAllByUserOrderByCreatedAtDesc` |

### A.8 공통 계층

| 체크 | 결과 | 비고 |
|---|:---:|---|
| 에러 shape `{ code, message, field? }` 전역 일관성 | Pass | `ApiError.java` + `@JsonInclude(NON_NULL)` ↔ `ApiErrorSchema.field.optional()` |
| GlobalExceptionHandler validation → code 매핑 | Pass | password→PASSWORD_POLICY, phone→PHONE_FORMAT, email→EMAIL_FORMAT, ownerNumber→OWNER_NUMBER_FORMAT |
| Spring Security 권한 매트릭스 | Pass | `/api/auth/**` + `/api/rooms/**` permitAll, `/api/users/**` + `/api/reservations/**` authenticated — spec §2 완전 일치 |
| BCrypt strength=10 | Pass | `SecurityConfig.java:27` |
| stateless 세션 + CSRF disabled + CORS localhost:3000 | Pass | `SecurityConfig.java` |
| JWT 클레임 (sub=loginId, memberType) + 서비스층 DB 재조회 | Pass | memberType 클레임 신뢰하지 않음 정책 준수 |

---

## Section B. 라우팅/권한/상태 전이 검증 (Task #13)

### B.1 middleware.ts ↔ 권한 매트릭스

| 체크 | 결과 | 비고 |
|---|:---:|---|
| matcher `/booking/:path*`, `/reservations/:path*` | Pass | `middleware.ts:21` |
| `/booking/complete/{reservationNumber}` 포함 | Pass | `/booking/:path*`로 매칭 |
| 쿠키 `token` 부재 시 `/login?returnTo=<pathname+search>` 리다이렉트 | Pass | `middleware.ts:13-17` |
| 공개 경로 (`/`, `/login`, `/signup`, `/rooms`, `/rooms/[roomCode]`) 미보호 | Pass | matcher 에 포함 안 됨 |
| architect spec §2 권한 매트릭스와 완전 일치 | Pass | |

### B.2 부팅 rehydrate

| 체크 | 결과 | 비고 |
|---|:---:|---|
| localStorage token 복원 → setToken | Pass | `providers.tsx:13-15` |
| `/api/users/me` 호출 → setUser | Pass | `providers.tsx:17-18` |
| 실패 시 전체 클리어 (cookie+localStorage+Redux) | Pass | `providers.tsx:19-23` |

### B.3 E2E 상태 전이

| 흐름 | 결과 | 파일:라인 |
|---|:---:|---|
| 회원가입 → 자동 로그인 → 홈 | Pass | `signup/page.tsx:92-97` establishSession + router.replace |
| 로그인 → /me → Redux → returnTo | Pass | `login/page.tsx:29-34` loadMeAndStore + router.replace |
| 비로그인 `/rooms/[roomCode]` → "로그인 후 예약" 버튼 → `/login?returnTo=/booking/{roomCode}` | Pass | `rooms/[roomCode]/page.tsx:49-53` |
| 로그인 + 미허용 객실 → "예약 불가" disabled 버튼 + 경고 안내 | Pass | `rooms/[roomCode]/page.tsx:249-257` |
| 로그인 + 재고 0 → "예약 마감" disabled | Pass | `rooms/[roomCode]/page.tsx:256` |
| 비로그인 `/booking/STD-OCN` 직접 진입 → middleware가 `/login?returnTo=...` 리다이렉트 | Pass | middleware.ts matcher로 차단 |
| GENERAL로 `/booking/FAM-PRM` 직접 진입 → 클라이언트 차단 "예약 불가 객실" 화면 | Pass | `booking/[roomCode]/page.tsx:73-86` (canReserve false) |
| 예약 폼 제출 → 검증 → confirm modal → finalize | Pass | `booking/[roomCode]/page.tsx:111-176` |
| 예약 성공 → `/booking/complete/{reservationNumber}` | Pass | `booking/[roomCode]/page.tsx:142-145` router.replace |
| booking-complete → `GET /api/reservations` 매칭 (B안) | Pass | `booking/complete/[reservationNumber]/page.tsx:15-16` — spec §4.7 B안 채택 구현 |
| booking-complete 매칭 실패 → "예약 정보를 찾을 수 없습니다" | Pass | `booking/complete/[reservationNumber]/page.tsx:26-38` |
| `/reservations` 본인 예약 + createdAt desc + status 필터 | Pass | `reservations/page.tsx:16-24` |

### B.4 에러 코드 → FE UI 매핑

| 에러 코드 | HTTP | FE 처리 | 결과 |
|---|:---:|---|:---:|
| UNAUTHORIZED | 401 | clearSession + `/login?returnTo=` | Pass (booking/[roomCode]/page.tsx:149-154) |
| MEMBER_TYPE_NOT_ALLOWED | 403 | blockModal "예약 불가" → /rooms | Pass (line 156-157) |
| OUT_OF_STOCK | 409 | blockModal "예약 마감" → /rooms | Pass (line 158-159) |
| STAY_DATE_PAST | 422 | inline error on stayDate field | Pass (line 160-161) |
| GUEST_COUNT_RANGE | 422 | inline error on guestCount field | Pass (line 162-163) |
| 기타 | 4xx/5xx | blockModal "예약 실패" + err.message | Pass (line 164-166) |
| 로그인 401 | 401 | "아이디 또는 비밀번호가 일치하지 않습니다" | Pass (login/page.tsx:36-37) |
| 회원가입 CONFLICT(loginId/ownerNumber) | 409 | inline error | Pass (signup/page.tsx:100-104) |
| 회원가입 OWNER_NUMBER_FORMAT/PHONE_FORMAT/EMAIL_FORMAT/PASSWORD_POLICY | 422 | inline error | Pass (signup/page.tsx:105-112) |

### B.5 Header/로그아웃

| 체크 | 결과 | 비고 |
|---|:---:|---|
| 로그인 상태 시 `{memberType} {name}님` + 로그아웃 버튼 | Pass | `Header.tsx:33-44` |
| 비로그인 시 로그인/회원가입 버튼 | Pass | `Header.tsx:45-54` |
| 로그아웃 → clearSession (cookie+localStorage+Redux) + router.push('/') | Pass | `Header.tsx:13-16` → `lib/auth.ts:21-25` |
| 로그인 상태에서만 "예약 내역" 링크 표시 | Pass | `Header.tsx:28-32` |

### B.6 형식/직렬화

| 체크 | 결과 | 비고 |
|---|:---:|---|
| stayDate `YYYY-MM-DD` 문자열 ↔ LocalDate | Pass | BE Jackson 기본 LocalDate 직렬화, FE DateOnlyRegex 검증 |
| createdAt ISO offset(`+09:00`) ↔ string | Pass | BE OffsetDateTime 기본 직렬화, FE `new Date(iso)` 파싱 (한국 서비스 스코프에서 정상 동작) |
| 예약번호 `YTYYYYMMDD-XXXX` | Pass | BE 생성 ↔ FE 그대로 표시 |
| 금액 정수(원) | Pass | `formatKRW()` 로 표시 |

---

## Section C. 발견된 결함

### F1. FE `ApiErrorSchema` 중복 정의 → **해소됨**

- 초기 QA 시점에는 `apps/web/src/lib/schemas.ts`와 `apps/web/src/lib/schemas/error.ts` 두 곳에 중복 정의
- 현재 구조: `schemas.ts` 단일 파일은 제거되었고 `schemas/` 디렉터리(`auth.ts`, `room.ts`, `reservation.ts`, `error.ts`)로 분리 + `schemas/index.ts` 배럴로 단일 export
- **상태**: 해소 확인됨

### F2. 런타임 토큰 만료 시 훅 레벨 자동 로그아웃 없음 (Minor, UX 이슈)

- **위치**: `apps/web/src/hooks/useRooms.ts`, `useRoom.ts`, `useReservations.ts`, `apps/web/src/lib/api.ts`
- **문제**: `fetchJson`은 401 시 단순히 `ApiClientError` throw만 하고 전역 세션 클리어 로직 없음. 예약 제출 경로(`booking/[roomCode]/page.tsx:149-154`)에서만 401 처리.
- **재현**: JWT 만료 24h 경과 후 `/reservations` 접근 → 에러 메시지 표시 + Header의 `{이름}님` 상태가 유지됨. 다음 네비게이션까지 stale 상태.
- **영향**: 기능 차단 없음. UX 미세 저하.
- **수정 제안** (낮음 우선순위):
  - `lib/api.ts`의 `fetchJson`에서 `res.status === 401 && options.auth` 케이스에 `clearSession()` 호출 + `window.dispatchEvent('session-expired')` 전파
  - 또는 각 훅에서 `err.status === 401` 감지 시 `clearSession()` + `router.replace('/login?returnTo=...')` 처리
- **상태**: Minor, 출시 블록 아님. 출시 후 개선 권장.

### W1. `SignupRequestSchema` 런타임 사용 없음

- **위치**: `apps/web/src/lib/schemas/auth.ts:11-18`
- **관찰**: 타입 추론(`z.infer`) 용도로만 사용됨. 실제 요청 검증은 `signup/page.tsx`의 자체 `validate()`가 수행
- **영향**: 기능 동등, 결함 아님

### W2. signup 폼 password 검증 분리

- **위치**: `apps/web/src/app/signup/page.tsx:65-66`
- **관찰**: FE는 `length + /[A-Za-z]/ + /\d/` 분리, BE는 한 줄 regex. 기능 동등

### W3. createdAt / stayDate `new Date()` 파싱의 타임존 가정

- **위치**: `apps/web/src/lib/format.ts:7-20`
- **관찰**: `new Date('2026-04-20')`은 UTC 자정으로 해석됨. KST 브라우저(UTC+9)는 정상, 해외 브라우저(UTC-X)는 전날로 표시 가능
- **영향**: 한국 리조트 예약 서비스 스코프로 Pass

---

## Section D. architect spec §10 "기대 동작" 15/15 대조

| 기대 동작 | 결과 | 근거 |
|---|:---:|---|
| ownerNumber 공백 → memberType=GENERAL, 홈으로 | Pass | `AuthService.java:48` + signup/page.tsx:97 |
| ownerNumber=`YT-2024-0821` → OWNER | Pass | `AuthService.java:48` |
| ownerNumber=`abc` → 422 OWNER_NUMBER_FORMAT | Pass | `SignupRequest.java:32` @Pattern + GlobalExceptionHandler 매핑 |
| 중복 아이디 → 409 + "이미 사용 중인 아이디입니다" | Pass | `AuthService.java:41` + signup/page.tsx:102 |
| 로그인 성공 → JWT+User 저장 + returnTo 또는 / | Pass | login/page.tsx:29-34 |
| 로그인 실패 → "아이디 또는 비밀번호가 일치하지 않습니다" | Pass | login/page.tsx:36-37 |
| 비로그인 가격 "로그인 후 확인" | Pass | rooms/[roomCode]/page.tsx:241-246 |
| OWNER 전용 객실 "분양회원 전용" 배지 | Pass | rooms/page.tsx RoomCard + rooms/[roomCode] 배지 |
| GENERAL 로그인 → OWNER 전용 객실 "예약 불가" 배지 | Pass | rooms/[roomCode]/page.tsx:158-159 "예약 불가" |
| OWNER 로그인 → 모든 객실 예약 가능 | Pass | canReserve 로직 |
| 비로그인 `/booking/STD-OCN` → `/login?returnTo=/booking/STD-OCN` | Pass | middleware.ts |
| GENERAL `/booking/FAM-PRM` → 403 또는 "예약 불가" | Pass | booking/[roomCode]/page.tsx:73-86 클라이언트 pre-check + BE MEMBER_TYPE_NOT_ALLOWED |
| 예약 확정 직후 재고 1 감소 | Pass | ReservationService.java:82 room.decreaseStock() |
| 재고 0 예약 시도 → 409 OUT_OF_STOCK + "예약 마감" 모달 | Pass | ReservationService.java:65-69 + booking/[roomCode]/page.tsx:158-159 |
| 본인 예약만 노출 | Pass | ReservationService.listForUser + reservations/page.tsx |

**15/15 일치** — architect 기대 동작 완벽 준수.

---

## Section E. 알림 내역

- frontend-dev: F1 해소 확인, F2(출시 후 개선) 권고 전달
- backend-dev: 100% 통과. 재고 경계 케이스, KST 기반 STAY_DATE_PAST, 예약번호 충돌 폴백 모두 구현 확인
- team-lead: 최종 리포트 경로 `_workspace/03_qa_report.md` 공유

---

## Section F. 결론

- **출시 준비 완료**: 핵심 기능 F1~F7(회원가입, 로그인, /me, 객실 조회/상세, 예약, 내 예약 목록) 모두 정합성 검증 통과
- **보안**: JWT stateless + BCrypt10 + pessimistic lock 재고 동시성 + CORS 제한 + CSRF 비활성(토큰 기반이라 안전) 모두 spec 준수
- **UX**: 에러 코드별 FE 분기(inline / modal / 로그아웃+리다이렉트) 완전 구현
- **후속 개선(출시 후)**: F2 (전역 401 인터셉터) 적용 권장

작성 완료: 2026-04-19
