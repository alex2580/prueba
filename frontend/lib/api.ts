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
    if (filtros?.q)             params.set('q', filtros.q);
    if (filtros?.periodo)       params.set('periodo', filtros.periodo);
    if (filtros?.con_seguridad) params.set('con_seguridad', 'true');
    if (filtros?.pais)         params.set('pais', filtros.pais);
    if (filtros?.rating_min)     params.set('rating_min', String(filtros.rating_min));
    if (filtros?.seguridad_min) params.set('seguridad_min', String(filtros.seguridad_min));
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
  listarConversacionesAdmin: (token: string, filtros?: { espacio_id?: string; demandante_id?: string; oferente_id?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.espacio_id)    params.set('espacio_id', filtros.espacio_id);
    if (filtros?.demandante_id) params.set('demandante_id', filtros.demandante_id);
    if (filtros?.oferente_id)   params.set('oferente_id', filtros.oferente_id);
    const qs = params.toString() ? `?${params}` : '';
    return fetchAPI<(Conversacion & { demandante_email?: string; oferente_email?: string; total_mensajes?: number })[]>(`/api/chat/admin/conversaciones${qs}`, {}, token);
  },

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

  actualizar: (data: { nombre: string; tel?: string; dni?: string; email?: string; direccion?: string; pais?: string; lat?: number; lng?: number; cbu_alias?: string }, token: string) =>
    fetchAPI<Usuario>('/api/usuarios/me', { method: 'PUT', body: JSON.stringify(data) }, token),

  subirAvatar: async (file: File, token: string): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('avatar', file);
    const res = await fetch(`${API_URL}/api/usuarios/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || 'Error al subir foto'); }
    return res.json();
  },

  solicitarCambioTel: (tel_nuevo: string, token: string) =>
    fetchAPI<{ ok: boolean; tel_hint: string }>('/api/usuarios/me/solicitar-cambio-tel', {
      method: 'POST', body: JSON.stringify({ tel_nuevo }),
    }, token),

  verificarCambioTel: (codigo: string, token: string) =>
    fetchAPI<{ ok: boolean; usuario: Usuario }>('/api/usuarios/me/verificar-cambio-tel', {
      method: 'POST', body: JSON.stringify({ codigo }),
    }, token),

  sync: (data: { supabase_id: string; nombre: string; email: string; tipo?: string; tel?: string }) =>
    fetchAPI<Usuario>('/api/usuarios/sync', { method: 'POST', body: JSON.stringify(data) }),

  verPerfil: (id: string) =>
    fetchAPI<Usuario>(`/api/usuarios/${id}`),
};

export const emailAPI = {
  mejorarPuntuacion: (data: { espacioNombre?: string; puntajeActual: number }, token: string) =>
    fetchAPI<{ message: string }>('/api/email/mejorar-puntuacion', {
      method: 'POST', body: JSON.stringify(data),
    }, token),
};

export const favoritosAPI = {
  listar:    (token: string) => fetchAPI<Espacio[]>('/api/favoritos', {}, token),
  listarIds: (token: string) => fetchAPI<string[]>('/api/favoritos/ids', {}, token),
  agregar:   (espacio_id: string, token: string) =>
    fetchAPI<{ ok: boolean }>('/api/favoritos', { method: 'POST', body: JSON.stringify({ espacio_id }) }, token),
  eliminar:  (espacio_id: string, token: string) =>
    fetchAPI<{ ok: boolean }>(`/api/favoritos/${espacio_id}`, { method: 'DELETE' }, token),
};
