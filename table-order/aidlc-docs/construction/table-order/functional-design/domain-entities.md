# Domain Entities

## Entity Relationship Diagram

```
+-------------+       +-------------+       +-------------+
|   Admin     |       |  Category   |<---+  |    Menu     |
+-------------+       +-------------+    |  +-------------+
| id          |       | id          |    +--| category_id |
| username    |       | name        |       | id          |
| password    |       | display_ord |       | name        |
+-------------+       +-------------+       | price       |
                                            | description |
+-------------+       +-------------+       | image_url   |
|   Table     |------>|   Order     |       | display_ord |
+-------------+       +-------------+       | is_active   |
| id          |       | id          |       +-------------+
| table_number|       | table_id    |              |
| password    |       | session_id  |              |
| session_id  |       | order_number|       +-------------+
| session_at  |       | status      |       | OrderItem   |
+-------------+       | total_amount|       +-------------+
                      | created_at  |<------| id          |
                      +-------------+       | order_id    |
                             |              | menu_id     |
                             v              | menu_name   |
                      +-------------+       | quantity    |
                      |OrderHistory |       | unit_price  |
                      +-------------+       +-------------+
                      | id          |
                      | table_id    |
                      | session_id  |
                      | order_data  |
                      | completed_at|
                      +-------------+
```

---

## Entity Definitions

### Admin
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL PK | auto-increment | 관리자 고유 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 로그인 사용자명 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성 시각 |

### Category
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL PK | auto-increment | 카테고리 고유 ID |
| name | VARCHAR(100) | NOT NULL | 카테고리명 |
| display_order | INT | DEFAULT 0 | 표시 순서 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성 시각 |

### Menu
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL PK | auto-increment | 메뉴 고유 ID |
| category_id | INT FK | REFERENCES Category(id) | 소속 카테고리 |
| name | VARCHAR(200) | NOT NULL | 메뉴명 |
| price | INT | NOT NULL, >= 0 | 가격 (원) |
| description | TEXT | NULLABLE | 메뉴 설명 |
| image_url | VARCHAR(500) | NULLABLE | 이미지 URL |
| display_order | INT | DEFAULT 0 | 표시 순서 |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성 시각 |

### TableInfo
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL PK | auto-increment | 테이블 고유 ID |
| table_number | INT | UNIQUE, NOT NULL | 테이블 번호 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시 |
| session_id | UUID | NULLABLE | 현재 활성 세션 ID |
| session_started_at | TIMESTAMP | NULLABLE | 세션 시작 시각 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성 시각 |

### Order
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL PK | auto-increment | 주문 고유 ID |
| table_id | INT FK | REFERENCES TableInfo(id) | 테이블 |
| session_id | UUID | NOT NULL | 세션 ID |
| order_number | VARCHAR(20) | UNIQUE, NOT NULL | 주문 번호 (표시용) |
| status | VARCHAR(20) | DEFAULT 'pending' | pending/preparing/completed |
| total_amount | INT | NOT NULL | 총 금액 |
| created_at | TIMESTAMP | DEFAULT NOW() | 주문 시각 |

### OrderItem
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL PK | auto-increment | 항목 고유 ID |
| order_id | INT FK | REFERENCES Order(id) ON DELETE CASCADE | 소속 주문 |
| menu_id | INT FK | REFERENCES Menu(id) | 메뉴 참조 |
| menu_name | VARCHAR(200) | NOT NULL | 주문 시점 메뉴명 (스냅샷) |
| quantity | INT | NOT NULL, >= 1 | 수량 |
| unit_price | INT | NOT NULL | 주문 시점 단가 (스냅샷) |

### OrderHistory
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL PK | auto-increment | 이력 고유 ID |
| table_id | INT FK | REFERENCES TableInfo(id) | 테이블 |
| session_id | UUID | NOT NULL | 세션 ID |
| order_data | JSONB | NOT NULL | 주문 전체 데이터 (스냅샷) |
| total_amount | INT | NOT NULL | 세션 총 금액 |
| completed_at | TIMESTAMP | DEFAULT NOW() | 이용 완료 시각 |

---

## Key Design Notes

1. **OrderItem에 menu_name, unit_price 스냅샷**: 메뉴 가격/이름 변경 시에도 주문 이력 보존
2. **OrderHistory에 JSONB**: 세션 종료 시 주문 데이터를 통째로 저장. 조회만 하므로 정규화 불필요
3. **session_id는 UUID**: 테이블 이용 완료 후 새 세션 시작 시 새 UUID 생성
4. **order_number**: "ORD-20260506-001" 형태의 사람이 읽기 쉬운 번호
