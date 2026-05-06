# 테이블오더 서비스 - Unit of Work Story Map

## Story-Unit 매핑 개요

| Unit | 담당 스토리 수 | 설명 |
|------|:-------------:|------|
| Unit 1 (Backend) | 30개 (API 구현) | 모든 스토리의 서버 로직 담당 |
| Unit 2 (Frontend) | 30개 (UI 구현) | 모든 스토리의 화면 담당 |

> **참고**: 모든 스토리는 Backend(API)와 Frontend(UI) 양쪽 모두에 걸쳐있습니다.
> 각 Unit은 해당 스토리의 자기 영역(서버/화면)을 구현합니다.

---

## Unit 1 (Backend) - Story 매핑

### 고객 주문 여정 API

| Story ID | Story 제목 | Backend 구현 내용 |
|----------|-----------|------------------|
| US-C01 | 테이블 태블릿 자동 로그인 | `POST /api/auth/table/login` — 테이블 인증 API |
| US-C02 | 카테고리별 메뉴 목록 조회 | `GET /api/stores/:storeId/menus` — 메뉴 조회 API |
| US-C03 | 메뉴 상세 정보 확인 | `GET /api/menus/:menuId` — 메뉴 상세 API |
| US-C04 | 카테고리 간 빠른 이동 | `GET /api/stores/:storeId/categories` — 카테고리 API |
| US-C05 | 장바구니에 메뉴 추가 | (클라이언트 전용 — Backend 불필요) |
| US-C06 | 장바구니 수량 조절 | (클라이언트 전용 — Backend 불필요) |
| US-C07 | 장바구니 메뉴 삭제 | (클라이언트 전용 — Backend 불필요) |
| US-C08 | 장바구니 비우기 | (클라이언트 전용 — Backend 불필요) |
| US-C09 | 장바구니 로컬 유지 | (클라이언트 전용 — Backend 불필요) |
| US-C10 | 주문 내역 최종 확인 | (클라이언트 전용 — Backend 불필요) |
| US-C11 | 주문 확정 및 성공 처리 | `POST /api/orders` — 주문 생성 API |
| US-C12 | 주문 실패 처리 | 에러 응답 처리 (400/500) |
| US-C13 | 현재 세션 주문 내역 조회 | `GET /api/sessions/:sessionId/orders` — 세션 주문 API |
| US-C14 | 주문 상태 확인 | 주문 조회 시 상태 필드 포함 |

### 관리자 운영 여정 API

| Story ID | Story 제목 | Backend 구현 내용 |
|----------|-----------|------------------|
| US-A01 | 관리자 로그인 | `POST /api/auth/admin/login` — 관리자 인증 API |
| US-A02 | 세션 유지 및 자동 로그아웃 | JWT 만료 처리, `GET /api/auth/me` |
| US-A03 | 실시간 주문 수신 | `GET /api/sse/stores/:storeId/orders` — SSE 엔드포인트 |
| US-A04 | 테이블별 주문 현황 대시보드 | `GET /api/stores/:storeId/orders` — 매장 주문 조회 |
| US-A05 | 주문 상세 보기 | `GET /api/orders/:orderId` — 주문 상세 API |
| US-A06 | 주문 상태 변경 | `PUT /api/orders/:orderId/status` — 상태 변경 API |
| US-A07 | 테이블 초기 설정 | `POST /api/stores/:storeId/tables` — 테이블 생성 API |
| US-A08 | 주문 삭제 (직권 수정) | `DELETE /api/orders/:orderId` — 주문 삭제 API |
| US-A09 | 테이블 이용 완료 처리 | `POST /api/tables/:tableId/complete-session` |
| US-A10 | 과거 주문 내역 조회 | `GET /api/tables/:tableId/order-history` |
| US-A11 | 메뉴 등록 | `POST /api/stores/:storeId/menus` — 메뉴 생성 API |
| US-A12 | 메뉴 수정 | `PUT /api/menus/:menuId` — 메뉴 수정 API |
| US-A13 | 메뉴 삭제 | `DELETE /api/menus/:menuId` — 메뉴 삭제 API |
| US-A14 | 메뉴 노출 순서 조정 | `PUT /api/categories/:categoryId/menus/reorder` |

### 슈퍼 관리자 여정 API

| Story ID | Story 제목 | Backend 구현 내용 |
|----------|-----------|------------------|
| US-S01 | 하위 관리자 계정 생성 | `POST /api/admins` — 관리자 생성 API |
| US-S02 | 매장별 관리자 할당 | `PUT /api/admins/:adminId/stores` — 매장 할당 API |

