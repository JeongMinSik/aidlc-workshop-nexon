# Component Dependencies

## Dependency Matrix

| Component | Depends On | Communication |
|-----------|-----------|---------------|
| Customer Frontend | API Server | HTTP REST |
| Admin Frontend | API Server | HTTP REST + SSE |
| API Server | PostgreSQL | SQL (pgx driver) |
| Load Tester (k6) | API Server | HTTP REST |

## Internal Dependencies (API Server)

```
Handlers (Gin)
  ├── AuthHandler → AuthService → AdminRepo, TableRepo
  ├── MenuHandler → MenuService → MenuRepo
  ├── OrderHandler → OrderService → OrderRepo, EventBroker, MetricsCollector
  ├── TableHandler → TableService → TableRepo, OrderRepo, EventBroker
  └── SSEHandler → EventBroker, MetricsCollector

Services
  ├── AuthService → AdminRepo, TableRepo (DB 조회)
  ├── MenuService → MenuRepo (DB CRUD)
  ├── OrderService → OrderRepo (DB), EventBroker (이벤트), MetricsCollector (메트릭)
  ├── TableService → TableRepo (DB), OrderRepo (이력 이동), EventBroker (알림)
  ├── MetricsCollector → (독립, 인메모리)
  └── EventBroker → (독립, 인메모리 채널)

Repositories
  ├── AdminRepo → PostgreSQL
  ├── MenuRepo → PostgreSQL
  ├── OrderRepo → PostgreSQL
  └── TableRepo → PostgreSQL
```

## Data Flow

```
+----------------+          +----------------+
|  Customer UI   |---REST-->|                |
+----------------+          |                |
                            |   API Server   |---SQL--->[ PostgreSQL ]
+----------------+          |   (Go + Gin)   |
|   Admin UI     |<--SSE---|                |
|                |---REST-->|                |
+----------------+          +----------------+
                                    ^
+----------------+                  |
|  k6 Load Test  |---HTTP-----------+
+----------------+
```

## Docker Compose 네트워크

모든 컴포넌트는 단일 Docker network에서 통신:

| Service | Port | Description |
|---------|------|-------------|
| `api` | 8080 | Go API Server |
| `frontend-customer` | 3000 | Customer React App |
| `frontend-admin` | 3001 | Admin React App |
| `db` | 5432 | PostgreSQL |

Load Tester(k6)는 호스트에서 직접 실행하거나 별도 컨테이너로 실행.
