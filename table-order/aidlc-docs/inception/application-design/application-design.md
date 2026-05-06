# 테이블오더 서비스 - Application Design (통합 문서)

## 설계 결정사항 요약

| 항목 | 결정 |
|------|------|
| 백엔드 아키텍처 | Layered Architecture (Controller → Service → Repository) |
| 프론트엔드 상태 관리 | React Context + useReducer |
| 코드 구조 | 모노레포 (packages/customer, packages/admin, packages/server) |
| API 스타일 | RESTful API |
| 실시간 통신 | Server-Sent Events (SSE) |
| 인증 | JWT (16시간 세션) |
| 데이터베이스 | MySQL/MariaDB |

---

## 시스템 아키텍처 개요

```
+------------------+     +------------------+
|  Customer App    |     |   Admin App      |
|  (React SPA)    |     |   (React SPA)    |
|  packages/       |     |   packages/      |
|  customer        |     |   admin          |
+--------+---------+     +--------+---------+
         |                         |
         |  HTTP (REST)            |  HTTP (REST) + SSE
         |                         |
+--------+-------------------------+---------+
|              API Server                    |
|           (Node.js + Express)              |
|           packages/server                  |
+--------------------------------------------+
|  Controller Layer                          |
|  (AuthCtrl, StoreCtrl, TableCtrl,         |
|   MenuCtrl, OrderCtrl, SSECtrl)           |
+--------------------------------------------+
|  Service Layer                             |
|  (AuthSvc, StoreSvc, AdminSvc,            |
|   TableSvc, MenuSvc, OrderSvc, SSESvc)    |
+--------------------------------------------+
|  Repository Layer                          |
|  (각 엔티티별 Repository)                  |
+--------------------------------------------+
              |
              |
+--------------------------------------------+
|         MySQL/MariaDB                      |
|  (Store, Admin, Table, Session,           |
|   Category, Menu, Order, OrderItem,       |
|   OrderHistory)                            |
+--------------------------------------------+
```

---

## 모노레포 구조

```
table-order/
+-- packages/
|   +-- customer/          # 고객용 React 앱
|   |   +-- src/
|   |   |   +-- components/
|   |   |   +-- contexts/
|   |   |   +-- pages/
|   |   |   +-- services/  (API 호출)
|   |   |   +-- hooks/
|   |   +-- package.json
|   |
|   +-- admin/             # 관리자용 React 앱
|   |   +-- src/
|   |   |   +-- components/
|   |   |   +-- contexts/
|   |   |   +-- pages/
|   |   |   +-- services/  (API 호출 + SSE)
|   |   |   +-- hooks/
|   |   +-- package.json
|   |
|   +-- server/            # Backend API 서버
|       +-- src/
|       |   +-- controllers/
|       |   +-- services/
|       |   +-- repositories/
|       |   +-- models/
|       |   +-- middlewares/
|       |   +-- routes/
|       |   +-- config/
|       |   +-- utils/
|       +-- package.json
|
+-- package.json           # 루트 (workspaces 설정)
```

---

## 핵심 컴포넌트 (7개 Backend 모듈)

| # | 모듈 | 목적 | 핵심 책임 |
|---|------|------|----------|
| 1 | Auth | 인증/인가 | JWT 발급/검증, 로그인 시도 제한, 역할 기반 접근 제어 |
| 2 | Store | 매장 관리 | 매장 CRUD, 매장 식별자 관리 |
| 3 | Admin | 관리자 관리 | 계정 CRUD, 매장 할당, 권한 관리 |
| 4 | Table | 테이블/세션 | 테이블 CRUD, 세션 라이프사이클, 이용 완료 |
| 5 | Menu | 메뉴/카테고리 | 메뉴 CRUD, 카테고리 관리, 순서 조정 |
| 6 | Order | 주문 처리 | 주문 CRUD, 상태 전이, 이력 관리 |
| 7 | SSE | 실시간 이벤트 | 클라이언트 관리, 이벤트 브로드캐스트 |

---

## 핵심 서비스 오케스트레이션

### 주문 생성 (가장 복잡한 플로우)
1. 세션 유효성 확인 (TableRepository)
2. 메뉴 항목 유효성 검증 (MenuRepository)
3. 주문 + 주문 항목 생성 (트랜잭션)
4. SSE 이벤트 브로드캐스트 (비동기)

### 이용 완료 (트랜잭션 복잡도 높음)
1. 현재 세션 조회
2. 세션 주문 → OrderHistory 이동 (트랜잭션)
3. 세션 종료
4. 테이블 상태 리셋

---

## 의존성 핵심 규칙

1. **Controller → Service만 호출** (Repository 직접 접근 금지)
2. **Service → Repository 호출** (데이터 접근)
3. **Service → 다른 Service 호출 가능** (오케스트레이션)
4. **순환 의존성 금지** (OrderService ↔ TableService 순환은 Repository 직접 참조로 해결)
5. **SSE 호출은 Fire & Forget** (실패해도 주문 처리에 영향 없음)

---

## 상세 설계 문서 참조

- [컴포넌트 정의](./components.md)
- [컴포넌트 메서드](./component-methods.md)
- [서비스 레이어](./services.md)
- [의존성 관계](./component-dependency.md)
