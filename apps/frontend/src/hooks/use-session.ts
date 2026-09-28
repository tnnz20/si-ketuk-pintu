import { createContext, useContext } from 'react';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin';
}

export interface SessionContextValue {
  status: SessionStatus;
  user: AuthUser | null;
  role: 'admin' | null;
  markAuthenticated: (user: AuthUser, token?: string) => void;
  markAnonymous: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
