import { getToken } from './auth'

const API_BASE = '/api'

async function request(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Auth
  tableLogin: (tableNumber: number, password: string) =>
    request('/table/login', {
      method: 'POST',
      body: JSON.stringify({ table_number: tableNumber, password }),
    }),

  // Menus
  getMenus: () => request('/menus'),

  // Orders
  createOrder: (items: { menu_id: number; quantity: number }[]) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  getOrders: () => request('/orders'),
}
