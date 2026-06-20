'use client';

import { useState, useEffect, useCallback } from 'react';
import { reservasAPI } from '@/lib/api';
import type { Reserva } from '@/types';

export function useReservas(token: string | null, tipo: 'mias' | 'recibidas' = 'mias') {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = tipo === 'recibidas'
        ? await reservasAPI.recibidas(token)
        : await reservasAPI.listar(token);
      setReservas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }, [token, tipo]);

  useEffect(() => { cargar(); }, [cargar]);

  const cancelar = useCallback(async (id: string, motivo?: string) => {
    if (!token) return;
    await reservasAPI.cancelar(id, token, motivo);
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'cancelada' } : r));
  }, [token]);

  const ocultar = useCallback(async (id: string) => {
    if (!token) return;
    await reservasAPI.ocultar(id, token);
    setReservas(prev => prev.filter(r => r.id !== id));
  }, [token]);

  return { reservas, loading, error, recargar: cargar, cancelar, ocultar };
}
