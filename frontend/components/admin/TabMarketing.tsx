'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';

// ── Types ──────────────────────────────────────────────────────
interface Campana {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo_html: string;
  destinatarios: 'todos' | 'oferentes' | 'demandantes';
  estado: 'borrador' | 'programada' | 'enviando' | 'enviada';
  enviada_en: string | null;
  total_enviados: number;
  prog_activa: number;
  prog_tipo: 'unica' | 'semanal' | 'mensual';
  prog_fecha: string | null;
  prog_hora: string;
  prog_dia_semana: number | null;
  prog_dia_mes: number | null;
  prog_ultimo_envio: string | null;
  created_at: string;
  enviados_ok?: number;
  enviados_err?: number;
}

interface LogItem {
  id: string;
  email: string;
  nombre: string;
  estado: 'ok' | 'error';
  error_msg: string | null;
  enviado_en: string;
}

const DIAS_SEMANA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DEST_LABEL: Record<string, string> = { todos: 'Todos los usuarios', oferentes: 'Solo Oferentes', demandantes: 'Solo Demandantes' };
const ESTADO_COLOR: Record<string, string> = { borrador: 'var(--text3)', programada: '#3b82f6', enviando: 'var(--orange)', enviada: '#22c55e' };
const ESTADO_LABEL: Record<string, string> = { borrador: 'Borrador', programada: 'Programada', enviando: 'Enviando…', enviada: 'Enviada' };

