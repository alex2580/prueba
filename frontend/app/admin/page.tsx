'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { formatFechaCorta } from '@/lib/utils';

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
    espacio: '🏠',
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
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
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

// ── Main page ──────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, isAdmin } = useAuth();
  const [tab, setTab] = useState('notificaciones');
  const [notifUnread, setNotifUnread] = useState(0);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/');
  }, [authLoading, isAdmin, router]);

  // Load unread count for badge
  useEffect(() => {
    if (!token || !isAdmin) return;
    fetch('/api/admin/notificaciones', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((data: Notificacion[]) => {
        setNotifUnread(Array.isArray(data) ? data.filter(n => !n.leido).length : 0);
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
    { key: 'notificaciones', label: '🔔 Notificaciones', badge: notifUnread || undefined },
    { key: 'consultas',      label: '📬 Consultas' },
    { key: 'campanas',       label: '📣 Campañas' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <nav>
          <button className="nav-btn" onClick={() => router.push('/panel')}>
            ← Mi Panel
          </button>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{user?.nombre}</span>
          <span style={{
            fontSize: '.68rem', fontWeight: 800,
            padding: '2px 8px', borderRadius: '99px',
            background: 'rgba(232,98,42,.18)', color: 'var(--orange)',
            fontFamily: 'Sora, sans-serif',
          }}>
            ADMIN
          </span>
        </div>
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.7rem', marginBottom: '1.5rem' }}>
            ⚙️ Panel de Administración
          </h1>

          <TabBar tabs={tabs} active={tab} onSelect={setTab} />

          {tab === 'notificaciones' && token && <TabNotificaciones token={token} />}
          {tab === 'consultas'      && token && <TabConsultas token={token} />}
          {tab === 'campanas'       && token && <TabCampanas token={token} />}
        </div>
      </div>
    </div>
  );
}
