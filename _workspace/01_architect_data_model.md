# 02. 데이터 모델 (YT 리조트 예약 시스템)

> PostgreSQL + JPA(`ddl-auto=update`) + Flyway 병행.
> JPA는 엔티티 매핑 보조 + 개발 중 빠른 반영용. **스키마 소스 오브 트루스는 Flyway 마이그레이션**.
> 컬럼명은 snake_case, 엔티티 필드는 camelCase.

---

## 1. ERD (개념)

```
┌──────────────┐     1      ∞  ┌─────────────────┐       ∞      1  ┌──────────┐
│   users      │───────────────│   reservations  │──────────────────│  rooms   │
│              │   user_id     │                 │   room_code      │          │
└──────────────┘               └─────────────────┘                  └──────────┘
```

- `User 1 ─ N Reservation` : 한 회원은 다수의 예약.
- `Room 1 ─ N Reservation` : 한 객실은 다수의 예약(다른 날짜로).
- Room ↔ allowedMemberTypes는 별도 테이블 없이 **컬럼(text[] 또는 콤마 문자열)**로 보관. Postgres 배열 사용 권장.

---

## 2. 테이블: `users`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | 내부 식별자 |
| `login_id` | VARCHAR(20) | UNIQUE, NOT NULL | 로그인 아이디 (JWT subject) |
| `password` | VARCHAR(72) | NOT NULL | BCrypt 해시 |
| `name` | VARCHAR(30) | NOT NULL | 이름 |
| `phone` | VARCHAR(20) | NOT NULL | 하이픈 포함 저장 (예: 010-1234-5678) |
| `email` | VARCHAR(100) | NULLABLE | 이메일 (미입력 허용) |
| `owner_number` | VARCHAR(20) | UNIQUE, NULLABLE | 분양회원번호 (NULL = 일반회원) |
| `member_type` | VARCHAR(10) | NOT NULL | `OWNER` / `GENERAL` |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 가입일시 |

**인덱스**
- `UNIQUE (login_id)`
- `UNIQUE (owner_number) WHERE owner_number IS NOT NULL` (partial unique)

**체크 제약**
- `CHECK (member_type IN ('OWNER','GENERAL'))`

---

## 3. 테이블: `rooms`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `room_code` | VARCHAR(10) | PK | 객실 코드 (예: STD-OCN) |
| `room_name` | VARCHAR(50) | NOT NULL | 객실명 |
| `room_type` | VARCHAR(20) | NOT NULL | STANDARD / FAMILY / SUITE |
| `capacity` | INT | NOT NULL | 최대 수용 인원 |
| `price_general` | INT | NULLABLE | 일반회원 가격 (원) |
| `price_owner` | INT | NULLABLE | 분양회원 가격 (원) |
| `allowed_member_types` | TEXT[] | NOT NULL | 예약 가능 회원유형 배열 (예: `{GENERAL,OWNER}`) |
| `stock` | INT | NOT NULL | 현재 잔여 재고 |
| `total_stock` | INT | NOT NULL | 총 재고 |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**제약**
- `CHECK (stock >= 0)`
- `CHECK (stock <= total_stock)`
- `CHECK (room_type IN ('STANDARD','FAMILY','SUITE'))`
- `CHECK (array_length(allowed_member_types, 1) >= 1)`

**인덱스**: PK만.

---

## 4. 테이블: `reservations`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGSERIAL | PK | 내부 식별자 |
| `reservation_number` | VARCHAR(20) | UNIQUE, NOT NULL | 예약번호 (`YTYYYYMMDD-XXXX`) |
| `user_id` | BIGINT | FK → users(id), NOT NULL | 예약자 |
| `room_code` | VARCHAR(10) | FK → rooms(room_code), NOT NULL | 객실 |
| `guest_name` | VARCHAR(30) | NOT NULL | 투숙자 이름 |
| `guest_phone` | VARCHAR(20) | NOT NULL | 투숙자 연락처 |
| `guest_count` | INT | NOT NULL | 투숙 인원 |
| `special_request` | TEXT | NULLABLE | 요청사항 |
| `stay_date` | DATE | NOT NULL | 투숙일 (1박 1실) |
| `member_type_snapshot` | VARCHAR(10) | NOT NULL | 예약 시점 회원유형 |
| `price_snapshot` | INT | NOT NULL | 예약 시점 가격 |
| `status` | VARCHAR(15) | NOT NULL DEFAULT 'CONFIRMED' | `CONFIRMED` |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 예약 생성 시각 |

**제약**
- `CHECK (member_type_snapshot IN ('OWNER','GENERAL'))`
- `CHECK (status IN ('CONFIRMED'))` — 취소 기능이 추가되면 `'CANCELLED'` 확장
- `CHECK (guest_count >= 1)`

**인덱스**
- `UNIQUE (reservation_number)`
- `INDEX idx_reservations_user_created (user_id, created_at DESC)` — 본인 예약 목록 조회용
- `INDEX idx_reservations_room_stay (room_code, stay_date)` — 운영 분석용

