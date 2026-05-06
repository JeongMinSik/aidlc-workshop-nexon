const TOKEN_KEY = 'table_token'
const TABLE_INFO_KEY = 'table_info'

interface TableInfo {
  tableId: number
  tableNumber: number
  sessionId: string | null
}

export function saveToken(token: string, tableInfo: TableInfo) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TABLE_INFO_KEY, JSON.stringify(tableInfo))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getTableInfo(): TableInfo | null {
  const info = localStorage.getItem(TABLE_INFO_KEY)
  return info ? JSON.parse(info) : null
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TABLE_INFO_KEY)
}
