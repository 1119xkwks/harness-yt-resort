---
name: webapp-backend
description: "웹 애플리케이션의 백엔드 구현 스킬. API 라우트, DB 스키마, 인증/인가, 데이터 검증을 구현한다. backend-dev 에이전트가 사용한다."
---

# 백엔드 구현

architect의 설계를 바탕으로 API 라우트, DB 스키마, 서버 로직을 구현한다.

## 구현 워크플로우

### Step 1: 설계 문서 확인

`_workspace/01_architect_*.md` 파일들을 읽고 다음을 파악한다:
- 데이터 모델 (테이블, 관계, 제약조건)
- API 엔드포인트 (경로, 메서드, 요청/응답 shape)
- 상태 전이 맵 (해당되는 경우)
- 인증/인가 요구사항

### Step 2: DB 스키마 구현

architect의 데이터 모델을 기반으로 스키마를 구현한다.

**컬럼명 규칙:**
- DB 컬럼: snake_case (`created_at`, `user_id`)
- API 응답: camelCase (`createdAt`, `userId`)
- 변환 레이어를 명확히 구현한다

### Step 3: API 라우트 구현

각 엔드포인트를 Next.js Route Handler 또는 해당 프레임워크 방식으로 구현한다.

**응답 shape 준수:**
```typescript
// architect의 스펙: { items: User[], total: number }
return NextResponse.json({
  items: users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.created_at,  // snake_case → camelCase 변환
  })),
  total: count,
});
```

**에러 응답 일관성:**
```typescript
return NextResponse.json(
  { error: "사용자를 찾을 수 없습니다", code: "USER_NOT_FOUND" },
  { status: 404 }
);
```

### Step 4: 상태 전이 구현 (해당되는 경우)

architect의 상태 전이 맵에 정의된 **모든** 전이를 코드로 구현한다.

**검증 규칙:**
- 맵에 정의된 전이만 허용, 정의되지 않은 전이는 400 에러 반환
- 중간 상태에서 최종 상태로의 전환이 누락되지 않도록 주의
- 각 전이 코드 옆에 주석으로 출발/도착 상태를 명시

### Step 5: 인증/인가

프로젝트 요구사항에 따라 인증/인가를 구현한다.

### Step 6: 입력 검증

모든 API 엔드포인트에 입력 검증을 적용한다. 시스템 경계(사용자 입력)에서는 반드시 검증한다.

## 경계면 준수 체크

구현 완료 후 스스로 확인하라:
- 모든 `NextResponse.json()`의 실제 shape이 API 스펙과 일치하는가?
- snake_case → camelCase 변환이 모든 필드에 일관되게 적용되었는가?
- 상태 전이 맵의 모든 전이가 코드로 구현되었는가?
- 에러 응답이 일관된 shape을 따르는가?

## 산출물

- 프로젝트 소스 코드에 직접 파일 생성/수정
- `_workspace/02_backend_report.md` — 구현 API 목록, 응답 shape, 미완료 항목
