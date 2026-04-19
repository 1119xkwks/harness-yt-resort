# 04. 페이지 구조 (Next.js App Router)

> FE: Next.js 14+ (App Router, TS) + Tailwind + Redux Toolkit + Zod + middleware.ts
> 루트: `apps/web/src/app/`
> 프로토타입 화면 흐름을 App Router 구조로 변환. 프로토타입의 `page` 문자열 키와 실제 URL을 매칭.

---

## 1. 전체 라우트 맵

| 프로토타입 page | Next.js URL | 파일 경로 (`apps/web/src/app/` 기준) | 로그인 필요 |
|---|---|---|:---:|
| `home` | `/` | `page.tsx` | × |
| `login` | `/login` | `login/page.tsx` | × |
| `signup` | `/signup` | `signup/page.tsx` | × |
| `rooms` | `/rooms` | `rooms/page.tsx` | × |
| `room-detail` | `/rooms/[roomCode]` | `rooms/[roomCode]/page.tsx` | × |
| `booking` | `/booking/[roomCode]` | `booking/[roomCode]/page.tsx` | ○ |
| `booking-complete` | `/booking/complete/[reservationNumber]` | `booking/complete/[reservationNumber]/page.tsx` | ○ |
| `bookings` | `/reservations` | `reservations/page.tsx` | ○ |

### 루트 레이아웃
```
apps/web/src/app/
├─ layout.tsx           # <html>/<body>, Redux Provider, ToastProvider, Noto Serif KR + Pretendard 폰트
├─ page.tsx             # 홈
├─ loading.tsx          # 전역 로딩 스켈레톤 (선택)
├─ error.tsx            # 전역 에러 경계
├─ not-found.tsx        # 404
├─ globals.css          # Tailwind + 프로토타입 CSS 변수 (네이비/골드/크림 팔레트)
├─ (components)/        # 공통 Header, Footer, Modal, Toast, Icon, Button 등
├─ login/page.tsx
├─ signup/page.tsx
├─ rooms/
│  ├─ page.tsx
│  └─ [roomCode]/page.tsx
├─ booking/
│  ├─ [roomCode]/page.tsx
│  └─ complete/[reservationNumber]/page.tsx
└─ reservations/page.tsx
```

> `(components)` 폴더는 App Router의 route-grouping 구문으로 URL에 포함되지 않음. 공통 컴포넌트 배치용.
> 실질적으로는 `apps/web/src/components/`, `apps/web/src/lib/`, `apps/web/src/store/`, `apps/web/src/hooks/`를 앱 루트와 별도로 두어도 무방.

---

## 2. middleware.ts

위치: `apps/web/src/middleware.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  /^\/booking(\/|$)/,
  /^\/reservations(\/|$)/,
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const needsAuth = PROTECTED.some(re => re.test(pathname));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get('token')?.value;
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('returnTo', pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/booking/:path*', '/reservations/:path*'],
};
```

- 로그인 성공 시 FE는 JWT를 `localStorage` + **`document.cookie = 'token=...; path=/; SameSite=Lax'`** 두 곳 모두 저장.
- 로그아웃 시 두 곳 모두 삭제.
- middleware는 서버 측에서 실행되므로 `localStorage`를 볼 수 없어 쿠키 필요.
- 쿠키는 **HttpOnly 아님**(JS에서 셋팅/삭제 해야 함). CSRF 리스크는 이 단계에선 수용 — 모든 API 요청은 Authorization 헤더로 인증하며 쿠키는 middleware 라우팅용으로만 사용.

---

## 3. Redux 슬라이스 구조

위치: `apps/web/src/store/`

```
store/
├─ index.ts            # configureStore, RootState, AppDispatch
├─ hooks.ts            # useAppDispatch, useAppSelector typed hooks
├─ auth/
│  ├─ authSlice.ts     # state: { token: string | null }
│  └─ authActions.ts   # loginThunk, logoutAction
└─ user/
   ├─ userSlice.ts     # state: { id, loginId, name, memberType } | null
   └─ userActions.ts   # fetchMeThunk, clearUserAction
```

