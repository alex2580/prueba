'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuthState, type AuthPublic } from '@/hooks/useAuth';

const AuthContext = createContext<AuthPublic | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthPublic {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
