# Frontend Business Logic Model - Unit 2

## 1. 장바구니 로직 (CartContext)

### State 구조
```typescript
interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { menu: Menu } }
  | { type: 'REMOVE_ITEM'; payload: { menuId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { menuId: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_FROM_STORAGE'; payload: { items: CartItem[] } };
```

### 로직 상세

| 액션 | 로직 | 결과 |
|------|------|------|
| ADD_ITEM | 기존 항목이면 quantity+1, 없으면 새 항목 추가 | items 업데이트, 총액 재계산 |
| REMOVE_ITEM | menuId로 항목 제거 | items 업데이트, 총액 재계산 |
| UPDATE_QUANTITY | quantity가 0이면 삭제, 아니면 수량 변경 | items 업데이트, 총액 재계산 |
| CLEAR_CART | 모든 항목 제거 | items=[], totalAmount=0 |
| LOAD_FROM_STORAGE | localStorage에서 복원 | 저장된 상태 복원 |

### localStorage 동기화
- **저장 시점**: items 변경 시마다 `localStorage.setItem('cart', JSON.stringify(items))`
- **복원 시점**: 앱 초기화 시 `localStorage.getItem('cart')` → LOAD_FROM_STORAGE
- **키**: `cart_{storeId}_{tableId}` (매장/테이블별 분리)
- **비우기**: CLEAR_CART 시 localStorage도 삭제

### 총액 계산
```
totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
```

---

## 2. 인증 로직 (AuthContext)

### 고객앱 인증 (TableAuthContext)

#### State 구조
```typescript
interface TableAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: TableSession | null;
  error: string | null;
}
```

#### 로직 플로우
1. **앱 시작** → localStorage에서 토큰 확인
2. **토큰 있음** → `GET /api/auth/me`로 유효성 검증
3. **유효** → session 설정, 메뉴 화면 표시
4. **무효/없음** → localStorage에서 저장된 인증 정보 확인
5. **인증 정보 있음** → 자동 로그인 시도 (`POST /api/auth/table/login`)
6. **인증 정보 없음** → 설정 화면(SetupPage) 표시

#### 토큰 관리
- **저장**: `localStorage.setItem('table_token', token)`
- **저장**: `localStorage.setItem('table_auth', JSON.stringify({storeCode, tableNumber, password}))`
- **읽기**: 앱 시작 시 자동 읽기
- **삭제**: 인증 실패 시 토큰만 삭제 (인증 정보는 유지하여 재시도)

### 관리자앱 인증 (AdminAuthContext)

#### State 구조
```typescript
interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AdminSession | null;
  error: string | null;
}
```

#### 로직 플로우
1. **앱 시작** → localStorage에서 토큰 확인
2. **토큰 있음** → 만료 시간 확인
3. **만료 전** → `GET /api/auth/me`로 유효성 검증 → 대시보드 표시
4. **만료됨** → 토큰 삭제 → 로그인 화면 표시
5. **토큰 없음** → 로그인 화면 표시

#### 자동 로그아웃
- 16시간 세션 만료 시 자동 로그아웃
- `setTimeout` 또는 주기적 만료 체크 (1분 간격)
- 만료 시: 토큰 삭제 → 로그인 화면 리다이렉트 → 안내 메시지

---

## 3. SSE 연결 관리 로직 (OrderContext - 관리자앱)

### State 구조
```typescript
interface OrderState {
  tables: TableWithOrders[];
  isConnected: boolean;
  lastEventTime: string | null;
}

type OrderAction =
  | { type: 'SET_INITIAL_DATA'; payload: { tables: TableWithOrders[] } }
  | { type: 'NEW_ORDER'; payload: { order: Order } }
  | { type: 'ORDER_UPDATED'; payload: { order: Order } }
  | { type: 'ORDER_DELETED'; payload: { orderId: number; tableId: number } }
  | { type: 'SET_CONNECTED'; payload: boolean };
```

### SSE 연결 관리
```
1. 대시보드 마운트 → EventSource 생성 (GET /api/sse/stores/:storeId/orders)
2. onopen → SET_CONNECTED(true)
3. onmessage → 이벤트 타입별 dispatch
4. onerror → SET_CONNECTED(false) → 3초 후 재연결 시도
5. 대시보드 언마운트 → EventSource.close()
```

### 이벤트 처리
| 이벤트 | 처리 |
|--------|------|
| `new_order` | 해당 테이블 카드에 주문 추가, 총액 업데이트, 시각적 강조 |
| `order_updated` | 해당 주문 상태 업데이트 |
| `order_deleted` | 해당 주문 제거, 총액 재계산 |

### 재연결 전략
- 연결 끊김 감지 → 3초 대기 → 재연결 시도
- 최대 5회 재시도 후 수동 새로고침 안내
- 재연결 성공 시 전체 데이터 다시 로드 (GET /api/stores/:storeId/orders)

---

## 4. 주문 상태 전이 로직 (UI 표시 규칙)

### 상태별 UI 표시
| 상태 | 한글 표시 | 색상 | 아이콘 |
|------|----------|------|--------|
| `pending` | 대기중 | 주황색 (#FF9800) | ⏳ |
| `preparing` | 준비중 | 파란색 (#2196F3) | 🔥 |
| `completed` | 완료 | 초록색 (#4CAF50) | ✅ |

### 상태 전이 규칙 (관리자)
```
pending → preparing → completed (단방향만 허용)
```
- 관리자 대시보드에서 "다음 상태" 버튼만 표시
- pending → "준비 시작" 버튼
- preparing → "완료" 버튼
- completed → 버튼 없음 (최종 상태)

### 신규 주문 강조 (관리자 대시보드)
- 신규 주문 수신 시 해당 테이블 카드에 펄스 애니메이션 (3초)
- 카드 배경색 일시적 변경 (연한 주황 → 원래 색)
- 주문 카운트 배지 업데이트

---

## 5. API 호출 래퍼 (fetch 기반)

### 공통 fetch 래퍼
```typescript
interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

// 기본 동작:
// - Authorization 헤더 자동 추가 (토큰 있을 시)
// - Content-Type: application/json 자동 설정
// - 응답 JSON 자동 파싱
// - 401 응답 시 자동 로그아웃 처리
// - 에러 응답 시 ApiError 형태로 throw
```

### 에러 핸들링 전략
| HTTP 상태 | 처리 |
|-----------|------|
| 200-299 | 정상 응답 반환 |
| 401 | 토큰 삭제 → 로그인 화면 리다이렉트 |
| 400 | 검증 에러 메시지 표시 |
| 404 | "찾을 수 없음" 메시지 |
| 500 | "서버 오류" 일반 메시지 |
| 네트워크 에러 | "네트워크 연결을 확인해주세요" |
