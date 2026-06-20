'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { formatFechaHora } from '@/lib/utils';
import { detectViolation, getViolationMessage } from '@/lib/contactFilter';

interface ConsultaPublica {
  id: number;
  autor_nombre: string;
  pregunta: string;
  respuesta: string | null;
  respuesta_at: string | null;
  created_at: string;
}

interface ConsultasEspacioProps {
  espacioId: string;
  token?: string | null;
  userId?: string | null;
  oferenteId?: string | null;
  showHistorial?: boolean;
}

export function ConsultasEspacio({ espacioId, token, userId, oferenteId, showHistorial = true }: ConsultasEspacioProps) {
  const [consultas, setConsultas] = useState<ConsultaPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [pregunta, setPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const cargar = useCallback(async () => {
    if (!showHistorial) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/espacios/${espacioId}/consultas`);
      const data = await res.json();
      setConsultas(Array.isArray(data) ? data : []);
    } catch {
      // silencioso — no bloquear la página si falla
    } finally {
      setLoading(false);
    }
  }, [espacioId, showHistorial]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleEnviar() {
    if (!pregunta.trim() || !token) return;
    const v = detectViolation(pregunta);
    if (v) { setError(getViolationMessage(v)); return; }
    setEnviando(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/espacios/${espacioId}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pregunta: pregunta.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Error ${res.status}`); return; }
      setPregunta('');
      setOk(true);
      setTimeout(() => setOk(false), 4000);
      cargar();
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const esProveedor = !!userId && userId === oferenteId;

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
      <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>
        ❓ Preguntas y respuestas
      </h3>

      {/* Formulario para enviar pregunta */}
      {token && !esProveedor && (
        <div style={{ marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
          <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: '.4rem', fontWeight: 600 }}>
            Hacé tu pregunta sobre este espacio
          </label>
          <textarea
            value={pregunta}
            onChange={e => {
              const val = e.target.value;
              const v = detectViolation(val);
              if (v) { setError(getViolationMessage(v)); return; }
              setError('');
              setPregunta(val);
            }}
            placeholder="¿Tiene luz? ¿Hay acceso las 24hs? ¿Se puede guardar electrónica?"
            rows={2}
            style={{
              width: '100%', resize: 'vertical', fontSize: '.85rem',
              padding: '.5rem .7rem', borderRadius: 'var(--r2)',
              background: 'var(--surface2)', border: '1.5px solid var(--border)',
              boxSizing: 'border-box', marginBottom: '.5rem',
            }}
          />
          {error && (
            <p style={{ color: 'var(--red)', fontSize: '.78rem', margin: '0 0 .5rem' }}>{error}</p>
          )}
          {ok && (
            <p style={{ color: 'var(--mint)', fontSize: '.78rem', margin: '0 0 .5rem' }}>
              ✅ Consulta enviada. El proveedor recibirá una notificación.
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="sm" onClick={handleEnviar} loading={enviando} disabled={!pregunta.trim()}>
              Enviar pregunta →
            </Button>
          </div>
        </div>
      )}

      {!token && (
        <p style={{ fontSize: '.82rem', color: 'var(--text3)', marginBottom: '1.2rem' }}>
          <a href="/es/auth/login" style={{ color: 'var(--orange)', fontWeight: 600 }}>Iniciá sesión</a> para hacer una pregunta.
        </p>
      )}

      {/* Listado de consultas */}
      {showHistorial && (loading ? (
        <p style={{ color: 'var(--text3)', fontSize: '.85rem' }}>Cargando consultas…</p>
      ) : consultas.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: '.85rem' }}>
          Todavía no hay preguntas sobre este espacio. ¡Sé el primero en consultar!
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {consultas.map(c => (
            <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
              {/* Pregunta */}
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', marginBottom: c.respuesta ? '.75rem' : 0 }}>
                  <Avatar nombre={c.autor_nombre} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                      <span style={{ fontSize: '.8rem', fontWeight: 700 }}>{c.autor_nombre.split(' ')[0]}</span>
                      <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{formatFechaHora(c.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{c.pregunta}</p>
                  </div>
                </div>

                {/* Respuesta */}
                {c.respuesta && (
                  <div style={{
                    marginTop: '.75rem',
                    background: 'var(--surface2)',
                    borderLeft: '3px solid var(--orange)',
                    borderRadius: '0 var(--r2) var(--r2) 0',
                    padding: '.75rem 1rem',
                  }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--orange)', fontWeight: 700, marginBottom: '.3rem' }}>
                      Respuesta del proveedor
                      {c.respuesta_at && (
                        <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: '.4rem' }}>
                          · {formatFechaHora(c.respuesta_at)}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{c.respuesta}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
