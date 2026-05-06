# Components

## 1. Customer Frontend (React + Vite + TypeScript)

**Purpose**: 고객이 테이블에서 메뉴를 조회하고 주문하는 웹 UI

**Responsibilities**:
- 테이블 자동 로그인 (로컬 저장 기반)
- 카테고리별 메뉴 조회 및 표시
- 장바구니 관리 (로컬 스토리지)
- 주문 생성 및 확인
- 주문 내역 조회 (현재 세션)

**Interfaces**:
- REST API 호출 (메뉴 조회, 주문 생성, 주문 내역)
- LocalStorage (장바구니, 로그인 정보)

---

## 2. Admin Frontend (React + Vite + TypeScript)

**Purpose**: 매장 관리자가 주문을 모니터링하고 매장을 관리하는 웹 UI

**Responsibilities**:
- 관리자 로그인 (JWT)
- 실시간 주문 모니터링 (SSE 수신)
- 실시간 메트릭 대시보드 (주문량 그래프, 매출 카운터)
- 테이블 관리 (초기 설정, 주문 삭제, 세션 종료, 과거 내역)
- 메뉴 CRUD 관리

**Interfaces**:
- REST API 호출 (인증, 메뉴 관리, 테이블 관리)
- SSE 수신 (실시간 주문 + 메트릭 스트림)

---

## 3. API Server (Go + Gin)

**Purpose**: 모든 비즈니스 로직 처리 및 데이터 관리

**Responsibilities**:
- 인증/인가 (JWT 발급 및 검증)
- 메뉴 관리 API
- 주문 처리 API
- 테이블 세션 관리
- SSE 스트리밍 (주문 이벤트 + 메트릭)
- 실시간 메트릭 수집 (초당 주문 수, 누적 매출)

**Interfaces**:
- REST API endpoints (JSON)
- SSE endpoints (text/event-stream)
- PostgreSQL 연결 (데이터 영속화)

---

## 4. Database (PostgreSQL)

**Purpose**: 모든 영속 데이터 저장

**Responsibilities**:
- 메뉴/카테고리 데이터 저장
- 주문/주문항목 데이터 저장
- 테이블/세션 정보 저장
- 관리자 계정 저장
- 주문 이력 보관

**Interfaces**:
- SQL (API Server에서 접근)

---

## 5. Load Tester (k6)

**Purpose**: 부하 테스트 실행 및 성능 시연

**Responsibilities**:
- 대량 동시 주문 요청 시뮬레이션
- RPS, latency 측정
- 결과 리포트 생성

**Interfaces**:
- HTTP 요청 (API Server 대상)
- 콘솔 출력 (실시간 메트릭)
