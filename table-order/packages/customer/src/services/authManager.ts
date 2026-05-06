import { TableAuth, TableSession } from '@/types';

const TOKEN_KEY = 'table_token';
const AUTH_KEY = 'table_auth';
const SESSION_KEY = 'table_session';

export const authManager = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getSession(): TableSession | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  setSession(session: TableSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.setToken(session.token);
  },

  removeSession(): void {
    localStorage.removeItem(SESSION_KEY);
    this.removeToken();
  },

  getSavedCredentials(): TableAuth | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveCredentials(auth: TableAuth): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  },

  removeCredentials(): void {
    localStorage.removeItem(AUTH_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
