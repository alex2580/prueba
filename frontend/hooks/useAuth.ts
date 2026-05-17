'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signOut as sbSignOut, signUp, getToken } from '@/lib/supabase';
import { usuariosAPI } from '@/lib/api';
import type { Usuario } from '@/types';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  const loadUser = useCallback(async (token: string) => {
    try {
      const usuario = await usuariosAPI.me(token);
      setState(s => ({ ...s, user: usuario, token, loading: false, error: null }));
    } catch {
      setState(s => ({ ...s, user: null, token: null, loading: false }));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        loadUser(data.session.access_token);
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        loadUser(session.access_token);
      } else {
        setState({ user: null, token: null, loading: false, error: null });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { data, error } = await signIn(email, password);
    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return false;
    }
    if (data.session?.access_token) {
      await loadUser(data.session.access_token);
    }
    return true;
  }, [loadUser]);

  const register = useCallback(async (
    nombre: string,
    email: string,
    password: string,
    tipo: 'oferente' | 'demandante' = 'demandante',
    tel?: string
  ) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { data, error } = await signUp(email, password, { nombre, tipo });
    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return false;
    }

    if (data.user) {
      try {
        await usuariosAPI.sync({
          supabase_id: data.user.id,
          nombre,
          email,
          tipo,
          tel,
        });
      } catch (e) {
        console.warn('Sync error:', e);
      }
    }

    if (data.session?.access_token) {
      await loadUser(data.session.access_token);
    } else {
      setState(s => ({ ...s, loading: false }));
    }
    return true;
  }, [loadUser]);

  const logout = useCallback(async () => {
    await sbSignOut();
    setState({ user: null, token: null, loading: false, error: null });
  }, []);

  return {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isOferente: state.user?.tipo === 'oferente',
    isDemandante: state.user?.tipo === 'demandante',
    isAdmin: state.user?.tipo === 'admin',
    login,
    register,
    logout,
  };
}
