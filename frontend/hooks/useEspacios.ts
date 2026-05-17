'use client';

import { useState, useEffect, useCallback } from 'react';
import { espaciosAPI } from '@/lib/api';
import type { Espacio, FiltrosEspacios } from '@/types';

export function useEspacios(filtrosIniciales?: FiltrosEspacios) {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosEspacios>(filtrosIniciales || {});

  const cargar = useCallback(async (f?: FiltrosEspacios) => {
    setLoading(true);
    setError(null);
    try {
      const data = await espaciosAPI.listar(f ?? filtros);
      setEspacios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar espacios');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
  }, []);

  const aplicarFiltros = useCallback((nuevosFiltros: FiltrosEspacios) => {
    const merged = { ...filtros, ...nuevosFiltros };
    setFiltros(merged);
    cargar(merged);
  }, [filtros, cargar]);

  const limpiarFiltros = useCallback(() => {
    setFiltros({});
    cargar({});
  }, [cargar]);

  return { espacios, loading, error, filtros, aplicarFiltros, limpiarFiltros, recargar: cargar };
}

export function useEspacio(id: string) {
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    espaciosAPI.obtener(id)
      .then(setEspacio)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { espacio, loading, error };
}