function formatFecha(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Sub-tab: Redactar / Editar ─────────────────────────────────
function FormCampana({
  token,
  inicial,
  onGuardado,
  onCancelar,
}: {
  token: string;
  inicial?: Campana;
  onGuardado: (c: Campana) => void;
  onCancelar?: () => void;
}) {
  const [nombre, setNombre]     = useState(inicial?.nombre     ?? '');
  const [asunto, setAsunto]     = useState(inicial?.asunto     ?? '');
  const [cuerpo, setCuerpo]     = useState(inicial?.cuerpo_html ?? '');
  const [dest, setDest]         = useState<Campana['destinatarios']>(inicial?.destinatarios ?? 'todos');
  const [totalDest, setTotalDest] = useState<number | null>(null);

  // Programación
  const [progActiva, setProgActiva]     = useState(!!inicial?.prog_activa);
  const [progTipo, setProgTipo]         = useState<Campana['prog_tipo']>(inicial?.prog_tipo ?? 'unica');
  const [progFecha, setProgFecha]       = useState(inicial?.prog_fecha ?? '');
  const [progHora, setProgHora]         = useState(inicial?.prog_hora ?? '09:00');
  const [progDiaSem, setProgDiaSem]     = useState<number>(inicial?.prog_dia_semana ?? 1);
  const [progDiaMes, setProgDiaMes]     = useState<number>(inicial?.prog_dia_mes ?? 1);

  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');
  const [preview, setPreview]   = useState(false);

  useEffect(() => {
    fetch(`/api/mailing/preview-destinatarios?dest=${dest}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setTotalDest(d.total))
      .catch(() => {});
  }, [dest, token]);

  async function guardar() {
    if (!nombre.trim() || !asunto.trim() || !cuerpo.trim()) {
      setError('Completá nombre, asunto y cuerpo'); return;
    }
    setLoading(true); setError('');
    try {
      const body = {
        nombre, asunto, cuerpo_html: cuerpo, destinatarios: dest,
        prog_activa: progActiva,
        prog_tipo: progTipo,
        prog_fecha: progFecha || null,
        prog_hora: progHora,
        prog_dia_semana: progTipo === 'semanal' ? progDiaSem : null,
        prog_dia_mes: progTipo === 'mensual' ? progDiaMes : null,
      };
      const url  = inicial ? `/api/mailing/campanas/${inicial.id}` : '/api/mailing/campanas';
      const method = inicial ? 'PATCH' : 'POST';
      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const campana = await res.json();
      onGuardado(campana);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  async function enviarAhora() {
    if (!inicial) { await guardar(); return; }
    if (!confirm(`¿Enviás "${asunto}" a ${totalDest ?? '?'} usuarios ahora mismo?`)) return;
    setSending(true); setError('');
    try {
      const res = await fetch(`/api/mailing/campanas/${inicial.id}/enviar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      alert(`✅ Enviado a ${data.ok} usuarios${data.err > 0 ? ` (${data.err} errores)` : ''}`);
      const updated = await fetch(`/api/mailing/campanas`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then((arr: Campana[]) => arr.find(c => c.id === inicial.id));
      if (updated) onGuardado(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--r2)', padding: '.6rem .85rem',
    color: 'var(--text)', fontSize: '.88rem', outline: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: '.78rem', color: 'var(--text3)', marginBottom: '.3rem', display: 'block' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        <div>
          <label style={labelStyle}>Nombre interno de la campaña *</label>
          <input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Newsletter Mayo 2026" />
        </div>
        <div>
          <label style={labelStyle}>Destinatarios</label>
          <select style={inputStyle} value={dest} onChange={e => setDest(e.target.value as Campana['destinatarios'])}>
            <option value="todos">Todos los usuarios</option>
            <option value="oferentes">Solo Oferentes</option>
            <option value="demandantes">Solo Demandantes</option>
          </select>
          {totalDest !== null && (
            <div style={{ fontSize: '.72rem', color: 'var(--orange)', marginTop: '.25rem' }}>
              📬 {totalDest} destinatarios activos
            </div>
          )}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Asunto del email *</label>
        <input style={inputStyle} value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Ej: 🎉 Novedades de TodasMisCosas — Mayo 2026" />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
          <label style={{ ...labelStyle, margin: 0 }}>Cuerpo del email (HTML) *</label>
          <button type="button" onClick={() => setPreview(p => !p)}
            style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '.75rem', cursor: 'pointer' }}>
            {preview ? '✏️ Editar' : '👁 Preview'}
          </button>
        </div>
        {preview ? (
          <div style={{
            border: '1px solid var(--border)', borderRadius: 'var(--r2)',
            background: '#fff', padding: '1rem', minHeight: 220,
            fontSize: '.85rem', lineHeight: 1.6,
          }}
            dangerouslySetInnerHTML={{ __html: cuerpo }}
          />
        ) : (
          <textarea
            style={{ ...inputStyle, minHeight: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: '.82rem' }}
            value={cuerpo}
            onChange={e => setCuerpo(e.target.value)}
            placeholder={'<h2>¡Novedades del mes!</h2>\n<p>Este mes incorporamos...</p>'}
          />
        )}
        <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: '.25rem' }}>
          Podés usar HTML básico: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;a href="..."&gt;, &lt;ul&gt;/&lt;li&gt;, &lt;img&gt;
        </div>
      </div>

      {/* Programación */}
      <div style={{
        background: 'var(--surface2)', border: `1px solid ${progActiva ? 'rgba(59,130,246,.4)' : 'var(--border)'}`,
        borderRadius: 'var(--r3)', padding: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: progActiva ? '1rem' : 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '.88rem' }}>
            <input type="checkbox" checked={progActiva} onChange={e => setProgActiva(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--orange)', cursor: 'pointer' }} />
            📅 Programar envío automático
          </label>
          {!progActiva && <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>— incluye fines de semana y feriados</span>}
        </div>

        {progActiva && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              {(['unica','semanal','mensual'] as const).map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.85rem' }}>
                  <input type="radio" name="prog_tipo" value={t} checked={progTipo === t} onChange={() => setProgTipo(t)}
                    style={{ accentColor: 'var(--orange)' }} />
                  {t === 'unica' ? '📆 Una vez' : t === 'semanal' ? '🔁 Semanal' : '📅 Mensual'}
                </label>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '.75rem' }}>
              {progTipo === 'unica' && (
                <div>
                  <label style={labelStyle}>Fecha de envío</label>
                  <input type="date" style={inputStyle} value={progFecha} onChange={e => setProgFecha(e.target.value)} />
                </div>
              )}
              {progTipo === 'semanal' && (
                <div>
                  <label style={labelStyle}>Día de la semana</label>
                  <select style={inputStyle} value={progDiaSem} onChange={e => setProgDiaSem(Number(e.target.value))}>
                    {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              {progTipo === 'mensual' && (
                <div>
                  <label style={labelStyle}>Día del mes</label>
                  <select style={inputStyle} value={progDiaMes} onChange={e => setProgDiaMes(Number(e.target.value))}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Hora (Buenos Aires)</label>
                <input type="time" style={inputStyle} value={progHora} onChange={e => setProgHora(e.target.value)} />
              </div>
            </div>

            <div style={{ fontSize: '.76rem', color: '#3b82f6', background: 'rgba(59,130,246,.08)', borderRadius: 'var(--r1)', padding: '.5rem .8rem' }}>
              ℹ️ El envío se ejecuta automáticamente en la hora indicada (hora de Buenos Aires), incluyendo sábados, domingos y feriados.
              {progTipo === 'unica' && progFecha && ` Fecha programada: ${progFecha} a las ${progHora}.`}
              {progTipo === 'semanal' && ` Todos los ${DIAS_SEMANA[progDiaSem]} a las ${progHora}.`}
              {progTipo === 'mensual' && ` El día ${progDiaMes} de cada mes a las ${progHora}.`}
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
        <Button onClick={guardar} loading={loading} variant="secondary" size="sm">
          💾 {inicial ? 'Guardar cambios' : 'Guardar borrador'}
        </Button>
        {inicial && inicial.estado !== 'enviada' && (
          <Button onClick={enviarAhora} loading={sending} variant="primary" size="sm">
            🚀 Enviar ahora {totalDest !== null ? `(${totalDest})` : ''}
          </Button>
        )}
        {onCancelar && (
          <button type="button" onClick={onCancelar}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.82rem', cursor: 'pointer' }}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-tab: Lista de campañas ─────────────────────────────────
function ListaCampanas({ token, campanas, onEditar, onEliminar, onRefresh }: {
  token: string;
  campanas: Campana[];
  onEditar: (c: Campana) => void;
  onEliminar: (id: string) => void;
  onRefresh: () => void;
}) {
  const [logOpen, setLogOpen] = useState<string | null>(null);
  const [log, setLog]         = useState<LogItem[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  async function verLog(id: string) {
    if (logOpen === id) { setLogOpen(null); return; }
    setLogLoading(true);
    setLogOpen(id);
    try {
      const res = await fetch(`/api/mailing/campanas/${id}/log`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLog(await res.json());
    } finally {
      setLogLoading(false);
    }
  }

  if (campanas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text3)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📭</div>
        <div>Todavía no hay campañas. ¡Redactá la primera!</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      {campanas.map(c => (
        <div key={c.id} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r3)', padding: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>{c.nombre}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{c.asunto}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '.3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>📬 {DEST_LABEL[c.destinatarios]}</span>
                {c.estado === 'enviada' && <span>✅ {c.total_enviados} enviados · {formatFecha(c.enviada_en)}</span>}
                {c.estado === 'programada' && c.prog_activa && (
                  <span style={{ color: '#3b82f6' }}>
                    ⏰ {c.prog_tipo === 'unica' ? `${c.prog_fecha} a las ${c.prog_hora}` : c.prog_tipo === 'semanal' ? `${DIAS_SEMANA[c.prog_dia_semana ?? 1]} ${c.prog_hora}` : `Día ${c.prog_dia_mes} · ${c.prog_hora}`}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{
                background: `${ESTADO_COLOR[c.estado]}22`, color: ESTADO_COLOR[c.estado],
                border: `1px solid ${ESTADO_COLOR[c.estado]}44`,
                borderRadius: '999px', padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 700,
              }}>
                {ESTADO_LABEL[c.estado]}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem', flexWrap: 'wrap' }}>
            {c.estado !== 'enviada' && (
              <button onClick={() => onEditar(c)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r1)', padding: '.3rem .7rem', fontSize: '.75rem', cursor: 'pointer', color: 'var(--text2)' }}>
                ✏️ Editar
              </button>
            )}
            {c.estado === 'enviada' && (
              <button onClick={() => verLog(c.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r1)', padding: '.3rem .7rem', fontSize: '.75rem', cursor: 'pointer', color: 'var(--text2)' }}>
                📋 {logOpen === c.id ? 'Cerrar log' : 'Ver log'}
              </button>
            )}
            <button onClick={() => onEliminar(c.id)}
              style={{ background: 'none', border: 'none', fontSize: '.72rem', cursor: 'pointer', color: 'var(--text3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              🗑️ Eliminar
            </button>
          </div>

          {logOpen === c.id && (
            <div style={{ marginTop: '.75rem', background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: '.75rem', maxHeight: 240, overflowY: 'auto' }}>
              {logLoading ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem' }}>Cargando…</div>
              ) : log.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem' }}>Sin registros</div>
              ) : (
                <table style={{ width: '100%', fontSize: '.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '.3rem' }}>Email</th>
                      <th style={{ textAlign: 'left', paddingBottom: '.3rem' }}>Estado</th>
                      <th style={{ textAlign: 'left', paddingBottom: '.3rem' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '.25rem 0', color: l.estado === 'error' ? 'var(--red)' : 'var(--text)' }}>{l.email}</td>
                        <td style={{ padding: '.25rem 0', color: l.estado === 'ok' ? '#22c55e' : 'var(--red)' }}>
                          {l.estado === 'ok' ? '✓' : `✗ ${l.error_msg || ''}`}
                        </td>
                        <td style={{ padding: '.25rem 0', color: 'var(--text3)' }}>{formatFecha(l.enviado_en)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
export function TabMarketing({ token }: { token: string }) {
  const [subTab, setSubTab]       = useState<'redactar' | 'campanas'>('campanas');
  const [campanas, setCampanas]   = useState<Campana[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editando, setEditando]   = useState<Campana | undefined>(undefined);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mailing/campanas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCampanas(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  function handleGuardado(c: Campana) {
    setCampanas(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      return idx >= 0 ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev];
    });
    setEditando(c);
    setSubTab('campanas');
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminás esta campaña?')) return;
    await fetch(`/api/mailing/campanas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setCampanas(prev => prev.filter(c => c.id !== id));
    if (editando?.id === id) setEditando(undefined);
  }

  function handleEditar(c: Campana) {
    setEditando(c);
    setSubTab('redactar');
  }

  function handleNueva() {
    setEditando(undefined);
    setSubTab('redactar');
  }

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--orange)' : 'var(--surface2)',
    color: active ? '#fff' : 'var(--text2)',
    border: 'none', borderRadius: 'var(--r2)',
    padding: '.45rem 1rem', cursor: 'pointer',
    fontSize: '.82rem', fontWeight: active ? 700 : 400,
    transition: 'all .15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>
            📣 Marketing · Difusión · Campañas
          </h2>
          <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.2rem' }}>
            Enviá newsletters y novedades a tus Oferentes y Demandantes
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={handleNueva}>
          + Nueva campaña
        </Button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '.4rem' }}>
        <button style={subTabStyle(subTab === 'campanas')} onClick={() => setSubTab('campanas')}>
          📋 Campañas {campanas.length > 0 && `(${campanas.length})`}
        </button>
        <button style={subTabStyle(subTab === 'redactar')} onClick={() => setSubTab('redactar')}>
          ✏️ {editando ? `Editando: ${editando.nombre}` : 'Nueva campaña'}
        </button>
      </div>

      {/* Contenido */}
      {subTab === 'redactar' ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r3)', padding: '1.25rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
            {editando ? `✏️ Editando: ${editando.nombre}` : '✉️ Redactar nueva campaña'}
          </h3>
          <FormCampana
            token={token}
            inicial={editando}
            onGuardado={handleGuardado}
            onCancelar={editando ? () => { setEditando(undefined); setSubTab('campanas'); } : undefined}
          />
        </div>
      ) : (
        loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>Cargando…</div>
        ) : (
          <ListaCampanas
            token={token}
            campanas={campanas}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            onRefresh={cargar}
          />
        )
      )}

    </div>
  );
}
