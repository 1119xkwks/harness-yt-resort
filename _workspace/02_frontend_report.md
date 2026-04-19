# 02. 프론트엔드 구현 보고서 (YT 리조트)

## 요약
- 프로젝트 위치: `D:/dev/harness-test01/apps/web/`
- 기술 스택: Next.js 14.2.15 (App Router) + TypeScript (strict) + Tailwind + Redux Toolkit + Zod
- 빌드 상태: `next build` 성공, 전체 8개 라우트 생성 + middleware 활성
- 타입체크: `tsc --noEmit` 통과

## 구현된 라우트
| URL | 파일 | 로그인 필요 | 비고 |
|---|---|:-:|---|
| `/` | `src/app/page.tsx` | ✗ | Hero + 객실 3개 프리뷰 + 비로그인 가입 CTA |
| `/login` | `src/app/login/page.tsx` | ✗ | Suspense 래핑 (`useSearchParams`) |
| `/signup` | `src/app/signup/page.tsx` | ✗ | `ownerNumber` 입력 여부로 memberType 프리뷰 |
| `/rooms` | `src/app/rooms/page.tsx` | ✗ | 필터 `all/available/owner-only` |
| `/rooms/[roomCode]` | `src/app/rooms/[roomCode]/page.tsx` | ✗ | 404 시 `notFound()` |
| `/booking/[roomCode]` | `src/app/booking/[roomCode]/page.tsx` | ○ | 확인 모달 → POST → 완료 리다이렉트 |
| `/booking/complete/[reservationNumber]` | `src/app/booking/complete/[reservationNumber]/page.tsx` | ○ | `GET /api/reservations`에서 번호로 조회 |
| `/reservations` | `src/app/reservations/page.tsx` | ○ | 필터 `all/confirmed`, `createdAt desc` |

## 공통 인프라
- `src/lib/api.ts` — `fetchJson<T>(path, schema, { auth, body, method })`.
  - 응답 200: Zod 검증 → 실패 시 `SchemaMismatchError` (dev 콘솔에 issue 로그).
  - 4xx/5xx + ApiError shape: `ApiClientError(status, code, message, field?)`.
  - `auth: true` 시 `Authorization: Bearer <token>` 자동 첨부.
- `src/lib/schemas/` — architect API 스펙 4파일 분리: `error.ts / auth.ts / room.ts / reservation.ts` + `index.ts` barrel.
- `src/middleware.ts` — `/booking/:path*`, `/reservations/:path*` 보호. 쿠키 `token` 없으면 `/login?returnTo=<원래경로>` 로 리다이렉트.
- `src/lib/auth.ts` — `establishSession(token, user)`, `loadMeAndStore(token)`, `clearSession()`.
  - JWT는 **쿠키(`token`, Path=/, SameSite=Lax, Max-Age 24h) + localStorage(`token`)** 두 곳 모두 저장.
  - 앱 부팅 시 `Providers` 내 `AuthBootstrap`가 토큰 존재 시 `/api/users/me`로 rehydrate, 401이면 완전 정리.
- `src/store/` — `auth`(token만) / `user`(UserInfo: id/loginId/name/memberType만). 다른 슬라이스 없음.
- Tailwind 테마: navy/gold/cream 팔레트 + Noto Serif KR + Pretendard 매핑 (`tailwind.config.ts`, `globals.css`).

## 커스텀 훅
- `useRooms()` — `GET /api/rooms` → `RoomSummary[]`
- `useRoom(roomCode)` — `GET /api/rooms/{roomCode}` → `RoomDetail`, 404 구분
- `useReservations()` — `GET /api/reservations` (auth) → `Reservation[]`

모두 `fetchJson` + Zod 스키마 경유, shape 불일치 시 바로 노출.

