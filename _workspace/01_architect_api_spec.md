# 03. API 스펙 (YT 리조트 예약 시스템)

> 모든 JSON 필드는 **camelCase**. FE Zod 스키마와 BE DTO 필드명·타입·옵셔널이 **1:1로 엄격히 일치**해야 한다.
> Base URL: `/api`
> 모든 에러는 공통 shape: `{ code: string, message: string, field?: string }` (상태코드 4xx/5xx).
> 인증 필요 엔드포인트는 `Authorization: Bearer <JWT>` 헤더 필수.

---

## 공통 타입 (Zod / TS / Java 매핑)

| 논리 타입 | TS / Zod | Java |
|---|---|---|
| 문자열 | `z.string()` | `String` |
| 정수 | `z.number().int()` | `Integer` / `int` |
| ISO 날짜(YYYY-MM-DD) | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | `LocalDate` (Jackson `@JsonFormat` 또는 기본) |
| ISO 일시 | `z.string().datetime({ offset: true })` | `OffsetDateTime` |
| 열거 | `z.enum(['OWNER','GENERAL'])` | `enum MemberType` |
| 옵셔널(없을 수 있음) | `.optional()` → undefined | `@Nullable` 또는 `Optional<T>`; 응답에서는 **JSON 키 자체를 생략** (Jackson `Include.NON_NULL`) |

### 공통 enum
```ts
MemberType = 'OWNER' | 'GENERAL'
RoomType   = 'STANDARD' | 'FAMILY' | 'SUITE'
ReservationStatus = 'CONFIRMED'
```

### 에러 응답 shape (Zod)
```ts
ApiError = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
});
```

---

## 1. POST `/api/auth/signup`

**인증**: 불필요.

### Request Body
```ts
z.object({
  loginId:     z.string().min(4).max(20).regex(/^[A-Za-z0-9]+$/),
  password:    z.string().min(8).regex(/(?=.*[A-Za-z])(?=.*\d)/),
  name:        z.string().min(1).max(30),
  phone:       z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/),
  email:       z.string().email().optional(),       // 빈 문자열은 서버에서 null로 정규화
  ownerNumber: z.string().regex(/^YT-\d{4}-\d{4}$/).optional(),
})
```

### BE DTO (Java)
```java
public record SignupRequest(
  @NotBlank @Size(min=4,max=20) @Pattern(regexp="^[A-Za-z0-9]+$") String loginId,
  @NotBlank @Pattern(regexp="(?=.*[A-Za-z])(?=.*\\d).{8,}") String password,
  @NotBlank @Size(max=30) String name,
  @NotBlank @Pattern(regexp="^01[0-9]-?\\d{3,4}-?\\d{4}$") String phone,
  @Email String email,
  @Pattern(regexp="^YT-\\d{4}-\\d{4}$") String ownerNumber
) {}
```

### Response — 200 OK
```ts
z.object({
  token: z.string(),
  user: z.object({
    id:         z.number().int(),
    loginId:    z.string(),
    name:       z.string(),
    memberType: z.enum(['OWNER','GENERAL']),
  }),
})
```
> 가입 성공 즉시 JWT 발급 및 사용자 최소정보 함께 반환(프로토타입의 가입→자동 로그인 흐름 유지).

### 에러
| HTTP | code | 상황 |
|:---:|---|---|
| 400 | `VALIDATION` | 스키마 위반 (로그인ID 형식, 필수값 누락 등) |
| 409 | `CONFLICT` | `loginId` 중복 (field: "loginId") 또는 `ownerNumber` 중복 (field: "ownerNumber") |
| 422 | `PASSWORD_POLICY` | 비밀번호 정책 위반 |
| 422 | `OWNER_NUMBER_FORMAT` | 분양회원번호 형식 오류 |
| 422 | `PHONE_FORMAT` | 연락처 형식 오류 |
| 422 | `EMAIL_FORMAT` | 이메일 형식 오류 |

---

## 2. POST `/api/auth/login`

**인증**: 불필요.

### Request Body
```ts
z.object({
  loginId:  z.string().min(1),
  password: z.string().min(1),
})
```

### Response — 200 OK
```ts
z.object({
  token: z.string(),   // JWT
})
```
> 응답에는 토큰만. 사용자 정보는 후속으로 `GET /api/users/me`로 조회(명세 요구).