---

## Unit 2 (Frontend) - Story 매핑

### 고객앱 (packages/customer)

| Story ID | Story 제목 | Frontend 구현 내용 |
|----------|-----------|-------------------|
| US-C01 | 테이블 태블릿 자동 로그인 | SetupPage + AuthContext (localStorage 토큰 관리) |
| US-C02 | 카테고리별 메뉴 목록 조회 | MenuPage — 카테고리 탭 + 메뉴 카드 그리드 |
| US-C03 | 메뉴 상세 정보 확인 | MenuDetailModal — 상세 정보 + 장바구니 추가 |
| US-C04 | 카테고리 간 빠른 이동 | CategoryTabs 컴포넌트 |
| US-C05 | 장바구니에 메뉴 추가 | CartContext — addItem 액션 |
| US-C06 | 장바구니 수량 조절 | CartPage — QuantityControl 컴포넌트 |
| US-C07 | 장바구니 메뉴 삭제 | CartPage — removeItem 액션 |
| US-C08 | 장바구니 비우기 | CartPage — clearCart 액션 |
| US-C09 | 장바구니 로컬 유지 | CartContext — localStorage 동기화 |
| US-C10 | 주문 내역 최종 확인 | OrderConfirmPage — 최종 확인 UI |
| US-C11 | 주문 확정 및 성공 처리 | OrderSuccessPage — 5초 카운트다운 + 리다이렉트 |
| US-C12 | 주문 실패 처리 | 에러 토스트/모달 + 장바구니 유지 |
| US-C13 | 현재 세션 주문 내역 조회 | OrderHistoryPage — 주문 목록 |
| US-C14 | 주문 상태 확인 | OrderStatusBadge 컴포넌트 |

### 관리자앱 (packages/admin)

| Story ID | Story 제목 | Frontend 구현 내용 |
|----------|-----------|-------------------|
| US-A01 | 관리자 로그인 | LoginPage + AuthContext |
| US-A02 | 세션 유지 및 자동 로그아웃 | AuthContext — 토큰 만료 감지 + 자동 로그아웃 |
| US-A03 | 실시간 주문 수신 | OrderContext — EventSource SSE 연동 |
| US-A04 | 테이블별 주문 현황 대시보드 | DashboardPage — 테이블 카드 그리드 |
| US-A05 | 주문 상세 보기 | OrderDetailModal — 전체 메뉴 목록 |
| US-A06 | 주문 상태 변경 | StatusChangeButton 컴포넌트 |
| US-A07 | 테이블 초기 설정 | TableManagePage — 설정 폼 |
| US-A08 | 주문 삭제 (직권 수정) | DeleteOrderButton + ConfirmModal |
| US-A09 | 테이블 이용 완료 처리 | CompleteSessionButton + ConfirmModal |
| US-A10 | 과거 주문 내역 조회 | OrderHistoryModal — 날짜 필터 |
| US-A11 | 메뉴 등록 | MenuManagePage — CreateMenuForm |
| US-A12 | 메뉴 수정 | MenuManagePage — EditMenuForm |
| US-A13 | 메뉴 삭제 | DeleteMenuButton + ConfirmModal |
| US-A14 | 메뉴 노출 순서 조정 | MenuManagePage — DragReorder |
| US-S01 | 하위 관리자 계정 생성 | AdminManagePage — CreateAdminForm |
| US-S02 | 매장별 관리자 할당 | AdminManagePage — StoreAssignForm |

---

## 클라이언트 전용 스토리 (Backend 불필요)

| Story ID | 이유 |
|----------|------|
| US-C05~C10 | 장바구니는 클라이언트 로컬 상태로만 관리 (서버 저장 없음) |

---

## 작업 우선순위 (Unit별)

### Unit 1 (Backend) 우선순위
1. **P1 (필수 기반)**: DB 스키마, Auth API, Menu API
2. **P2 (핵심 기능)**: Order API, Table/Session API
3. **P3 (고급 기능)**: SSE, Admin 관리 API, 이력 관리

### Unit 2 (Frontend) 우선순위
1. **P1 (필수 기반)**: 프로젝트 셋업, 라우팅, 공통 컴포넌트
2. **P2 (핵심 기능)**: 메뉴 조회, 장바구니, 주문 생성, 로그인
3. **P3 (고급 기능)**: SSE 연동, 관리자 대시보드, 테이블/메뉴 관리
