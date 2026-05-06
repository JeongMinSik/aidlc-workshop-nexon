# Application Design - 테이블오더 서비스

## Overview

워크샵 시연용 고성능 테이블오더 시스템. 단일 Go 바이너리 + React 프론트엔드 2개 + PostgreSQL로 구성.

### 🎯 Core Goals
1. **있어보이는 것** — 실시간 대시보드, 애니메이션, 모던 UI
2. **부하테스트 시연** — Go의 고성능을 숫자로 증명
3. **실시간 시각화** — SSE 기반 라이브 데이터 스트리밍

---

## Architecture

```
+------------------+     +------------------+     +------------------+
|   Customer UI    |     |    Admin UI      |     |   Load Tester    |
|  React + Vite    |     |  React + Vite    |     |      k6          |
|  :3000           |     |  :3001           |     |                  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                    |    ^                        |
         | REST               | REST|SSE                   | HTTP
         +--------+-----------+----+------------------------+
                  |
                  v
         +---------------------------+
         |    Go + Gin API Server    |
         |         :8080             |
         +---------------------------+
         | Handlers (Auth, Menu,     |
         |   Order, Table, SSE)      |
         +---------------------------+
         | Services (Auth, Menu,     |
         |   Order, Table, Metrics,  |
         |   EventBroker)            |
         +---------------------------+
         | Repositories (Admin,      |
         |   Menu, Order, Table)     |
         +------------+--------------+
                      |
                      v
         +---------------------------+
         |   PostgreSQL :5432        |
         +---------------------------+
```

---

## Tech Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | Go 1.22+ / Gin | 고성능, goroutine 동시성, 부하테스트 시연 |
| Frontend | React 18 / Vite / TypeScript | AI 생성 최적, 풍부한 UI 라이브러리 |
| Database | PostgreSQL 16 | 프로덕션급 인상, 부하테스트 적합 |
| ORM | pgx (raw SQL) + sqlc | Go 네이티브, 타입 안전, 최소 오버헤드 |
| Real-time | SSE (Server-Sent Events) | 단방향 실시간, 구현 단순 |
| Charts | Recharts (React) | 실시간 메트릭 그래프 |
| UI Library | shadcn/ui + Tailwind CSS | 모던하고 있어보이는 UI |
| Container | Docker Compose | 전체 스택 한 번에 실행 |
| Load Test | k6 | JavaScript 기반 시나리오, 시각적 결과 |

---

## Key Design Decisions

1. **단일 바이너리**: 마이크로서비스 분리 없음. 하루 개발에 불필요한 복잡도 제거.
2. **인메모리 메트릭**: MetricsCollector는 DB 없이 인메모리로 동작. 부하테스트 시 DB 병목 방지.
3. **EventBroker 패턴**: Go 채널 기반 pub/sub. SSE 클라이언트에 이벤트 분배.
4. **pgx + sqlc**: ORM 오버헤드 없이 타입 안전한 SQL. 성능 극대화.
5. **프론트엔드 분리**: Customer UI와 Admin UI를 별도 앱으로. 역할 명확, 독립 배포 가능.

---

## API Endpoints Summary

### Public (인증 불필요)
- `POST /api/table/login` — 테이블 로그인
- `GET /api/menus` — 메뉴 조회
- `GET /api/categories` — 카테고리 조회

### Customer (테이블 토큰 필요)
- `POST /api/orders` — 주문 생성
- `GET /api/orders` — 주문 내역 조회

### Admin (관리자 토큰 필요)
- `POST /api/admin/login` — 관리자 로그인
- `GET/POST/PUT/DELETE /api/admin/menus` — 메뉴 관리
- `GET/POST/PUT/DELETE /api/admin/categories` — 카테고리 관리
- `PUT /api/admin/orders/:id/status` — 주문 상태 변경
- `DELETE /api/admin/orders/:id` — 주문 삭제
- `GET/POST /api/admin/tables` — 테이블 관리
- `POST /api/admin/tables/:id/complete` — 이용 완료
- `GET /api/admin/tables/:id/history` — 과거 내역
- `GET /api/admin/events` — 실시간 주문 SSE
- `GET /api/admin/metrics/stream` — 실시간 메트릭 SSE

---

## Detailed Design References
- [Components](./components.md)
- [Component Methods](./component-methods.md)
- [Services](./services.md)
- [Component Dependencies](./component-dependency.md)
