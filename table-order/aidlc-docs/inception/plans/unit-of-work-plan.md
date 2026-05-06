# Unit of Work Plan - 테이블오더 서비스

## 계획 개요
2명의 개발자가 병렬로 작업할 수 있도록 시스템을 2개 유닛으로 분해합니다.

---

## 분해 전략

### 팀 구성
- **개발자 2명** 병렬 작업
- 각 유닛이 독립적으로 개발 가능하도록 분리
- 인터페이스(API 계약)를 먼저 합의하여 병렬 개발 가능

### 분해 기준
- **Unit 1: Backend (API 서버 + 데이터베이스)** — 서버 로직, DB 스키마, API 엔드포인트, SSE
- **Unit 2: Frontend (고객앱 + 관리자앱)** — React UI, 상태 관리, API 연동

### 분해 근거
- Backend와 Frontend는 REST API 계약으로 명확히 분리 가능
- 각 유닛이 독립적으로 개발/테스트 가능 (Mock API / Mock UI)
- 2명 팀 구조에 최적화된 분할

---

## 실행 계획

### Step 1: Unit 정의
- [x] Unit 1 (Backend) 범위 및 책임 정의
- [x] Unit 2 (Frontend) 범위 및 책임 정의

### Step 2: 의존성 정의
- [x] Unit 간 의존성 매트릭스 작성
- [x] API 계약 (인터페이스) 정의
- [x] 개발 순서 및 병렬화 전략

### Step 3: Story 매핑
- [x] Unit 1에 할당할 스토리 식별
- [x] Unit 2에 할당할 스토리 식별
- [x] 공유 스토리 식별 및 분담 방안

### Step 4: 산출물 생성
- [x] unit-of-work.md 생성
- [x] unit-of-work-dependency.md 생성
- [x] unit-of-work-story-map.md 생성
