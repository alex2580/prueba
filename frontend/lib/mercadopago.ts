'use client';

/**
 * Redirige al usuario a MercadoPago para completar el pago.
 */
export function redirectToMP(initPoint: string): void {
  window.location.href = initPoint;
}

/**
 * Parsea los query params de retorno de MercadoPago.
 * MP redirige a back_urls con: collection_id, collection_status, external_reference, etc.
 */
export function parseMPReturnParams(searchParams: URLSearchParams): {
  paymentId?: string;
  status?: string;
  externalRef?: string;
  merchantOrderId?: string;
} {
  return {
    paymentId:       searchParams.get('collection_id') ?? undefined,
    status:          searchParams.get('collection_status') ?? searchParams.get('estado') ?? undefined,
    externalRef:     searchParams.get('external_reference') ?? undefined,
    merchantOrderId: searchParams.get('merchant_order_id') ?? undefined,
  };
}

/**
 * Formatea un monto en pesos argentinos.
 */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}
