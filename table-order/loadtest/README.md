# Load Testing

## Prerequisites

Install k6: https://k6.io/docs/get-started/installation/

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Running Tests

### 1. Gradual Load Test (Recommended for Demo)
Ramps up from 0 to 1000 virtual users over 100 seconds.

```bash
k6 run k6-order-test.js
```

### 2. Spike Test
500 concurrent users for 30 seconds straight.

```bash
k6 run k6-spike-test.js
```

### 3. Custom API URL
```bash
k6 run -e API_URL=http://localhost:8080 k6-order-test.js
```

## Demo Scenario

1. Open admin dashboard (http://localhost:3001) in one browser window
2. Open terminal in another window
3. Run the load test:
   ```bash
   k6 run k6-order-test.js
   ```
4. Watch the admin dashboard:
   - Orders/sec graph spikes up
   - Total orders counter rapidly increases
   - Revenue counter climbs
   - Order cards flood in with real-time updates

## Expected Results (Single Instance)

| Metric | Expected |
|--------|----------|
| RPS | 5,000 - 50,000+ |
| p50 latency | < 5ms |
| p95 latency | < 50ms |
| p99 latency | < 100ms |
| Error rate | < 1% |

*Results vary by hardware. Go + PostgreSQL on modern hardware easily handles 10k+ RPS.*