### 에러
| HTTP | code | 상황 |
|:---:|---|---|
| 400 | `VALIDATION` | 필드 누락 |
| 401 | `UNAUTHORIZED` | 아이디/비번 불일치 |

---

## 3. GET `/api/users/me`

**인증**: 필요.

### Request
- 헤더: `Authorization: Bearer <token>`
- 바디/쿼리 없음.

### Response — 200 OK
```ts
z.object({
  id:         z.number().int(),
  loginId:    z.string(),
  name:       z.string(),
  memberType: z.enum(['OWNER','GENERAL']),
})
```

> **주의**: 이 응답은 화면 표시용 최소 정보. phone/email/ownerNumber 등은 포함하지 않는다. Redux `user` slice에 그대로 들어간다.

### 에러
| HTTP | code | 상황 |
|:---:|---|---|
| 401 | `UNAUTHORIZED` | JWT 없음/만료/위조 |

---

## 4. GET `/api/rooms`

**인증**: 불필요.

### Request
- 쿼리: 없음 (초기 스코프). 필터는 FE에서 처리.

### Response — 200 OK
```ts
z.object({
  rooms: z.array(RoomSummary),
})

RoomSummary = z.object({
  roomCode:             z.string(),
  roomName:             z.string(),
  roomType:             z.enum(['STANDARD','FAMILY','SUITE']),
  capacity:             z.number().int(),
  priceGeneral:         z.number().int().nullable(),   // GENERAL에게 불가하면 null
  priceOwner:           z.number().int().nullable(),   // OWNER에게 불가하면 null
  allowedMemberTypes:   z.array(z.enum(['OWNER','GENERAL'])).min(1),
  stock:                z.number().int(),
  totalStock:           z.number().int(),
})
```

### BE DTO (Java)
```java
public record RoomSummary(
  String roomCode, String roomName, RoomType roomType, Integer capacity,
  Integer priceGeneral, Integer priceOwner,          // null 허용
  List<MemberType> allowedMemberTypes,
  Integer stock, Integer totalStock
) {}

public record RoomListResponse(List<RoomSummary> rooms) {}
```

> 가격이 null이면 Jackson은 `"priceGeneral": null`로 내보낸다. FE는 `.nullable()`로 받으므로 일관.
> 화면에 필요한 부가 필드(`description`, `amenities`, `view`, `bedType`, `size`)는 **상세 API**에서만 반환.

---

## 5. GET `/api/rooms/{roomCode}`

**인증**: 불필요.

### Path
- `roomCode`: `STD-OCN` 등

### Response — 200 OK (`RoomDetail`)
```ts
RoomDetail = RoomSummary.extend({
  nameEn:      z.string(),
  size:        z.string(),            // "42㎡"
  bedType:     z.string(),            // "퀸 베드 1"
  view:        z.string(),            // "오션뷰"
  description: z.string(),
  amenities:   z.array(z.string()),
})
```

### BE DTO
```java
public record RoomDetail(
  String roomCode, String roomName, RoomType roomType, Integer capacity,
  Integer priceGeneral, Integer priceOwner,
  List<MemberType> allowedMemberTypes,
  Integer stock, Integer totalStock,
  String nameEn, String size, String bedType, String view,
  String description, List<String> amenities
) {}
```

> 초기 스코프에서 이 상세 부가 필드(`nameEn`, `size`, ...)는 **코드 상수(프로토타입 값 이식)**로 하드코딩해 둔다(관리자 등록 없음 정책). 추후 확장 시 `rooms` 테이블에 컬럼 추가 또는 별도 `room_details` 테이블.

### 에러
| HTTP | code | 상황 |
|:---:|---|---|
| 404 | `NOT_FOUND` | roomCode 없음 |

---

## 6. POST `/api/reservations`

**인증**: 필요.

### Request Body
```ts
z.object({
  roomCode:       z.string(),
  guestName:      z.string().min(1).max(30),
  guestPhone:     z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/),
  guestCount:     z.number().int().min(1).max(10),
  specialRequest: z.string().max(500).optional(),
  stayDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
```

### BE DTO
```java
public record CreateReservationRequest(
  @NotBlank String roomCode,
  @NotBlank @Size(max=30) String guestName,
  @NotBlank @Pattern(regexp="^01[0-9]-?\\d{3,4}-?\\d{4}$") String guestPhone,
  @NotNull @Min(1) @Max(10) Integer guestCount,
  @Size(max=500) String specialRequest,
  @NotNull LocalDate stayDate
) {}
```