### 3.1 `authSlice`
```ts
type AuthState = { token: string | null };

const initial: AuthState = { token: null };

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setToken: (s, a: PayloadAction<string>) => { s.token = a.payload; },
    clearToken: (s) => { s.token = null; },
  },
});
```
- 앱 부팅 시 `localStorage.getItem('token')`으로 rehydrate (store/index.ts의 preloadedState).

### 3.2 `userSlice`
```ts
type UserState = {
  id: number;
  loginId: string;
  name: string;
  memberType: 'OWNER' | 'GENERAL';
} | null;

const userSlice = createSlice({
  name: 'user',
  initialState: null as UserState,
  reducers: {
    setUser: (_, a: PayloadAction<UserState>) => a.payload,
    clearUser: () => null,
  },
});
```

### 3.3 store 구성
```ts
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
  },
});
```
- **오직 이 두 슬라이스만.** 객실 목록이나 예약 목록은 컴포넌트에서 React Query 또는 자체 `useEffect + fetch`로 로드(본 스코프에선 Redux에 캐시하지 않음).

### 3.4 부팅 시퀀스
`RootProvider` (layout.tsx에서 사용):
1. localStorage에서 token 읽어 `authSlice.setToken` 디스패치.
2. token이 있으면 `fetchMeThunk` 호출 → `/api/users/me` → `userSlice.setUser`. 실패(401) 시 토큰/쿠키/유저 모두 클리어.
3. 이후 UI 렌더.

---

## 4. 페이지별 섹션 구조 및 상태 전이

> 각 페이지는 "섹션" = 화면 수직 구획, "상태" = 페이지 내 국소 상태(loading/error/form 등)

### 4.1 `/` (홈) — `home`
- 섹션: Hero, 객실 프리뷰(상위 3개), 회원 혜택, CTA.
- 데이터: `GET /api/rooms` (상위 3개만 노출)
- 상태: `loading | ready | error` (API 실패 시 정적 플레이스홀더).

### 4.2 `/login`
- 섹션: 로그인 폼, 회원가입 링크, 데모 계정 안내.
- 쿼리: `?returnTo=<encoded path>`
- 국소 상태: `{ form, error, loading }`
- 상태 전이:
  ```
  idle ── submit ──▶ submitting ──success──▶ POST /api/auth/login 성공
                                        │
                                        ├─► GET /api/users/me
                                        │     │
                                        │     ├─ 200: setToken + setUser → router.push(returnTo ?? '/')
                                        │     └─ 401: clearAll + error "세션 오류"
                                        │
                                        └─failure──▶ idle + error "아이디 또는 비밀번호가 일치하지 않습니다"
  ```
- 로그인 성공 후처리 (필수):
  1. `localStorage.setItem('token', res.token)`
  2. `document.cookie = 'token=' + res.token + '; path=/; SameSite=Lax'`
  3. `dispatch(setToken(res.token))`
  4. `await dispatch(fetchMeThunk())` → 성공 시 `router.push(returnTo ?? '/')`

### 4.3 `/signup`
- 섹션: 안내 + 회원유형 미리보기 카드 + 폼 + 약관.
- 국소 상태: `{ form, errors, idCheckStatus, termsModal, loading }`
- 동적 표시: `form.ownerNumber` 입력 여부로 "OWNER / GENERAL" 카드 토글 (클라이언트 계산).
- 상태 전이:
  ```
  idle ─ submit ─▶ validate (client) ─error─▶ idle + inline errors
                                   │
                                   └ok──▶ POST /api/auth/signup ─2xx─▶ 자동 로그인 (res.token + res.user)
                                                                │         → localStorage + cookie 저장
                                                                │         → dispatch(setToken, setUser)
                                                                │         → router.push('/')
                                                                │
                                                                └409──▶ field="loginId" → inline error
                                                                └422──▶ code별 inline error (OWNER_NUMBER_FORMAT 등)
  ```
