# Services

## Service Architecture

단일 Go 바이너리 내에서 레이어드 아키텍처로 구성. 마이크로서비스 분리 없음 (하루 개발 + 단일 매장).

```
+--------------------------------------------------+
|                   Gin Router                      |
|  (Handlers: Auth, Menu, Order, Table, SSE)       |
+--------------------------------------------------+
|                 Service Layer                     |
|  (AuthService, MenuService, OrderService,        |
|   TableService, MetricsCollector, EventBroker)   |
+--------------------------------------------------+
|               Repository Layer                   |
|  (MenuRepo, OrderRepo, TableRepo, AdminRepo)     |
+--------------------------------------------------+
|                  PostgreSQL                       |
+--------------------------------------------------+
```

---

## Service Definitions

### 1. AuthService
**Responsibility**: 인증/인가 처리

- JWT 토큰 발급 (관리자: 16시간, 테이블: 16시간)
- 비밀번호 검증 (bcrypt)
- 토큰 검증 미들웨어 제공

### 2. MenuService
**Responsibility**: 메뉴 및 카테고리 비즈니스 로직

- 메뉴 CRUD 오케스트레이션
- 카테고리별 메뉴 그룹핑
- 노출 순서 관리
- 입력 검증 (필수 필드, 가격 범위)

### 3. OrderService
**Responsibility**: 주문 처리 핵심 로직

- 주문 생성 (메뉴 유효성 검증, 금액 계산)
- 주문 상태 전이 (대기중 → 준비중 → 완료)
- 주문 삭제
- 주문 생성 시 EventBroker에 이벤트 발행
- 주문 생성 시 MetricsCollector에 기록

### 4. TableService
**Responsibility**: 테이블 세션 라이프사이클 관리

- 테이블 초기 설정
- 세션 시작/종료
- 이용 완료 시 주문 이력 이동
- 테이블 상태 조회

### 5. MetricsCollector
**Responsibility**: 실시간 성능 메트릭 수집 및 브로드캐스트

- 인메모리 카운터 (초당 주문 수, 누적 매출, 누적 주문 수)
- 1초 간격 메트릭 스냅샷 생성
- SSE를 통한 메트릭 브로드캐스트
- 부하 테스트 시 실시간 변화 시각화 지원

### 6. EventBroker
**Responsibility**: SSE 기반 실시간 이벤트 분배

- 클라이언트 연결 관리 (subscribe/unsubscribe)
- 이벤트 타입별 분배 (new_order, status_change, metrics)
- 연결 끊김 감지 및 정리

---

## Service Interactions

```
[주문 생성 플로우]
Client → OrderHandler → OrderService → OrderRepo (DB 저장)
                                     → EventBroker (실시간 알림)
                                     → MetricsCollector (메트릭 기록)

[실시간 모니터링 플로우]
Admin UI ← SSE ← EventBroker ← OrderService (주문 이벤트)
Admin UI ← SSE ← MetricsCollector (1초 간격 메트릭)

[테이블 이용 완료 플로우]
Admin → TableHandler → TableService → OrderRepo (이력 이동)
                                    → EventBroker (테이블 리셋 알림)
```
