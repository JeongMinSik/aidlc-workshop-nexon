# Requirements Document - 테이블오더 서비스

## Intent Analysis

| 항목 | 내용 |
|------|------|
| **User Request** | 워크샵 시연용 테이블오더 서비스 구축 (하루 개발, 고성능 데모) |
| **Request Type** | New Project (Greenfield) |
| **Scope Estimate** | Multiple Components (프론트엔드 + 백엔드 + DB) |
| **Complexity Estimate** | Moderate (기능은 명확하나 실시간 통신 + 성능 시연 포함) |
| **Project Context** | 워크샵 데모용. 유지보수 없음. "있어보이게" + 부하테스트 시연이 목표 |

### 🎯 Core Goals (항상 기억할 것)
1. **있어보이는 것** — 시각적으로 인상적인 UI/UX
2. **부하테스트 시연** — 고성능을 숫자와 그래프로 증명
3. **실시간 시각화** — 데이터가 살아 움직이는 느낌

---

## Technology Stack

| 레이어 | 기술 | 선택 근거 |
|--------|------|-----------|
| **Backend** | Go + Gin | 고성능 시연, 사용자가 코드 읽기 가능, goroutine 기반 동시성 |
| **Frontend** | React + Vite + TypeScript | AI 생성 최적, 풍부한 UI 라이브러리, 있어보이는 화면 |
| **Database** | PostgreSQL (Docker Compose) | 프로덕션급 인상, 부하테스트 적합, 자동화된 환경 |
| **Real-time** | Server-Sent Events (SSE) | 요구사항 명시, 단방향 실시간 통신에 적합 |
| **Load Testing** | k6 또는 vegeta | 시각적 결과 리포트, Go 생태계 친화적 |
| **Dev Environment** | Docker Compose | 사용자 로컬 환경, 전체 스택 한 번에 실행 |

---

## Functional Requirements

### FR-1: 고객용 기능 (Customer)

#### FR-1.1: 테이블 태블릿 자동 로그인
- 관리자가 1회 초기 설정 (매장ID, 테이블번호, 비밀번호)
- 로그인 정보 로컬 저장 후 자동 로그인
- 16시간 세션 유지

#### FR-1.2: 메뉴 조회
- 카테고리별 메뉴 분류 및 표시
- 메뉴 상세: 메뉴명, 가격, 설명, 이미지(외부 URL)
- 카드 형태 레이아웃, 터치 친화적 (최소 44x44px)

#### FR-1.3: 장바구니 관리
- 메뉴 추가/삭제, 수량 조절
- 총 금액 실시간 계산
- 클라이언트 로컬 저장 (새로고침 유지)
- 서버 전송은 주문 확정 시에만

#### FR-1.4: 주문 생성
- 주문 내역 최종 확인 → 확정
- 성공: 주문번호 표시 → 장바구니 비우기 → 메뉴 화면 리다이렉트
- 실패: 에러 메시지 + 장바구니 유지
- 주문 정보: 테이블ID, 메뉴 목록(메뉴명, 수량, 단가), 총 금액, 세션ID

#### FR-1.5: 주문 내역 조회
- 현재 테이블 세션 주문만 표시
- 주문번호, 시각, 메뉴/수량, 금액, 상태(대기중/준비중/완료)
- 시간 순 정렬

### FR-2: 관리자용 기능 (Admin)

#### FR-2.1: 매장 인증
- 매장ID + 사용자명 + 비밀번호
- JWT 토큰 기반, 16시간 세션
- bcrypt 해싱 (기본 수준)

#### FR-2.2: 실시간 주문 모니터링
- SSE 기반 실시간 업데이트 (2초 이내)
- 그리드/대시보드 레이아웃 (테이블별 카드)
- 각 카드: 테이블번호, 총 주문액, 최신 주문 미리보기
- 주문 카드 클릭 → 상세 보기
- 주문 상태 변경 (대기중/준비중/완료)
- 신규 주문 시각적 강조

#### FR-2.3: 테이블 관리
- 테이블 초기 설정 (번호, 비밀번호)
- 주문 삭제 (확인 팝업 → 즉시 삭제 → 총액 재계산)
- 테이블 세션 종료 (이용 완료 → 주문 이력 이동 → 리셋)
- 과거 주문 내역 조회 (날짜 필터링)

#### FR-2.4: 메뉴 관리
- CRUD: 메뉴 등록/조회/수정/삭제
- 필드: 메뉴명, 가격, 설명, 카테고리, 이미지 URL
- 노출 순서 조정
- 필수 필드 및 가격 범위 검증