- 중복확인 버튼: 별도 API 없으므로 **제출 시 검증**으로 대체. 프로토타입 UI의 "중복확인" 버튼은 MVP에선 숨기거나, 제출 시 중복이면 "이미 사용 중인 아이디입니다" inline error.

### 4.4 `/rooms`
- 섹션: 페이지 타이틀, 회원 배지(세션 있을 때), 필터 탭, 객실 카드 그리드.
- 데이터: `GET /api/rooms`
- 필터(클라이언트): `all | available | owner-only`
  - `available`: 세션 없으면 `stock > 0`, 있으면 `stock > 0 && allowedMemberTypes.includes(user.memberType)`
  - `owner-only`: `allowedMemberTypes.length === 1 && allowedMemberTypes[0] === 'OWNER'`
- 상태 전이:
  ```
  loading ──▶ loaded
          └─error──▶ 에러 화면 (재시도 버튼)
  ```

### 4.5 `/rooms/[roomCode]`
- 섹션: 브래드크럼, 히어로 이미지, 좌(상세 정보/어메니티/회원별 요금 테이블) + 우(예약 카드, sticky).
- 데이터: `GET /api/rooms/{roomCode}`
- 예약 CTA 분기:
  - 세션 없음 → "로그인 후 예약" → `router.push('/login?returnTo=/booking/{roomCode}')`
  - 세션 있음 + `!allowedMemberTypes.includes(user.memberType)` → "예약 불가" disabled
  - 세션 있음 + `stock === 0` → "예약 마감" disabled
  - 그 외 → "예약하기" → `router.push('/booking/{roomCode}')`
- 404 처리: 응답 404 시 `notFound()` 호출 (Next의 `not-found.tsx` 렌더).

### 4.6 `/booking/[roomCode]`  (로그인 필요)
- 섹션: 브래드크럼, 좌(투숙일/투숙자 폼/요청사항/약관) + 우(예약 요약 카드, sticky).
- 데이터:
  - `GET /api/rooms/{roomCode}` (상세)
  - Redux `user` (투숙자 기본값 name/phone용 — 단, `/api/users/me`는 phone을 돌려주지 않으므로 **name만 프리필**. phone은 사용자가 직접 입력)
- 국소 상태: `{ form, errors, loading, confirmModal, blockModal }`
- 상태 전이:
  ```
  idle ─ submit ─▶ validate ─error─▶ idle + inline errors
                         │
                         └ok──▶ confirm-modal-open
                                     │
                                     └ "예약 확정" 클릭 ─▶ submitting
                                                              │
                                                              ├─ 201: setBookingResult → router.push('/booking/complete/{reservationNumber}')
                                                              ├─ 403 MEMBER_TYPE_NOT_ALLOWED: block-modal → rooms 목록으로
                                                              ├─ 409 OUT_OF_STOCK: block-modal "예약 마감" → rooms 목록으로
                                                              ├─ 422 STAY_DATE_PAST | GUEST_COUNT_RANGE: inline error
                                                              └─ 401: clearAll + router.push('/login?returnTo=...')
  ```
- 클라이언트 pre-check: 로드된 room의 `stock`, `allowedMemberTypes`로 진입 시점에 "예약 불가" 화면 표시(프로토타입과 동일). 최종 결정은 서버가 함.

### 4.7 `/booking/complete/[reservationNumber]` (로그인 필요)
- 섹션: 체크 아이콘, 예약번호, 요약 카드 (객실/투숙일/투숙자/인원/예약일시/요금), CTA(홈으로 / 예약 확인 페이지로).
- 데이터: 두 가지 옵션
  - (A) 예약 성공 시 직전 페이지의 응답(`ReservationDetail`)을 `sessionStorage` 또는 Redux `user`와 별개 슬라이스에 일시 저장 후 이 페이지에서 로드.
  - (B) 이 페이지 진입 시 `GET /api/reservations` 호출하여 일치하는 `reservationNumber` 찾기.
- **채택: (B)**. 새로고침/직접 URL 접근도 안전하게 지원 + Redux 복잡도 낮춤.
- 404 처리: 해당 reservationNumber가 내 예약에 없으면 "예약 정보를 찾을 수 없습니다" + 홈 복귀 버튼.

