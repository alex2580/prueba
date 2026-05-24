import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Obtiene el token JWT actual del usuario autenticado.
 */
export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Cierra sesión en Supabase.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Registra un nuevo usuario en Supabase Auth.
 */
export async function signUp(email: string, password: string, metadata?: Record<string, string>) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
}

/**
 * Inicia sesión con email y contraseña.
 */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Envía email de recuperación de contraseña.
 */
export async function resetPasswordForEmail(email: string, redirectTo: string) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

/**
 * Actualiza la contraseña del usuario autenticado (usado en la página de reset).
 */
export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

/**
 * Observa cambios de sesión. Devuelve la función de unsubscribe.
 */
export function onAuthStateChange(callback: (session: { access_token?: string; user?: { id: string; email?: string } } | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription.unsubscribe;
}