## 상태 전이 구현 포인트
- 로그인: `POST /api/auth/login` → `loadMeAndStore(token)` → `router.replace(returnTo ?? '/')`.
- 회원가입: `POST /api/auth/signup` 응답의 `token + user`로 즉시 `establishSession` → `/`.
- 예약: 클라이언트 검증 → `confirmModal` → `POST /api/reservations`
  - 201: `/booking/complete/{reservationNumber}`
  - 401: `clearSession()` + `/login?returnTo=/booking/{roomCode}`
  - 403 `MEMBER_TYPE_NOT_ALLOWED` / 409 `OUT_OF_STOCK` → blockModal → 객실 목록
  - 422 `STAY_DATE_PAST` / `GUEST_COUNT_RANGE` → inline error
- 예약 완료: `useReservations()` 결과에서 `reservationNumber`로 매칭, 없으면 "찾을 수 없음" 안내.

## 실행 방법
```bash
cd apps/web
cp .env.local.example .env.local   # 필요 시 NEXT_PUBLIC_API_BASE_URL 수정
npm install
npm run dev     # http://localhost:3000
```
- 기본 API 프록시: `next.config.mjs`의 `rewrites`가 `/api/*` → `${NEXT_PUBLIC_API_BASE_URL}/api/*` (기본 `http://localhost:8080`).
- 타입체크: `npm run typecheck`
- 프로덕션 빌드: `npm run build`

## QA 피드백 반영 (Task #12 / #13)
- **F1 (ApiErrorSchema 중복)** — 해당 없음 확인. 스키마는 `src/lib/schemas/` 디렉터리로 분리되어 있고 `error.ts`는 `index.ts` barrel을 거쳐 `api.ts`에서 실제 사용 중.
- **빈 문자열 처리** — `schemas/auth.ts`의 `email/ownerNumber`를 `z.union([z.literal(''), ...]).optional()`로 완화. `""`, `undefined`, 유효값 모두 통과 (architect spec §4와 정합).
- **F2 (런타임 401 자동 로그아웃)** — `lib/api.ts`에 `setUnauthorizedHandler()` 도입, `Providers`에서 `useEffect`로 핸들러 등록. auth 요청 시 401 수신 즉시 `clearAuthToken` + Redux clear + 보호 경로에 있으면 `/login?returnTo=<pathname>`으로 `router.replace`.
- **타임존** — `format.ts` 전체를 `Intl.DateTimeFormat` + `timeZone: 'Asia/Seoul'` 고정으로 변경. BE JVM TZ가 UTC/KST 어느 쪽이든, 브라우저 TZ와 무관하게 항상 KST 표시.

## 주의 사항 / 미완료
- 약관/개인정보 전문 모달은 체크박스 + 필수 검증만 구현 (전문보기 모달은 스코프 제외).
- Toast 시스템은 도입하지 않음 — 에러는 각 페이지의 inline banner/모달로 처리.
- 예약 목록의 상태 필터는 현재 `CONFIRMED` 단일 상태라 기능적 차이 없음 (스코프 내 취소 미구현).

## 백엔드 경계면 정합성 (확정)
- `/api/users/me` ↔ `MeResponseSchema` — ✓ 일치
- `/api/rooms` / `/api/rooms/{roomCode}` ↔ `RoomListResponseSchema` / `RoomDetailSchema` — ✓ 일치 (`priceGeneral`/`priceOwner` nullable, `allowedMemberTypes` 단일 원소 `["OWNER"]` 허용)
- `POST /api/reservations` 201 Created ↔ `ReservationSchema` — ✓ `fetchJson`은 `res.ok` 검사라 201 정상 처리
- `GET /api/reservations` ↔ `ReservationListResponseSchema` — ✓ 일치
- `createdAt`: ISO 8601 with offset (`+09:00` 또는 `Z`) — ✓ FE가 KST 고정 표시로 처리하므로 어떤 오프셋이 와도 일관된 결과
- 에러 코드: `MEMBER_TYPE_NOT_ALLOWED`, `OUT_OF_STOCK`, `STAY_DATE_PAST`, `GUEST_COUNT_RANGE`, `OWNER_NUMBER_FORMAT`, `PHONE_FORMAT`, `EMAIL_FORMAT`, `PASSWORD_POLICY` 각각 해당 페이지에서 inline error 또는 blockModal로 매핑 — ✓ 구현
