# Build Instructions

## Prerequisites

- Docker & Docker Compose 설치
- Go 1.22+ (로컬 개발 시)
- Node.js 20+ (프론트엔드 로컬 개발 시)
- k6 (부하테스트 시)

## Quick Start (Docker Compose)

```bash
cd table-order

# 전체 스택 실행 (DB + API + Frontend x2)
docker-compose up --build

# 백그라운드 실행
docker-compose up --build -d
```

### 접속 URL
| Service | URL | Description |
|---------|-----|-------------|
| Customer UI | http://localhost:3000 | 고객 주문 화면 |
| Admin UI | http://localhost:3001 | 관리자 대시보드 |
| API Server | http://localhost:8080 | REST API + SSE |
| PostgreSQL | localhost:5432 | DB (tableorder/tableorder123) |

### 기본 계정
| Role | Credentials |
|------|-------------|
| Admin | username: `admin`, password: `admin123` |
| Table 1~5 | table_number: `1`~`5`, password: `1234` |

## Local Development (Without Docker)

### 1. Database
```bash
# PostgreSQL 실행 (Docker만 사용)
docker-compose up db -d

# 또는 로컬 PostgreSQL에 직접 마이그레이션
psql -U tableorder -d tableorder -f backend/migrations/001_init.sql
```

### 2. Backend
```bash
cd backend
go mod tidy
go run ./cmd/server
```

### 3. Frontend (Customer)
```bash
cd frontend-customer
npm install
npm run dev
```

### 4. Frontend (Admin)
```bash
cd frontend-admin
npm install
npm run dev
```

## Build Verification

```bash
# API health check
curl http://localhost:8080/health
# Expected: {"status":"ok"}

# Menu API
curl http://localhost:8080/api/menus
# Expected: {"categories":[...]}

# Admin login
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Expected: {"token":"...","expires_at":...}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| DB connection refused | `docker-compose up db` 먼저 실행, healthcheck 대기 |
| Port already in use | `docker-compose down` 후 재시작 |
| go.sum mismatch | `cd backend && go mod tidy` |
| npm install 실패 | `rm -rf node_modules package-lock.json && npm install` |
