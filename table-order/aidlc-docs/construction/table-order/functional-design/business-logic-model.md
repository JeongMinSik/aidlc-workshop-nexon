# Business Logic Model

## Core Business Flows

### Flow 1: 고객 주문 플로우

```
[고객 태블릿 접근]
       |
       v
[자동 로그인 시도]
       |
  +----+----+
  |         |
  v         v
[성공]    [실패 → 로그인 화면]
  |
  v
[메뉴 조회 (기본 화면)]
  |
  v
[메뉴 선택 → 장바구니 추가]
  |         (로컬 스토리지)
  v
[장바구니 확인 → 주문 확정]
  |
  v
[POST /api/orders]
  |
  +----+----+
  |         |
  v         v
[성공]    [실패 → 에러 표시, 장바구니 유지]
  |
  v
[주문번호 표시 (5초)]
  |
  v
[장바구니 비우기 → 메뉴 화면 리다이렉트]
```

### Flow 2: 관리자 주문 모니터링 플로우

```
[관리자 로그인]
       |
       v
[대시보드 진입]
       |
       +---> [SSE 연결: /api/admin/events]
       |
       +---> [SSE 연결: /api/admin/metrics/stream]
       |
       v
[테이블별 그리드 표시]
       |
       v
[실시간 업데이트 수신]
  |         |         |
  v         v         v
[new_order] [metrics] [status_change]
  |         |         |
  v         v         v
[카드 추가] [그래프   [상태 뱃지
 +강조]     업데이트]  변경]
```

### Flow 3: 테이블 이용 완료 플로우

```
[관리자: 이용 완료 버튼 클릭]
       |
       v
[확인 팝업 표시]
       |
  +----+----+
  |         |
  v         v
[확인]    [취소 → 복귀]
  |
  v
[POST /api/admin/tables/:id/complete]
       |
       v
[서버 처리]
  1. 현재 세션 주문 → OrderHistory (JSONB)
  2. Order, OrderItem 삭제
  3. TableInfo.session_id = NULL
  4. EventBroker: table_reset 이벤트
       |
       v
[Admin UI: 테이블 카드 리셋]
[Customer UI: 빈 상태로 전환 (다음 고객 대기)]
```

### Flow 4: 부하 테스트 시연 플로우

```
[k6 스크립트 실행]
       |
       v
[가상 사용자 N명 동시 주문 생성]
       |
       +---> [API Server: 주문 처리]
       |            |
       |            +---> [DB 저장]
       |            +---> [EventBroker: new_order 발행]
       |            +---> [MetricsCollector: 카운터 증가]
       |
       v
[Admin 대시보드 (동시 관찰)]
  - 주문 카드 폭발적 증가
  - 실시간 그래프 급상승
  - 매출 카운터 빠르게 증가
       |
       v
[k6 결과 리포트]
  - RPS: 초당 처리량
  - p50/p95/p99 latency
  - 에러율
```

---

## State Machines

### Order Status State Machine
```
         create
           |
           v
      +---------+     update      +------------+     update     +-----------+
      | pending |--------------->| preparing  |-------------->| completed |
      +---------+                +------------+               +-----------+
           |
           | delete (admin)
           v
      +---------+
      | deleted |
      +---------+
```

Valid transitions:
- `pending` → `preparing` (관리자 상태 변경)
- `preparing` → `completed` (관리자 상태 변경)
- `any` → `deleted` (관리자 직권 삭제)

### Table Session State Machine
```
      +----------+     first order     +----------+     complete     +----------+
      | no_session|------------------>| active   |---------------->| no_session|
      +----------+                    +----------+                 +----------+
                                           |
                                           | (주문 계속 추가 가능)
                                           +----> [주문 추가] ---+
                                           |                     |
                                           +<--------------------+
```

---

## Concurrency Considerations (부하테스트 대비)

1. **MetricsCollector**: atomic counter 사용 (sync/atomic)
2. **EventBroker**: Go 채널 기반, 버퍼링된 채널로 slow consumer 대응
3. **DB 연결 풀**: pgx pool (max 50 connections)
4. **주문 번호 생성**: DB sequence 사용 (동시성 안전)
5. **SSE 연결 관리**: sync.RWMutex로 클라이언트 맵 보호
