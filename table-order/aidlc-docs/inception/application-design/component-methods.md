# Component Methods

## API Server (Go + Gin)

### Auth Handler
| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| `POST` | `/api/admin/login` | 관리자 로그인 | `{store_id, username, password}` | `{token, expires_at}` |
| `POST` | `/api/table/login` | 테이블 로그인 | `{store_id, table_number, password}` | `{token, table_id, session_id}` |

### Menu Handler
| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| `GET` | `/api/menus` | 메뉴 전체 조회 (카테고리 포함) | query: `?category_id=` | `{categories: [{id, name, menus: [...]}]}` |
| `POST` | `/api/admin/menus` | 메뉴 등록 | `{name, price, description, category_id, image_url}` | `{menu}` |
| `PUT` | `/api/admin/menus/:id` | 메뉴 수정 | `{name, price, description, category_id, image_url}` | `{menu}` |
| `DELETE` | `/api/admin/menus/:id` | 메뉴 삭제 | - | `{success}` |
| `PUT` | `/api/admin/menus/order` | 메뉴 순서 변경 | `{menu_ids: [ordered]}` | `{success}` |

### Order Handler
| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| `POST` | `/api/orders` | 주문 생성 | `{table_id, session_id, items: [{menu_id, quantity}]}` | `{order_id, order_number, total_amount}` |
| `GET` | `/api/orders` | 주문 내역 조회 (현재 세션) | query: `?table_id=&session_id=` | `{orders: [...]}` |
| `PUT` | `/api/admin/orders/:id/status` | 주문 상태 변경 | `{status}` | `{order}` |
| `DELETE` | `/api/admin/orders/:id` | 주문 삭제 | - | `{success}` |

### Table Handler
| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| `POST` | `/api/admin/tables` | 테이블 초기 설정 | `{table_number, password}` | `{table_id}` |
| `POST` | `/api/admin/tables/:id/complete` | 테이블 이용 완료 | - | `{success}` |
| `GET` | `/api/admin/tables/:id/history` | 과거 주문 내역 | query: `?date=` | `{history: [...]}` |
| `GET` | `/api/admin/tables` | 테이블 목록 조회 | - | `{tables: [...]}` |

### SSE Handler
| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| `GET` | `/api/admin/events` | 실시간 주문 이벤트 스트림 | - | SSE stream (new_order, status_change) |
| `GET` | `/api/admin/metrics/stream` | 실시간 메트릭 스트림 | - | SSE stream (orders_per_second, total_revenue, total_orders) |

### Category Handler
| Method | Endpoint | Purpose | Input | Output |
|--------|----------|---------|-------|--------|
| `GET` | `/api/categories` | 카테고리 목록 | - | `{categories: [...]}` |
| `POST` | `/api/admin/categories` | 카테고리 생성 | `{name, display_order}` | `{category}` |
| `PUT` | `/api/admin/categories/:id` | 카테고리 수정 | `{name, display_order}` | `{category}` |
| `DELETE` | `/api/admin/categories/:id` | 카테고리 삭제 | - | `{success}` |

---

## Internal Services (Go)

### MetricsCollector
| Method | Purpose | Description |
|--------|---------|-------------|
| `RecordOrder(amount)` | 주문 기록 | 초당 주문 수 카운터 증가, 매출 누적 |
| `GetCurrentMetrics()` | 현재 메트릭 조회 | 초당 RPS, 누적 매출, 누적 주문 수 반환 |
| `StartBroadcast()` | 메트릭 브로드캐스트 시작 | 1초 간격으로 연결된 SSE 클라이언트에 메트릭 전송 |

### EventBroker
| Method | Purpose | Description |
|--------|---------|-------------|
| `Subscribe(client)` | SSE 클라이언트 등록 | 새 SSE 연결 등록 |
| `Unsubscribe(client)` | SSE 클라이언트 해제 | 연결 종료 시 제거 |
| `Publish(event)` | 이벤트 발행 | 모든 구독자에게 이벤트 전송 |

### SessionManager
| Method | Purpose | Description |
|--------|---------|-------------|
| `StartSession(tableID)` | 세션 시작 | 첫 주문 시 새 세션 생성 |
| `EndSession(tableID)` | 세션 종료 | 이용 완료 처리, 주문 이력 이동 |
| `GetActiveSession(tableID)` | 활성 세션 조회 | 현재 테이블의 활성 세션 반환 |
