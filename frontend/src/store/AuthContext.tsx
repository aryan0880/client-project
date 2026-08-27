import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthState, LoginCredentials, User } from '../types';
import { authService } from '../services/authService';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadPersistedAuth(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersistedAuth();

  const [state, setState] = useState<AuthState>({
    user: persisted.user,
    token: persisted.token,
    isAuthenticated: !!persisted.token && !!persisted.user,
    isLoading: false,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { token, user } = await authService.login(credentials);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setState({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
