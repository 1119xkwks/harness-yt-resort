---
name: webapp-orchestrator
description: "웹 애플리케이션 개발 에이전트 팀을 조율하는 오케스트레이터. 웹앱 개발, 웹사이트 만들기, 앱 구축, 프로젝트 생성, 풀스택 개발, 프론트엔드/백엔드 구현 요청 시 이 스킬을 사용하라. 후속 작업: 웹앱 결과 수정, 부분 재실행, 업데이트, 보완, 다시 실행, 기능 추가, 버그 수정, 이전 결과 개선, 페이지 추가, API 추가, 컴포넌트 수정 요청 시에도 반드시 이 스킬을 사용."
---

# Web Application Orchestrator

웹 애플리케이션 개발 에이전트 팀을 조율하여 설계부터 구현, QA 검증까지 완료하는 통합 스킬.

## 실행 모드: 에이전트 팀

## 에이전트 구성

| 팀원 | 에이전트 타입 | 역할 | 스킬 | 출력 |
|------|-------------|------|------|------|
| architect | 커스텀 (architect) | 요구사항 분석, 아키텍처 설계 | webapp-architect | `_workspace/01_architect_*.md` |
| frontend-dev | 커스텀 (frontend-dev) | 프론트엔드 구현 | webapp-frontend | 소스 코드 + `_workspace/02_frontend_report.md` |
| backend-dev | 커스텀 (backend-dev) | 백엔드 구현 | webapp-backend | 소스 코드 + `_workspace/02_backend_report.md` |
| qa-inspector | 커스텀 (qa-inspector) | 통합 정합성 검증 | webapp-qa | `_workspace/03_qa_report.md` |

## 워크플로우

### Phase 0: 컨텍스트 확인

기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:

1. `_workspace/` 디렉토리 존재 여부 확인
2. 실행 모드 결정:
   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
   - **`_workspace/` 존재 + 사용자가 부분 수정 요청** → 부분 재실행. 해당 에이전트만 재호출. 기존 산출물 중 수정 대상만 덮어쓴다
   - **`_workspace/` 존재 + 새 입력 제공** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 뒤 Phase 1 진행
3. 부분 재실행 시: 이전 산출물 경로를 에이전트 프롬프트에 포함하여, 에이전트가 기존 결과를 읽고 피드백을 반영하도록 지시

### Phase 1: 준비

1. 사용자 입력 분석 — 어떤 웹 앱을 만들 것인지, 핵심 기능, 기술 요구사항 파악
2. 작업 디렉토리에 `_workspace/` 생성 (초기 실행 시)
3. 입력 요약을 `_workspace/00_input.md`에 저장

### Phase 2: 팀 구성 및 설계

1. 팀 생성:
   ```
   TeamCreate(
     team_name: "webapp-team",
     members: [
       {
         name: "architect",
         agent_type: "architect",
         model: "opus",
         prompt: "웹 애플리케이션 설계자입니다. _workspace/00_input.md를 읽고 요구사항을 분석하세요. webapp-architect 스킬의 워크플로우를 따라 설계 문서를 생성하세요. 완료 후 설계 문서 경로를 팀에 공유하세요."
       },
       {
         name: "frontend-dev",
         agent_type: "frontend-dev",
         model: "opus",
         prompt: "프론트엔드 개발자입니다. architect가 설계를 완료하면 _workspace/01_architect_*.md를 읽고 webapp-frontend 스킬을 따라 구현하세요. 구현 완료 시 qa-inspector에게 알리세요."
       },
       {
         name: "backend-dev",
         agent_type: "backend-dev",
         model: "opus",
         prompt: "백엔드 개발자입니다. architect가 설계를 완료하면 _workspace/01_architect_*.md를 읽고 webapp-backend 스킬을 따라 구현하세요. API 완성 시 frontend-dev와 qa-inspector에게 알리세요."
       },
       {
         name: "qa-inspector",
         agent_type: "qa-inspector",
         model: "opus",
         prompt: "QA 검증 전문가입니다. architect의 설계 문서를 검증 기준으로 사용하세요. backend-dev와 frontend-dev가 구현을 완료하면 webapp-qa 스킬을 따라 통합 정합성을 검증하세요. 발견 즉시 해당 에이전트에게 수정 요청을 보내세요."
       }
     ]
   )
   ```

2. 작업 등록:
   ```
   TaskCreate(tasks: [
     { title: "요구사항 분석 및 기능 명세", assignee: "architect" },
     { title: "데이터 모델 설계", assignee: "architect" },
     { title: "API 스펙 정의", assignee: "architect" },
     { title: "페이지 구조 설계", assignee: "architect" },
     { title: "DB 스키마 구현", assignee: "backend-dev", depends_on: ["데이터 모델 설계"] },
     { title: "API 라우트 구현", assignee: "backend-dev", depends_on: ["API 스펙 정의"] },
     { title: "타입 정의 및 훅 작성", assignee: "frontend-dev", depends_on: ["API 스펙 정의"] },
     { title: "페이지 및 컴포넌트 구현", assignee: "frontend-dev", depends_on: ["페이지 구조 설계"] },
     { title: "API-프론트 경계면 검증", assignee: "qa-inspector", depends_on: ["API 라우트 구현", "타입 정의 및 훅 작성"] },
     { title: "라우팅 정합성 검증", assignee: "qa-inspector", depends_on: ["페이지 및 컴포넌트 구현"] },
     { title: "통합 QA 리포트 작성", assignee: "qa-inspector", depends_on: ["API-프론트 경계면 검증", "라우팅 정합성 검증"] }
   ])
   ```

### Phase 3: 설계 + 구현 + 검증