---

## 5. JPA 엔티티 매핑 (Java)

### 5.1 `User`
```java
@Entity
@Table(name = "users")
public class User {
  @Id @GeneratedValue(strategy = IDENTITY)
  private Long id;

  @Column(name = "login_id", nullable = false, unique = true, length = 20)
  private String loginId;

  @Column(nullable = false, length = 72)
  private String password;

  @Column(nullable = false, length = 30)
  private String name;

  @Column(nullable = false, length = 20)
  private String phone;

  @Column(length = 100)
  private String email;

  @Column(name = "owner_number", unique = true, length = 20)
  private String ownerNumber;

  @Enumerated(EnumType.STRING)
  @Column(name = "member_type", nullable = false, length = 10)
  private MemberType memberType;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;
}

public enum MemberType { OWNER, GENERAL }
```

### 5.2 `Room`
```java
@Entity
@Table(name = "rooms")
public class Room {
  @Id
  @Column(name = "room_code", length = 10)
  private String roomCode;

  @Column(name = "room_name", nullable = false, length = 50)
  private String roomName;

  @Enumerated(EnumType.STRING)
  @Column(name = "room_type", nullable = false, length = 20)
  private RoomType roomType;

  @Column(nullable = false)
  private Integer capacity;

  @Column(name = "price_general")
  private Integer priceGeneral;

  @Column(name = "price_owner")
  private Integer priceOwner;

  // Postgres TEXT[] — Hibernate 6는 @Array 또는 커스텀 타입 필요.
  // 실무에서는 hibernate-types 라이브러리 또는 JPA Converter로 콤마 문자열 ↔ List<String>.
  @Column(name = "allowed_member_types", nullable = false, columnDefinition = "text[]")
  @Convert(converter = StringArrayToMemberTypeListConverter.class)
  private List<MemberType> allowedMemberTypes;

  @Column(nullable = false)
  private Integer stock;

  @Column(name = "total_stock", nullable = false)
  private Integer totalStock;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;
}

public enum RoomType { STANDARD, FAMILY, SUITE }
```

> `allowed_member_types`는 JPA + Postgres 배열 매핑이 번거로우면 대안: VARCHAR에 `"GENERAL,OWNER"`로 저장하고 `@Convert`로 List 변환. Flyway 스키마와 일치하게 선택할 것.
> **권장(단순)**: VARCHAR(50) + 콤마 구분. 본 설계 기본값으로 채택 → 아래 Flyway도 VARCHAR 버전으로 작성.

### 5.2-b (채택) `Room.allowedMemberTypes`를 VARCHAR로 단순화
```java
@Column(name = "allowed_member_types", nullable = false, length = 50)
@Convert(converter = MemberTypeListConverter.class)
private List<MemberType> allowedMemberTypes;
// 저장 형태: "GENERAL,OWNER" 또는 "OWNER"
```

### 5.3 `Reservation`
```java
@Entity
@Table(name = "reservations",
       indexes = {
         @Index(name = "idx_reservations_user_created", columnList = "user_id, created_at DESC"),
         @Index(name = "idx_reservations_room_stay",    columnList = "room_code, stay_date")
       })
public class Reservation {
  @Id @GeneratedValue(strategy = IDENTITY)
  private Long id;

  @Column(name = "reservation_number", nullable = false, unique = true, length = 20)
  private String reservationNumber;

  @ManyToOne(fetch = LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = LAZY)
  @JoinColumn(name = "room_code", nullable = false)
  private Room room;

  @Column(name = "guest_name", nullable = false, length = 30)
  private String guestName;

  @Column(name = "guest_phone", nullable = false, length = 20)
  private String guestPhone;

  @Column(name = "guest_count", nullable = false)
  private Integer guestCount;

  @Column(name = "special_request", columnDefinition = "text")
  private String specialRequest;

  @Column(name = "stay_date", nullable = false)
  private LocalDate stayDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "member_type_snapshot", nullable = false, length = 10)
  private MemberType memberTypeSnapshot;

  @Column(name = "price_snapshot", nullable = false)
  private Integer priceSnapshot;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 15)
  private ReservationStatus status;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;
}

public enum ReservationStatus { CONFIRMED }
```

---

## 6. Flyway 마이그레이션

### 6.1 위치 / 네이밍 규칙
- 경로: `apps/api/src/main/resources/db/migration/`
- 네이밍: `V{MAJOR}_{MINOR}__{snake_case_description}.sql`
- 예시:
  - `V1_1__create_users.sql`
  - `V1_2__create_rooms.sql`
  - `V1_3__create_reservations.sql`
  - `V1_4__seed_rooms.sql`
- MAJOR는 배포 마일스톤(초기 = 1), MINOR는 마일스톤 내 순차.
- 스키마 수정은 **항상 새 파일** (기존 파일 수정 금지).

