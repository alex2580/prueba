// ============================================================
//  TodasMisCosas.com — TypeScript Types
// ============================================================

export type UsuarioTipo = 'oferente' | 'demandante' | 'admin';

export interface Usuario {
  id: string;
  supabase_id?: string;
  nombre: string;
  email: string;
  tel?: string;
  dni?: string;
  tipo: UsuarioTipo;
  avatar_url?: string;
  verificado: boolean;
  activo?: boolean;
  created_at?: string;
  // Profile address
  direccion?: string;
  pais?: string;
  lat?: number;
  lng?: number;
  cbu_alias?: string;
}

export interface PerfilPublico {
  id: string;
  nombre: string;
  tipo: UsuarioTipo;
  verificado: boolean;
  avatar_url?: string;
  created_at: string;
  espacios_count: number;
  rating_promedio: number | null;
  reviews_count: number;
}

export type EspacioTipo = 'exclusivo' | 'compartido';

export interface Espacio {
  id: string;
  nombre: string;
  direccion: string;
  barrio: string;
  m2?: number;
  tipo: EspacioTipo;
  precio_dia: number;
  precio_mes: number;
  descripcion?: string;
  moneda?: string;
  oferente_id: string;
  oferente_nombre?: string;
  oferente_email?: string;
  oferente_tel?: string;
  lat: number;
  lng: number;
  disponible: boolean;
  rating: number;
  reviews_count: number;
  reservas_mes: number;
  badge?: string | null;
  imgs: string[];
  img_principal?: string;
  reviews_data?: Review[];
  activo?: boolean;
  inactiva_auto?: boolean;
  cupo_disponible?: boolean;
  created_at?: string;
  fecha_vencimiento?: string | null;
  vencida?: number;
  aviso_vencimiento_enviado?: number;
  // Panel stats
  total_reservas?: number;
  ingresos_total?: number;
  // Seguridad (checklist del oferente)
  seguridad?: Record<string, boolean>;
}

export interface EspacioFormData {
  nombre: string;
  direccion: string;
  barrio: string;
  m2?: number;
  tipo: EspacioTipo;
  precio_dia: number;
  precio_mes: number;
  descripcion: string;
  lat: number;
  lng: number;
  moneda?: string;
  categoria?: string;
  disponibilidad?: { dias?: string[]; meses?: string[] };
  seguridad?: Record<string, boolean>;
}

export const MONEDAS = [
  { value: 'ARS', label: 'Pesos argentinos',        simbolo: '$',    flag: '🇦🇷' },
  { value: 'USD', label: 'Dólares (USD)',            simbolo: 'US$', flag: '🇺🇸' },
  { value: 'EUR', label: 'Euros',                   simbolo: '€',   flag: '🇪🇺' },
  { value: 'BRL', label: 'Reales brasileños',       simbolo: 'R$',  flag: '🇧🇷' },
  { value: 'MXN', label: 'Pesos mexicanos',         simbolo: 'MX$', flag: '🇲🇽' },
  { value: 'UYU', label: 'Pesos uruguayos',         simbolo: '$U',  flag: '🇺🇾' },
  { value: 'CLP', label: 'Pesos chilenos',          simbolo: 'CL$', flag: '🇨🇱' },
  { value: 'COP', label: 'Pesos colombianos',       simbolo: 'COL$',flag: '🇨🇴' },
  { value: 'PEN', label: 'Soles peruanos',          simbolo: 'S/',  flag: '🇵🇪' },
  { value: 'BOB', label: 'Bolivianos',              simbolo: 'Bs',  flag: '🇧🇴' },
  { value: 'PYG', label: 'Guaraníes paraguayos',    simbolo: '₲',   flag: '🇵🇾' },
  { value: 'VES', label: 'Bolívares venezolanos',   simbolo: 'Bs.S',flag: '🇻🇪' },
  { value: 'DOP', label: 'Pesos dominicanos',       simbolo: 'RD$', flag: '🇩🇴' },
  { value: 'CRC', label: 'Colones costarricenses',  simbolo: '₡',   flag: '🇨🇷' },
  { value: 'GTQ', label: 'Quetzales guatemaltecos', simbolo: 'Q',   flag: '🇬🇹' },
  { value: 'HNL', label: 'Lempiras hondureños',     simbolo: 'L',   flag: '🇭🇳' },
  { value: 'NIO', label: 'Córdobas nicaragüenses',  simbolo: 'C$',  flag: '🇳🇮' },
  { value: 'PAB', label: 'Balboas panameños',        simbolo: 'B/.',  flag: '🇵🇦' },
  { value: 'CUP', label: 'Pesos cubanos',           simbolo: '$MN', flag: '🇨🇺' },
] as const;

