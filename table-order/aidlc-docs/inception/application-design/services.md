# 테이블오더 서비스 - 서비스 레이어 설계

## 서비스 아키텍처 개요

```
Controller Layer (HTTP 요청 처리)
       |
Service Layer (비즈니스 로직 오케스트레이션)
       |
Repository Layer (데이터 접근)
       |
Database (MySQL/MariaDB)
```

---

## 서비스 정의

### 1. AuthService
**책임**: 인증/인가 로직 오케스트레이션
**의존성**: AdminRepository, TableRepository, JWT 라이브러리, bcrypt

| 오케스트레이션 | 설명 |
|---------------|------|
| 관리자 로그인 | 로그인 시도 확인 → 자격 증명 검증 → JWT 발급 → 시도 횟수 초기화 |
| 테이블 로그인 | 매장/테이블 확인 → 비밀번호 검증 → JWT 발급 |
| 토큰 검증 | JWT 디코딩 → 만료 확인 → 페이로드 반환 |

---

### 2. StoreService
**책임**: 매장 관련 비즈니스 로직
**의존성**: StoreRepository

| 오케스트레이션 | 설명 |
|---------------|------|
| 매장 생성 | 코드 중복 확인 → 매장 생성 → 반환 |
| 매장 조회 | ID 또는 코드로 매장 조회 |

---

### 3. AdminService
**책임**: 관리자 계정 관리 로직
**의존성**: AdminRepository, StoreRepository, bcrypt

| 오케스트레이션 | 설명 |
|---------------|------|
| 관리자 생성 | 권한 확인 → 중복 확인 → 비밀번호 해싱 → 계정 생성 → 매장 할당 |
| 매장 할당 | 관리자 존재 확인 → 매장 존재 확인 → 할당 업데이트 |

---

### 4. TableService
**책임**: 테이블 및 세션 라이프사이클 관리
**의존성**: TableRepository, SessionRepository, OrderService

| 오케스트레이션 | 설명 |
|---------------|------|
| 테이블 초기 설정 | 테이블 생성/수정 → 비밀번호 해싱 → 세션 토큰 생성 |
| 세션 시작 | 현재 세션 확인 → 새 세션 생성 → 세션 ID 반환 |
| 이용 완료 | 현재 세션 조회 → 주문 이력 이동 → 세션 종료 → 테이블 리셋 |

---

### 5. MenuService
**책임**: 메뉴/카테고리 CRUD 및 순서 관리
**의존성**: MenuRepository, CategoryRepository

| 오케스트레이션 | 설명 |
|---------------|------|
| 메뉴 생성 | 카테고리 존재 확인 → 데이터 검증 → 순서 할당 → 메뉴 생성 |
| 메뉴 순서 변경 | 카테고리 확인 → 순서 배열 검증 → 일괄 업데이트 |
| 메뉴 삭제 | 메뉴 존재 확인 → 삭제 → 순서 재정렬 |

---

### 6. OrderService
**책임**: 주문 생성, 상태 관리, 이력 관리
**의존성**: OrderRepository, OrderItemRepository, TableService, SSEService, MenuService

| 오케스트레이션 | 설명 |
|---------------|------|
| 주문 생성 | 세션 확인 → 메뉴 유효성 검증 → 주문 생성 → 주문 항목 생성 → SSE 브로드캐스트 |
| 상태 변경 | 주문 존재 확인 → 상태 전이 검증 → 상태 업데이트 → SSE 브로드캐스트 |
| 주문 삭제 | 주문 존재 확인 → 삭제 → 총액 재계산 → SSE 브로드캐스트 |
| 이력 이동 | 세션 주문 조회 → OrderHistory로 복사 → 원본 삭제 |

---

### 7. SSEService
**책임**: 실시간 이벤트 관리 및 전송
**의존성**: 없음 (인메모리 클라이언트 관리)

| 오케스트레이션 | 설명 |
|---------------|------|
| 클라이언트 등록 | 매장별 클라이언트 맵에 추가 → 연결 유지 |
| 이벤트 브로드캐스트 | 매장 클라이언트 조회 → 전체 전송 → 실패 클라이언트 제거 |
| 연결 정리 | 연결 종료 감지 → 클라이언트 맵에서 제거 |

---

## 트랜잭션 경계

| 작업 | 트랜잭션 범위 | 설명 |
|------|-------------|------|
| 주문 생성 | Order + OrderItems | 주문과 항목이 원자적으로 생성 |
| 이용 완료 | Session + Orders + OrderHistory | 세션 종료, 주문 이력 이동이 원자적 |
| 주문 삭제 | Order + OrderItems | 주문과 항목이 원자적으로 삭제 |
| 관리자 생성 | Admin + AdminStoreMapping | 계정과 매장 할당이 원자적 |

---

## 서비스 간 호출 관계

```
AuthService ──────→ AdminRepository, TableRepository
StoreService ─────→ StoreRepository
AdminService ─────→ AdminRepository, StoreRepository
TableService ─────→ TableRepository, SessionRepository, OrderService
MenuService ──────→ MenuRepository, CategoryRepository
OrderService ─────→ OrderRepository, TableService, SSEService, MenuService
SSEService ───────→ (인메모리 클라이언트 관리)
```
