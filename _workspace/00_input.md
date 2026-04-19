# 입력 요약 — YT 리조트 예약 시스템

## 제품 개요
리조트 객실 예약 웹 애플리케이션. 회원가입/로그인 후 객실 조회 → 예약 → 예약 확인까지의 흐름을 제공한다.

## 참조 자료
- PRD: `docs/prd/yt_resort.md`
- 프로토타입(Claude Design 생성, localStorage 기반): `docs/prototype/yt_resort/index.html` + `docs/prototype/yt_resort/src/*.jsx`
  - mock.jsx (253 L), components.jsx (457 L), pages-auth.jsx (456 L), pages-home.jsx (258 L), pages-rooms.jsx (494 L), pages-booking.jsx (580 L), app.jsx (88 L)

## 핵심 기능
1. 회원가입 — 분양회원번호 유무에 따라 `분양회원(OWNER)` / `일반회원(GENERAL)` 구분
2. 로그인 — 아이디/비밀번호
3. 객실 조회 — 목록 및 상세 (회원 유형별 금액/예약 가능 여부)
4. 예약 — 1박 1실, 회원 유형·재고 검증 후 재고 -1
5. 예약 확인 — 본인 예약만 조회

## 페이지
- 메인, 회원가입, 로그인, 객실 목록, 객실 상세, 예약, 예약 확인

## 권한 매트릭스
| 페이지 | 접근 |
|---|---|
| 메인 / 로그인 / 회원가입 / 객실 목록 / 객실 상세 | 전체 공개 |
| 예약 / 예약 확인 | 로그인 필수 |

## 기술 스택 (필수 고정)

### 프론트엔드
- Next.js (TypeScript, App Router)
- Tailwind CSS
- Redux(Redux Toolkit) — 전역 상태
- Zod — API 응답/폼 검증
- **middleware.ts** — 인증 필요 페이지 접근 제어
- 로그인 이후: JWT 저장 + 별도 사용자 정보 조회 API(`/api/users/me`) 호출하여 최소 정보(ID, 이름)만 Redux 저장. 화면의 `~~님` 표시에 사용

### 백엔드
- Spring Boot + Gradle
- PostgreSQL
- JPA (`ddl-auto=update` 등 자동 생성 활성)
- Flyway (스키마 버전 관리, JPA와 병행)
- Spring Security + JWT
  - `username` 필드 = 회원 로그인 ID
- `application.yml` — DB 접속 정보(host, port, db, user, password)는 외부 설정(환경변수/`application-local.yml`) 주입 가능하도록 비워두거나 placeholder 사용

## UI/UX 기준
프로토타입(`docs/prototype/yt_resort/index.html`)의 화면 구조와 흐름을 그대로 유지한다. 색상 팔레트(네이비+골드), 타이포(Noto Serif KR + Pretendard), 레이아웃, 페이지 전환 흐름은 프로토타입을 그대로 따른다.

## 통신 구조
1. 로그인 → JWT 발급(백) → 프론트 저장
2. 사용자 정보 조회(`/api/users/me`) → Redux에 최소 정보 저장
3. 이후 요청 시 `Authorization: Bearer <token>` 헤더로 인가

## 주요 데이터 모델 (1차 정의)
- **User**: id, loginId(=username, unique), password(BCrypt), name, phone, email?, ownerNumber?, memberType(OWNER/GENERAL)
- **Room**: roomCode, roomName, stock, priceOwner, priceGeneral, allowedMemberTypes
- **Reservation**: reservationNumber, userId, roomCode, guestName, guestPhone, stayDate(1박), memberTypeSnapshot, status(CONFIRMED/CANCELLED), createdAt

## 검증 포인트
- 회원가입: 아이디 중복, 비밀번호(8자리+영문+숫자), 연락처 형식, 이메일 형식(선택), 필수값
- 예약: 회원 유형이 해당 객실 예약 가능한지, 재고 > 0
- 재고: 성공 시 1 차감, 동시성 고려

## 산출물 위치
- `_workspace/01_architect_*.md` (spec / data_model / api_spec / page_structure)
- `apps/web/` — 프론트엔드 (Next.js)
- `apps/api/` — 백엔드 (Spring Boot)
- `_workspace/02_frontend_report.md`, `_workspace/02_backend_report.md`
- `_workspace/03_qa_report.md`