export function getMonedaSimbolo(moneda?: string): string {
  return MONEDAS.find(m => m.value === moneda)?.simbolo ?? '$';
}

export type ReservaEstado = 'pendiente' | 'confirmada' | 'pagada' | 'cancelada' | 'finalizada';

export interface Reserva {
  id: string;
  espacio_id: string;
  usuario_id: string;
  fecha_desde: string;
  fecha_hasta: string;
  precio_total: number;
  estado: ReservaEstado;
  mp_preference_id?: string;
  mp_payment_id?: string;
  mp_status?: string;
  notas?: string;
  pin_acceso?: string;
  espacio_seguridad?: Record<string, boolean>;
  created_at: string;
  updated_at?: string;
  // Joined
  espacio_nombre?: string;
  espacio_barrio?: string;
  lat?: number;
  lng?: number;
  oferente_id?: string;
  usuario_nombre?: string;
  usuario_email?: string;
  usuario_tel?: string;
  servicios?: ServicioAdicional[];
  // Escrow
  escrow_liberado?: number;
  escrow_liberado_at?: string | null;
  escrow_neto_oferente?: number | null;
}

export interface Review {
  id: string;
  espacio_id?: string;
  autor_id: string;
  autor_nombre: string;
  autor_avatar?: string;
  rating: number;
  texto: string;
  util_count: number;
  created_at: string;
}

export type ServicioTipo = 'seguro' | 'embalaje' | 'transporte' | 'limpieza';

export interface ServicioAdicional {
  id: string;
  reserva_id: string;
  tipo: ServicioTipo;
  precio: number;
  estado: 'activo' | 'cancelado';
  created_at: string;
}

export interface Conversacion {
  id: string;
  espacio_id: string;
  demandante_id: string;
  oferente_id: string;
  ultimo_msg?: string;
  ultimo_msg_at?: string;
  created_at: string;
  // Joined
  espacio_nombre?: string;
  barrio?: string;
  espacio_img?: string;
  demandante_nombre?: string;
  oferente_nombre?: string;
  no_leidos?: number;
}

export interface Mensaje {
  id: string;
  conversacion_id: string;
  autor_id: string;
  autor_nombre?: string;
  texto: string;
  leido: boolean;
  created_at: string;
}

export interface MPPreferenciaResponse {
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface FiltrosEspacios {
  barrio?: string;
  tipo?: EspacioTipo | '';
  precio_max?: number;
  precio_min?: number;
  disponible?: boolean;
  q?: string;
  periodo?: 'dia' | 'mes' | '';
  con_seguridad?: boolean;
  pais?: string;
  rating_min?: number;
  seguridad_min?: number;
  con_cupo?: boolean;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

// Barrios disponibles en la app
export const BARRIOS = [
  'Palermo', 'Belgrano', 'Recoleta', 'San Telmo', 'Caballito',
  'Villa Crespo', 'Almagro', 'Flores', 'Floresta', 'Devoto',
  'Núñez', 'Coghlan', 'Saavedra', 'Agronomía', 'Paternal',
  'Villa del Parque', 'Monte Castro', 'Villa Real',
  'Vicente López', 'San Isidro', 'Quilmes', 'Lanús',
  'Avellaneda', 'Lomas de Zamora',
] as const;

export type Barrio = typeof BARRIOS[number];

export const SERVICIOS_ADICIONALES: Record<ServicioTipo, { label: string; emoji: string; precio: number }> = {
  seguro:     { label: 'Seguro de contenido',    emoji: '🛡️', precio: 0 },
  embalaje:   { label: 'Kit de embalaje',        emoji: '📦', precio: 0 },
  transporte: { label: 'Servicio de transporte', emoji: '🚚', precio: 0 },
  limpieza:   { label: 'Limpieza del espacio',   emoji: '🧹', precio: 0 },
};
