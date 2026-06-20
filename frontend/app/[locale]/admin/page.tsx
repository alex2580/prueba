'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { formatFechaCorta, formatARS, COMISION_TMC } from '@/lib/utils';
import { chatAPI } from '@/lib/api';
import type { Conversacion } from '@/types';
import { TabMarketing } from '@/components/admin/TabMarketing';
import { TabEmailConfig } from '@/components/admin/TabEmailConfig';

// ── Types ──────────────────────────────────────────────────────

interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  fecha: string;
  leido: number;
  datos: Record<string, unknown> | null;
}

interface Consulta {
  id: string;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  tipo: 'consulta' | 'reclamo' | 'sugerencia';
  estado: 'pendiente' | 'respondida' | 'resuelta';
  respuesta: string | null;
  fecha: string;
}

interface Campana {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: number;
  color: string;
}

interface PublicacionAdmin {
  id: string;
  nombre: string;
  barrio: string;
  pais: string;
  categoria: string;
  tipo: string;
  precio_dia: number | null;
  precio_mes: number | null;
  moneda: string;
  disponible: number;
  activo: number;
  inactiva_auto: number;
  eliminado_por_oferente: number;
  eliminado_at: string | null;
  fecha_vencimiento: string | null;
  vencida: number;
  rating: number | null;
  reviews_count: number;
  reservas_mes: number;
  created_at: string;
  oferente_id: string;
  oferente_nombre: string;
  oferente_email: string;
}

// ── Helpers ────────────────────────────────────────────────────

function tipoIcon(tipo: string) {
  const map: Record<string, string> = {
    reserva: '📅',
    pago: '💳',
    usuario: '👤',
    espacio: '📦',
    sistema: '⚙️',
  };
  return map[tipo] ?? '🔔';
}

function consultaTipoLabel(tipo: string) {
  const map: Record<string, string> = { consulta: 'Consulta', reclamo: 'Reclamo', sugerencia: 'Sugerencia' };
  return map[tipo] ?? tipo;
}

function consultaTipoColor(tipo: string) {
  const map: Record<string, string> = {
    consulta: 'var(--blue)',
    reclamo: 'var(--red)',
    sugerencia: 'var(--mint)',
  };
  return map[tipo] ?? 'var(--text3)';
}

function estadoColor(estado: string) {
  const map: Record<string, string> = {
    pendiente: 'var(--amber)',
    respondida: 'var(--blue)',
    resuelta: 'var(--mint)',
  };
  return map[estado] ?? 'var(--text3)';
}

const PRESET_COLORS = ['#e8622a', '#10B981', '#82c4ff', '#F59E0B', '#6366F1'];
const CAMPANA_TIPOS = ['promocion', 'descuento', 'evento', 'comunicado'];

// ── Calendar helpers ───────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // 0=Sun, adjust so Monday=0
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function dateToStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function campanaOnDay(c: Campana, year: number, month: number, day: number): boolean {
  const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return d >= c.fecha_inicio && d <= c.fecha_fin;
}

// ── Sub-components ─────────────────────────────────────────────

