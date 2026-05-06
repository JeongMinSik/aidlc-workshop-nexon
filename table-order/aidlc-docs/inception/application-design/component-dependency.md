# 테이블오더 서비스 - 컴포넌트 의존성

## 의존성 매트릭스

| 컴포넌트 (사용자) | Auth | Store | Admin | Table | Menu | Order | SSE |
|-------------------|:----:|:-----:|:-----:|:-----:|:----:|:-----:|:---:|
| **Auth** | - | - | ✅ | ✅ | - | - | - |
| **Store** | - | - | - | - | - | - | - |
| **Admin** | - | ✅ | - | - | - | - | - |
| **Table** | - | - | - | - | - | ✅ | - |
| **Menu** | - | - | - | - | - | - | - |
| **Order** | - | - | - | ✅ | ✅ | - | ✅ |
| **SSE** | - | - | - | - | - | - | - |

> ✅ = 행(사용자)이 열(제공자)에 의존

---

## 통신 패턴

### Backend 내부 (동기 호출)
| 호출자 | 피호출자 | 패턴 | 설명 |
|--------|----------|------|------|
| AuthService | AdminRepository | 동기 | 관리자 자격 증명 조회 |
| AuthService | TableRepository | 동기 | 테이블 자격 증명 조회 |
| AdminService | StoreRepository | 동기 | 매장 존재 확인 |
| TableService | OrderService | 동기 | 이용 완료 시 주문 이력 이동 |
| OrderService | TableService | 동기 | 세션 확인 |
| OrderService | MenuService | 동기 | 메뉴 유효성 검증 |
| OrderService | SSEService | 비동기(Fire&Forget) | 이벤트 브로드캐스트 |

### Frontend → Backend (HTTP)
| 클라이언트 | 서버 | 패턴 | 설명 |
|-----------|------|------|------|
| Customer App | REST API | HTTP Request/Response | 메뉴 조회, 주문 생성 |
| Admin App | REST API | HTTP Request/Response | CRUD 작업 |
| Admin App | SSE Endpoint | SSE (단방향 스트림) | 실시간 주문 수신 |

---

## 데이터 흐름 다이어그램

### 고객 주문 플로우
```
Customer App                    Server                         Database
     |                            |                              |
     |-- POST /api/orders ------->|                              |
     |                            |-- validateSession() -------->|
     |                            |<-- session valid ------------|
     |                            |-- validateMenuItems() ------>|
     |                            |<-- menus valid --------------|
     |                            |-- createOrder() ------------>|
     |                            |<-- order created ------------|
     |                            |-- broadcastNewOrder() ------>| (SSE to Admin)
     |<-- 201 Created -----------|                              |
```

### 관리자 실시간 모니터링 플로우
```
Admin App                       Server                         Database
     |                            |                              |
     |-- GET /api/sse/stores/:id/orders -->|                     |
     |<-- SSE Connection Established ------|                     |
     |                            |                              |
     |   [고객이 주문 생성]        |                              |
     |                            |-- order created event ------>|
     |<-- SSE: new_order ---------|                              |
     |                            |                              |
     |   [관리자가 상태 변경]      |                              |
     |-- PUT /api/orders/:id/status -->|                         |
     |                            |-- updateStatus() ---------->|
     |                            |<-- updated ------------------|
     |<-- 200 OK -----------------|                              |
     |<-- SSE: order_updated -----|                              |
```

### 이용 완료 플로우
```
Admin App                       Server                         Database
     |                            |                              |
     |-- POST /tables/:id/complete-session -->|                  |
     |                            |-- getCurrentSession() ----->|
     |                            |<-- session data ------------|
     |                            |-- moveOrdersToHistory() --->|
     |                            |<-- orders moved ------------|
     |                            |-- closeSession() ---------->|
     |                            |<-- session closed ----------|
     |                            |-- resetTable() ------------>|
     |                            |<-- table reset --------------|
     |<-- 200 OK -----------------|                              |
```

---

## 순환 의존성 분석

**잠재적 순환**: TableService ↔ OrderService
- TableService.completeSession() → OrderService.moveOrdersToHistory()
- OrderService.createOrder() → TableService.getCurrentSession()

**해결 방안**: 
- OrderService가 TableRepository를 직접 참조하여 세션 확인 (TableService 우회)
- 또는 SessionService를 별도 분리하여 양쪽에서 참조

**채택 방안**: OrderService가 세션 확인 시 TableRepository를 직접 사용하여 순환 방지

---

## 미들웨어 체인

```
Request → CORS → Logger → AuthMiddleware → ValidationMiddleware → Controller
                                                                       |
Response ← ErrorHandler ← Controller Response ←────────────────────────┘
```

### 미들웨어 적용 범위
| 미들웨어 | 적용 대상 | 설명 |
|----------|----------|------|
| CORS | 전체 | Cross-Origin 허용 |
| Logger | 전체 | 요청/응답 로깅 |
| AuthMiddleware | 인증 필요 경로 | JWT 검증 |
| RoleMiddleware | 권한 필요 경로 | 역할 확인 (super_admin/admin/table) |
| ValidationMiddleware | POST/PUT 경로 | 요청 바디 검증 |
| ErrorHandler | 전체 | 에러 응답 표준화 |
