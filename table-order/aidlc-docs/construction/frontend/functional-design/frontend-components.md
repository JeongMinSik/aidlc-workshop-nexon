# Frontend Components Design - Unit 2

## 고객앱 (packages/customer) 컴포넌트 계층

### 페이지 구조
```
App
├── AuthProvider (TableAuthContext)
│   ├── CartProvider (CartContext)
│   │   ├── Layout
│   │   │   ├── Header (매장명, 테이블 번호, 장바구니 아이콘+배지)
│   │   │   ├── Main (라우트 콘텐츠)
│   │   │   └── BottomNav (메뉴, 장바구니, 주문내역 탭)
│   │   │
│   │   ├── MenuPage (/)
│   │   │   ├── CategoryTabs
│   │   │   └── MenuGrid
│   │   │       └── MenuCard (반복)
│   │   │           └── MenuDetailModal
│   │   │
│   │   ├── CartPage (/cart)
│   │   │   ├── CartItemList
│   │   │   │   └── CartItemRow (반복)
│   │   │   │       └── QuantityControl
│   │   │   ├── CartSummary (총액)
│   │   │   └── OrderButton
│   │   │
│   │   ├── OrderConfirmPage (/order/confirm)
│   │   │   ├── OrderItemList
│   │   │   ├── OrderTotal
│   │   │   └── ConfirmButton
│   │   │
│   │   ├── OrderSuccessPage (/order/success/:orderNumber)
│   │   │   ├── SuccessIcon
│   │   │   ├── OrderNumber
│   │   │   └── CountdownRedirect (5초)
│   │   │
│   │   └── OrderHistoryPage (/orders)
│   │       └── OrderList
│   │           └── OrderCard (반복)
│   │               ├── OrderStatusBadge
│   │               └── OrderItemSummary
│   │
│   └── SetupPage (/setup) [인증 전 접근 가능]
│       └── SetupForm
```

### 주요 컴포넌트 Props/State

#### MenuPage
```typescript
// State (로컬)
const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
const [menus, setMenus] = useState<Menu[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

#### CategoryTabs
```typescript
interface CategoryTabsProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (categoryId: number) => void;
}
```

#### MenuCard
```typescript
interface MenuCardProps {
  menu: Menu;
  onAddToCart: (menu: Menu) => void;
  onShowDetail: (menu: Menu) => void;
}
```

#### CartItemRow
```typescript
interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (menuId: number, quantity: number) => void;
  onRemove: (menuId: number) => void;
}
```

#### QuantityControl
```typescript
interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;  // default: 1
  max?: number;  // default: 99
}
```

#### OrderStatusBadge
```typescript
interface OrderStatusBadgeProps {
  status: OrderStatus;
}
// 렌더링: 상태별 색상 + 한글 텍스트
```

---

## 관리자앱 (packages/admin) 컴포넌트 계층

### 페이지 구조
```
App
├── AuthProvider (AdminAuthContext)
│   ├── OrderProvider (OrderContext + SSE)
│   │   ├── Layout
│   │   │   ├── Sidebar (네비게이션)
│   │   │   │   ├── NavItem (대시보드)
│   │   │   │   ├── NavItem (테이블 관리)
│   │   │   │   ├── NavItem (메뉴 관리)
│   │   │   │   ├── NavItem (관리자 관리) [슈퍼 관리자만]
│   │   │   │   └── LogoutButton
│   │   │   └── Main (라우트 콘텐츠)
│   │   │
│   │   ├── DashboardPage (/)
│   │   │   ├── ConnectionStatus (SSE 연결 상태)
│   │   │   ├── TableGrid (4열 그리드)
│   │   │   │   └── TableCard (반복)
│   │   │   │       ├── TableNumber
│   │   │   │       ├── TotalAmount
│   │   │   │       ├── RecentOrderPreview
│   │   │   │       └── NewOrderIndicator (펄스 애니메이션)
│   │   │   └── OrderDetailModal
│   │   │       ├── OrderList
│   │   │       │   └── OrderRow (반복)
│   │   │       │       ├── OrderStatusBadge
│   │   │       │       ├── StatusChangeButton
│   │   │       │       └── DeleteOrderButton
│   │   │       ├── CompleteSessionButton
│   │   │       └── ViewHistoryButton
│   │   │
│   │   ├── TableManagePage (/tables)
│   │   │   ├── TableList
│   │   │   │   └── TableRow (반복)
│   │   │   └── CreateTableForm
│   │   │
│   │   ├── MenuManagePage (/menus)
│   │   │   ├── CategorySelector
│   │   │   ├── MenuList (드래그 순서 조정)
│   │   │   │   └── MenuRow (반복)
│   │   │   │       ├── EditButton
│   │   │   │       └── DeleteButton
│   │   │   ├── CreateMenuForm
│   │   │   └── EditMenuModal
│   │   │
│   │   └── AdminManagePage (/admins) [슈퍼 관리자 전용]
│   │       ├── AdminList
│   │       │   └── AdminRow (반복)
│   │       └── CreateAdminForm
│   │
│   └── LoginPage (/login) [인증 전 접근 가능]
│       └── LoginForm
```

### 주요 컴포넌트 Props/State

#### DashboardPage
```typescript
// OrderContext에서 가져옴
const { tables, isConnected } = useOrderContext();
const [selectedTable, setSelectedTable] = useState<Table | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
```

#### TableCard
```typescript
interface TableCardProps {
  table: Table;
  isNew: boolean;  // 신규 주문 강조 여부
  onClick: (table: Table) => void;
}
```

#### StatusChangeButton
```typescript
interface StatusChangeButtonProps {
  orderId: number;
  currentStatus: OrderStatus;
  onStatusChange: (orderId: number, newStatus: OrderStatus) => void;
}
// pending → "준비 시작" 버튼 표시
// preparing → "완료" 버튼 표시
// completed → 버튼 숨김
```

#### OrderDetailModal
```typescript
interface OrderDetailModalProps {
  table: Table;
  orders: Order[];
  onClose: () => void;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
  onDeleteOrder: (orderId: number) => void;
  onCompleteSession: (tableId: number) => void;
}
```

#### CreateMenuForm
```typescript
interface CreateMenuFormProps {
  categories: Category[];
  onSubmit: (data: CreateMenuDto) => void;
  onCancel: () => void;
}

