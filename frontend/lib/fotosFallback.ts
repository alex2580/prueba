/**
 * Fotos de depósito/almacén para usar como fallback
 * cuando un espacio no tiene fotos propias.
 * La selección es determinística según el ID del espacio.
 * Usa picsum.photos con seeds fijos → siempre devuelve la misma imagen.
 */

const SEEDS = [
  'deposito1', 'deposito2', 'deposito3', 'deposito4', 'deposito5',
  'almacen1',  'almacen2',  'almacen3',  'almacen4',  'almacen5',
];

const FOTOS_DEPOSITO = SEEDS.map(
  seed => `https://picsum.photos/seed/${seed}/800/500`
);

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
