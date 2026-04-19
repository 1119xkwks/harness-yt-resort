---
name: webapp-architect
description: "웹 애플리케이션의 요구사항 분석, 아키텍처 설계, 데이터 모델링, API 스펙 정의, 페이지 구조 설계를 수행하는 스킬. architect 에이전트가 사용한다."
---

# 웹 애플리케이션 아키텍처 설계

사용자의 요구사항을 분석하여 프론트엔드/백엔드 개발자가 즉시 구현할 수 있는 설계 문서를 생성한다.

## 설계 워크플로우

### Step 1: 요구사항 분석

1. 사용자 요구사항에서 핵심 기능을 추출한다
2. 각 기능을 CRUD 관점에서 분해한다
3. 사용자 역할(role)과 권한을 정의한다
4. 비기능 요구사항(성능, 보안)을 식별한다

### Step 2: 기술 스택 선정

프로젝트 특성에 맞는 기술 스택을 선정한다. 기존 코드베이스가 있으면 해당 스택을 우선한다.

**기본 스택 (특별한 요구가 없을 때):**
- 프론트엔드: Next.js (App Router) + TypeScript + Tailwind CSS
- 백엔드: Next.js Route Handlers 또는 별도 서버
- DB: 프로젝트 요구에 따라 선정
- 인증: 프로젝트 요구에 따라 선정

### Step 3: 데이터 모델 설계

테이블/컬렉션 단위로 스키마를 정의한다:

```markdown
## 테이블: {table_name}

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| id | uuid | PK | 고유 식별자 |
| ... | ... | ... | ... |

### 관계
- {table_name}.{fk} → {other_table}.id (1:N)
```

### Step 4: API 스펙 정의

각 엔드포인트의 경로, 메서드, 요청/응답 shape을 명확히 정의한다:

```markdown
## API: {기능명}

### `GET /api/{resource}`
- 설명: {목적}
- 인증: 필요/불필요
- 요청 파라미터: { ... }
- 응답 shape:
  ```json
  {
    "items": [...],
    "total": 0,
    "page": 1
  }
  ```
- 에러 응답: `{ "error": "메시지", "code": "ERROR_CODE" }`
```

**경계면 명확화 원칙:**
- 응답 필드명은 camelCase로 통일한다
- 래핑 구조(`{ items: [...] }` vs 직접 배열)를 명시한다
- 옵셔널 필드는 `?`로 표시한다
- 날짜 형식(ISO 8601)을 명시한다

### Step 5: 페이지 구조 설계

Next.js App Router 기준 디렉토리 구조를 설계한다:

```markdown
## 페이지 구조

src/app/
├── layout.tsx (루트 레이아웃)
├── page.tsx (/)
├── (auth)/
│   ├── login/page.tsx (/login)
│   └── register/page.tsx (/register)
└── (dashboard)/
    ├── layout.tsx
    └── dashboard/
        ├── page.tsx (/dashboard)
        └── [id]/page.tsx (/dashboard/[id])
```

**주의:** route group `(auth)`, `(dashboard)`는 URL에 포함되지 않는다. 괄호 안의 이름은 URL 경로에서 제거된다.

### Step 6: 상태 전이 맵 (해당되는 경우)

상태를 가진 엔티티가 있으면 전이 맵을 정의한다:

```markdown
## 상태 전이: {Entity}

| 현재 상태 | 이벤트 | 다음 상태 | 트리거 |
|----------|--------|----------|--------|
| draft | submit | pending | 사용자 |
| pending | approve | approved | 관리자 |
| pending | reject | rejected | 관리자 |
```

## 산출물

모든 산출물은 `_workspace/` 하위에 저장한다:
- `01_architect_spec.md` — 기능 명세 + 기술 스택
- `01_architect_data_model.md` — DB 스키마 + 관계도
- `01_architect_api_spec.md` — API 엔드포인트 + 요청/응답 shape
- `01_architect_page_structure.md` — 페이지 구조 + 라우팅 맵
