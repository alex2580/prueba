'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, signIn, signOut as sbSignOut, signUp } from '@/lib/supabase';
import { usuariosAPI } from '@/lib/api';
import type { Usuario } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface OtpCanales { email: boolean; sms: boolean; whatsapp: boolean; }

interface AuthState {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  otpPending: boolean;
  otpToken: string | null;
  otpRefreshToken: string | null;
  otpEmailHint: string;
  emailConfirmPending: boolean;
  emailConfirmEmail: string;
  otpCanales: OtpCanales;
}

const INITIAL: AuthState = {
  user: null, token: null, loading: true, error: null,
  otpPending: false, otpToken: null, otpRefreshToken: null, otpEmailHint: '', otpCanales: { email: true, sms: false, whatsapp: false },
  emailConfirmPending: false, emailConfirmEmail: '',
};

export function useAuth() {
  const [state, setState] = useState<AuthState>(INITIAL);
  // Ref para saber si el load fue disparado post-OTP (no auto-load)
  const otpFlowRef = useRef(false);

  const loadUser = useCallback(async (token: string) => {
    try {
      const usuario = await usuariosAPI.me(token);
      setState(s => ({
        ...s, user: usuario, token, loading: false, error: null,
        otpPending: false, otpToken: null,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de autenticación';
      // Si el backend devuelve cuenta bloqueada, mostrar mensaje claro
      if (msg.includes('suspendida') || msg.includes('bloqueada')) {
        setState(s => ({ ...s, loading: false, error: msg }));
      } else {
        setState(s => ({ ...s, user: null, token: null, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    const OTP_FLAG = 'tmc_otp_pending';

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token && !otpFlowRef.current) {
        if (localStorage.getItem(OTP_FLAG) === '1') {
          // Sesión existe pero OTP no fue completado — re-solicitar código
          const token = data.session.access_token;
          const refreshToken = data.session.refresh_token;
          otpFlowRef.current = true;
          fetch(`${API}/api/auth/solicitar-otp`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then(body => {
            setState(s => ({
              ...s, loading: false,
              otpPending: true, otpToken: token, otpRefreshToken: refreshToken || null,
              otpEmailHint: body.email_hint || '',
              otpCanales: body.canales || { email: true, sms: false, whatsapp: false },
            }));
          }).catch(() => {
            // Si falla re-solicitar, dejar que el usuario ingrese normalmente
            localStorage.removeItem(OTP_FLAG);
            otpFlowRef.current = false;
            loadUser(token);
          });
        } else {
          loadUser(data.session.access_token);
        }
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (otpFlowRef.current) return;
      if (session?.access_token) {
        loadUser(session.access_token);
      } else {
        setState({ ...INITIAL, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  // ── login: email + password → solicita OTP ────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    otpFlowRef.current = true; // bloquear auto-load durante el flujo OTP

    const { data, error } = await signIn(email, password);
    if (error) {
      otpFlowRef.current = false;
      setState(s => ({ ...s, loading: false, error: error.message }));
      return false;
    }

    const token = data.session?.access_token;
    const refreshToken = data.session?.refresh_token;
    if (!token) {
      otpFlowRef.current = false;
      setState(s => ({ ...s, loading: false, error: 'No se pudo obtener sesión' }));
      return false;
    }

    // Marcar OTP pendiente en localStorage para prevenir bypass por recarga
    localStorage.setItem('tmc_otp_pending', '1');

    // Solicitar OTP al backend
    try {
      const res = await fetch(`${API}/api/auth/solicitar-otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (!res.ok) {
        localStorage.removeItem('tmc_otp_pending');
        otpFlowRef.current = false;
        await sbSignOut();
        setState(s => ({ ...s, loading: false, error: body.error || 'Error al solicitar código' }));
        return false;
      }

      setState(s => ({
        ...s, loading: false,
        otpPending: true,
        otpToken: token,
        otpRefreshToken: refreshToken || null,
        otpEmailHint: body.email_hint || '',
        otpCanales: body.canales || { email: true, sms: false, whatsapp: false },
      }));
      return true;
    } catch {
      localStorage.removeItem('tmc_otp_pending');
      otpFlowRef.current = false;
      setState(s => ({ ...s, loading: false, error: 'Error de conexión al solicitar código' }));
      return false;
    }
  }, []);

  // ── verifyOTP: valida el código de 6 dígitos ──────────────────
  const verifyOTP = useCallback(async (codigo: string) => {
    const token        = state.otpToken;
    if (!token) return false;

    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const res = await fetch(`${API}/api/auth/verificar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ codigo }),
      });
      const body = await res.json();

      if (!res.ok) {
        setState(s => ({ ...s, loading: false, error: body.error || 'Código incorrecto' }));
        return false;
      }

      // OTP correcto → limpiar flag y cargar usuario
      localStorage.removeItem('tmc_otp_pending');
      otpFlowRef.current = false;
      await loadUser(token);
      return true;
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Error de conexión' }));
      return false;
    }
  }, [state.otpToken, state.otpRefreshToken, loadUser]);

  // ── reenviarOTP: genera un nuevo código ───────────────────────
  const reenviarOTP = useCallback(async () => {
    const token = state.otpToken;
    if (!token) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      await fetch(`${API}/api/auth/solicitar-otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setState(s => ({ ...s, loading: false, error: null }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [state.otpToken]);

  // ── register: alta + OTP ──────────────────────────────────────
  const register = useCallback(async (
    nombre: string,
    email: string,
    password: string,
    tipo: 'usuario' = 'usuario',
    tel?: string
  ) => {
    setState(s => ({ ...s, loading: true, error: null }));
    otpFlowRef.current = true;

    const emailRedirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/${window.location.pathname.split('/')[1] || 'es'}/auth/confirm`
      : undefined;

    const { data, error } = await signUp(email, password, { nombre, tipo }, emailRedirectTo);
    if (error) {
      otpFlowRef.current = false;
      setState(s => ({ ...s, loading: false, error: error.message }));
      return false;
    }

    if (data.user) {
      try {
        await usuariosAPI.sync({ supabase_id: data.user.id, nombre, email, tipo, tel });
      } catch (e) { console.warn('Sync error:', e); }
    }

    const token = data.session?.access_token;
    if (!token) {
      // Supabase tiene confirmación de email activa — solo mostrar aviso, sin OTP
      otpFlowRef.current = false;
      setState(s => ({ ...s, loading: false, emailConfirmPending: true, emailConfirmEmail: email }));
      return 'email-confirm' as const;
    }

    try {
      const res = await fetch(`${API}/api/auth/solicitar-otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      setState(s => ({
        ...s, loading: false,
        otpPending: true, otpToken: token,
        otpEmailHint: body.email_hint || '',
        otpCanales: body.canales || { email: true, sms: false, whatsapp: false },
      }));
      return true;
    } catch {
      otpFlowRef.current = false;
      setState(s => ({ ...s, loading: false }));
      return true;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (state.token) await loadUser(state.token);
  }, [state.token, loadUser]);

  const logout = useCallback(async () => {
    localStorage.removeItem('tmc_otp_pending');
    otpFlowRef.current = false;
    await sbSignOut();
    setState({ ...INITIAL, loading: false });
  }, []);

  return {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    otpPending: state.otpPending,
    otpEmailHint: state.otpEmailHint,
    otpCanales: state.otpCanales,
    emailConfirmPending: state.emailConfirmPending,
    emailConfirmEmail: state.emailConfirmEmail,
    isAuthenticated: !!state.user,
    isOferente: !!state.user && state.user.tipo !== 'admin',
    isDemandante: !!state.user && state.user.tipo !== 'admin',
    isAdmin: state.user?.tipo === 'admin',
    login,
    register,
    verifyOTP,
    reenviarOTP,
    logout,
    refreshUser,
  };
}
