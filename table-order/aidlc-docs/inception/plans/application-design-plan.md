# Application Design Plan - 테이블오더 서비스

## 계획 개요
테이블오더 서비스의 컴포넌트 식별, 서비스 레이어 설계, 의존성 정의를 위한 계획입니다.

---

## 질문 및 결정사항

### Question 1
백엔드 아키텍처 패턴으로 어떤 것을 선호하시나요?

A) Layered Architecture — Controller → Service → Repository 계층 구조 (전통적, 이해하기 쉬움)
B) Clean Architecture — Domain 중심, 의존성 역전 원칙 적용 (유연하지만 복잡도 증가)
C) Simple MVC — Route → Controller → Model 단순 구조 (빠른 개발, 소규모 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
프론트엔드 상태 관리 방식은?

A) React Context + useReducer — 내장 기능만 사용 (의존성 최소화)
B) Zustand — 경량 상태 관리 라이브러리 (간단한 API, 보일러플레이트 적음)
C) Redux Toolkit — 대규모 상태 관리 (강력하지만 보일러플레이트 많음)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
고객용 앱과 관리자용 앱의 코드 구조는?

A) 모노레포 (하나의 저장소에 packages/customer, packages/admin, packages/server로 분리)
B) 단일 프로젝트 (하나의 React 앱에서 라우팅으로 분리)
C) 완전 분리 (별도 프로젝트로 독립 배포)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
API 설계 스타일은?

A) RESTful API — 리소스 기반 URL, HTTP 메서드 활용 (표준적)
B) RESTful + 일부 RPC 스타일 — 기본은 REST, 복잡한 액션은 동사형 엔드포인트 허용
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 실행 계획 (답변 수집 후 진행)

### Step 1: 컴포넌트 식별
- [x] Backend 컴포넌트 식별 (Auth, Store, Table, Menu, Order, Session, SSE)
- [x] Frontend 컴포넌트 식별 (Customer App, Admin App)
- [x] 공통 컴포넌트 식별 (Database, Middleware)

### Step 2: 컴포넌트 메서드 정의
- [x] 각 컴포넌트의 주요 메서드 시그니처 정의
- [x] Input/Output 타입 정의
- [x] 컴포넌트 간 인터페이스 정의

### Step 3: 서비스 레이어 설계
- [x] 서비스 정의 및 책임 할당
- [x] 서비스 간 오케스트레이션 패턴 정의
- [x] 트랜잭션 경계 정의

### Step 4: 의존성 관계 정의
- [x] 컴포넌트 간 의존성 매트릭스 작성
- [x] 통신 패턴 정의 (동기/비동기)
- [x] 데이터 흐름 다이어그램 작성

### Step 5: 설계 문서 생성
- [x] components.md 생성
- [x] component-methods.md 생성
- [x] services.md 생성
- [x] component-dependency.md 생성
- [x] application-design.md (통합 문서) 생성
