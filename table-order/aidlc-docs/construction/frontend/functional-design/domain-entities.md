# Frontend Domain Entities - Unit 2

## 기술 스택 결정사항

| 항목 | 선택 |
|------|------|
| 스타일링 | CSS Modules |
| 라우팅 | React Router v6 |
| HTTP 클라이언트 | fetch API (내장) |
| 빌드 도구 | Next.js (SPA 모드) |
| 메뉴 레이아웃 | 상단 카테고리 탭 + 2열 카드 그리드 |
| 대시보드 그리드 | 4개 카드/행 |

---

## 공통 타입 정의

### API 응답 형식
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

interface ApiError {
  code: string;
  message: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    page: number;
    limit: number;
    total: number;
  };
}
```

### 공통 엔티티
```typescript
interface BaseEntity {
  id: number;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}
```

---

## 고객앱 데이터 모델

### Store (매장)
```typescript
interface Store {
  id: number;
  code: string;
  name: string;
}
```

### Category (카테고리)
```typescript
interface Category {
  id: number;
  storeId: number;
  name: string;
  sortOrder: number;
}
```

### Menu (메뉴)
```typescript
interface Menu {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  sortOrder: number;
}
```

### CartItem (장바구니 항목)
```typescript
interface CartItem {
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}
```

### Order (주문)
```typescript
interface Order extends BaseEntity {
  id: number;
  orderNumber: string;
  storeId: number;
  tableId: number;
  sessionId: number;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  orderedAt: string;
}

type OrderStatus = 'pending' | 'preparing' | 'completed';

interface OrderItem {
  id: number;
  menuId: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
```

### TableAuth (테이블 인증 정보)
```typescript
interface TableAuth {
  storeCode: string;
  tableNumber: number;
  password: string;
}

interface TableSession {
  token: string;
  storeId: number;
  tableId: number;
  sessionId: number;
  storeName: string;
  tableNumber: number;
}
```

---

## 관리자앱 데이터 모델

### Admin (관리자)
```typescript
interface Admin extends BaseEntity {
  id: number;
  username: string;
  role: AdminRole;
  storeIds: number[];
}

type AdminRole = 'super_admin' | 'admin';
```

### AdminAuth (관리자 인증)
```typescript
interface AdminAuth {
  storeCode: string;
  username: string;
  password: string;
}

interface AdminSession {
  token: string;
  admin: Admin;
  storeId: number;
  storeName: string;
  expiresAt: string;
}
```

### Table (테이블 - 관리자 관점)
```typescript
interface Table extends BaseEntity {
  id: number;
  storeId: number;
  tableNumber: number;
  currentSessionId: number | null;
  totalOrderAmount: number;
  recentOrders: OrderSummary[];
  hasActiveSession: boolean;
}

interface OrderSummary {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
  itemCount: number;
}
```

### OrderHistory (과거 주문 이력)
```typescript
interface OrderHistory {
  sessionId: number;
  completedAt: string;
  orders: Order[];
  totalAmount: number;
}
```

### SSE 이벤트 타입
```typescript
type SSEEventType = 'new_order' | 'order_updated' | 'order_deleted';

interface SSEEvent {
  type: SSEEventType;
  data: Order | { orderId: number };
  timestamp: string;
}
```
