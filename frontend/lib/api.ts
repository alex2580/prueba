import type {
  Espacio, EspacioFormData, Reserva, Review, Conversacion, Mensaje,
  MPPreferenciaResponse, FiltrosEspacios, Usuario,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ── Helpers ────────────────────────────────────────────────────

async function fetchAPI<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Espacios ────────────────────────────────────────────────────

export const espaciosAPI = {
  listar: (filtros?: FiltrosEspacios, token?: string) => {
    const params = new URLSearchParams();
    if (filtros?.barrio)     params.set('barrio', filtros.barrio);
    if (filtros?.tipo)       params.set('tipo', filtros.tipo);
    if (filtros?.precio_max) params.set('precio_max', String(filtros.precio_max));
    if (filtros?.precio_min) params.set('precio_min', String(filtros.precio_min));
    if (filtros?.disponible !== undefined) params.set('disponible', String(filtros.disponible));
    if (filtros?.q)          params.set('q', filtros.q);
    const qs = params.toString() ? `?${params}` : '';
    return fetchAPI<Espacio[]>(`/api/espacios${qs}`, {}, token);
  },

  obtener: (id: string, token?: string) =>
    fetchAPI<Espacio>(`/api/espacios/${id}`, {}, token),

  crear: (data: EspacioFormData, token: string) =>
    fetchAPI<Espacio>('/api/espacios', { method: 'POST', body: JSON.stringify(data) }, token),

  actualizar: (id: string, data: Partial<EspacioFormData> & { disponible?: boolean }, token: string) =>
    fetchAPI<Espacio>(`/api/espacios/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  eliminar: (id: string, token: string) =>
    fetchAPI<{ message: string }>(`/api/espacios/${id}`, { method: 'DELETE' }, token),

  subirFotos: async (espacioId: string, files: File[], token: string): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('fotos', f));
    const res = await fetch(`${API_URL}/api/espacios/${espacioId}/fotos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  misEspacios: (token: string) =>
    fetchAPI<Espacio[]>('/api/espacios/mis-espacios', {}, token),
};

// ── Reservas ────────────────────────────────────────────────────

export const reservasAPI = {
  listar: (token: string) =>
    fetchAPI<Reserva[]>('/api/reservas', {}, token),

  recibidas: (token: string) =>
    fetchAPI<Reserva[]>('/api/reservas/recibidas', {}, token),

  obtener: (id: string, token: string) =>
    fetchAPI<Reserva>(`/api/reservas/${id}`, {}, token),

  crear: (data: { espacio_id: string; fecha_desde: string; fecha_hasta: string; notas?: string }, token: string) =>
    fetchAPI<Reserva>('/api/reservas', { method: 'POST', body: JSON.stringify(data) }, token),

  cambiarEstado: (id: string, estado: string, token: string) =>
    fetchAPI<Reserva>(`/api/reservas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }, token),

  cancelar: (id: string, token: string) =>
    fetchAPI<{ message: string }>(`/api/reservas/${id}`, { method: 'DELETE' }, token),
};

// ── Reviews ────────────────────────────────────────────────────

export const reviewsAPI = {
  listar: (espacioId: string) =>
    fetchAPI<Review[]>(`/api/reviews?espacio_id=${espacioId}`),

  crear: (data: { espacio_id: string; rating: number; texto: string }, token: string) =>
    fetchAPI<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }, token),

  marcarUtil: (id: string, token: string) =>
    fetchAPI<{ message: string }>(`/api/reviews/${id}/util`, { method: 'POST' }, token),

  eliminar: (id: string, token: string) =>
    fetchAPI<{ message: string }>(`/api/reviews/${id}`, { method: 'DELETE' }, token),
};

// ── Pagos ────────────────────────────────────────────────────

export const pagosAPI = {
  crearPreferencia: (reservaId: string, token: string) =>
    fetchAPI<MPPreferenciaResponse>('/api/pagos/preferencia', {
      method: 'POST',
      body: JSON.stringify({ reserva_id: reservaId }),
    }, token),

  estado: (reservaId: string, token: string) =>
    fetchAPI<{ id: string; estado: string; mp_payment_id?: string; precio_total: number }>
      (`/api/pagos/estado/${reservaId}`, {}, token),
};

// ── Chat ────────────────────────────────────────────────────

export const chatAPI = {
  listarConversaciones: (token: string) =>
    fetchAPI<Conversacion[]>('/api/chat/conversaciones', {}, token),

  obtenerMensajes: (convId: string, token: string) =>
    fetchAPI<Mensaje[]>(`/api/chat/conversaciones/${convId}/mensajes`, {}, token),

  iniciarConversacion: (data: { espacio_id: string; mensaje?: string }, token: string) =>
    fetchAPI<Conversacion>('/api/chat/conversaciones', { method: 'POST', body: JSON.stringify(data) }, token),

  enviarMensaje: (convId: string, texto: string, token: string) =>
    fetchAPI<Mensaje>(`/api/chat/conversaciones/${convId}/mensajes`, {
      method: 'POST',
      body: JSON.stringify({ texto }),
    }, token),
};

// ── Admin ────────────────────────────────────────────────────

export const adminAPI = {
  notificarServicios: (data: {
    nombreDemandante: string;
    emailDemandante: string;
    telDemandante?: string;
    espacioNombre: string;
    servicios: string[];
    fechaDesde: string;
    fechaHasta: string;
  }) => fetchAPI<{ ok: boolean }>('/api/admin/notificar-servicios', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ── Usuarios ────────────────────────────────────────────────────

export const usuariosAPI = {
  me: (token: string) =>
    fetchAPI<Usuario>('/api/usuarios/me', {}, token),

  actualizar: (data: { nombre: string; tel?: string; direccion?: string; lat?: number; lng?: number }, token: string) =>
    fetchAPI<Usuario>('/api/usuarios/me', { method: 'PUT', body: JSON.stringify(data) }, token),

  sync: (data: { supabase_id: string; nombre: string; email: string; tipo?: string; tel?: string }) =>
    fetchAPI<Usuario>('/api/usuarios/sync', { method: 'POST', body: JSON.stringify(data) }),

  verPerfil: (id: string) =>
    fetchAPI<Usuario>(`/api/usuarios/${id}`),
};
