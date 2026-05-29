'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { formatFechaCorta, formatARS, COMISION_TMC } from '@/lib/utils';
import { chatAPI } from '@/lib/api';
import type { Conversacion } from '@/types';
import { TabMarketing } from '@/components/admin/TabMarketing';

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
  tipo: 'consulta' | 'queja' | 'sugerencia';
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
  const map: Record<string, string> = { consulta: 'Consulta', queja: 'Queja', sugerencia: 'Sugerencia' };
  return map[tipo] ?? tipo;
}

function consultaTipoColor(tipo: string) {
  const map: Record<string, string> = {
    consulta: 'var(--blue)',
    queja: 'var(--red)',
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
      display: 'flex', borderBottom: '1px solid var(--border)',
      background: 'var(--surface)', marginBottom: '1.5rem',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          style={{
            padding: '.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: active === t.key ? '2px solid var(--orange)' : '2px solid transparent',
            color: active === t.key ? 'var(--orange)' : 'var(--text2)',
            fontFamily: 'Sora, sans-serif',
            fontWeight: active === t.key ? 700 : 500,
            fontSize: '.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '.4rem',
            transition: 'color .15s',
          }}
        >
          {t.label}
          {!!t.badge && (
            <span style={{
              background: 'var(--orange)', color: '#fff',
              borderRadius: '99px', fontSize: '.65rem',
              padding: '1px 6px', fontWeight: 700,
            }}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
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
  tipo: 'oferente' | 'demandante' | 'admin';
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
    oferente:   'var(--mint)',
    demandante: 'var(--blue)',
    admin:      'var(--orange)',
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
          <option value="oferente">Oferentes</option>
          <option value="demandante">Demandantes</option>
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
                  {u.tipo === 'oferente' && <span>📦 {u.espacios_count} espacio{u.espacios_count !== 1 ? 's' : ''}</span>}
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

// ── Main page ──────────────────────────────────────────────────

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
    fetch('/api/admin/solicitudes-puntuacion', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: SolicitudPuntuacion[]) => {
        setSolicitudesPendientes(Array.isArray(data) ? data.filter(s => s.estado === 'pendiente').length : 0);
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
    { key: 'solicitudes-puntaje',  label: '🛡️ Servicios adicionales', badge: solicitudesPendientes || undefined },
    { key: 'campanas',             label: '📣 Campañas' },
    { key: 'marketing',            label: '📨 Marketing & Difusión' },
    { key: 'usuarios',             label: '👤 Usuarios' },
    { key: 'conversaciones',       label: '💬 Conversaciones' },
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
          {tab === 'solicitudes-puntaje' && token && <TabSolicitudesPuntuacion token={token} />}
          {tab === 'campanas'            && token && <TabCampanas token={token} />}
          {tab === 'marketing'           && token && <TabMarketing token={token} />}
          {tab === 'usuarios'            && token && <TabUsuarios token={token} />}
          {tab === 'conversaciones'      && token && <TabConversaciones token={token} />}
        </div>
      </div>
    </div>
  );
}
