import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const orderSuccess = new Rate('order_success')
const orderDuration = new Trend('order_duration')

// Test configuration
export const options = {
  scenarios: {
    // Ramp up load test
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },   // Ramp up to 50 users
        { duration: '30s', target: 200 },  // Ramp up to 200 users
        { duration: '30s', target: 500 },  // Ramp up to 500 users
        { duration: '20s', target: 1000 }, // Peak at 1000 users
        { duration: '10s', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    order_success: ['rate>0.95'],       // 95% success rate
  },
}

const BASE_URL = __ENV.API_URL || 'http://localhost:8080'

// Pre-login and get token for a random table
function getTableToken(tableNumber) {
  const loginRes = http.post(`${BASE_URL}/api/table/login`, JSON.stringify({
    table_number: tableNumber,
    password: '1234',
  }), { headers: { 'Content-Type': 'application/json' } })

  if (loginRes.status === 200) {
    return JSON.parse(loginRes.body).token
  }
  return null
}

// Get available menu IDs
let menuIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function () {
  // Random table (1-5)
  const tableNumber = Math.floor(Math.random() * 5) + 1
  const token = getTableToken(tableNumber)

  if (!token) {
    orderSuccess.add(false)
    return
  }

  // Create order with random items
  const numItems = Math.floor(Math.random() * 3) + 1
  const items = []
  for (let i = 0; i < numItems; i++) {
    items.push({
      menu_id: menuIds[Math.floor(Math.random() * menuIds.length)],
      quantity: Math.floor(Math.random() * 3) + 1,
    })
  }

  const startTime = Date.now()
  const orderRes = http.post(`${BASE_URL}/api/orders`, JSON.stringify({ items }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
  const duration = Date.now() - startTime

  const success = orderRes.status === 201
  orderSuccess.add(success)
  orderDuration.add(duration)

  check(orderRes, {
    'order created': (r) => r.status === 201,
    'has order_number': (r) => {
      try { return JSON.parse(r.body).order_number !== undefined } catch { return false }
    },
  })

  sleep(0.1) // Small pause between requests
}
