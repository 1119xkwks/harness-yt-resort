---
name: webapp-qa
description: "웹 애플리케이션의 통합 정합성 검증 스킬. API 응답과 프론트 훅의 shape 교차 비교, 라우팅 경로 매칭 검증, 상태 전이 완전성 추적, DB-API-UI 데이터 흐름 일관성 검증을 수행한다. qa-inspector 에이전트가 사용한다."
---

# 통합 정합성 검증 (QA)

모듈 간 **경계면 불일치**를 찾아내는 교차 검증을 수행한다. 개별 코드의 정상 동작이 아닌, 연결 지점의 계약 일치를 검증한다.

## 검증 워크플로우

### Step 1: 기준 수집

architect의 설계 문서에서 검증 기준을 추출한다:
- API 스펙의 응답 shape → 프론트 훅 타입과 비교할 기준
- 페이지 구조 → 링크 경로와 비교할 기준
- 상태 전이 맵 → 코드의 전이와 비교할 기준

### Step 2: API <-> 프론트 교차 검증

각 API route에 대해:

1. `src/app/api/` 하위 route 파일에서 `NextResponse.json()`에 전달하는 객체의 shape을 추출한다
2. 대응하는 `src/hooks/` 파일에서 `fetchJson<T>` 또는 fetch 호출의 기대 타입을 추출한다
3. 두 shape을 비교한다:
   - 필드명 일치 여부 (camelCase 통일)
   - 래핑 구조 일치 (`{ items: [...] }` vs 배열 직접 반환)
   - 옵셔널 필드 처리 일관성
4. API 엔드포인트에 대응하는 훅이 존재하지 않으면 "누락" 플래그

### Step 3: 라우팅 교차 검증

1. `src/app/` 하위 page 파일의 URL 경로를 추출한다
   - route group `(group)`은 URL에서 제거
   - 동적 세그먼트 `[id]`는 패턴으로 처리
2. 코드 내 모든 `href=`, `router.push(`, `redirect(` 값을 수집한다
3. 각 링크가 실제 존재하는 page 경로와 매칭되는지 확인한다

### Step 4: 상태 전이 교차 검증

1. architect의 상태 전이 맵에서 허용된 전이 목록을 추출한다
2. 코드에서 모든 `.update({ status: "..." })` 또는 status 변경 패턴을 검색한다
3. 비교:
   - 맵에 있는데 코드에 없는 전이 → "미구현 전이"
   - 코드에 있는데 맵에 없는 전이 → "무단 전이"
   - 프론트의 `if (status === "X")` 분기에서 X가 실제 도달 가능한지 확인

### Step 5: 데이터 흐름 검증

DB 컬럼명 → API 응답 필드명 → 프론트 타입 정의를 추적한다:
- snake_case(DB) → camelCase(API) 변환이 일관된지
- API 응답의 필드와 프론트 타입 정의의 필드가 일치하는지

## 리포트 형식

```markdown
# QA 검증 리포트

## 요약
- 통과: N개
- 실패: N개
- 미검증: N개

## 실패 항목

### [F-001] API 응답 shape 불일치
- 경계면: API → 프론트 훅
- 위치: `src/app/api/users/route.ts:25` <-> `src/hooks/useUsers.ts:12`
- 문제: API가 `{ users: [...] }` 반환, 훅이 `User[]` 기대
- 수정 제안: 훅에서 `.users`로 unwrap하거나 API가 배열 직접 반환

### [F-002] 링크 경로 불일치
- 경계면: 파일 경로 → href
- 위치: `src/components/Nav.tsx:8`
- 문제: href="/settings" 이지만 페이지는 /dashboard/settings
- 수정 제안: href를 "/dashboard/settings"으로 변경
```

## 점진적 검증

전체 완성 후 일괄 검증이 아니라, 각 모듈 완성 직후 해당 경계면을 즉시 검증한다. backend-dev가 API를 완성하면 해당 API + 대응 훅을 바로 검증한다.
