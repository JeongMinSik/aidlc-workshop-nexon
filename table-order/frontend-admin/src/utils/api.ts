const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

export function saveAdminToken(token: string) {
  localStorage.setItem('admin_token', token)
}

export function clearAdminToken() {
  localStorage.removeItem('admin_token')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

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

export const adminApi = {
  login: (username: string, password: string) =>
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getTables: () => request('/admin/tables'),
  createTable: (tableNumber: number, password: string) =>
    request('/admin/tables', {
      method: 'POST',
      body: JSON.stringify({ table_number: tableNumber, password }),
    }),
  completeTable: (id: number) =>
    request(`/admin/tables/${id}/complete`, { method: 'POST' }),
  getTableHistory: (id: number, date?: string) =>
    request(`/admin/tables/${id}/history${date ? `?date=${date}` : ''}`),

  updateOrderStatus: (id: number, status: string) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  deleteOrder: (id: number) =>
    request(`/admin/orders/${id}`, { method: 'DELETE' }),

  getMenus: () => request('/menus'),
  createMenu: (data: any) =>
    request('/admin/menus', { method: 'POST', body: JSON.stringify(data) }),
  updateMenu: (id: number, data: any) =>
    request(`/admin/menus/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenu: (id: number) =>
    request(`/admin/menus/${id}`, { method: 'DELETE' }),

  getCategories: () => request('/categories'),
  createCategory: (data: any) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
}

export function createSSE(path: string): EventSource {
  const token = getToken()
  return new EventSource(`${API_BASE}${path}?token=${token}`)
}