interface CreateMenuDto {
  name: string;
  price: number;
  description?: string;
  categoryId: number;
  imageUrl?: string;
}
```

---

## 공통 컴포넌트

### UI 기본 컴포넌트
| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| `Button` | `variant, size, disabled, loading, onClick, children` | 기본 버튼 |
| `Modal` | `isOpen, onClose, title, children` | 모달 다이얼로그 |
| `ConfirmModal` | `isOpen, onConfirm, onCancel, title, message, confirmText, variant` | 확인 팝업 |
| `Toast` | `type, message, duration` | 알림 토스트 |
| `Spinner` | `size` | 로딩 스피너 |
| `Badge` | `variant, children` | 상태 배지 |
| `Input` | `label, error, ...inputProps` | 폼 입력 필드 |
| `Select` | `label, options, error, ...selectProps` | 드롭다운 |
| `EmptyState` | `icon, message` | 빈 상태 표시 |

---

## 사용자 인터랙션 플로우

### 고객 주문 플로우
```
[메뉴 화면] → 카테고리 선택 → 메뉴 카드 터치
    → [메뉴 상세 모달] → "장바구니 추가" 터치
    → 장바구니 배지 업데이트 → 계속 탐색 또는 장바구니 이동
    → [장바구니 화면] → 수량 조절 → "주문하기" 터치
    → [주문 확인 화면] → "주문 확정" 터치
    → [주문 성공 화면] → 5초 카운트다운 → [메뉴 화면] 자동 이동
```

### 관리자 주문 처리 플로우
```
[대시보드] → 신규 주문 수신 (SSE) → 테이블 카드 강조
    → 테이블 카드 클릭 → [주문 상세 모달]
    → "준비 시작" 클릭 → 상태 변경 (pending → preparing)
    → "완료" 클릭 → 상태 변경 (preparing → completed)
```

### 관리자 이용 완료 플로우
```
[대시보드] → 테이블 카드 클릭 → [주문 상세 모달]
    → "이용 완료" 클릭 → [확인 팝업]
    → "완료 처리" 클릭 → 주문 이력 이동 + 테이블 리셋
    → 성공 토스트 → 대시보드 업데이트
```
