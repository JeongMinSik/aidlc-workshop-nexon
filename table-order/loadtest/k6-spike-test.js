import http from 'k6/http'
import { check } from 'k6'
import { Rate } from 'k6/metrics'

const orderSuccess = new Rate('order_success')

// Spike test - sudden burst of traffic
export const options = {
  scenarios: {
    spike: {
      executor: 'constant-vus',
      vus: 500,
      duration: '30s',
    },
  },
}

const BASE_URL = __ENV.API_URL || 'http://localhost:8080'

// Pre-cached tokens (login once, reuse)
const tokens = {}

function getToken(tableNumber) {
  if (tokens[tableNumber]) return tokens[tableNumber]

  const res = http.post(`${BASE_URL}/api/table/login`, JSON.stringify({
    table_number: tableNumber,
    password: '1234',
  }), { headers: { 'Content-Type': 'application/json' } })

  if (res.status === 200) {
    tokens[tableNumber] = JSON.parse(res.body).token
    return tokens[tableNumber]
  }
  return null
}

export default function () {
  const tableNumber = Math.floor(Math.random() * 5) + 1
  const token = getToken(tableNumber)

  if (!token) {
    orderSuccess.add(false)
    return
  }

  const items = [
    { menu_id: Math.floor(Math.random() * 12) + 1, quantity: 1 },
  ]

  const res = http.post(`${BASE_URL}/api/orders`, JSON.stringify({ items }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  orderSuccess.add(res.status === 201)
  check(res, { 'status 201': (r) => r.status === 201 })
}
