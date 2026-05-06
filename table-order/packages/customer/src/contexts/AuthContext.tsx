'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { TableSession, TableAuth } from '@/types';
import { apiClient } from '@/services/apiClient';
import { authManager } from '@/services/authManager';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: TableSession | null;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: TableSession }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  session: null,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { isAuthenticated: true, isLoading: false, session: action.payload, error: null };
    case 'AUTH_FAILURE':
      return { isAuthenticated: false, isLoading: false, session: null, error: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (auth: TableAuth) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initAuth = useCallback(async () => {
    const session = authManager.getSession();
    if (session) {
      const result = await apiClient.get<TableSession>('/auth/me');
      if (result.success && result.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: session });
        return;
      }
    }

    const credentials = authManager.getSavedCredentials();
    if (credentials) {
      const result = await apiClient.post<TableSession>('/auth/table/login', credentials);
      if (result.success && result.data) {
        authManager.setSession(result.data);
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data });
        return;
      }
    }

    dispatch({ type: 'AUTH_FAILURE', payload: '' });
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (auth: TableAuth): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    const result = await apiClient.post<TableSession>('/auth/table/login', auth);

    if (result.success && result.data) {
      authManager.saveCredentials(auth);
      authManager.setSession(result.data);
      dispatch({ type: 'AUTH_SUCCESS', payload: result.data });
      return true;
    }

    dispatch({ type: 'AUTH_FAILURE', payload: result.error?.message || '로그인에 실패했습니다.' });
    return false;
  };

  const logout = () => {
    authManager.removeSession();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
