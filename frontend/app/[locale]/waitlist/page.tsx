'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { waitlistAPI } from '@/lib/api';
import type { WaitlistTipo, WaitlistPayload } from '@/types';

type Paso = 'selector' | 'form' | 'confirmacion';

const TIPOS_ESPACIO = ['Cochera / Garage', 'Habitación', 'Depósito / Sótano', 'Galpón', 'Otro'];
const PARA_QUE = ['Muebles / mudanza', 'Cosas del trabajo', 'Bicicleta / moto', 'Auto', 'Otro'];
const DURACIONES = ['Menos de 1 mes', '1 a 3 meses', '3 a 6 meses', 'Indefinido'];

function YaAnotado() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: 'var(--text)', marginBottom: '1.25rem' }}>
            ¡Ya estás en la lista!
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.8, maxWidth: 420, margin: '0 auto 1.5rem' }}>
            Tu lugar está reservado. Cuando estemos operativos en tu zona, vas a ser de los primeros en saberlo — te escribimos directo al email con el acceso.
          </p>
          <p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.8, maxWidth: 420, margin: '0 auto 2rem' }}>
            Mientras tanto, si conocés a alguien que tenga espacio libre o que necesite guardar algo, compartile el link. Cada persona que se suma nos ayuda a llegar antes a más barrios.
          </p>
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '1rem 1.5rem', display: 'inline-block', marginBottom: '2rem' }}>
            <span style={{ fontSize: '.85rem', color: 'var(--text3)' }}>🔗 </span>
            <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--orange)' }}>todasmiscosas.com/es/waitlist</span>
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--text3)' }}>— El equipo de TodasMisCosas.com</p>
          <a href="/es" style={{ display: 'inline-block', marginTop: '2rem', color: 'var(--orange)', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none' }}>
            ← Volver a la home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function WaitlistPage() {
  const searchParams = useSearchParams();
  if (searchParams.get('ya') === '1') return <YaAnotado />;

  const [paso, setPaso] = useState<Paso>('selector');
  const [tipo, setTipo] = useState<WaitlistTipo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [barrio, setBarrio] = useState('');
  const [tipoEspacio, setTipoEspacio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [paraQue, setParaQue] = useState('');
  const [duracion, setDuracion] = useState('');

  function elegirTipo(t: WaitlistTipo) {
    setTipo(t);
    setPaso('form');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son obligatorios.');
      return;
    }

    const payload: WaitlistPayload = {
      tipo: tipo!,
      nombre: nombre.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || undefined,
      barrio: barrio.trim() || undefined,
      tipo_espacio: tipoEspacio || undefined,
      descripcion: descripcion.trim() || undefined,
      para_que: paraQue || undefined,
      duracion: duracion || undefined,
    };

    setLoading(true);
    try {
      await waitlistAPI.registrar(payload);
      setPaso('confirmacion');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* ── PASO 1: Selector ── */}
          {paso === 'selector' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📦</div>
                <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: 'var(--text)', marginBottom: '.75rem' }}>
                  Lista de espera
                </h1>
                <p style={{ color: 'var(--text2)', fontSize: '.95rem', maxWidth: 400, margin: '0 auto' }}>
                  Estamos en lanzamiento. Anotate y te avisamos en cuanto el servicio esté disponible en tu zona.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  onClick={() => elegirTipo('proveedor')}
                  style={{
                    background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 16,
                    padding: '2rem 1.25rem', cursor: 'pointer', textAlign: 'center',
                    transition: 'border-color .15s, box-shadow .15s',
                    fontFamily: 'Sora, sans-serif',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(232,98,42,.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🏠</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '.4rem' }}>Tengo un espacio</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>Quiero alquilar mi cochera, habitación o depósito</div>
                  <div style={{ marginTop: '1rem', fontSize: '.75rem', fontWeight: 700, color: 'var(--orange)' }}>0% comisión los primeros 3 meses →</div>
                </button>

                <button
                  onClick={() => elegirTipo('cliente')}
                  style={{
                    background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 16,
                    padding: '2rem 1.25rem', cursor: 'pointer', textAlign: 'center',
                    transition: 'border-color .15s, box-shadow .15s',
                    fontFamily: 'Sora, sans-serif',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(232,98,42,.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📦</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '.4rem' }}>Busco dónde guardar</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>Necesito espacio de almacenamiento en mi barrio</div>
                  <div style={{ marginTop: '1rem', fontSize: '.75rem', fontWeight: 700, color: 'var(--orange)' }}>20% de descuento tu primer mes →</div>
                </button>
              </div>
            </>
          )}

          {/* ── PASO 2: Formulario ── */}
          {paso === 'form' && tipo && (
            <>
              <button
                onClick={() => { setPaso('selector'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '.4rem', padding: 0, fontFamily: 'Sora, sans-serif' }}
              >
                ← Volver
              </button>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: tipo === 'proveedor' ? '#FFF7ED' : '#EFF6FF', border: `1.5px solid ${tipo === 'proveedor' ? 'var(--orange)' : 'var(--blue)'}`, borderRadius: 8, padding: '.4rem .9rem', fontSize: '.82rem', fontWeight: 700, color: tipo === 'proveedor' ? 'var(--orange)' : 'var(--blue)', marginBottom: '1rem' }}>
                  {tipo === 'proveedor' ? '🏠 Proveedor de espacio' : '📦 Busco dónde guardar'}
                </div>
                <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,3.5vw,2rem)', color: 'var(--text)', marginBottom: '.4rem' }}>
                  {tipo === 'proveedor' ? 'Contanos sobre tu espacio' : 'Contanos qué necesitás'}
                </h1>
                <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>Son 2 minutos. Te avisamos cuando abramos en tu zona.</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                <div>
                  <label style={labelStyle}>Nombre y apellido *</label>
                  <input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Martina García" required />
                </div>

                <div>
                  <label style={labelStyle}>Email *</label>
                  <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp o teléfono <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
                  <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+54 11 1234-5678" />
                </div>

                <div>
                  <label style={labelStyle}>{tipo === 'proveedor' ? '¿En qué barrio está el espacio?' : '¿En qué barrio buscás?'} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
                  <input style={inputStyle} value={barrio} onChange={e => setBarrio(e.target.value)} placeholder="Ej: Palermo, Caballito, San Isidro..." />
                </div>

                {tipo === 'proveedor' && (
                  <>
                    <div>
                      <label style={labelStyle}>¿Qué tipo de espacio tenés? <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.4rem' }}>
                        {TIPOS_ESPACIO.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTipoEspacio(tipoEspacio === t ? '' : t)}
                            style={{
                              padding: '.45rem 1rem', borderRadius: 20, border: '1.5px solid',
                              borderColor: tipoEspacio === t ? 'var(--orange)' : 'var(--border)',
                              background: tipoEspacio === t ? '#FFF7ED' : 'var(--surface)',
                              color: tipoEspacio === t ? 'var(--orange)' : 'var(--text2)',
                              fontWeight: tipoEspacio === t ? 700 : 400,
                              fontSize: '.83rem', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                            }}
                          >{t}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>¿Algo más que quieras contarnos? <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(acceso, condiciones, disponibilidad…)</span></label>
                      <textarea
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                        value={descripcion}
                        onChange={e => setDescripcion(e.target.value)}
                        placeholder="Ej: Cochera techada con portón eléctrico, disponible las 24hs..."
                      />
                    </div>
                  </>
                )}

                {tipo === 'cliente' && (
                  <>
                    <div>
                      <label style={labelStyle}>¿Para qué necesitás el espacio? <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.4rem' }}>
                        {PARA_QUE.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setParaQue(paraQue === p ? '' : p)}
                            style={{
                              padding: '.45rem 1rem', borderRadius: 20, border: '1.5px solid',
                              borderColor: paraQue === p ? 'var(--orange)' : 'var(--border)',
                              background: paraQue === p ? '#FFF7ED' : 'var(--surface)',
                              color: paraQue === p ? 'var(--orange)' : 'var(--text2)',
                              fontWeight: paraQue === p ? 700 : 400,
                              fontSize: '.83rem', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                            }}
                          >{p}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>¿Por cuánto tiempo? <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.4rem' }}>
                        {DURACIONES.map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDuracion(duracion === d ? '' : d)}
                            style={{
                              padding: '.45rem 1rem', borderRadius: 20, border: '1.5px solid',
                              borderColor: duracion === d ? 'var(--orange)' : 'var(--border)',
                              background: duracion === d ? '#FFF7ED' : 'var(--surface)',
                              color: duracion === d ? 'var(--orange)' : 'var(--text2)',
                              fontWeight: duracion === d ? 700 : 400,
                              fontSize: '.83rem', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                            }}
                          >{d}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '.75rem 1rem', color: '#DC2626', fontSize: '.85rem' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '.9rem', fontSize: '1rem', fontWeight: 800, borderRadius: 12, marginTop: '.25rem' }}
                >
                  {loading ? 'Enviando...' : tipo === 'proveedor' ? '¡Quiero ser Proveedor! →' : '¡Anotarme! →'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--text3)' }}>
                  Sin spam. Solo te contactamos cuando tengamos novedades en tu zona.
                </p>
              </form>
            </>
          )}

          {/* ── PASO 3: Confirmación ── */}
          {paso === 'confirmacion' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: 'var(--text)', marginBottom: '1rem' }}>
                {tipo === 'proveedor' ? `¡Estás en la lista, ${nombre}!` : `¡Listo, ${nombre}!`}
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: '.95rem', maxWidth: 400, margin: '0 auto 2rem', lineHeight: 1.7 }}>
                {tipo === 'proveedor'
                  ? 'Sos de los primeros proveedores de TodasMisCosas.com. Te avisamos en cuanto abramos en tu zona. También te mandamos un email de confirmación.'
                  : 'Estamos armando la red de espacios en tu barrio. Te avisamos en cuanto tengamos opciones. Revisá tu email para la confirmación.'}
              </p>

              {tipo === 'proveedor' && (
                <div style={{ background: '#FFF7ED', border: '1.5px solid var(--orange)', borderRadius: 14, padding: '1.25rem 1.5rem', maxWidth: 380, margin: '0 auto 2rem', textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: 'var(--orange)', fontSize: '.9rem', marginBottom: '.4rem' }}>🎁 Tu beneficio early</div>
                  <div style={{ fontSize: '.87rem', color: 'var(--text)', lineHeight: 1.6 }}>0% de comisión los primeros 3 meses, solo para los primeros proveedores que se sumen.</div>
                </div>
              )}

              {tipo === 'cliente' && (
                <div style={{ background: '#EFF6FF', border: '1.5px solid var(--blue)', borderRadius: 14, padding: '1.25rem 1.5rem', maxWidth: 380, margin: '0 auto 2rem', textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: 'var(--blue)', fontSize: '.9rem', marginBottom: '.4rem' }}>🎁 Tu beneficio early</div>
                  <div style={{ fontSize: '.87rem', color: 'var(--text)', lineHeight: 1.6 }}>20% de descuento en tu primer mes, solo para los primeros clientes.</div>
                </div>
              )}

              <p style={{ color: 'var(--text3)', fontSize: '.83rem' }}>
                ¿Conocés a alguien que pueda sumarse? Compartí el link 👇
              </p>
              <a
                href="/es"
                style={{ display: 'inline-block', marginTop: '1.5rem', color: 'var(--orange)', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none' }}
              >
                ← Volver a la home
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Sora, sans-serif',
  fontWeight: 700,
  fontSize: '.85rem',
  color: 'var(--text)',
  marginBottom: '.4rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '.7rem 1rem',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: '.92rem',
  fontFamily: 'Sora, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};
