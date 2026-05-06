# Business Rules

## BR-1: 인증 규칙

### BR-1.1: 관리자 로그인
- username + password로 인증
- bcrypt로 비밀번호 검증
- 성공 시 JWT 발급 (만료: 16시간)
- 실패 시 401 Unauthorized

### BR-1.2: 테이블 로그인
- table_number + password로 인증
- 성공 시 JWT 발급 (만료: 16시간)
- JWT payload: `{table_id, table_number, session_id}`
- 세션이 없으면 (첫 로그인) session_id는 null → 첫 주문 시 세션 생성

---

## BR-2: 주문 규칙

### BR-2.1: 주문 생성
- 장바구니 항목이 1개 이상이어야 함
- 각 항목의 menu_id가 유효하고 is_active=true여야 함
- 수량은 1 이상이어야 함
- total_amount = SUM(unit_price * quantity) — 서버에서 재계산
- 주문 시점의 메뉴 가격을 unit_price로 스냅샷

### BR-2.2: 주문 번호 생성
- 형식: `ORD-{YYYYMMDD}-{순번3자리}`
- 예: `ORD-20260506-001`, `ORD-20260506-002`
- 당일 기준 순번 증가 (DB sequence 또는 카운터)

### BR-2.3: 세션 자동 시작
- 테이블에 활성 세션이 없는 상태에서 첫 주문 생성 시:
  - 새 UUID 세션 생성
  - TableInfo.session_id 업데이트
  - TableInfo.session_started_at = NOW()

### BR-2.4: 주문 상태 전이
```
pending → preparing → completed
```
- 역방향 전이 불가
- 유효하지 않은 전이 시 400 Bad Request
- 상태 변경 시 EventBroker에 status_change 이벤트 발행

### BR-2.5: 주문 삭제 (관리자 직권)
- 관리자만 가능
- 어떤 상태의 주문이든 삭제 가능
- 삭제 시 해당 테이블의 총 주문액 재계산 필요 (프론트에서 처리)
- EventBroker에 order_deleted 이벤트 발행

---

## BR-3: 테이블 세션 규칙

### BR-3.1: 세션 종료 (이용 완료)
1. 해당 테이블의 현재 세션 주문들을 OrderHistory에 JSONB로 저장
2. 해당 세션의 Order, OrderItem 레코드 삭제
3. TableInfo.session_id = NULL
4. TableInfo.session_started_at = NULL
5. EventBroker에 table_reset 이벤트 발행

### BR-3.2: 주문 내역 조회 범위
- 고객: 현재 session_id에 해당하는 주문만 조회 가능
- 관리자: 모든 테이블의 현재 세션 주문 + 과거 이력 조회 가능

---

## BR-4: 메뉴 관리 규칙

### BR-4.1: 메뉴 등록 검증
- name: 필수, 1~200자
- price: 필수, 0 이상 정수
- category_id: 필수, 유효한 카테고리 ID
- image_url: 선택, 유효한 URL 형식
- description: 선택

### BR-4.2: 메뉴 삭제
- is_active = false로 소프트 삭제 (기존 주문 이력 보존)
- 이미 주문된 메뉴는 OrderItem에 스냅샷으로 남아있으므로 안전

### BR-4.3: 카테고리 삭제
- 해당 카테고리에 활성 메뉴가 있으면 삭제 불가 (400 Bad Request)
- 메뉴를 먼저 다른 카테고리로 이동하거나 비활성화해야 함

---

## BR-5: 실시간 메트릭 규칙

### BR-5.1: MetricsCollector
- 주문 생성 시마다 카운터 증가
- 1초 간격으로 스냅샷 생성:
  - `orders_per_second`: 직전 1초간 주문 수
  - `total_orders`: 서버 시작 이후 누적 주문 수
  - `total_revenue`: 서버 시작 이후 누적 매출
- 인메모리 (서버 재시작 시 리셋 — 데모용이므로 OK)

### BR-5.2: SSE 이벤트 타입
| Event Type | Payload | Trigger |
|-----------|---------|---------|
| `new_order` | `{order_id, table_number, items, total_amount}` | 주문 생성 |
| `status_change` | `{order_id, old_status, new_status}` | 상태 변경 |
| `order_deleted` | `{order_id, table_id}` | 주문 삭제 |
| `table_reset` | `{table_id, table_number}` | 이용 완료 |
| `metrics` | `{orders_per_second, total_orders, total_revenue}` | 1초 간격 |
