/**
 * Fotos de depósito/almacén de Unsplash para usar como fallback
 * cuando un espacio no tiene fotos propias.
 * La selección es determinística según el ID del espacio.
 */

const FOTOS_DEPOSITO = [
  'https://images.unsplash.com/photo-1586528922-1e05e0b5c13b?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1530518975071-ccac21b5eff0?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1615672968435-0c7f87e85082?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1562699264-9c5e8b7c0b38?w=800&q=80&fit=crop&auto=format',
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Una foto determinística para cards/miniaturas */
export function getFotoFallback(espacioId: string): string {
  return FOTOS_DEPOSITO[hashId(espacioId) % FOTOS_DEPOSITO.length];
}

/** Conjunto de fotos para galería (siempre el mismo conjunto para el mismo ID) */
export function getFotosFallback(espacioId: string, count = 4): string[] {
  const h = hashId(espacioId);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(FOTOS_DEPOSITO[(h + i) % FOTOS_DEPOSITO.length]);
  }
  return result;
}