function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: string; label: string; badge?: number }[];
  active: string;
  onSelect: (k: string) => void;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '.55rem',
      marginBottom: '1.75rem',
    }}>
      {tabs.map(t => {
        const isActive = active === t.key;
        const spaceIdx = t.label.indexOf(' ');
        const icon = spaceIdx > -1 ? t.label.slice(0, spaceIdx) : t.label;
        const text = spaceIdx > -1 ? t.label.slice(spaceIdx + 1) : '';

        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            style={{
              position: 'relative',
              padding: '.85rem .5rem .75rem',
              background: isActive ? 'rgba(232,98,42,.1)' : 'var(--surface)',
              border: `1.5px solid ${isActive ? 'var(--orange)' : 'var(--border)'}`,
              borderRadius: 'var(--r3)',
              color: isActive ? 'var(--orange)' : 'var(--text2)',
              fontFamily: 'Sora, sans-serif',
              fontWeight: isActive ? 700 : 500,
              fontSize: '.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '.38rem',
              transition: 'all .15s',
              textAlign: 'center',
              lineHeight: 1.25,
              minHeight: 72,
              boxShadow: isActive ? '0 0 0 3px rgba(232,98,42,.15)' : 'none',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{icon}</span>
            <span style={{ lineHeight: 1.25 }}>{text}</span>
            {!!t.badge && (
              <span style={{
                position: 'absolute',
                top: -7,
                right: -7,
                background: '#ef4444',
                color: '#fff',
                borderRadius: 99,
                fontSize: '.6rem',
                fontWeight: 800,
                fontFamily: 'Sora, sans-serif',
                minWidth: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2.5px solid var(--bg)',
                boxShadow: '0 2px 6px rgba(239,68,68,.5)',
                lineHeight: 1,
                zIndex: 1,
              }}>
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Tab: Notificaciones ────────────────────────────────────────

function TabNotificaciones({ token }: { token: string }) {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notificaciones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar notificaciones');
      setItems(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function marcarLeido(id: string) {
    await fetch(`/api/admin/notificaciones/${id}/leido`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(prev => prev.map(n => n.id === id ? { ...n, leido: 1 } : n));
  }

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando…</p>;
  if (error) return <p className="alert alert--error">{error}</p>;
  if (!items.length) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🔔</div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin notificaciones</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: '.75rem' }}>
      {items.map(n => (
        <div key={n.id} style={{
          background: n.leido ? 'var(--surface)' : 'var(--surface2)',
          border: `1px solid ${n.leido ? 'var(--border)' : 'var(--border2)'}`,
          borderRadius: 'var(--r2)',
          padding: '1rem 1.1rem',
          display: 'flex', alignItems: 'flex-start', gap: '.85rem',
          opacity: n.leido ? .65 : 1,
          transition: 'opacity .2s',
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: '.1rem' }}>{tipoIcon(n.tipo)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '.88rem', lineHeight: 1.5 }}>{n.mensaje}</div>
            <div style={{ fontSize: '.74rem', color: 'var(--text3)', marginTop: '.3rem' }}>
              {formatFechaCorta(n.fecha)}
            </div>
          </div>
          {!n.leido && (
            <button
              className="btn-ghost"
              style={{ fontSize: '.76rem', flexShrink: 0 }}
              onClick={() => marcarLeido(n.id)}
            >
              ✓ Leído
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Movimientos Financieros ──────────────────────────────

interface Movimiento {
  id: string;
  reserva_id: string;
  tipo: 'pago' | 'liberacion' | 'comision' | 'cancelacion';
  descripcion: string;
  cuenta_debito: string;
  cuenta_credito: string;
  monto: number;
  moneda: string;
  creado_at: string;
  espacio_nombre: string | null;
  cliente_nombre: string | null;
  cliente_email: string | null;
  proveedor_nombre: string | null;
  reserva_estado: string | null;
  escrow_liberado: number | null;
  escrow_liberado_at: string | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
}

interface ResumenMovimientos {
  total_pagos: number;
  total_liberaciones: number;
  total_comisiones: number;
  total_cancelaciones: number;
  saldo_escrow: number;
}

function tipoMovColor(tipo: string): string {
  const m: Record<string, string> = {
    pago:        'var(--mint)',
    liberacion:  'var(--blue)',
    comision:    'var(--orange)',
    cancelacion: 'var(--red)',
  };
  return m[tipo] ?? 'var(--text3)';
}

function tipoMovLabel(tipo: string): string {
  const m: Record<string, string> = {
    pago:        '💳 Pago recibido',
    liberacion:  '✅ Liberación al proveedor',
    comision:    '💰 Comisión TMC',
    cancelacion: '↩️ Reintegro',
  };
  return m[tipo] ?? tipo;
}

function TabMovimientos({ token }: { token: string }) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [resumen, setResumen] = useState<ResumenMovimientos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'pago' | 'liberacion' | 'comision' | 'cancelacion'>('todos');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/movimientos', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setMovimientos(data.movimientos ?? []);
        setResumen(data.resumen ?? null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = filtro === 'todos' ? movimientos : movimientos.filter(m => m.tipo === filtro);

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando…</p>;
  if (error) return <p className="alert alert--error">{error}</p>;

  return (
    <>
      {/* Resumen */}
      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Pagos recibidos',     value: resumen.total_pagos,        color: 'var(--mint)' },
            { label: 'Liberado a proveedores', value: resumen.total_liberaciones, color: 'var(--blue)' },
            { label: 'Comisiones TMC',      value: resumen.total_comisiones,    color: 'var(--orange)' },
            { label: 'Reintegros',          value: resumen.total_cancelaciones, color: 'var(--red)' },
            { label: 'Saldo en garantía',   value: resumen.saldo_escrow,        color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '.9rem 1rem' }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: '.25rem' }}>{label}</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.05rem', color }}>{formatARS(value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['todos', 'pago', 'liberacion', 'comision', 'cancelacion'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '.3rem .85rem', borderRadius: '99px', cursor: 'pointer',
            border: `1px solid ${filtro === f ? 'var(--orange)' : 'var(--border)'}`,
            background: filtro === f ? 'rgba(232,98,42,.12)' : 'transparent',
            color: filtro === f ? 'var(--orange)' : 'var(--text2)',
            fontSize: '.78rem', fontWeight: 600, textTransform: 'capitalize',
          }}>
            {f === 'todos' ? 'Todos' : tipoMovLabel(f)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>📊</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin movimientos</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.65rem' }}>
          {filtered.map(m => (
            <div key={m.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '.85rem 1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: 6, borderRadius: 99, background: tipoMovColor(m.tipo), alignSelf: 'stretch', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.35rem' }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 700, color: tipoMovColor(m.tipo) }}>{tipoMovLabel(m.tipo)}</span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '.95rem', color: tipoMovColor(m.tipo), flexShrink: 0 }}>{formatARS(m.monto)}</span>
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: '.2rem' }}>
                  {m.espacio_nombre && <span>📦 {m.espacio_nombre} · </span>}
                  {m.cliente_nombre && <span>👤 {m.cliente_nombre}</span>}
                </div>
                {m.fecha_desde && (
                  <div style={{ fontSize: '.74rem', color: 'var(--text3)' }}>
                    📅 {m.fecha_desde?.slice(0, 10)} → {m.fecha_hasta?.slice(0, 10)}
                    {m.reserva_estado && <span style={{ marginLeft: '.5rem', fontWeight: 600 }}>· {m.reserva_estado}</span>}
                  </div>
                )}
                {m.tipo === 'pago' && !m.escrow_liberado && m.reserva_estado === 'pagada' && (
                  <div style={{ fontSize: '.72rem', color: '#f59e0b', fontWeight: 600, marginTop: '.2rem' }}>
                    🔒 En depósito de garantía — pendiente de confirmación de acceso
                  </div>
                )}
                {m.escrow_liberado === 1 && m.escrow_liberado_at && (
                  <div style={{ fontSize: '.72rem', color: 'var(--mint)', marginTop: '.2rem' }}>
                    ✅ Garantía liberada el {new Date(m.escrow_liberado_at).toLocaleDateString('es-AR')}
                  </div>
                )}
                <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: '.15rem' }}>
                  {new Date(m.creado_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Tab: Calendario Admin ──────────────────────────────────────

function CalendarioGrid({ reservas }: { reservas: any[] }) {
  const [mesBase, setMesBase] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  const year = mesBase.getFullYear();
  const month = mesBase.getMonth();
  const primerDia = new Date(year, month, 1).getDay(); // 0=dom
  const diasMes = new Date(year, month + 1, 0).getDate();
  const offset = (primerDia + 6) % 7; // lunes primero

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diasSem = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

  const estadoColor: Record<string, string> = {
    pagada: 'var(--mint)', confirmada: 'var(--orange)', pendiente: '#94a3b8',
    finalizada: 'var(--blue)', cancelada: 'var(--red)',
  };

  function reservasDelDia(dia: number) {
    const fecha = `${year}-${String(month+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    return reservas.filter(r => {
      const desde = r.fecha_desde?.slice(0,10);
      const hasta = r.fecha_hasta?.slice(0,10);
      return desde && hasta && fecha >= desde && fecha <= hasta;
    });
  }

  const [selDia, setSelDia] = useState<number | null>(null);
  const selReservas = selDia ? reservasDelDia(selDia) : [];

  return (
    <div>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn-ghost" onClick={() => setMesBase(new Date(year, month-1, 1))}>‹</button>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', flex: 1, textAlign: 'center' }}>
          {meses[month]} {year}
        </span>
        <button className="btn-ghost" onClick={() => setMesBase(new Date(year, month+1, 1))}>›</button>
      </div>

      {/* Grid header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
        {diasSem.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '.7rem', fontWeight: 700, color: 'var(--text3)', padding: '.3rem 0' }}>{d}</div>
        ))}
      </div>

      {/* Grid days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: diasMes }, (_, i) => i + 1).map(dia => {
          const rDia = reservasDelDia(dia);
          const hoy = new Date();
          const esHoy = dia === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();
          return (
            <div key={dia} onClick={() => setSelDia(selDia === dia ? null : dia)}
              style={{ background: selDia === dia ? 'rgba(232,98,42,.12)' : esHoy ? 'rgba(232,98,42,.06)' : 'var(--surface)', border: `1px solid ${esHoy ? 'var(--orange)' : 'var(--border)'}`, borderRadius: 'var(--r1)', padding: '.35rem .2rem', minHeight: 48, cursor: rDia.length > 0 ? 'pointer' : 'default', position: 'relative' }}>
              <div style={{ textAlign: 'center', fontSize: '.78rem', fontWeight: esHoy ? 800 : 400, color: esHoy ? 'var(--orange)' : 'var(--text)' }}>{dia}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', marginTop: 2 }}>
                {rDia.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: estadoColor[r.estado] ?? 'var(--text3)' }} title={r.espacio_nombre ?? ''} />
                ))}
                {rDia.length > 3 && <div style={{ fontSize: '.55rem', color: 'var(--text3)' }}>+{rDia.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalle día seleccionado */}
      {selDia && (
        <div style={{ marginTop: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.75rem' }}>
            Reservas activas el {selDia} de {meses[month]}
          </div>
          {selReservas.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '.85rem' }}>Sin reservas este día.</p>
          ) : (
            <div style={{ display: 'grid', gap: '.5rem' }}>
              {selReservas.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem .75rem', background: 'var(--surface2)', borderRadius: 'var(--r1)', borderLeft: `3px solid ${estadoColor[r.estado] ?? 'var(--text3)'}` }}>
                  <div>
                    <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{r.espacio_nombre ?? r.nombre ?? 'Espacio'}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--text3)' }}>
                      {r.demandante_nombre ?? r.usuario_nombre ?? ''} · {r.fecha_desde?.slice(0,10)} → {r.fecha_hasta?.slice(0,10)}
                    </div>
                  </div>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: estadoColor[r.estado], background: `${estadoColor[r.estado]}22`, borderRadius: 99, padding: '.15rem .5rem' }}>{r.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabAuditoriaPerfil({ token }: { token: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetch('/api/admin/auditoria-perfil', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Error al cargar historial'); setLoading(false); });
  }, [token]);

  const CAMPOS: Record<string, string> = {
    nombre: '👤 Nombre',
    telefono: '📱 Teléfono',
    email: '✉️ Email',
    direccion: '📍 Dirección',
    dni: '🪪 DNI',
    pais: '🌎 País',
    cbu_alias: '🏦 CBU/Alias',
  };

  const filtrados = rows.filter(r => {
    const q = busqueda.toLowerCase();
    return !q || r.usuario_nombre?.toLowerCase().includes(q) || r.usuario_email?.toLowerCase().includes(q) || r.campo?.toLowerCase().includes(q);
  });

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem' }}>📋 Historial de cambios de perfil</h2>
      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por usuario, email o campo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #e5e7eb', flex: 1, fontSize: '0.9rem' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{filtrados.length} registros</span>
          </div>
          {filtrados.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>Sin cambios registrados todavía.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Fecha</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Usuario</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Campo</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Valor anterior</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Valor nuevo</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap', color: '#6b7280' }}>
                        {new Date(r.creado_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{r.usuario_nombre || '—'}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{r.usuario_email}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 99, padding: '2px 10px', fontWeight: 700, fontSize: '0.8rem' }}>
                          {CAMPOS[r.campo] || r.campo}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#dc2626', maxWidth: 180, wordBreak: 'break-all' }}>
                        {r.valor_anterior || <span style={{ color: '#d1d5db' }}>vacío</span>}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#16a34a', maxWidth: 180, wordBreak: 'break-all' }}>
                        {r.valor_nuevo || <span style={{ color: '#d1d5db' }}>vacío</span>}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                        {r.ip || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabCalendarioAdmin({ token }: { token: string }) {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/operaciones', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setReservas(data.reservas ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando…</p>;
  return <CalendarioGrid reservas={reservas} />;
}

// ── Tab: Servicios Adicionales ────────────────────────────────

function TabServiciosAdicionales({ token }: { token: string }) {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notificaciones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar servicios');
      const all: Notificacion[] = await res.json();
      setItems(all.filter(n => n.tipo === 'servicios_adicionales'));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function marcarLeido(id: string) {
    await fetch(`/api/admin/notificaciones/${id}/leido`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(prev => prev.map(n => n.id === id ? { ...n, leido: 1 } : n));
  }

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando…</p>;
  if (error) return <p className="alert alert--error">{error}</p>;
  if (!items.length) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🛎️</div>
      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin solicitudes de servicios adicionales</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: '.85rem' }}>
      {items.map(n => {
        const d = (typeof n.datos === 'string' ? JSON.parse(n.datos) : n.datos) as Record<string, unknown> | null;
        const servicios = Array.isArray(d?.servicios) ? (d.servicios as string[]) : [];
        return (
          <div key={n.id} style={{
            background: n.leido ? 'var(--surface)' : 'var(--surface2)',
            border: `1px solid ${n.leido ? 'var(--border)' : 'var(--border2)'}`,
            borderRadius: 'var(--r2)',
            padding: '1rem 1.1rem',
            opacity: n.leido ? .65 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem' }}>
                🛎️ {String(d?.espacioNombre ?? '—')}
              </div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                  {new Date(n.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
                {!n.leido && (
                  <button className="btn-ghost" style={{ fontSize: '.76rem' }} onClick={() => marcarLeido(n.id)}>
                    ✓ Leído
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem .8rem', fontSize: '.82rem', color: 'var(--text2)', marginBottom: '.6rem' }}>
              <div><span style={{ color: 'var(--text3)' }}>Cliente:</span> {String(d?.nombreDemandante ?? '—')}</div>
              <div><span style={{ color: 'var(--text3)' }}>Email:</span> {String(d?.emailDemandante ?? '—')}</div>
              {!!d?.telDemandante && <div><span style={{ color: 'var(--text3)' }}>Tel:</span> {String(d.telDemandante)}</div>}
              <div><span style={{ color: 'var(--text3)' }}>Período:</span> {String(d?.fechaDesde ?? '')} → {String(d?.fechaHasta ?? '')}</div>
            </div>
            {servicios.length > 0 && (
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {servicios.map(s => (
                  <span key={s} style={{
                    fontSize: '.75rem', fontWeight: 700,
                    background: 'rgba(232,98,42,.12)', color: 'var(--orange)',
                    borderRadius: '99px', padding: '.2rem .65rem',
                    textTransform: 'capitalize',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Consultas ─────────────────────────────────────────────

function TabConsultas({ token }: { token: string }) {
  const [items, setItems] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'resueltas'>('todas');
  const [respModalId, setRespModalId] = useState<string | null>(null);
  const [respTexto, setRespTexto] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/consultas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar consultas');
      setItems(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function responder() {
    if (!respModalId || !respTexto.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/consultas/${respModalId}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ respuesta: respTexto }),
    });
    setSaving(false);
    setRespModalId(null);
    setRespTexto('');
    load();
  }

  async function marcarResuelta(id: string) {
    await fetch(`/api/admin/consultas/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: 'resuelta' }),
    });
    setItems(prev => prev.map(c => c.id === id ? { ...c, estado: 'resuelta' } : c));
  }

  async function borrarConsulta(id: string) {
    if (!confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/admin/consultas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(prev => prev.filter(c => c.id !== id));
  }

  const filtered = items.filter(c => {
    if (filtro === 'pendientes') return c.estado === 'pendiente';
    if (filtro === 'resueltas')  return c.estado === 'resuelta';
    return true;
  });

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando…</p>;
  if (error) return <p className="alert alert--error">{error}</p>;

  return (
    <>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        {(['todas', 'pendientes', 'resueltas'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '.3rem .85rem',
              borderRadius: '99px',
              border: `1px solid ${filtro === f ? 'var(--orange)' : 'var(--border)'}`,
              background: filtro === f ? 'rgba(232,98,42,.12)' : 'transparent',
              color: filtro === f ? 'var(--orange)' : 'var(--text2)',
              fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>📭</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin consultas</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.85rem' }}>
          {filtered.map(c => (
            <div key={c.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r2)',
              padding: '1.1rem',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem', gap: '.5rem' }}>
                <div>
                  <span style={{
                    fontSize: '.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                    background: `${consultaTipoColor(c.tipo)}22`,
                    color: consultaTipoColor(c.tipo),
                    marginRight: '.4rem',
                  }}>
                    {consultaTipoLabel(c.tipo)}
                  </span>
                  <span style={{
                    fontSize: '.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                    background: `${estadoColor(c.estado)}22`,
                    color: estadoColor(c.estado),
                  }}>
                    {c.estado}
                  </span>
                </div>
                <span style={{ fontSize: '.74rem', color: 'var(--text3)', flexShrink: 0 }}>
                  {formatFechaCorta(c.fecha)}
                </span>
              </div>

              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.2rem' }}>{c.asunto}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.4rem' }}>
                {c.nombre} · <a href={`mailto:${c.email}`} style={{ color: 'var(--blue)' }}>{c.email}</a>
              </div>
              <div style={{ fontSize: '.86rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: '.75rem' }}>{c.mensaje}</div>

              {c.respuesta && (
                <div style={{
                  background: 'var(--surface2)', borderRadius: 'var(--r1)',
                  padding: '.7rem .9rem', marginBottom: '.75rem',
                  borderLeft: '3px solid var(--mint)',
                }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--mint)', marginBottom: '.2rem' }}>TU RESPUESTA</div>
                  <div style={{ fontSize: '.84rem', lineHeight: 1.6 }}>{c.respuesta}</div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn-ghost"
                  style={{ fontSize: '.78rem', border: '1px solid var(--border)' }}
                  onClick={() => { setRespModalId(c.id); setRespTexto(c.respuesta || ''); }}
                >
                  ✏️ Responder
                </button>
                {c.estado !== 'resuelta' && (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '.78rem', border: '1px solid var(--border)', color: 'var(--mint)' }}
                    onClick={() => marcarResuelta(c.id)}
                  >
                    ✅ Marcar resuelta
                  </button>
                )}
                <button
                  className="btn-ghost"
                  style={{ fontSize: '.78rem', color: 'var(--red)', border: '1px solid rgba(239,68,68,.3)', marginLeft: 'auto' }}
                  onClick={() => borrarConsulta(c.id)}
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Responder modal */}
      <Modal
        open={!!respModalId}
        onClose={() => { setRespModalId(null); setRespTexto(''); }}
        title="✏️ Responder consulta"
        maxWidth="540px"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label className="form-label">
            Tu respuesta
            <textarea
              rows={6}
              value={respTexto}
              onChange={e => setRespTexto(e.target.value)}
              placeholder="Escribí tu respuesta al cliente…"
              style={{ marginTop: '.4rem' }}
            />
          </label>
          <Button onClick={responder} loading={saving} disabled={!respTexto.trim()}>
            Enviar respuesta
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ── Tab: Usuarios ──────────────────────────────────────────────

interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  tel: string;
  tipo: 'usuario' | 'admin';
  verificado: number;
  activo: number;
  bloqueado_motivo: string | null;
  bloqueado_en: string | null;
  created_at: string;
  espacios_count: number;
  reservas_count: number;
}

function TabUsuarios({ token }: { token: string }) {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [bloqueoModal, setBloqueoModal] = useState<UsuarioAdmin | null>(null);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDesbloqueo, setConfirmDesbloqueo] = useState<UsuarioAdmin | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda)     params.set('q', busqueda);
      if (filtroTipo)   params.set('tipo', filtroTipo);
      if (filtroEstado) params.set('estado', filtroEstado);
      const res = await fetch(`/api/admin/usuarios?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar usuarios');
      setUsuarios(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [token, busqueda, filtroTipo, filtroEstado]);

  useEffect(() => { load(); }, [load]);

  async function bloquear() {
    if (!bloqueoModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${bloqueoModal.id}/bloquear`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ motivo }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error');
      }
      setBloqueoModal(null);
      setMotivo('');
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function desbloquear(u: UsuarioAdmin) {
    setSaving(true);
    try {
      await fetch(`/api/admin/usuarios/${u.id}/desbloquear`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmDesbloqueo(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  const tipoColor: Record<string, string> = {
    usuario: 'var(--blue)',
    admin:   'var(--orange)',
  };

  const MOTIVOS_RAPIDOS = [
    'Actividad fraudulenta detectada',
    'Usufructo de la plataforma sin contraprestación',
    'Datos falsos o identidad no verificable',
    'Conducta abusiva con otros usuarios',
    'Incumplimiento reiterado de las normas de uso',
    'Reservas fantasma o cancelaciones maliciosas',
  ];

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando usuarios…</p>;
  if (error) return <p style={{ color: 'var(--red)' }}>{error}</p>;

  return (
    <>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          placeholder="🔍 Buscar por nombre o email…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ flex: '1 1 220px', minWidth: 180, padding: '.5rem .85rem', borderRadius: 'var(--r2)', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.85rem' }}
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          style={{ padding: '.5rem .85rem', borderRadius: 'var(--r2)', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.82rem' }}
        >
          <option value="">Todos los tipos</option>
          <option value="usuario">Usuarios</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '.5rem .85rem', borderRadius: 'var(--r2)', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.82rem' }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="bloqueado">Bloqueados</option>
        </select>
        <span style={{ fontSize: '.78rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {usuarios.length} resultado{usuarios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista */}
      {!usuarios.length ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>👤</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin resultados</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.65rem' }}>
          {usuarios.map(u => (
            <div key={u.id} style={{
              background: u.activo ? 'var(--surface)' : 'rgba(239,68,68,.04)',
              border: `1px solid ${u.activo ? 'var(--border)' : 'rgba(239,68,68,.3)'}`,
              borderRadius: 'var(--r2)',
              padding: '1rem 1.1rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              {/* Avatar inicial */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: u.activo ? tipoColor[u.tipo] + '22' : 'rgba(239,68,68,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 800, color: u.activo ? tipoColor[u.tipo] : 'var(--red)',
                fontFamily: 'Sora, sans-serif',
              }}>
                {u.nombre.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.15rem' }}>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.92rem' }}>{u.nombre}</span>
                  <span style={{
                    fontSize: '.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '99px',
                    background: tipoColor[u.tipo] + '22', color: tipoColor[u.tipo],
                  }}>{u.tipo}</span>
                  {!u.activo && (
                    <span style={{
                      fontSize: '.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '99px',
                      background: 'rgba(239,68,68,.15)', color: 'var(--red)',
                    }}>⛔ BLOQUEADO</span>
                  )}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{u.email}</div>
                {u.bloqueado_motivo && (
                  <div style={{ fontSize: '.74rem', color: 'var(--red)', marginTop: '.2rem', fontStyle: 'italic' }}>
                    Motivo: {u.bloqueado_motivo}
                  </div>
                )}
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: '.2rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                  {u.tipo === 'usuario' && <span>📦 {u.espacios_count} espacio{u.espacios_count !== 1 ? 's' : ''}</span>}
                  <span>📅 {u.reservas_count} reserva{u.reservas_count !== 1 ? 's' : ''}</span>
                  <span>📆 Alta: {formatFechaCorta(u.created_at)}</span>
                </div>
              </div>

              {/* Acciones */}
              {u.tipo !== 'admin' && (
                <div style={{ flexShrink: 0 }}>
                  {u.activo ? (
                    <button
                      onClick={() => { setBloqueoModal(u); setMotivo(''); }}
                      style={{
                        padding: '.42rem 1rem', borderRadius: 'var(--r2)',
                        border: '1px solid rgba(239,68,68,.4)',
                        background: 'rgba(239,68,68,.08)',
                        color: 'var(--red)', fontSize: '.8rem', fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⛔ Bloquear
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDesbloqueo(u)}
                      style={{
                        padding: '.42rem 1rem', borderRadius: 'var(--r2)',
                        border: '1px solid rgba(16,185,129,.4)',
                        background: 'rgba(16,185,129,.08)',
                        color: 'var(--mint)', fontSize: '.8rem', fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✅ Desbloquear
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal bloqueo */}
      <Modal
        open={!!bloqueoModal}
        onClose={() => setBloqueoModal(null)}
        title="⛔ Bloquear usuario"
        maxWidth="500px"
      >
        {bloqueoModal && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 'var(--r2)', padding: '.85rem 1rem' }}>
              <div style={{ fontWeight: 700 }}>{bloqueoModal.nombre}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{bloqueoModal.email} · {bloqueoModal.tipo}</div>
            </div>

            <div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: '.5rem', fontWeight: 600 }}>Motivos frecuentes (click para seleccionar):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.75rem' }}>
                {MOTIVOS_RAPIDOS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMotivo(m)}
                    style={{
                      padding: '.28rem .7rem', borderRadius: '99px', cursor: 'pointer',
                      border: `1px solid ${motivo === m ? 'rgba(239,68,68,.6)' : 'var(--border)'}`,
                      background: motivo === m ? 'rgba(239,68,68,.12)' : 'var(--surface2)',
                      color: motivo === m ? 'var(--red)' : 'var(--text2)',
                      fontSize: '.72rem', fontWeight: motivo === m ? 700 : 400,
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <label style={{ display: 'block', fontSize: '.82rem', color: 'var(--text2)', marginBottom: '.4rem', fontWeight: 600 }}>
                O escribí un motivo personalizado:
              </label>
              <textarea
                rows={3}
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Describí el motivo del bloqueo…"
                style={{ width: '100%', padding: '.65rem .9rem', borderRadius: 'var(--r2)', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.85rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ fontSize: '.78rem', color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 'var(--r1)', padding: '.7rem .9rem' }}>
              ⚠️ El usuario recibirá un email informando que su cuenta fue suspendida{motivo ? ' con el motivo indicado' : ''}.
              Todas sus sesiones activas quedarán bloqueadas en el próximo request.
            </div>

            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setBloqueoModal(null)}
                style={{ padding: '.5rem 1.1rem', borderRadius: 'var(--r2)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: '.85rem' }}
              >
                Cancelar
              </button>
              <button
                onClick={bloquear}
                disabled={saving}
                style={{ padding: '.5rem 1.3rem', borderRadius: 'var(--r2)', border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem', opacity: saving ? .6 : 1 }}
              >
                {saving ? 'Bloqueando…' : '⛔ Confirmar bloqueo'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal confirmación desbloqueo */}
      <Modal
        open={!!confirmDesbloqueo}
        onClose={() => setConfirmDesbloqueo(null)}
        title="✅ Reactivar cuenta"
        maxWidth="440px"
      >
        {confirmDesbloqueo && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
              ¿Reactivar la cuenta de <strong>{confirmDesbloqueo.nombre}</strong>?
              El usuario recibirá un email de confirmación y podrá ingresar nuevamente.
            </p>
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDesbloqueo(null)}
                style={{ padding: '.5rem 1.1rem', borderRadius: 'var(--r2)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: '.85rem' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => desbloquear(confirmDesbloqueo)}
                disabled={saving}
                style={{ padding: '.5rem 1.3rem', borderRadius: 'var(--r2)', border: 'none', background: 'var(--mint)', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem', opacity: saving ? .6 : 1 }}
              >
                {saving ? 'Reactivando…' : '✅ Confirmar reactivación'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ── Tab: Solicitudes de mejora de puntuación ──────────────────

interface SolicitudPuntuacion {
  id: string;
  oferente_id: string | null;
  nombre: string;
  email: string;
  tel: string | null;
  espacio_nombre: string | null;
  puntaje_actual: number;
  estado: 'pendiente' | 'contactado' | 'resuelto';
  created_at: string;
}

function estadoPuntuacionColor(estado: string) {
  const map: Record<string, string> = {
    pendiente:  'var(--amber)',
    contactado: 'var(--blue)',
    resuelto:   'var(--mint)',
  };
  return map[estado] ?? 'var(--text3)';
}

function TabSolicitudesPuntuacion({ token }: { token: string }) {
  const [items, setItems] = useState<SolicitudPuntuacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'pendiente' | 'contactado' | 'resuelto'>('todas');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/solicitudes-puntuacion', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar solicitudes');
      setItems(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function cambiarEstado(id: string, estado: SolicitudPuntuacion['estado']) {
    await fetch(`/api/admin/solicitudes-puntuacion/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado }),
    });
    setItems(prev => prev.map(s => s.id === id ? { ...s, estado } : s));
  }

  async function borrarSolicitud(id: string) {
    if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
    await fetch(`/api/admin/solicitudes-puntuacion/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(prev => prev.filter(s => s.id !== id));
  }

  const filtered = items.filter(s => filtro === 'todas' || s.estado === filtro);
  const pendientes = items.filter(s => s.estado === 'pendiente').length;

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando…</p>;
  if (error) return <p className="alert alert--error">{error}</p>;

  return (
    <>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['todas', 'pendiente', 'contactado', 'resuelto'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '.3rem .85rem', borderRadius: '99px',
              border: `1px solid ${filtro === f ? 'var(--orange)' : 'var(--border)'}`,
              background: filtro === f ? 'rgba(232,98,42,.12)' : 'transparent',
              color: filtro === f ? 'var(--orange)' : 'var(--text2)',
              fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {f}{f === 'pendiente' && pendientes > 0 ? ` (${pendientes})` : ''}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🛡️</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin solicitudes</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.85rem' }}>
          {filtered.map(s => (
            <div key={s.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r2)',
              padding: '1.1rem',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.7rem', gap: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                    background: `${estadoPuntuacionColor(s.estado)}22`,
                    color: estadoPuntuacionColor(s.estado),
                    textTransform: 'capitalize',
                  }}>
                    {s.estado}
                  </span>
                  <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>
                    {'⭐'.repeat(s.puntaje_actual)}{'☆'.repeat(5 - s.puntaje_actual)} {s.puntaje_actual}/5
                  </span>
                </div>
                <span style={{ fontSize: '.74rem', color: 'var(--text3)', flexShrink: 0 }}>
                  {formatFechaCorta(s.created_at)}
                </span>
              </div>

              {/* Info */}
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.15rem' }}>
                {s.nombre}
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.25rem' }}>
                <a href={`mailto:${s.email}`} style={{ color: 'var(--blue)' }}>{s.email}</a>
                {s.tel && <span> · 📞 {s.tel}</span>}
              </div>
              {s.espacio_nombre && (
                <div style={{ fontSize: '.82rem', color: 'var(--text3)', marginBottom: '.7rem' }}>
                  📦 {s.espacio_nombre}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <a
                  href={`mailto:${s.email}?subject=Mejorá la seguridad de tu espacio en TodasMisCosas`}
                  style={{
                    padding: '.38rem .9rem', borderRadius: 'var(--r2)',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--blue)', fontSize: '.78rem', fontWeight: 600,
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  ✉️ Responder
                </a>
                {s.estado !== 'contactado' && (
                  <button
                    onClick={() => cambiarEstado(s.id, 'contactado')}
                    style={{
                      padding: '.38rem .9rem', borderRadius: 'var(--r2)',
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--blue)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    📞 Marcar contactado
                  </button>
                )}
                {s.estado !== 'resuelto' && (
                  <button
                    onClick={() => cambiarEstado(s.id, 'resuelto')}
                    style={{
                      padding: '.38rem .9rem', borderRadius: 'var(--r2)',
                      border: '1px solid rgba(16,185,129,.4)', background: 'rgba(16,185,129,.08)',
                      color: 'var(--mint)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ✅ Marcar resuelto
                  </button>
                )}
                <button
                  onClick={() => borrarSolicitud(s.id)}
                  style={{
                    padding: '.38rem .9rem', borderRadius: 'var(--r2)',
                    border: '1px solid rgba(239,68,68,.3)', background: 'transparent',
                    color: 'var(--red)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Tab: Campañas ──────────────────────────────────────────────

function TabCampanas({ token }: { token: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campana | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descripcion: '', tipo: 'comunicado',
    fecha_inicio: dateToStr(today), fecha_fin: dateToStr(today), color: '#e8622a',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/campanas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCampanas(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function crear() {
    if (!form.titulo) return;
    setSaving(true);
    try {
      await fetch('/api/admin/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      setForm({ titulo: '', descripcion: '', tipo: 'comunicado', fecha_inicio: dateToStr(today), fecha_fin: dateToStr(today), color: '#e8622a' });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm('¿Eliminar esta campaña?')) return;
    setDeleting(true);
    await fetch(`/api/admin/campanas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleting(false);
    setSelected(null);
    load();
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
          📅 Calendario de campañas
        </h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          ➕ Nueva campaña
        </Button>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
        <button className="btn-ghost" onClick={prevMonth} style={{ padding: '.3rem .6rem', fontSize: '.9rem' }}>‹</button>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', minWidth: 160, textAlign: 'center' }}>
          {MONTHS_ES[month]} {year}
        </span>
        <button className="btn-ghost" onClick={nextMonth} style={{ padding: '.3rem .6rem', fontSize: '.9rem' }}>›</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text3)' }}>Cargando…</p>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS_ES.map(d => (
              <div key={d} style={{
                padding: '.45rem', textAlign: 'center',
                fontSize: '.7rem', fontWeight: 700,
                color: 'var(--text3)', fontFamily: 'Sora, sans-serif',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 80, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const col = (firstDow + idx) % 7;
              const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
              const dayCampanas = campanas.filter(c => campanaOnDay(c, year, month, day));

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 80,
                    padding: '.3rem .35rem .4rem',
                    borderRight: col < 6 ? '1px solid var(--border)' : 'none',
                    borderBottom: '1px solid var(--border)',
                    position: 'relative',
                    background: isToday ? 'rgba(232,98,42,.06)' : 'transparent',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: 22, height: 22,
                    lineHeight: '22px',
                    textAlign: 'center',
                    borderRadius: '50%',
                    fontSize: '.76rem',
                    fontWeight: isToday ? 800 : 500,
                    background: isToday ? 'var(--orange)' : 'transparent',
                    color: isToday ? '#fff' : 'var(--text2)',
                    fontFamily: 'Sora, sans-serif',
                    marginBottom: '.2rem',
                  }}>
                    {day}
                  </span>
                  {dayCampanas.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      title={c.titulo}
                      style={{
                        display: 'block', width: '100%',
                        background: c.color,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 3,
                        fontSize: '.6rem',
                        fontWeight: 700,
                        padding: '1px 4px',
                        marginBottom: 2,
                        textAlign: 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        opacity: .92,
                      }}
                    >
                      {c.titulo}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaign detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="📣 Detalle de campaña"
        maxWidth="480px"
      >
        {selected && (
          <div style={{ display: 'grid', gap: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: selected.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.05rem' }}>{selected.titulo}</span>
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', textTransform: 'capitalize' }}>{selected.tipo}</div>
            {selected.descripcion && (
              <p style={{ fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>{selected.descripcion}</p>
            )}
            <div style={{ display: 'flex', gap: '1rem', fontSize: '.82rem', color: 'var(--text2)' }}>
              <span>📅 {formatFechaCorta(selected.fecha_inicio)}</span>
              <span>→</span>
              <span>{formatFechaCorta(selected.fecha_fin)}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={() => eliminar(selected.id)}
            >
              🗑️ Eliminar campaña
            </Button>
          </div>
        )}
      </Modal>

      {/* Create campaign modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="➕ Nueva campaña"
        maxWidth="520px"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label className="form-label">
            Título *
            <input
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Black Friday 20% off"
              style={{ marginTop: '.4rem' }}
            />
          </label>

          <label className="form-label">
            Descripción
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción opcional…"
              style={{ marginTop: '.4rem' }}
            />
          </label>

          <label className="form-label">
            Tipo
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              style={{ marginTop: '.4rem' }}
            >
              {CAMPANA_TIPOS.map(t => (
                <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="form-label">
              Fecha inicio *
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                style={{ marginTop: '.4rem' }}
              />
            </label>
            <label className="form-label">
              Fecha fin *
              <input
                type="date"
                value={form.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                style={{ marginTop: '.4rem' }}
              />
            </label>
          </div>

          <div>
            <div className="form-label" style={{ marginBottom: '.5rem' }}>Color</div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c, border: `2px solid ${form.color === c ? '#fff' : 'transparent'}`,
                    cursor: 'pointer', padding: 0,
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <Button onClick={crear} loading={saving} disabled={!form.titulo || !form.fecha_inicio || !form.fecha_fin}>
            Crear campaña
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ── Tab: Operaciones / Finanzas ────────────────────────────────

interface ReservaOp {
  id: string;
  estado: string;
  precio_total: number;
  comision_tmc: number;
  neto_oferente: number;
  fecha_desde: string;
  fecha_hasta: string;
  created_at: string;
  espacio_nombre: string;
  espacio_barrio: string;
  demandante_nombre: string;
  demandante_email: string;
  oferente_nombre: string;
  oferente_email: string;
  mp_payment_id?: string;
}

interface ResumenOp {
  total: number;
  pagadas: number;
  pendientes: number;
  canceladas: number;
  gmv: number;
  gmv_mes: number;
  comision_total: number;
  comision_mes: number;
  neto_oferentes: number;
}

function estadoOpColor(estado: string) {
  const m: Record<string, string> = {
    pagada: 'var(--mint)', finalizada: 'var(--mint)',
    confirmada: 'var(--blue)', pendiente: 'var(--amber)',
    cancelada: 'var(--red)',
  };
  return m[estado] ?? 'var(--text3)';
}

function TabOperaciones({ token }: { token: string }) {
  const [resumen, setResumen] = useState<ResumenOp | null>(null);
  const [reservas, setReservas] = useState<ReservaOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/operaciones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar operaciones');
      const data = await res.json();
      setResumen(data.resumen);
      setReservas(data.reservas);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSincronizar() {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/sincronizar-pendientes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSyncResult(`Revisadas: ${data.revisadas} · Actualizadas a pagada: ${data.actualizadas}`);
      if (data.actualizadas > 0) load();
    } catch {
      setSyncResult('Error al sincronizar');
    } finally {
      setSyncLoading(false);
    }
  }

  const filtered = reservas.filter(r => {
    const matchEstado = filtroEstado === 'todas'
      || (filtroEstado === 'pagadas' && ['pagada', 'finalizada'].includes(r.estado))
      || (filtroEstado === 'pendientes' && ['pendiente', 'confirmada'].includes(r.estado))
      || (filtroEstado === 'canceladas' && r.estado === 'cancelada');
    const q = busqueda.toLowerCase();
    const matchQ = !q || r.espacio_nombre.toLowerCase().includes(q)
      || r.demandante_nombre.toLowerCase().includes(q)
      || r.oferente_nombre.toLowerCase().includes(q);
    return matchEstado && matchQ;
  });

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando operaciones…</p>;
  if (error) return <p className="alert alert--error">{error}</p>;

  const statCards = resumen ? [
    { emoji: '📋', label: 'Total reservas',     value: resumen.total,                          color: 'var(--text)' },
    { emoji: '✅', label: 'Completadas',         value: resumen.pagadas,                        color: 'var(--mint)' },
    { emoji: '⏳', label: 'En curso / pendientes', value: resumen.pendientes,                   color: 'var(--amber)' },
    { emoji: '❌', label: 'Canceladas',          value: resumen.canceladas,                     color: 'var(--red)' },
    { emoji: '💵', label: 'GMV del mes',         value: formatARS(resumen.gmv_mes),             color: 'var(--blue)' },
    { emoji: '💰', label: 'GMV total',           value: formatARS(resumen.gmv),                 color: 'var(--blue)' },
    { emoji: '🏛️', label: `Comisión TMC mes (${COMISION_TMC * 100}%)`, value: formatARS(resumen.comision_mes), color: 'var(--orange)' },
    { emoji: '🏛️', label: `Comisión TMC total (${COMISION_TMC * 100}%)`, value: formatARS(resumen.comision_total), color: 'var(--orange)' },
    { emoji: '🤝', label: 'Neto a oferentes',   value: formatARS(resumen.neto_oferentes),       color: 'var(--mint)' },
  ] : [];

  return (
    <>
      {/* Summary cards */}
      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '.75rem', marginBottom: '1.5rem' }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '.25rem' }}>{s.emoji}</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: '.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sync button */}
      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleSincronizar}
          disabled={syncLoading}
          style={{ padding: '.45rem 1rem', borderRadius: 'var(--r2)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: syncLoading ? 'wait' : 'pointer', fontSize: '.82rem', fontWeight: 700, color: 'var(--orange)' }}
        >
          {syncLoading ? '⏳ Sincronizando…' : '🔄 Sincronizar pagos pendientes'}
        </button>
        {syncResult && <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{syncResult}</span>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input
          placeholder="🔍 Espacio, demandante u oferente…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ flex: '1 1 220px', padding: '.45rem .85rem', borderRadius: 'var(--r2)', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.83rem' }}
        />
        {(['todas', 'pagadas', 'pendientes', 'canceladas'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            style={{
              padding: '.3rem .8rem', borderRadius: '99px', cursor: 'pointer',
              border: `1px solid ${filtroEstado === f ? 'var(--orange)' : 'var(--border)'}`,
              background: filtroEstado === f ? 'rgba(232,98,42,.12)' : 'transparent',
              color: filtroEstado === f ? 'var(--orange)' : 'var(--text2)',
              fontSize: '.76rem', fontWeight: 600, textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
        <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {!filtered.length ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📋</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin resultados</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.65rem' }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r2)',
              padding: '1rem 1.1rem',
            }}>
              {/* Top row: espacio + estado + fecha */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.5rem' }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.92rem' }}>
                  {r.espacio_nombre}
                  <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: '.78rem', marginLeft: '.4rem' }}>📍 {r.espacio_barrio}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                    background: `${estadoOpColor(r.estado)}22`, color: estadoOpColor(r.estado),
                    textTransform: 'capitalize',
                  }}>{r.estado}</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{formatFechaCorta(r.created_at)}</span>
                </div>
              </div>

              {/* People */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--text2)', marginBottom: '.55rem' }}>
                <span>👤 <strong>Demandante:</strong> {r.demandante_nombre} · <a href={`mailto:${r.demandante_email}`} style={{ color: 'var(--blue)' }}>{r.demandante_email}</a></span>
                <span>🔑 <strong>Oferente:</strong> {r.oferente_nombre} · <a href={`mailto:${r.oferente_email}`} style={{ color: 'var(--blue)' }}>{r.oferente_email}</a></span>
              </div>

              {/* Dates */}
              <div style={{ fontSize: '.76rem', color: 'var(--text3)', marginBottom: '.55rem' }}>
                📅 {formatFechaCorta(r.fecha_desde)} → {formatFechaCorta(r.fecha_hasta)}
                {r.mp_payment_id && <span style={{ marginLeft: '.75rem' }}>💳 MP: {r.mp_payment_id}</span>}
              </div>

              {/* Financials */}
              {['pagada', 'finalizada'].includes(r.estado) && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--surface2)', borderRadius: 'var(--r1)', padding: '.55rem .85rem', fontSize: '.8rem' }}>
                  <span>💵 <strong>Bruto:</strong> {formatARS(r.precio_total)}</span>
                  <span style={{ color: 'var(--orange)' }}>🏛️ <strong>TMC ({COMISION_TMC * 100}%):</strong> {formatARS(r.comision_tmc)}</span>
                  <span style={{ color: 'var(--mint)' }}>🤝 <strong>Neto oferente:</strong> {formatARS(r.neto_oferente)}</span>
                </div>
              )}
              {!['pagada', 'finalizada'].includes(r.estado) && r.precio_total > 0 && (
                <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>
                  💵 Valor estimado: {formatARS(r.precio_total)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Tab: Conversaciones ────────────────────────────────────────

type ConvAdmin = Conversacion & { demandante_email?: string; oferente_email?: string; total_mensajes?: number };

function TabConversaciones({ token }: { token: string }) {
  const [convs, setConvs] = useState<ConvAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState({ espacio_id: '', demandante_id: '', oferente_id: '' });

  async function cargar(f = filtro) {
    setLoading(true);
    try {
      const data = await chatAPI.listarConversacionesAdmin(token, {
        espacio_id: f.espacio_id || undefined,
        demandante_id: f.demandante_id || undefined,
        oferente_id: f.oferente_id || undefined,
      });
      setConvs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Filtros */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.75rem' }}>
        <div>
          <label className="form-label">ID Publicación</label>
          <input value={filtro.espacio_id} onChange={e => setFiltro(f => ({ ...f, espacio_id: e.target.value }))} placeholder="espacio_id…" />
        </div>
        <div>
          <label className="form-label">ID Demandante</label>
          <input value={filtro.demandante_id} onChange={e => setFiltro(f => ({ ...f, demandante_id: e.target.value }))} placeholder="usuario_id…" />
        </div>
        <div>
          <label className="form-label">ID Oferente</label>
          <input value={filtro.oferente_id} onChange={e => setFiltro(f => ({ ...f, oferente_id: e.target.value }))} placeholder="usuario_id…" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button onClick={() => cargar(filtro)} loading={loading} size="sm" style={{ width: '100%' }}>
            🔍 Buscar
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--text3)' }}>Cargando…</p>
      ) : convs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>💬</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>No hay conversaciones</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.6rem' }}>
          {convs.map(conv => (
            <div key={conv.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '.85rem 1rem', display: 'grid', gap: '.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
                    📦 {conv.espacio_nombre} <span style={{ color: 'var(--text3)', fontSize: '.72rem', fontWeight: 400 }}>({conv.barrio})</span>
                  </div>
                  <div style={{ fontSize: '.76rem', color: 'var(--text3)', marginTop: '.1rem' }}>
                    👤 Demandante: <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{conv.demandante_nombre}</span>
                    {conv.demandante_email && <span style={{ opacity: .7 }}> · {conv.demandante_email}</span>}
                  </div>
                  <div style={{ fontSize: '.76rem', color: 'var(--text3)' }}>
                    🏪 Oferente: <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{conv.oferente_nombre}</span>
                    {conv.oferente_email && <span style={{ opacity: .7 }}> · {conv.oferente_email}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Mensajes</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--blue)' }}>{conv.total_mensajes ?? '—'}</div>
                </div>
              </div>
              {conv.ultimo_msg && (
                <div style={{ fontSize: '.78rem', color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 6, padding: '.35rem .6rem', marginTop: '.25rem' }}>
                  "{conv.ultimo_msg}"
                </div>
              )}
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: '.1rem' }}>
                Último mensaje: {conv.ultimo_msg_at ? new Date(conv.ultimo_msg_at).toLocaleString('es-AR') : '—'}
                <span style={{ marginLeft: '.5rem', opacity: .6 }}>· ID espacio: {conv.espacio_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab Publicaciones ──────────────────────────────────────────

function TabPublicaciones({ token }: { token: string }) {
  const [publicaciones, setPublicaciones] = useState<PublicacionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'inactivas' | 'vencidas'>('todas');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/publicaciones', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: PublicacionAdmin[]) => setPublicaciones(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function toggleDisponible(pub: PublicacionAdmin) {
    setToggling(pub.id);
    const nuevoEstado = (pub.activo && pub.disponible) ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/publicaciones/${pub.id}/disponible`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: nuevoEstado }),
      });
      if (res.ok) {
        setPublicaciones(prev =>
          prev.map(p => p.id === pub.id ? { ...p, disponible: nuevoEstado, activo: nuevoEstado, inactiva_auto: 0 } : p)
        );
      }
    } finally {
      setToggling(null);
    }
  }

  const filtradas = publicaciones.filter(p => {
    if (filtro === 'activas')   return p.activo === 1 && p.disponible === 1 && !p.vencida;
    if (filtro === 'inactivas') return (p.activo === 0 || p.disponible === 0) && !p.vencida;
    if (filtro === 'vencidas')  return p.vencida === 1;
    return true;
  });

  const pillStyle = (key: 'todas' | 'activas' | 'inactivas' | 'vencidas') => ({
    padding: '.35rem .85rem',
    borderRadius: 99,
    border: 'none',
    fontFamily: 'Sora, sans-serif',
    fontWeight: filtro === key ? 700 : 500,
    fontSize: '.82rem',
    cursor: 'pointer',
    background: filtro === key ? 'var(--orange)' : 'var(--surface2)',
    color: filtro === key ? '#fff' : 'var(--text2)',
    transition: 'background .15s',
  } as React.CSSProperties);

  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={pillStyle('todas')}    onClick={() => setFiltro('todas')}>Todas ({publicaciones.length})</button>
        <button style={pillStyle('activas')}  onClick={() => setFiltro('activas')}>Activas ({publicaciones.filter(p => p.activo === 1 && p.disponible === 1 && !p.vencida).length})</button>
        <button style={pillStyle('inactivas')} onClick={() => setFiltro('inactivas')}>Inactivas ({publicaciones.filter(p => (p.activo === 0 || p.disponible === 0) && !p.vencida).length})</button>
        <button style={{ ...pillStyle('vencidas'), ...(filtro === 'vencidas' ? {} : { color: '#ef4444' }) }} onClick={() => setFiltro('vencidas')}>
          🔴 Vencidas ({publicaciones.filter(p => p.vencida === 1).length})
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text3)', padding: '2rem 0' }}>Cargando…</div>}
      {!loading && filtradas.length === 0 && (
        <div style={{ color: 'var(--text3)', padding: '2rem 0' }}>Sin publicaciones en esta categoría.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {filtradas.map(pub => (
          <div key={pub.id} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.97rem', marginBottom: '.2rem' }}>
                  {pub.nombre}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: '.3rem' }}>
                  {pub.barrio} · {pub.categoria}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>
                  {pub.precio_dia != null && <span>Día: <b>{formatARS(pub.precio_dia)}</b> </span>}
                  {pub.moneda && pub.moneda !== 'ARS' && <span style={{ opacity: .7 }}>({pub.moneda})</span>}
                </div>
                <div style={{ fontSize: '.77rem', color: 'var(--text3)', marginTop: '.25rem' }}>
                  👤 {pub.oferente_nombre}
                  {pub.oferente_email && <span style={{ opacity: .7 }}> · {pub.oferente_email}</span>}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: '.1rem' }}>
                  ⭐ {pub.rating?.toFixed(1) ?? '—'} · {pub.reviews_count} reseñas · {pub.reservas_mes} reservas/mes
                  <span style={{ opacity: .6 }}> · Alta: {new Date(pub.created_at).toLocaleDateString('es-AR')}</span>
                  {pub.fecha_vencimiento && !pub.vencida && (
                    <span style={{ opacity: .6 }}> · Vence: {new Date(pub.fecha_vencimiento).toLocaleDateString('es-AR')}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                <span style={{
                  padding: '.25rem .7rem',
                  borderRadius: 99,
                  fontSize: '.75rem',
                  fontWeight: 700,
                  background: !pub.activo ? 'rgba(239,68,68,.1)' : pub.disponible ? 'rgba(16,185,129,.15)' : 'rgba(245,158,11,.12)',
                  color: !pub.activo ? 'var(--red)' : pub.disponible ? 'var(--mint)' : 'var(--amber)',
                }}>
                  {!pub.activo ? '● No visible' : pub.disponible ? '● Activa' : pub.inactiva_auto ? '● Pausada auto' : '● Pausada'}
                </span>

                <span style={{
                  padding: '.25rem .7rem',
                  borderRadius: 99,
                  fontSize: '.75rem',
                  fontWeight: 700,
                  background: pub.tipo === 'compartido' ? 'rgba(232,98,42,.1)' : 'rgba(30,41,59,.07)',
                  color: pub.tipo === 'compartido' ? 'var(--orange)' : 'var(--text2)',
                  border: `1.5px solid ${pub.tipo === 'compartido' ? 'rgba(232,98,42,.3)' : 'rgba(30,41,59,.15)'}`,
                }}>
                  {pub.tipo === 'compartido' ? '🤝 Compartido' : '🔒 Exclusivo'}
                </span>

                {!!pub.vencida && (
                  <span style={{
                    padding: '.2rem .65rem',
                    borderRadius: 99,
                    fontSize: '.72rem',
                    fontWeight: 700,
                    background: 'rgba(239,68,68,.18)',
                    color: '#ef4444',
                    border: '1.5px solid rgba(239,68,68,.4)',
                  }}>
                    🔴 Publicación vencida
                    {pub.fecha_vencimiento && (
                      <span style={{ fontWeight: 400, opacity: .8 }}>
                        {' · '}{new Date(pub.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </span>
                )}

                {!!pub.eliminado_por_oferente && (
                  <span style={{
                    padding: '.2rem .65rem',
                    borderRadius: 99,
                    fontSize: '.72rem',
                    fontWeight: 700,
                    background: 'rgba(239,68,68,.12)',
                    color: 'var(--red)',
                    border: '1px solid rgba(239,68,68,.25)',
                  }}>
                    🗑️ Baja por oferente
                    {pub.eliminado_at && (
                      <span style={{ fontWeight: 400, opacity: .8 }}>
                        {' · '}{new Date(pub.eliminado_at).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button
                    onClick={() => toggleDisponible(pub)}
                    disabled={toggling === pub.id}
                    style={{
                      padding: '.35rem .75rem',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: '.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: pub.activo && pub.disponible ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.15)',
                      color: pub.activo && pub.disponible ? 'var(--red)' : 'var(--mint)',
                      opacity: toggling === pub.id ? .6 : 1,
                    }}
                  >
                    {pub.activo && pub.disponible ? 'Pausar' : 'Activar'}
                  </button>
                  <a
                    href={`/espacio/${pub.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '.35rem .75rem',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      fontSize: '.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'var(--surface2)',
                      color: 'var(--text2)',
                      textDecoration: 'none',
                    }}
                  >
                    Ver ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

// ── Tab: Consultas públicas (consultas_espacio) ────────────────

interface ConsultaPublicaAdmin {
  id: number;
  espacio_id: string;
  autor_id: string;
  autor_nombre: string;
  pregunta: string;
  respuesta: string | null;
  respuesta_at: string | null;
  created_at: string;
  espacio_nombre: string;
}

function TabConsultasPublicas({ token }: { token: string }) {
  const [items, setItems] = useState<ConsultaPublicaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'respondidas'>('todas');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/consultas-publicas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar consultas públicas');
      setItems(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function borrar(id: number) {
    if (!confirm('¿Eliminar esta consulta? No se puede deshacer.')) return;
    await fetch(`/api/admin/consultas-publicas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(prev => prev.filter(c => c.id !== id));
  }

  const filtered = items.filter(c => {
    if (filtro === 'pendientes')  return !c.respuesta;
    if (filtro === 'respondidas') return !!c.respuesta;
    return true;
  });

  if (loading) return <p style={{ color: 'var(--text3)' }}>Cargando…</p>;
  if (error)   return <p className="alert alert--error">{error}</p>;

  return (
    <>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['todas', 'pendientes', 'respondidas'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '.3rem .85rem', borderRadius: '99px',
              fontSize: '.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filtro === f ? 'var(--orange)' : 'var(--surface2)',
              color: filtro === f ? '#fff' : 'var(--text2)',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pendientes'  && ` (${items.filter(c => !c.respuesta).length})`}
            {f === 'respondidas' && ` (${items.filter(c => !!c.respuesta).length})`}
            {f === 'todas'       && ` (${items.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>❓</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Sin consultas</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.75rem' }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
              <div style={{ padding: '.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '.72rem', color: 'var(--text3)' }}>
                <span>📦 <strong style={{ color: 'var(--text2)' }}>{c.espacio_nombre}</strong></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span
                    style={{
                      background: c.respuesta ? 'rgba(52,211,153,.15)' : 'rgba(232,98,42,.12)',
                      color: c.respuesta ? 'var(--mint)' : 'var(--orange)',
                      borderRadius: '99px', padding: '.1rem .55rem', fontWeight: 700,
                    }}
                  >
                    {c.respuesta ? 'Respondida' : 'Pendiente'}
                  </span>
                  <button
                    onClick={() => borrar(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '.75rem', padding: '.2rem .5rem' }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', marginBottom: c.respuesta ? '.75rem' : 0 }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--orange)', background: 'rgba(232,98,42,.1)', borderRadius: '99px', padding: '.15rem .55rem', whiteSpace: 'nowrap' }}>
                    {c.autor_nombre}
                  </span>
                  <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.5 }}>{c.pregunta}</p>
                </div>
                {c.respuesta && (
                  <div style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--orange)', borderRadius: '0 var(--r2) var(--r2) 0', padding: '.75rem 1rem' }}>
                    <div style={{ fontSize: '.68rem', color: 'var(--orange)', fontWeight: 700, marginBottom: '.3rem' }}>Respuesta del proveedor</div>
                    <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.5 }}>{c.respuesta}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, isAdmin } = useAuth();
  const [tab, setTab] = useState('notificaciones');
  const [notifUnread, setNotifUnread] = useState(0);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/');
  }, [authLoading, isAdmin, router]);

  // Load unread counts for badges
  useEffect(() => {
    if (!token || !isAdmin) return;
    fetch('/api/admin/notificaciones', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: Notificacion[]) => {
        setNotifUnread(Array.isArray(data) ? data.filter(n => !n.leido).length : 0);
      })
      .catch(() => {});
    fetch('/api/admin/notificaciones', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: Notificacion[]) => {
        setSolicitudesPendientes(Array.isArray(data) ? data.filter(n => n.tipo === 'servicios_adicionales' && !n.leido).length : 0);
      })
      .catch(() => {});
  }, [token, isAdmin]);

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' }}>
        Cargando…
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { key: 'notificaciones',       label: '🔔 Notificaciones', badge: notifUnread || undefined },
    { key: 'operaciones',          label: '💼 Operaciones' },
    { key: 'consultas',            label: '📬 Consultas' },
    { key: 'consultas-publicas',   label: '❓ Consultas públicas' },
    { key: 'solicitudes-puntaje',  label: '🛡️ Servicios adicionales', badge: solicitudesPendientes || undefined },
    { key: 'campanas',             label: '📣 Campañas' },
    { key: 'marketing',            label: '📨 Marketing & Difusión' },
    { key: 'usuarios',             label: '👤 Usuarios' },
    { key: 'conversaciones',       label: '💬 Conversaciones' },
    { key: 'publicaciones',        label: '🏠 Publicaciones' },
    { key: 'calendario',           label: '📅 Calendario' },
    { key: 'movimientos',          label: '💵 Movimientos' },
    { key: 'auditoria-perfil',     label: '📋 Historial Perfil' },
    { key: 'emails',               label: '✉️ Emails' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SiteHeader />

      <div className="page-scroll">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.7rem', marginBottom: '1.5rem' }}>
            ⚙️ Panel de Administración
          </h1>

          <TabBar tabs={tabs} active={tab} onSelect={setTab} />

          {tab === 'notificaciones'      && token && <TabNotificaciones token={token} />}
          {tab === 'operaciones'         && token && <TabOperaciones token={token} />}
          {tab === 'consultas'           && token && <TabConsultas token={token} />}
          {tab === 'consultas-publicas'  && token && <TabConsultasPublicas token={token} />}
          {tab === 'solicitudes-puntaje' && token && <TabServiciosAdicionales token={token} />}
          {tab === 'campanas'            && token && <TabCampanas token={token} />}
          {tab === 'marketing'           && token && <TabMarketing token={token} />}
          {tab === 'usuarios'            && token && <TabUsuarios token={token} />}
          {tab === 'conversaciones'      && token && <TabConversaciones token={token} />}
          {tab === 'publicaciones'       && token && <TabPublicaciones token={token} />}
          {tab === 'calendario'          && token && <TabCalendarioAdmin token={token} />}
          {tab === 'movimientos'         && token && <TabMovimientos token={token} />}
          {tab === 'auditoria-perfil'    && token && <TabAuditoriaPerfil token={token} />}
          {tab === 'emails'              && token && <TabEmailConfig token={token} />}
        </div>
      </div>
    </div>
  );
}
