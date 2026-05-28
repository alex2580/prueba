import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatFecha(dateStr: string, fmt = "d 'de' MMMM 'de' yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatFechaCorta(dateStr: string): string {
  return formatFecha(dateStr, 'dd-MM-yyyy');
}

export function diasEntre(desde: string, hasta: string): number {
  return differenceInDays(parseISO(hasta), parseISO(desde)) + 1;
}

export function mesesEntre(desde: string, hasta: string): number {
  const d = parseISO(desde);
  const h = parseISO(hasta);
  return (h.getFullYear() * 12 + h.getMonth()) - (d.getFullYear() * 12 + d.getMonth()) + 1;
}

export function calcularPrecio(
  desde: string,
  hasta: string,
  precioDia: number,
  precioMes: number
): number {
  const dias = diasEntre(desde, hasta);
  if (dias >= 28) {
    return Math.ceil(dias / 30) * precioMes;
  }
  return dias * precioDia;
}

export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKm(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

export function initials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export const COMISION_TMC = 0.15; // 15% — actualizar también en emailService.js si cambia

export function netoOferente(bruto: number): number {
  return Math.round(bruto * (1 - COMISION_TMC));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Distancia haversine entre dos coordenadas (en metros).
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
