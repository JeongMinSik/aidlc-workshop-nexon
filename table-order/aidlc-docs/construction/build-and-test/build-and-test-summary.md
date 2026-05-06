# Build and Test Summary

## System Overview

| Component | Technology | Port | Status |
|-----------|-----------|------|--------|
| API Server | Go + Gin | 8080 | Docker |
| Customer UI | React + Vite | 3000 | Docker (nginx) |
| Admin UI | React + Vite + Recharts | 3001 | Docker (nginx) |
| Database | PostgreSQL 16 | 5432 | Docker |
| Load Tester | k6 | - | Host |

## One-Command Start

```bash
cd table-order && docker-compose up --build
```

## Test Checklist

### Functional Tests (수동)
- [ ] Admin login (admin/admin123)
- [ ] Table login (table 1, password 1234)
- [ ] Menu display with categories
- [ ] Add to cart + quantity change
- [ ] Create order → success screen
- [ ] Order appears in admin dashboard (real-time)
- [ ] Order status change (pending → preparing → completed)
- [ ] Table complete (이용 완료)

### Performance Tests (k6)
- [ ] Gradual load test: `k6 run loadtest/k6-order-test.js`
- [ ] Spike test: `k6 run loadtest/k6-spike-test.js`
- [ ] Admin dashboard shows real-time metrics during load test
- [ ] Orders/sec graph responds within 1-2 seconds

### Demo Readiness
- [ ] Docker Compose starts without errors
- [ ] All 3 UIs accessible (3000, 3001, 8080/health)
- [ ] SSE connection stable (no disconnects)
- [ ] Load test produces impressive numbers
- [ ] Admin dashboard visually responds to load

## Known Limitations (Workshop Demo)

- Seed data의 테이블 비밀번호 해시가 placeholder (실제 동작 시 재생성 필요)
- go.sum 파일이 placeholder (첫 빌드 시 `go mod tidy` 필요)
- package-lock.json 미포함 (첫 빌드 시 `npm install`로 생성)
- 보안: JWT secret이 하드코딩 (데모용)
- 세션 종료 후 대량 데이터 이동 시 지연 가능 (부하테스트 후)

## First-Time Setup

Docker Compose 첫 실행 전에 필요한 작업:

```bash
cd table-order/backend
go mod tidy  # go.sum 생성

cd ../frontend-customer
npm install  # package-lock.json + node_modules 생성

cd ../frontend-admin
npm install  # package-lock.json + node_modules 생성

cd ..
docker-compose up --build
```
