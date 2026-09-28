import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { SessionContext, type AuthUser, type SessionStatus } from '@/hooks/use-session';

interface SessionProviderProps {
  children: ReactNode;
}

function parseJwt(token: string): { sub?: string; exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getInitialSession(): { user: AuthUser | null; status: SessionStatus } {
  if (typeof window === 'undefined') {
    return { user: null, status: 'loading' };
  }
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    return { user: null, status: 'anonymous' };
  }

  const payload = parseJwt(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user');
    return { user: null, status: 'anonymous' };
  }

  const storedUser = localStorage.getItem('jwt_user');
  let authUser: AuthUser = {
    id: payload.sub ?? '1',
    name: 'Administrator',
    role: 'admin',
  };

  if (storedUser) {
    try {
      authUser = JSON.parse(storedUser);
    } catch {
      // use default
    }
  }

  return { user: authUser, status: 'authenticated' };
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<{ user: AuthUser | null; status: SessionStatus }>(
    getInitialSession,
  );
  const { user, status } = session;

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_user');
      setSession({ user: null, status: 'anonymous' });
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const markAuthenticated = useCallback((authenticatedUser: AuthUser, token?: string) => {
    if (token) {
      localStorage.setItem('jwt_token', token);
    }
    localStorage.setItem('jwt_user', JSON.stringify(authenticatedUser));
    setSession({ user: authenticatedUser, status: 'authenticated' });
  }, []);

  const markAnonymous = useCallback(() => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user');
    setSession({ user: null, status: 'anonymous' });
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      role: user?.role ?? null,
      markAuthenticated,
      markAnonymous,
    }),
    [status, user, markAuthenticated, markAnonymous],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