### Response — 201 Created (`ReservationDetail`)
```ts
ReservationDetail = z.object({
  reservationNumber:  z.string(),             // "YT20260419-1234"
  roomCode:           z.string(),
  roomName:           z.string(),
  guestName:          z.string(),
  guestPhone:         z.string(),
  guestCount:         z.number().int(),
  specialRequest:     z.string().nullable(),
  stayDate:           z.string(),              // "YYYY-MM-DD"
  memberType:         z.enum(['OWNER','GENERAL']),  // snapshot
  price:              z.number().int(),        // snapshot
  status:             z.enum(['CONFIRMED']),
  createdAt:          z.string(),              // ISO datetime with offset
})
```

### 에러
| HTTP | code | 상황 |
|:---:|---|---|
| 400 | `VALIDATION` | 스키마 위반 |
| 401 | `UNAUTHORIZED` | JWT 없음/만료 |
| 403 | `MEMBER_TYPE_NOT_ALLOWED` | 사용자 유형이 해당 객실 예약 불가 |
| 404 | `ROOM_NOT_FOUND` | 잘못된 roomCode |
| 409 | `OUT_OF_STOCK` | 재고 0 |
| 422 | `STAY_DATE_PAST` | 과거 투숙일 |
| 422 | `GUEST_COUNT_RANGE` | `guestCount > room.capacity` |

### 성공 시 부수효과
- 해당 Room의 `stock -= 1` (같은 트랜잭션, FOR UPDATE).
- Reservation 레코드 생성 (`status = 'CONFIRMED'`, `priceSnapshot`/`memberTypeSnapshot` 포함).

---

## 7. GET `/api/reservations`

**인증**: 필요.

### Request
- 쿼리: 없음. (정렬/필터는 FE에서 처리)

### Response — 200 OK
```ts
z.object({
  reservations: z.array(ReservationSummary),
})

ReservationSummary = z.object({
  reservationNumber:  z.string(),
  roomCode:           z.string(),
  roomName:           z.string(),
  guestName:          z.string(),
  guestPhone:         z.string(),
  guestCount:         z.number().int(),
  specialRequest:     z.string().nullable(),
  stayDate:           z.string(),            // YYYY-MM-DD
  memberType:         z.enum(['OWNER','GENERAL']),
  price:              z.number().int(),
  status:             z.enum(['CONFIRMED']),
  createdAt:          z.string(),
})
```

> `POST /api/reservations`의 `ReservationDetail`과 **완전히 동일한 필드 세트**. 타입 재사용 권장 (FE에서 `Reservation` 한 타입으로 통합).

### 에러
| HTTP | code | 상황 |
|:---:|---|---|
| 401 | `UNAUTHORIZED` | JWT 없음 |

---

## 8. 필드 매핑 대조표 (FE Zod ↔ BE DTO)