### 4.8 `/reservations` (로그인 필요)
- 섹션: 타이틀, 필터 탭(전체/확정), 예약 카드 리스트.
- 데이터: `GET /api/reservations`
- 필터(클라이언트): `all | confirmed` (취소 기능은 스코프 밖이지만, 상태 탭은 `status === 'CONFIRMED'`만 존재).
- 빈 상태: "예약 내역이 없습니다" + 객실 보러가기 CTA.

---

## 5. Zod 스키마 파일 구조

위치: `apps/web/src/lib/schemas/`
```
schemas/
├─ auth.ts        # SignupRequest, SignupResponse, LoginRequest, LoginResponse, MeResponse
├─ room.ts        # RoomSummary, RoomListResponse, RoomDetail
├─ reservation.ts # CreateReservationRequest, Reservation, ReservationListResponse
└─ error.ts       # ApiError
```

- 응답 검증: fetch 래퍼 `apiClient<T>(url, opts, schema)`에서 `schema.parse(json)`.
- 실패 시 개발 환경은 콘솔에 상세 diff, 프로덕션은 사용자에게 "일시적 오류"로 fallback.

---

## 6. 컴포넌트 구조 (가이드)

```
apps/web/src/components/
├─ layout/
│  ├─ Header.tsx          # 로고, 내비, 로그인 상태별 메뉴 (로그인/로그아웃, ~님)
│  └─ Footer.tsx
├─ ui/
│  ├─ Button.tsx, Input.tsx, Textarea.tsx, Checkbox.tsx, Modal.tsx, Toast.tsx, Icon.tsx, DatePicker.tsx
│  └─ Badge.tsx, Spinner.tsx
└─ room/
   ├─ RoomCard.tsx        # 그리드 카드
   ├─ RoomPlaceholder.tsx # 프로토타입의 그라디언트 플레이스홀더
   └─ PricingTable.tsx    # 회원유형별 요금 표
```

- Header는 `useAppSelector(s => s.user)`로 세션 유무 판단, `onLogout` 시 authSlice/userSlice clear + localStorage/cookie 삭제 + `router.push('/')`.

---

## 7. 데이터 흐름 요약

```
Browser                   middleware.ts        API (Spring Boot)
 │ ── /booking/FAM-DLX ─▶ │ 쿠키 token? ─없음─▶ redirect /login?returnTo=/booking/FAM-DLX
 │                         │ ─있음─▶ next
 │                         ▼
 │  page component (RSC/CSR)
 │   ├─ fetch /api/rooms/FAM-DLX (Zod parse) ─────▶ GET /api/rooms/FAM-DLX
 │   ├─ useAppSelector(s => s.user)
 │   └─ submit ─▶ fetch /api/reservations (Bearer) ─▶ POST /api/reservations
```

---

## 8. 테스트/검증 기준 (QA용)

- [ ] 비로그인으로 `/booking/STD-OCN` 진입 → `/login?returnTo=/booking/STD-OCN` 리다이렉트.
- [ ] 로그인 성공 후 `returnTo`가 있으면 해당 URL로 이동, 없으면 `/`.
- [ ] 로그아웃 → 쿠키/localStorage/Redux 모두 비워짐, `/`로 이동.
- [ ] GENERAL로 로그인한 상태에서 `/rooms/FAM-PRM` 상세: 예약 버튼 disabled, "예약 불가" 안내 표시.
- [ ] GENERAL로 `/booking/FAM-PRM` 직접 진입: "예약 불가 객실" 화면 렌더 (API 호출 전에 클라이언트에서 차단).
- [ ] OWNER로 모든 객실 상세 → 예약 페이지 이동 → 폼 제출 → 성공 → `/booking/complete/...`에서 예약번호 확인 가능.
- [ ] `/reservations`에서 본인 예약만 노출. 다른 계정 로그인 시 그 계정 예약만 보임.
- [ ] 401 응답을 받으면 전역 인터셉터가 로그아웃 처리 후 `/login`으로.
