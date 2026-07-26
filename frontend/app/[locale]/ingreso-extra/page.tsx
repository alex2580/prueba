'use client';

import { useState } from 'react';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { Link } from '@/navigation';

type Zona = 'CABA' | 'GBA';

type TipoEspacio = {
  value: string;
  label: string;
  icon: string;
  rangos: Record<Zona, [number, number]>;
};

const TIPOS: TipoEspacio[] = [
  { value: 'cochera', label: 'Cochera', icon: '🚗', rangos: { GBA: [30000, 60000], CABA: [80000, 150000] } },
  { value: 'estante', label: 'Baulera / Estantería', icon: '📦', rangos: { GBA: [25000, 50000], CABA: [50000, 90000] } },
  { value: 'habitacion', label: 'Habitación', icon: '🛏️', rangos: { GBA: [35000, 70000], CABA: [60000, 120000] } },
  { value: 'galpon', label: 'Galpón / Depósito', icon: '🏭', rangos: { GBA: [50000, 150000], CABA: [100000, 250000] } },
];

function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function IngresoExtraPage() {
  const [tipo, setTipo] = useState<string | null>(null);
  const [zona, setZona] = useState<Zona>('CABA');

  const seleccionado = TIPOS.find(t => t.value === tipo);
  const rango = seleccionado?.rangos[zona];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem 5rem' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>

          {/* ── HERO ── */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>💰</div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: 'var(--text)', marginBottom: '.75rem' }}>
              Lo que no usás, puede pagar lo que sí necesitás
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '.95rem', maxWidth: 460, margin: '0 auto' }}>
              Esa baulera, ese garage, ese cuarto vacío — hoy no te dan nada. Elegí tu tipo de espacio y mirá cuánto podría rendirte por mes.
            </p>
          </div>

          {/* ── CALCULADORA ── */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 20, padding: '2rem 1.75rem' }}>

            <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', marginBottom: '.6rem' }}>
              ¿Qué tipo de espacio tenés?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.5rem' }}>
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  style={{
                    padding: '1rem .75rem', borderRadius: 14, border: '2px solid',
                    borderColor: tipo === t.value ? 'var(--orange)' : 'var(--border)',
                    background: tipo === t.value ? '#FFF7ED' : 'var(--bg)',
                    color: tipo === t.value ? 'var(--orange)' : 'var(--text2)',
                    fontWeight: tipo === t.value ? 700 : 400,
                    fontSize: '.88rem', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>{t.icon}</div>
                  {t.label}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', marginBottom: '.6rem' }}>
              ¿Dónde está?
            </label>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: rango ? '1.75rem' : 0 }}>
              {(['CABA', 'GBA'] as Zona[]).map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZona(z)}
                  style={{
                    flex: 1, padding: '.65rem', borderRadius: 10, border: '1.5px solid',
                    borderColor: zona === z ? 'var(--orange)' : 'var(--border)',
                    background: zona === z ? '#FFF7ED' : 'var(--bg)',
                    color: zona === z ? 'var(--orange)' : 'var(--text2)',
                    fontWeight: zona === z ? 700 : 400,
                    fontSize: '.85rem', cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                  }}
                >
                  {z === 'CABA' ? 'CABA' : 'GBA / Conurbano'}
                </button>
              ))}
            </div>

            {rango && (
              <div style={{ background: '#FFF7ED', border: '1.5px solid var(--orange)', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.4rem' }}>Podrías ganar aproximadamente</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--orange)', marginBottom: '.4rem' }}>
                  {formatARS(rango[0])} – {formatARS(rango[1])}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>por mes</div>
              </div>
            )}

            <p style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '1rem', lineHeight: 1.5 }}>
              Estimado a partir de referencias de mercado ajustadas al modelo entre particulares de TMC. El valor real depende de tu zona, tamaño y estado del espacio — vos ponés el precio final al publicar.
            </p>

            <Link
              href="/waitlist?tipo=proveedor"
              className="btn-primary"
              style={{ display: 'block', textAlign: 'center', width: '100%', padding: '.9rem', fontSize: '1rem', fontWeight: 800, borderRadius: 12, marginTop: '1.5rem', textDecoration: 'none' }}
            >
              Publicá tu espacio →
            </Link>
          </div>

          {/* ── CONFIANZA ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '.4rem' }}>🔒</div>
              <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', marginBottom: '.3rem' }}>Depósito de garantía</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>No cobrás en efectivo con un desconocido — todo queda respaldado dentro de la plataforma.</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '.4rem' }}>🎁</div>
              <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', marginBottom: '.3rem' }}>0% comisión 3 meses</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>Beneficio para los primeros proveedores que se sumen a la plataforma.</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