| 논리 필드 | JSON (camelCase) | FE Zod | BE DTO (Java) | DB 컬럼 |
|---|---|---|---|---|
| 로그인 아이디 | `loginId` | `z.string()` | `String loginId` | `login_id` |
| 비밀번호 | `password` | `z.string()` | `String password` | `password` (BCrypt) |
| 이름 | `name` | `z.string()` | `String name` | `name` |
| 연락처 | `phone` | `z.string()` | `String phone` | `phone` |
| 이메일 | `email` | `z.string().email().optional()` | `@Email String email` | `email` (NULL 가능) |
| 분양회원번호 | `ownerNumber` | `z.string().regex(...).optional()` | `String ownerNumber` | `owner_number` (NULL 가능) |
| 회원유형 | `memberType` | `z.enum(['OWNER','GENERAL'])` | `MemberType memberType` | `member_type` |
| 객실코드 | `roomCode` | `z.string()` | `String roomCode` | `room_code` |
| 객실명 | `roomName` | `z.string()` | `String roomName` | `room_name` |
| 객실유형 | `roomType` | `z.enum([...])` | `RoomType roomType` | `room_type` |
| 수용인원 | `capacity` | `z.number().int()` | `Integer capacity` | `capacity` |
| 일반가 | `priceGeneral` | `z.number().int().nullable()` | `Integer priceGeneral` | `price_general` |
| 분양가 | `priceOwner` | `z.number().int().nullable()` | `Integer priceOwner` | `price_owner` |
| 예약 가능 유형 | `allowedMemberTypes` | `z.array(z.enum([...]))` | `List<MemberType>` | `allowed_member_types` (VARCHAR, CSV) |
| 잔여 재고 | `stock` | `z.number().int()` | `Integer stock` | `stock` |
| 총 재고 | `totalStock` | `z.number().int()` | `Integer totalStock` | `total_stock` |
| 예약번호 | `reservationNumber` | `z.string()` | `String reservationNumber` | `reservation_number` |
| 투숙자 이름 | `guestName` | `z.string()` | `String guestName` | `guest_name` |
| 투숙자 연락처 | `guestPhone` | `z.string()` | `String guestPhone` | `guest_phone` |
| 투숙 인원 | `guestCount` | `z.number().int()` | `Integer guestCount` | `guest_count` |
| 요청사항 | `specialRequest` | `z.string().nullable()` (응답) / `.optional()` (요청) | `String specialRequest` | `special_request` |
| 투숙일 | `stayDate` | `z.string()` (YYYY-MM-DD) | `LocalDate stayDate` | `stay_date` |
| 스냅샷 회원유형 | `memberType` | `z.enum([...])` | `MemberType memberTypeSnapshot` | `member_type_snapshot` |
| 스냅샷 금액 | `price` | `z.number().int()` | `Integer priceSnapshot` | `price_snapshot` |
| 상태 | `status` | `z.enum(['CONFIRMED'])` | `ReservationStatus status` | `status` |
| 생성일시 | `createdAt` | `z.string()` (ISO) | `OffsetDateTime createdAt` | `created_at` |

> **응답의 `memberType`와 `price`는 DB에서는 "snapshot" 컬럼이지만, API 레이어에서 이름을 축약**한다(FE는 스냅샷 여부를 알 필요 없음). BE 매퍼에서 `memberTypeSnapshot → memberType`, `priceSnapshot → price`로 변환.

---

## 9. 인증/인가 구현 규약 (BE)

- Spring Security 필터 체인:
  1. `JwtAuthenticationFilter` — `Authorization: Bearer ...` 파싱 → `UsernamePasswordAuthenticationToken` 설정 (principal = loginId).
  2. 인증 필요 라우트(`/api/users/**`, `/api/reservations/**`)는 `authenticated()`.
- JWT 클레임:
  - `sub` = loginId
  - `iat`, `exp` (24h)
  - `memberType` (클레임에 포함하되, 서버는 신뢰하지 않고 매번 DB 조회)
- 401/403은 `AuthenticationEntryPoint` / `AccessDeniedHandler`에서 공통 에러 shape으로 반환.

## 10. 응답 헤더 / 기타

- `Content-Type: application/json; charset=UTF-8` 고정.
- 성공 응답은 항상 객체(JSON array 루트 반환 금지). 목록은 `{ rooms: [...] }`, `{ reservations: [...] }`로 래핑.
- CORS: dev 한정 `http://localhost:3000` 허용.

---

## 11. 예시 플로우

### A. 회원가입 → 로그인 → /me
```
POST /api/auth/signup { loginId, password, name, phone, ownerNumber: "YT-2024-0821" }
 → 200 { token, user: { id, loginId, name, memberType: "OWNER" } }

# 토큰 저장, 이후 요청에 Bearer 헤더

GET /api/users/me                → 200 { id, loginId, name, memberType: "OWNER" }
```

### B. 객실 조회 → 예약
```
GET  /api/rooms                  → 200 { rooms: [...] }
GET  /api/rooms/FAM-DLX          → 200 RoomDetail

POST /api/reservations
{ roomCode: "FAM-DLX", guestName: "홍길동", guestPhone: "010-1234-5678",
  guestCount: 2, stayDate: "2026-05-15" }
 → 201 ReservationDetail { reservationNumber: "YT20260419-1234", ... }

GET  /api/reservations           → 200 { reservations: [ ... ] }
```

### C. 실패 케이스
```
POST /api/reservations (GENERAL → FAM-PRM)
 → 403 { code: "MEMBER_TYPE_NOT_ALLOWED", message: "해당 회원 유형은 본 객실을 예약할 수 없습니다." }

POST /api/reservations (stock=0)
 → 409 { code: "OUT_OF_STOCK", message: "재고가 소진되어 예약할 수 없습니다." }
```