### FR-3: 성능 시연 및 실시간 메트릭 기능

#### FR-3.1: 부하 테스트 환경
- k6 또는 vegeta 기반 부하 테스트 스크립트 포함
- 주문 생성 API 대상 대량 동시 요청 시뮬레이션
- 결과 리포트: RPS, latency (p50/p95/p99), 에러율

#### FR-3.2: 성능 시연 시나리오
- "초당 N만 주문 처리" 데모 가능
- 실시간 부하 테스트 결과 시각화
- 단일 인스턴스 성능 한계 측정

#### FR-3.3: 실시간 메트릭 대시보드 (관리자 화면)
- **실시간 주문량 그래프**: 초당/분당 주문 수 라인 차트 (부하 테스트 시 그래프가 치솟는 장면 연출)
- **오늘 누적 매출 카운터**: 실시간으로 숫자가 올라가는 애니메이션
- **오늘 누적 주문 수 카운터**: 실시간 카운트업
- **SSE 기반 실시간 업데이트**: 주문 모니터링과 동일한 SSE 인프라 활용
- **시각적 임팩트**: 부하 테스트 중 대시보드를 띄워놓으면 그래프/숫자가 폭발적으로 변하는 것을 눈으로 확인

---

## Non-Functional Requirements (Minimal)

| 항목 | 요구사항 |
|------|----------|
| **Performance** | 주문 API p99 < 50ms (단일 인스턴스, 부하 테스트 시연용) |
| **Scalability** | 단일 인스턴스 기준 최대 처리량 측정 및 시연 |
| **Availability** | N/A (워크샵 데모) |
| **Security** | 기본 JWT 인증만. 프로덕션 보안 패턴 생략 |
| **Testing** | 부하 테스트 스크립트만. 단위/통합 테스트 최소화 |
| **Deployment** | Docker Compose로 로컬 전체 스택 실행 |

---

## Excluded (구현하지 않음)

요구사항 constraints.md 기반 + 프로젝트 맥락 판단:
- 결제 처리, PG 연동, 영수증
- OAuth/SNS 로그인, 2FA
- 이미지 업로드/리사이징
- 푸시/SMS/이메일 알림
- 주방 전달, 재고 관리
- 외부 플랫폼 연동 (배달, POS)
- 다국어, 예약, 리뷰 시스템
- 복잡한 매출 리포트 (기간별 분석, 엑셀 다운로드 등 — 단, 실시간 카운터/그래프는 포함)

---

## Architecture Overview (High-Level)

```
+------------------+     +------------------+     +------------------+
|   Customer UI    |     |    Admin UI      |     |   Load Tester    |
|  (React + Vite)  |     |  (React + Vite)  |     |   (k6/vegeta)   |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                        |
         |                         | SSE (실시간 주문 +      |
         |                         |  메트릭 그래프)         |
         +------------+------------+------------------------+
                      |
                      v
         +---------------------------+
         |      Go + Gin API Server  |
         |  (REST + SSE endpoints)   |
         |  - 주문 API               |
         |  - 메트릭 수집/스트리밍    |
         +------------+--------------+
                      |
                      v
         +---------------------------+
         |     PostgreSQL (Docker)   |
         +---------------------------+
```

**데모 시연 구성:**
```
+-------------------------------------------+
|          워크샵 시연 화면 구성              |
+-------------------------------------------+
|                                           |
|  [화면 1] 관리자 대시보드                  |
|    - 실시간 주문 그리드                    |
|    - 실시간 주문량 그래프 (라인차트)       |
|    - 누적 매출/주문 카운터                 |
|                                           |
|  [화면 2] 부하 테스트 터미널               |
|    - k6/vegeta 실행 중                    |
|    - RPS, latency 실시간 출력             |
|                                           |
|  [화면 3] 고객 주문 화면 (선택)            |
|    - 실제 주문 플로우 시연                 |
|                                           |
+-------------------------------------------+
```

---

## Data Model (Conceptual)

- **Table**: id, table_number, password_hash, session_id, session_started_at
- **Menu**: id, name, price, description, category, image_url, display_order
- **Category**: id, name, display_order
- **Order**: id, table_id, session_id, status, total_amount, created_at
- **OrderItem**: id, order_id, menu_id, menu_name, quantity, unit_price
- **OrderHistory**: id, table_id, session_id, completed_at (세션 종료 시 이동)
- **Admin**: id, username, password_hash

---

## Extension Configuration

| Extension | Enabled | Decided At |
|-----------|---------|------------|
| Security Baseline | No | Requirements Analysis |
| Property-Based Testing | No | Requirements Analysis |
