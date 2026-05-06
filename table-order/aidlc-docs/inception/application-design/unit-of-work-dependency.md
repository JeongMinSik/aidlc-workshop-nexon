# 테이블오더 서비스 - Unit of Work 의존성

## Unit 간 의존성 매트릭스

| Unit (사용자) | Unit 1 (Backend) | Unit 2 (Frontend) |
|---------------|:----------------:|:-----------------:|
| **Unit 1 (Backend)** | - | - |
| **Unit 2 (Frontend)** | ✅ (API 호출) | - |

> Unit 2 → Unit 1: Frontend가 Backend API를 호출 (HTTP REST + SSE)
> Unit 1은 Frontend에 의존하지 않음 (독립 개발/테스트 가능)

---

## 의존성 상세

### Unit 2 → Unit 1 의존성

| 의존 유형 | 설명 | 해결 방안 |
|-----------|------|----------|
| REST API | 모든 데이터 CRUD | API 계약 합의 → Mock API로 독립 개발 |
| SSE | 실시간 주문 이벤트 | Mock SSE 서버로 독립 개발 |
| 인증 토큰 | JWT 형식 | 토큰 형식 합의 → Mock 토큰 사용 |

---

## API 계약 (인터페이스 정의)

### 합의 필요 항목 (개발 시작 전)

| # | 항목 | 내용 |
|---|------|------|
| 1 | Base URL | `http://localhost:3000/api` |
| 2 | 인증 헤더 | `Authorization: Bearer <JWT>` |
| 3 | 응답 형식 | `{ success: boolean, data?: T, error?: { code, message } }` |
| 4 | 에러 코드 | HTTP 상태 코드 + 커스텀 에러 코드 |
| 5 | 페이지네이션 | `{ page, limit, total, items[] }` |
| 6 | SSE 이벤트 형식 | `event: <type>\ndata: <JSON>\n\n` |

### SSE 이벤트 타입

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `new_order` | `Order` 객체 | 신규 주문 생성 |
| `order_updated` | `Order` 객체 | 주문 상태 변경 |
| `order_deleted` | `{ orderId }` | 주문 삭제 |

---

## 병렬 개발 전략

### 독립 개발 가능 조건
```
Unit 1 (Backend)              Unit 2 (Frontend)
     |                              |
     |  API 계약 합의 (Day 1)       |
     |<---------------------------->|
     |                              |
     |  독립 개발 시작               |  Mock API로 독립 개발
     |  (Postman/curl 테스트)       |  (MSW 또는 json-server)
     |                              |
     |  API 완성                    |  UI 완성
     |<---------------------------->|
     |       통합 테스트             |
     |                              |
```

### Mock 전략

**Unit 2 (Frontend) Mock 방안:**
- 개발 초기: `json-server` 또는 MSW (Mock Service Worker) 사용
- API 계약에 맞는 Mock 데이터 준비
- SSE Mock: EventSource polyfill + 타이머 기반 이벤트 생성

**Unit 1 (Backend) 독립 테스트:**
- Postman/curl로 API 테스트
- 자동화 테스트 (Jest + supertest)
- DB 시드 데이터로 시나리오 테스트

---

## 통합 포인트

| # | 통합 항목 | 시점 | 검증 방법 |
|---|----------|------|----------|
| 1 | 인증 플로우 | Phase 2 완료 후 | 로그인 → 토큰 발급 → API 호출 |
| 2 | 메뉴 조회 | Phase 2 완료 후 | 메뉴 API → 고객 화면 표시 |
| 3 | 주문 생성 | Phase 2 완료 후 | 장바구니 → 주문 API → DB 저장 |
| 4 | SSE 실시간 | Phase 3 완료 후 | 주문 생성 → SSE → 관리자 대시보드 |
| 5 | 세션 관리 | Phase 3 완료 후 | 이용 완료 → 이력 이동 → 리셋 |

---

## 리스크 및 완화 방안

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| API 계약 변경 | 양쪽 수정 필요 | 초기에 계약 확정, 변경 시 즉시 공유 |
| Backend 지연 | Frontend 통합 지연 | Mock API로 UI 완성 가능 |
| Frontend 지연 | 통합 테스트 지연 | Backend는 Postman으로 독립 검증 |
| SSE 구현 복잡도 | 실시간 기능 지연 | 폴링 방식 fallback 준비 |
