# 테이블오더 서비스 - 컴포넌트 메서드 정의

> **Note**: 상세 비즈니스 규칙은 Functional Design (CONSTRUCTION) 단계에서 정의됩니다.

---

## 1. Auth Module

### AuthController
| 메서드 | HTTP | 경로 | 설명 |
|--------|------|------|------|
| `adminLogin` | POST | `/api/auth/admin/login` | 관리자 로그인 |
| `adminLogout` | POST | `/api/auth/admin/logout` | 관리자 로그아웃 |
| `tableLogin` | POST | `/api/auth/table/login` | 테이블 태블릿 로그인 |
| `refreshToken` | POST | `/api/auth/refresh` | 토큰 갱신 |
| `getMe` | GET | `/api/auth/me` | 현재 인증 정보 조회 |

### AuthService
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `authenticateAdmin` | `{storeCode, username, password}` | `{token, admin}` | 관리자 인증 |
| `authenticateTable` | `{storeCode, tableNumber, password}` | `{token, table}` | 테이블 인증 |
| `verifyToken` | `token: string` | `TokenPayload` | 토큰 검증 |
| `checkLoginAttempts` | `{storeCode, username}` | `boolean` | 로그인 시도 제한 확인 |

### AuthRepository
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `findAdminByCredentials` | `{storeId, username}` | `Admin \| null` | 관리자 조회 |
| `incrementLoginAttempts` | `{storeId, username}` | `void` | 로그인 시도 횟수 증가 |
| `resetLoginAttempts` | `{storeId, username}` | `void` | 로그인 시도 횟수 초기화 |

---

## 2. Store Module

### StoreController
| 메서드 | HTTP | 경로 | 설명 |
|--------|------|------|------|
| `getStore` | GET | `/api/stores/:storeId` | 매장 정보 조회 |
| `createStore` | POST | `/api/stores` | 매장 생성 (슈퍼 관리자) |
| `updateStore` | PUT | `/api/stores/:storeId` | 매장 정보 수정 |

### StoreService
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `getStoreById` | `storeId: number` | `Store` | 매장 조회 |
| `getStoreByCode` | `storeCode: string` | `Store` | 매장 코드로 조회 |
| `createStore` | `CreateStoreDto` | `Store` | 매장 생성 |
| `updateStore` | `storeId, UpdateStoreDto` | `Store` | 매장 수정 |

---

## 3. Admin Module

### AdminController
| 메서드 | HTTP | 경로 | 설명 |
|--------|------|------|------|
| `getAdmins` | GET | `/api/admins` | 관리자 목록 조회 |
| `createAdmin` | POST | `/api/admins` | 관리자 생성 (슈퍼 관리자) |
| `updateAdmin` | PUT | `/api/admins/:adminId` | 관리자 수정 |
| `deleteAdmin` | DELETE | `/api/admins/:adminId` | 관리자 삭제 |
| `assignStore` | PUT | `/api/admins/:adminId/stores` | 매장 할당 |

### AdminService
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `getAdminsByStore` | `storeId: number` | `Admin[]` | 매장별 관리자 조회 |
| `createAdmin` | `CreateAdminDto` | `Admin` | 관리자 생성 |
| `updateAdmin` | `adminId, UpdateAdminDto` | `Admin` | 관리자 수정 |
| `deleteAdmin` | `adminId: number` | `void` | 관리자 삭제 |
| `assignStoreToAdmin` | `adminId, storeIds[]` | `Admin` | 매장 할당 |

---

## 4. Table Module

### TableController
| 메서드 | HTTP | 경로 | 설명 |
|--------|------|------|------|
| `getTables` | GET | `/api/stores/:storeId/tables` | 테이블 목록 조회 |
| `createTable` | POST | `/api/stores/:storeId/tables` | 테이블 생성 |
| `updateTable` | PUT | `/api/tables/:tableId` | 테이블 수정 |
| `deleteTable` | DELETE | `/api/tables/:tableId` | 테이블 삭제 |
| `completeSession` | POST | `/api/tables/:tableId/complete-session` | 이용 완료 처리 |
| `getSessionHistory` | GET | `/api/tables/:tableId/history` | 과거 세션 이력 조회 |

### TableService
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `getTablesByStore` | `storeId: number` | `Table[]` | 매장별 테이블 조회 |
| `createTable` | `CreateTableDto` | `Table` | 테이블 생성 |
| `setupTable` | `tableId, {number, password}` | `Table` | 테이블 초기 설정 |
| `startSession` | `tableId: number` | `TableSession` | 세션 시작 |
| `completeSession` | `tableId: number` | `void` | 이용 완료 (세션 종료) |
| `getCurrentSession` | `tableId: number` | `TableSession \| null` | 현재 세션 조회 |
| `getSessionHistory` | `tableId, filters` | `TableSession[]` | 과거 세션 이력 |

---

## 5. Menu Module

