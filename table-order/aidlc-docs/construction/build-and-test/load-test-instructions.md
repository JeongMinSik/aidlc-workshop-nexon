# Load Test Instructions

## Prerequisites

k6 설치:
```bash
# Ubuntu/Debian (WSL)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6 -y

# macOS
brew install k6

# Docker (alternative)
docker run --rm -i --network host grafana/k6 run - < loadtest/k6-order-test.js
```

## Demo Scenario (워크샵 시연용)

### 화면 구성
```
+---------------------------+---------------------------+
|                           |                           |
|   [Browser 1]             |   [Terminal]              |
|   Admin Dashboard         |   k6 load test output     |
|   http://localhost:3001   |                           |
|                           |                           |
|   - 실시간 그래프          |   running (0m30s)         |
|   - 주문 카드 폭발         |   http_reqs: 45231       |
|   - 매출 카운터 급상승     |   http_req_duration:     |
|                           |     p(95)=12ms           |
|                           |                           |
+---------------------------+---------------------------+
```

### Step-by-Step

1. **시스템 시작**
   ```bash
   cd table-order
   docker-compose up --build -d
   ```

2. **관리자 대시보드 열기**
   - http://localhost:3001 접속
   - admin / admin123 로그인
   - 대시보드 화면 확인 (아직 조용한 상태)

3. **부하테스트 실행 (메인 이벤트)**
   ```bash
   cd loadtest
   k6 run k6-order-test.js
   ```

4. **시연 포인트 (관리자 대시보드 관찰)**
   - 📈 Orders/sec 그래프가 0에서 급상승
   - 🔢 Total Orders 카운터가 빠르게 증가
   - 💰 Revenue 카운터가 폭발적으로 증가
   - 🛒 주문 카드가 실시간으로 쏟아져 들어옴
   - ⚡ 모든 것이 2초 이내에 반영

5. **결과 발표**
   - k6 터미널 출력에서 핵심 수치 확인:
     - `http_reqs`: 총 처리된 요청 수
     - `http_req_duration p(95)`: 95% 요청의 응답 시간
     - `iterations`: 초당 처리된 주문 수

### Spike Test (추가 시연)
```bash
k6 run k6-spike-test.js
```
500명이 동시에 주문하는 시나리오. 더 극적인 그래프 변화.

## Expected Output Example

```
          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: k6-order-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 1000 max VUs, 2m10s max duration

     ✓ order created
     ✓ has order_number

     checks.....................: 99.87% ✓ 89234  ✗ 112
     http_req_duration..........: avg=8.2ms  min=1.1ms  p(50)=5.3ms  p(95)=18.7ms  p(99)=45.2ms
     http_reqs..................: 45231  452.31/s
     iteration_duration.........: avg=12.4ms
     order_duration.............: avg=6.8ms  p(95)=15.2ms
     order_success..............: 99.87%

running (1m40.0s), 0000/1000 VUs, 45231 complete iterations
```

## 시연 멘트 예시

> "이 시스템은 단일 인스턴스에서 초당 450건 이상의 주문을 처리하고 있습니다.
> p95 응답시간은 18ms로, 1억명의 사용자가 동시에 접속해도
> 수평 확장만으로 충분히 커버 가능한 성능입니다.
> 실시간 대시보드에서 보시는 것처럼, 모든 주문이 2초 이내에 반영됩니다."
