# Code Generation Plan - Unit 2 (Frontend)

## 계획 개요
Frontend Unit (고객앱 + 관리자앱)의 코드 생성 계획입니다.
모노레포 구조로 packages/customer, packages/admin을 생성합니다.

---

## 생성 순서

### Phase 1: 프로젝트 기반 구조
- [ ] 루트 package.json (npm workspaces)
- [ ] tsconfig.base.json (공통 TypeScript 설정)
- [ ] .eslintrc.js, .prettierrc (공통 린트/포맷)
- [ ] .gitignore 업데이트

### Phase 2: 고객앱 (packages/customer)
- [ ] Next.js 프로젝트 초기화 (package.json, next.config.js, tsconfig.json)
- [ ] 공통 타입 정의 (src/types/)
- [ ] API 클라이언트 (src/services/apiClient.ts)
- [ ] Auth 서비스 (src/services/authManager.ts)
- [ ] AuthContext (src/contexts/AuthContext.tsx)
- [ ] CartContext (src/contexts/CartContext.tsx)
- [ ] ToastContext (src/contexts/ToastContext.tsx)
- [ ] 공통 컴포넌트 (Button, Modal, ConfirmModal, Toast, Spinner, Badge, Input)
- [ ] 레이아웃 (Layout, Header, BottomNav)
- [ ] 메뉴 페이지 (MenuPage, CategoryTabs, MenuGrid, MenuCard, MenuDetailModal)
- [ ] 장바구니 페이지 (CartPage, CartItemRow, QuantityControl, CartSummary)
- [ ] 주문 확인 페이지 (OrderConfirmPage)
- [ ] 주문 성공 페이지 (OrderSuccessPage + 카운트다운)
- [ ] 주문 내역 페이지 (OrderHistoryPage, OrderCard, OrderStatusBadge)
- [ ] 설정 페이지 (SetupPage, SetupForm)
- [ ] PWA 설정 (manifest.json, next-pwa 설정)
- [ ] CSS 변수 및 글로벌 스타일

### Phase 3: 관리자앱 (packages/admin)
- [ ] Next.js 프로젝트 초기화
- [ ] 공통 타입 정의 (src/types/)
- [ ] API 클라이언트 + SSE 매니저 (src/services/)
- [ ] AuthContext (src/contexts/AuthContext.tsx)
- [ ] OrderContext + SSE 연동 (src/contexts/OrderContext.tsx)
- [ ] ToastContext (src/contexts/ToastContext.tsx)
- [ ] 공통 컴포넌트 (재사용)
- [ ] 레이아웃 (Layout, Sidebar, NavItem)
- [ ] 로그인 페이지 (LoginPage, LoginForm)
- [ ] 대시보드 페이지 (DashboardPage, TableGrid, TableCard, OrderDetailModal)
- [ ] 테이블 관리 페이지 (TableManagePage, CreateTableForm)
- [ ] 메뉴 관리 페이지 (MenuManagePage, CreateMenuForm, EditMenuModal)
- [ ] 관리자 관리 페이지 (AdminManagePage, CreateAdminForm)
- [ ] CSS 변수 및 글로벌 스타일

### Phase 4: 빌드 검증
- [ ] 고객앱 빌드 확인 (npm run build)
- [ ] 관리자앱 빌드 확인 (npm run build)
- [ ] TypeScript 에러 없음 확인
- [ ] ESLint 에러 없음 확인

---

## 코드 생성 원칙

1. **TypeScript 엄격 모드** — strict: true
2. **CSS Modules** — 컴포넌트별 .module.css
3. **React Context + useReducer** — 상태 관리
4. **fetch API** — HTTP 클라이언트 (래퍼 함수)
5. **Next.js App Router** — 파일 기반 라우팅
6. **PWA** — next-pwa, Service Worker
7. **반응형** — 모바일/태블릿/데스크톱 브레이크포인트

---

## 참조 문서
- Functional Design: `aidlc-docs/construction/frontend/functional-design/`
- NFR Requirements: `aidlc-docs/construction/frontend/nfr-requirements/`
- NFR Design: `aidlc-docs/construction/frontend/nfr-design/`
- Infrastructure Design: `aidlc-docs/construction/frontend/infrastructure-design/`
- Application Design: `aidlc-docs/inception/application-design/`
