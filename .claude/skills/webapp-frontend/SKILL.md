---
name: webapp-frontend
description: "React/Next.js 기반 웹 애플리케이션의 프론트엔드 구현 스킬. 페이지, 컴포넌트, 커스텀 훅, 타입 정의를 생성한다. frontend-dev 에이전트가 사용한다."
---

# 프론트엔드 구현

architect의 설계를 바탕으로 Next.js App Router 기반 프론트엔드를 구현한다.

## 구현 워크플로우

### Step 1: 설계 문서 확인

`_workspace/01_architect_*.md` 파일들을 읽고 다음을 파악한다:
- 페이지 구조 및 라우팅
- API 엔드포인트 및 응답 shape
- 데이터 모델에서 프론트에 노출되는 필드

### Step 2: 타입 정의

API 응답 shape에 맞춰 TypeScript 인터페이스를 정의한다. `src/types/`에 도메인별 파일로 분리.

**핵심:** 타입 정의는 API 응답 shape과 **정확히** 일치해야 한다. `fetchJson<T>`의 T가 실제 응답과 다르면 런타임 에러가 발생하지만 컴파일은 통과한다.

### Step 3: API 연동 훅

`src/hooks/`에 API별 커스텀 훅을 작성한다.

**래핑된 응답 처리:**
```typescript
// API가 { items: User[], total: number }를 반환할 때
const { data } = useFetch<{ items: User[]; total: number }>("/api/users");
// data.items로 접근 (data를 직접 User[]로 캐스팅하지 않는다)
```

**snake_case → camelCase:**
백엔드가 camelCase로 변환해서 보내도록 설계되어 있으므로, 프론트 타입도 camelCase로 정의한다. 만약 snake_case가 오면 변환 유틸을 적용한다.

### Step 4: 페이지 구현

`src/app/` 하위에 architect의 페이지 구조대로 파일을 생성한다.

**라우팅 주의사항:**
- `href`와 `router.push()` 값은 실제 URL 경로와 일치해야 한다
- route group `(group)`은 URL에서 제거된다
- 예: `src/app/(dashboard)/settings/page.tsx` → URL은 `/settings`

### Step 5: 컴포넌트 구현

`src/components/`에 재사용 컴포넌트를 생성한다.

**구조 원칙:**
- 도메인별 하위 디렉토리 (`components/user/`, `components/layout/`)
- 컴포넌트당 하나의 파일
- Props 인터페이스를 컴포넌트 파일 상단에 정의

## 경계면 준수 체크

구현 완료 후 스스로 확인하라:
- 모든 `fetchJson<T>`의 T가 API 스펙의 응답 shape과 일치하는가?
- 모든 `href`, `router.push` 값이 실제 page 파일 경로와 매칭되는가?
- 옵셔널 필드에 대한 null 처리가 되어 있는가?

## 산출물

- 프로젝트 소스 코드에 직접 파일 생성/수정
- `_workspace/02_frontend_report.md` — 구현 파일 목록, 미완료 항목
