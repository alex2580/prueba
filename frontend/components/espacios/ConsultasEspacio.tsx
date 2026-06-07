'use client';

import { useState, useEffect, useCallback } from 'react';
import { detectViolation, getViolationMessage } from '@/lib/contactFilter';
import { Button } from '@/components/ui/Button';

interface Consulta {
  id: number;
  autor_nombre: string;
  pregunta: string;
  respuesta: string | null;
  respuesta_at: string | null;
  created_at: string;
}

interface ConsultasEspacioProps {
  espacioId: string;
  token: string | null;
  userId: string | null;
  oferenteId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function ConsultasEspacio({ espacioId, token, userId, oferenteId }: ConsultasEspacioProps) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [pregunta, setPregunta] = useState('');
  const [warning, setWarning] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/espacios/${espacioId}/consultas`);
      const data = await res.json();
      setConsultas(Array.isArray(data) ? data : []);
    } catch {
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  }, [espacioId]);

  useEffect(() => { cargar(); }, [cargar]);

  function handleChange(val: string) {
    setWarning('');
    setError('');
    setEnviado(false);
    const violation = detectViolation(val);
    if (violation) {
      setWarning(getViolationMessage(violation));
      return;
    }
    setPregunta(val);
  }

  async function handleEnviar() {
    if (!pregunta.trim() || !token) return;
    const violation = detectViolation(pregunta);
    if (violation) { setWarning(getViolationMessage(violation)); return; }
    setEnviando(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/espacios/${espacioId}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pregunta: pregunta.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).error || 'Error al enviar la consulta');
        return;
      }
      setPregunta('');
      setEnviado(true);
      await cargar();
    } catch {
      setError('Error de conexión');
    } finally {
      setEnviando(false);
    }
  }

  const esOferente = userId === oferenteId;
  const puedePreguntar = token && !esOferente;

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>
        💬 Consultas sobre este espacio
      </h3>

      {/* Formulario de pregunta */}
      {puedePreguntar && (
        <div style={{ marginBottom: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--r2)', padding: '1rem', border: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '.5rem' }}>
            Hacé tu consulta
          </label>
          <textarea
            value={pregunta}
            onChange={e => handleChange(e.target.value)}
            placeholder="¿Tiene vigilancia? ¿Se puede acceder los fines de semana?…"
            rows={3}
            style={{
              width: '100%', resize: 'vertical', fontSize: '.88rem',
              padding: '.6rem .8rem', borderRadius: 'var(--r2)',
              background: 'var(--surface2)', border: `1.5px solid ${warning ? 'var(--red)' : 'var(--border)'}`,
              boxSizing: 'border-box',
            }}
          />
          {warning && (
            <div style={{ fontSize: '.78rem', color: 'var(--red)', marginTop: '.35rem', fontWeight: 600 }}>
              ⚠️ {warning}
            </div>
          )}
          {error && (
            <div style={{ fontSize: '.78rem', color: 'var(--red)', marginTop: '.35rem' }}>{error}</div>
          )}
          {enviado && (
            <div style={{ fontSize: '.78rem', color: 'var(--mint)', marginTop: '.35rem', fontWeight: 600 }}>
              ✅ Consulta enviada. El proveedor recibirá una notificación por email.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.6rem' }}>
            <Button
              onClick={handleEnviar}
              loading={enviando}
              disabled={!pregunta.trim() || !!warning}
              size="sm"
            >
              Enviar consulta →
            </Button>
          </div>
        </div>
      )}

      {!token && (
        <p style={{ fontSize: '.83rem', color: 'var(--text3)', marginBottom: '1rem' }}>
          Iniciá sesión para hacer una consulta.
        </p>
      )}

      {/* Lista de consultas */}
      {loading ? (
        <p style={{ color: 'var(--text3)', fontSize: '.85rem' }}>Cargando consultas…</p>
      ) : consultas.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: '.85rem' }}>Todavía no hay consultas. ¡Sé el primero!</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {consultas.map(c => (
            <div key={c.id} style={{ background: 'var(--surface)', borderRadius: 'var(--r2)', padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--orange)', background: 'rgba(232,98,42,.1)', borderRadius: '99px', padding: '.15rem .55rem', whiteSpace: 'nowrap' }}>
                  {c.autor_nombre}
                </span>
                <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--text)', lineHeight: 1.5 }}>{c.pregunta}</p>
              </div>
              {c.respuesta ? (
                <div style={{ marginTop: '.6rem', paddingLeft: '.9rem', borderLeft: '3px solid var(--mint)' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--mint)', marginBottom: '.2rem' }}>
                    Respuesta del oferente
                  </div>
                  <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.5 }}>{c.respuesta}</p>
                </div>
              ) : (
                <div style={{ marginTop: '.5rem', paddingLeft: '.9rem', borderLeft: '3px solid var(--border)' }}>
                  <span style={{ fontSize: '.75rem', color: 'var(--text3)', fontStyle: 'italic' }}>Pendiente de respuesta</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