**실행 방식:** 팀원들이 자체 조율

**작업 흐름:**

1. **architect 선행:** architect가 설계 문서 4개를 생성한다. 각 문서 완성 시 관련 팀원에게 SendMessage로 알린다.
2. **frontend-dev + backend-dev 병렬:** architect의 설계가 나오면 frontend-dev와 backend-dev가 병렬로 구현을 시작한다.
3. **qa-inspector 점진적 검증:** backend-dev가 API를 완성하고 frontend-dev가 대응 훅을 완성하면, qa-inspector가 해당 경계면을 즉시 검증한다. 전체 완성을 기다리지 않는다.
4. **피드백 루프:** qa-inspector가 불일치를 발견하면 해당 에이전트에게 즉시 수정 요청. frontend-dev와 backend-dev는 직접 소통하여 경계면을 맞춘다.

**팀원 간 통신 규칙:**
- architect → frontend-dev: 페이지 구조, API 응답 shape 전달
- architect → backend-dev: 데이터 모델, API 스펙, 상태 전이 맵 전달
- architect → qa-inspector: 경계면 정의(검증 기준) 전달
- backend-dev ↔ frontend-dev: API shape 변경 시 즉시 상호 알림
- qa-inspector → frontend-dev/backend-dev: 경계면 불일치 피드백 (파일:라인 + 수정 방법)

**산출물 저장:**

| 팀원 | 출력 경로 |
|------|----------|
| architect | `_workspace/01_architect_spec.md`, `_workspace/01_architect_data_model.md`, `_workspace/01_architect_api_spec.md`, `_workspace/01_architect_page_structure.md` |
| frontend-dev | 프로젝트 소스 코드 + `_workspace/02_frontend_report.md` |
| backend-dev | 프로젝트 소스 코드 + `_workspace/02_backend_report.md` |
| qa-inspector | `_workspace/03_qa_report.md` |

**리더 모니터링:**
- 팀원이 유휴 상태가 되면 자동 알림 수신
- architect가 설계를 지연하면 SendMessage로 독촉
- 전체 진행률은 TaskGet으로 확인

### Phase 4: 통합 및 완료

1. 모든 팀원의 작업 완료 대기 (TaskGet으로 상태 확인)
2. qa-inspector의 최종 리포트 확인
3. 실패 항목이 있으면:
   - 해당 에이전트에게 수정 지시
   - 수정 완료 후 qa-inspector에게 재검증 요청
4. 모든 검증 통과 시 → Phase 5로 진행

### Phase 5: 정리

1. 팀원들에게 종료 요청 (SendMessage)
2. 팀 정리 (TeamDelete)
3. `_workspace/` 디렉토리 보존 (사후 검증/감사 추적용)
4. 사용자에게 결과 요약 보고:
   - 구현된 페이지 목록
   - 구현된 API 목록
   - QA 검증 결과 요약
   - 알려진 제한사항/미완료 항목

## 데이터 흐름

```
[리더] → TeamCreate → [architect]
                          │
                    설계 문서 완성
                          │
              ┌───────────┼───────────┐
              ↓                       ↓
        [frontend-dev]          [backend-dev]
              │                       │
              ↓                       ↓
         훅/페이지 구현          API/DB 구현
              │                       │
              └───────┬───────────────┘
                      ↓
               [qa-inspector]
                점진적 경계면 검증
                      │
              ┌───────┼───────┐
              ↓               ↓
        피드백 → FE      피드백 → BE
              │               │
              └───────┬───────┘
                      ↓
               최종 QA 리포트
                      ↓
               [리더: 완료 보고]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| architect 설계 지연 | 리더가 SendMessage로 진행 상황 확인, 병목 해소 지원 |
| 팀원 1명 실패/중지 | 리더가 감지 → SendMessage로 상태 확인 → 재시작 또는 다른 팀원에게 작업 재할당 |
| 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |
| 타임아웃 | 현재까지 구현된 부분 결과로 QA 진행, 미완료 항목 리포트에 명시 |
| frontend-dev와 backend-dev 간 shape 충돌 | architect에게 중재 요청, 스펙 기준으로 판단 |
| QA 실패 항목 수정 후 재실패 | 2회 재시도 후 리포트에 "미해결" 명시, 사용자에게 알림 |

## 테스트 시나리오

### 정상 흐름
1. 사용자가 "할 일 관리 앱을 만들어줘"를 입력
2. Phase 0에서 `_workspace/` 미존재 확인 → 초기 실행
3. Phase 1에서 요구사항 분석, `_workspace/00_input.md` 생성
4. Phase 2에서 팀 구성 (4명) + 작업 등록 (11개)
5. Phase 3에서:
   - architect가 설계 문서 4개 생성
   - frontend-dev + backend-dev가 병렬 구현
   - qa-inspector가 점진적 검증, 2건 불일치 발견 → 즉시 수정 요청
   - 수정 완료 후 재검증 통과
6. Phase 4에서 최종 QA 리포트 확인, 모든 항목 통과
7. Phase 5에서 팀 정리, 결과 요약 보고
8. 예상 결과: 프로젝트 소스 코드 + `_workspace/` 산출물

### 에러 흐름
1. Phase 3에서 backend-dev가 에러로 중지
2. 리더가 유휴 알림 수신
3. SendMessage로 상태 확인 → 재시작 시도
4. 재시작 실패 시 backend-dev 작업 중 완료된 부분만 보존
5. frontend-dev에게 목업 데이터로 우선 진행 지시
6. qa-inspector에게 "백엔드 일부 미구현" 알림
7. 최종 보고서에 "백엔드 API 일부 미구현, 프론트엔드는 목업 데이터 사용" 명시