### 6.2 V1_1__create_users.sql
```sql
CREATE TABLE users (
  id             BIGSERIAL PRIMARY KEY,
  login_id       VARCHAR(20)  NOT NULL UNIQUE,
  password       VARCHAR(72)  NOT NULL,
  name           VARCHAR(30)  NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  email          VARCHAR(100),
  owner_number   VARCHAR(20),
  member_type    VARCHAR(10)  NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_users_member_type CHECK (member_type IN ('OWNER','GENERAL'))
);
CREATE UNIQUE INDEX uq_users_owner_number
  ON users(owner_number) WHERE owner_number IS NOT NULL;
```

### 6.3 V1_2__create_rooms.sql
```sql
CREATE TABLE rooms (
  room_code             VARCHAR(10) PRIMARY KEY,
  room_name             VARCHAR(50) NOT NULL,
  room_type             VARCHAR(20) NOT NULL,
  capacity              INT         NOT NULL,
  price_general         INT,
  price_owner           INT,
  allowed_member_types  VARCHAR(50) NOT NULL,
  stock                 INT         NOT NULL,
  total_stock           INT         NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_rooms_room_type CHECK (room_type IN ('STANDARD','FAMILY','SUITE')),
  CONSTRAINT chk_rooms_stock_nonneg CHECK (stock >= 0),
  CONSTRAINT chk_rooms_stock_le_total CHECK (stock <= total_stock)
);
```

### 6.4 V1_3__create_reservations.sql
```sql
CREATE TABLE reservations (
  id                     BIGSERIAL PRIMARY KEY,
  reservation_number     VARCHAR(20) NOT NULL UNIQUE,
  user_id                BIGINT      NOT NULL REFERENCES users(id),
  room_code              VARCHAR(10) NOT NULL REFERENCES rooms(room_code),
  guest_name             VARCHAR(30) NOT NULL,
  guest_phone            VARCHAR(20) NOT NULL,
  guest_count            INT         NOT NULL,
  special_request        TEXT,
  stay_date              DATE        NOT NULL,
  member_type_snapshot   VARCHAR(10) NOT NULL,
  price_snapshot         INT         NOT NULL,
  status                 VARCHAR(15) NOT NULL DEFAULT 'CONFIRMED',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_reservations_member_type CHECK (member_type_snapshot IN ('OWNER','GENERAL')),
  CONSTRAINT chk_reservations_status      CHECK (status IN ('CONFIRMED')),
  CONSTRAINT chk_reservations_guest_count CHECK (guest_count >= 1)
);
CREATE INDEX idx_reservations_user_created ON reservations(user_id, created_at DESC);
CREATE INDEX idx_reservations_room_stay    ON reservations(room_code, stay_date);
```

### 6.5 V1_4__seed_rooms.sql
```sql
INSERT INTO rooms (room_code, room_name, room_type, capacity,
                   price_general, price_owner, allowed_member_types,
                   stock, total_stock) VALUES
  ('STD-OCN','스탠다드 오션',     'STANDARD', 3, 280000, 180000, 'GENERAL,OWNER', 12, 12),
  ('STD-MNT','스탠다드 마운틴',   'STANDARD', 3, 250000, 160000, 'GENERAL,OWNER', 10, 10),
  ('FAM-DLX','패밀리 디럭스',     'FAMILY',   5, 420000, 280000, 'GENERAL,OWNER',  8,  8),
  ('FAM-PRM','패밀리 프리미엄',   'FAMILY',   6,   NULL, 380000, 'OWNER',          4,  4),
  ('SUT-EXE','이그제큐티브 스위트','SUITE',    4, 780000, 520000, 'GENERAL,OWNER',  6,  6),
  ('SUT-PRE','프레지덴셜 스위트', 'SUITE',    6,   NULL,1200000, 'OWNER',          2,  2);
```

---

## 7. JPA ↔ Flyway 공존 전략

- `spring.jpa.hibernate.ddl-auto=update` : 개발 편의. **운영 배포 전에는 `validate`로 전환 권장**.
- `spring.flyway.enabled=true`, `spring.flyway.baseline-on-migrate=true`.
- 순서: Flyway가 먼저 스키마를 만들고, JPA는 validate/update로 후처리.
- 스키마 변경은 **반드시 Flyway 파일로**. JPA 엔티티 필드만 바꾸고 DB에 미반영되는 상황 방지.

---

## 8. 네이밍/매핑 변환 규칙

| 영역 | 규칙 |
|---|---|
| DB 컬럼 | snake_case |
| 엔티티 필드 | camelCase, `@Column(name="snake_case")` 명시 |
| DTO 필드 | camelCase (JSON 그대로 노출) |
| API JSON | camelCase |
| Enum | 문자열 상수, 대문자 (`OWNER`, `GENERAL`, `CONFIRMED`) |

PhysicalNamingStrategy로 일괄 변환하는 대신 `@Column(name="...")` 명시 권장 (명확성).