### MenuController
| 메서드 | HTTP | 경로 | 설명 |
|--------|------|------|------|
| `getCategories` | GET | `/api/stores/:storeId/categories` | 카테고리 목록 조회 |
| `createCategory` | POST | `/api/stores/:storeId/categories` | 카테고리 생성 |
| `updateCategory` | PUT | `/api/categories/:categoryId` | 카테고리 수정 |
| `deleteCategory` | DELETE | `/api/categories/:categoryId` | 카테고리 삭제 |
| `getMenus` | GET | `/api/stores/:storeId/menus` | 메뉴 목록 조회 |
| `getMenusByCategory` | GET | `/api/categories/:categoryId/menus` | 카테고리별 메뉴 조회 |
| `createMenu` | POST | `/api/stores/:storeId/menus` | 메뉴 생성 |
| `updateMenu` | PUT | `/api/menus/:menuId` | 메뉴 수정 |
| `deleteMenu` | DELETE | `/api/menus/:menuId` | 메뉴 삭제 |
| `reorderMenus` | PUT | `/api/categories/:categoryId/menus/reorder` | 메뉴 순서 변경 |

### MenuService
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `getCategoriesByStore` | `storeId: number` | `Category[]` | 카테고리 조회 |
| `createCategory` | `CreateCategoryDto` | `Category` | 카테고리 생성 |
| `getMenusByStore` | `storeId: number` | `Menu[]` | 전체 메뉴 조회 |
| `getMenusByCategory` | `categoryId: number` | `Menu[]` | 카테고리별 메뉴 |
| `createMenu` | `CreateMenuDto` | `Menu` | 메뉴 생성 |
| `updateMenu` | `menuId, UpdateMenuDto` | `Menu` | 메뉴 수정 |
| `deleteMenu` | `menuId: number` | `void` | 메뉴 삭제 |
| `reorderMenus` | `categoryId, menuIds[]` | `void` | 순서 변경 |

---

## 6. Order Module

### OrderController
| 메서드 | HTTP | 경로 | 설명 |
|--------|------|------|------|
| `createOrder` | POST | `/api/orders` | 주문 생성 |
| `getOrdersBySession` | GET | `/api/sessions/:sessionId/orders` | 세션별 주문 조회 |
| `getOrdersByTable` | GET | `/api/tables/:tableId/orders` | 테이블별 현재 주문 조회 |
| `getOrdersByStore` | GET | `/api/stores/:storeId/orders` | 매장별 주문 조회 |
| `updateOrderStatus` | PUT | `/api/orders/:orderId/status` | 주문 상태 변경 |
| `deleteOrder` | DELETE | `/api/orders/:orderId` | 주문 삭제 (관리자) |
| `getOrderHistory` | GET | `/api/tables/:tableId/order-history` | 과거 주문 이력 |

### OrderService
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `createOrder` | `CreateOrderDto` | `Order` | 주문 생성 |
| `getOrdersBySession` | `sessionId: number` | `Order[]` | 세션별 주문 |
| `getActiveOrdersByStore` | `storeId: number` | `Order[]` | 매장 활성 주문 |
| `updateOrderStatus` | `orderId, status` | `Order` | 상태 변경 |
| `deleteOrder` | `orderId: number` | `void` | 주문 삭제 |
| `moveOrdersToHistory` | `sessionId: number` | `void` | 이력으로 이동 |
| `getOrderHistory` | `tableId, filters` | `OrderHistory[]` | 과거 이력 조회 |

---

## 7. SSE Module

### SSEController
| 메서드 | HTTP | 경로 | 설명 |
|--------|------|------|------|
| `subscribe` | GET | `/api/sse/stores/:storeId/orders` | 매장 주문 이벤트 구독 |

### SSEService
| 메서드 | Input | Output | 설명 |
|--------|-------|--------|------|
| `addClient` | `storeId, response` | `void` | SSE 클라이언트 등록 |
| `removeClient` | `storeId, clientId` | `void` | 클라이언트 제거 |
| `broadcastNewOrder` | `storeId, order` | `void` | 신규 주문 브로드캐스트 |
| `broadcastOrderUpdate` | `storeId, order` | `void` | 주문 상태 변경 브로드캐스트 |
| `broadcastOrderDelete` | `storeId, orderId` | `void` | 주문 삭제 브로드캐스트 |

---

## 8. Frontend - Customer App

### Pages/Views
| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| `MenuPage` | `/` | 메뉴 조회 (기본 화면) |
| `CartPage` | `/cart` | 장바구니 |
| `OrderConfirmPage` | `/order/confirm` | 주문 확인 |
| `OrderSuccessPage` | `/order/success` | 주문 성공 |
| `OrderHistoryPage` | `/orders` | 주문 내역 |
| `SetupPage` | `/setup` | 초기 설정 (관리자용) |

### Context/State
| Context | 설명 |
|---------|------|
| `AuthContext` | 테이블 인증 상태 관리 |
| `CartContext` | 장바구니 상태 관리 (localStorage 연동) |

---

## 9. Frontend - Admin App

### Pages/Views
| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| `LoginPage` | `/login` | 관리자 로그인 |
| `DashboardPage` | `/` | 주문 모니터링 대시보드 |
| `TableManagePage` | `/tables` | 테이블 관리 |
| `MenuManagePage` | `/menus` | 메뉴 관리 |
| `AdminManagePage` | `/admins` | 관리자 계정 관리 (슈퍼) |

### Context/State
| Context | 설명 |
|---------|------|
| `AuthContext` | 관리자 인증 상태 관리 |
| `OrderContext` | 실시간 주문 상태 관리 (SSE 연동) |
