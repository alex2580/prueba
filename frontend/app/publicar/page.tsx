'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { espaciosAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { BARRIOS } from '@/types';
import type { EspacioTipo } from '@/types';

export default function PublicarPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    barrio: '',
    m2: '',
    tipo: 'exclusivo' as EspacioTipo,
    precio_dia: '',
    precio_mes: '',
    descripcion: '',
    lat: '',
    lng: '',
  });

  const [fotos, setFotos]       = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.tipo === 'demandante')) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 10);
    setFotos(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const espacio = await espaciosAPI.crear({
        nombre: form.nombre,
        direccion: form.direccion,
        barrio: form.barrio,
        m2: Number(form.m2),
        tipo: form.tipo,
        precio_dia: Number(form.precio_dia),
        precio_mes: Number(form.precio_mes),
        descripcion: form.descripcion,
        lat: Number(form.lat) || -34.6037,
        lng: Number(form.lng) || -58.3816,
      }, token);

      // Upload fotos
      if (fotos.length > 0) {
        await espaciosAPI.subirFotos(espacio.id, fotos, token);
      }

      router.push('/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar el espacio');
    } finally {
      setLoading(false);
    }
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  if (authLoading) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="site-header">
        <div className="logo" onClick={() => router.push('/')}>
          <span style={{ fontSize: '1.4rem' }}>📦</span>
          <span>Todas<span style={{ color: 'var(--orange)' }}>Mis</span>Cosas</span>
        </div>
        <div />
        <button className="nav-btn" onClick={() => router.push('/panel')}>← Mi Panel</button>
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: '.4rem' }}>
              📦 Publicar espacio
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '.92rem' }}>
              Completá los datos de tu espacio para que los demandantes puedan encontrarlo.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.2rem' }}>
            {/* Tipo */}
            <div>
              <label className="form-label">Tipo de espacio</label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                {(['exclusivo', 'compartido'] as EspacioTipo[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('tipo', t)}
                    style={{
                      flex: 1, padding: '.6rem 1rem',
                      background: form.tipo === t ? 'rgba(232,98,42,.1)' : 'var(--surface2)',
                      border: `2px solid ${form.tipo === t ? 'var(--orange)' : 'var(--border)'}`,
                      borderRadius: 'var(--r2)', color: form.tipo === t ? 'var(--orange)' : 'var(--text2)',
                      fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer',
                    }}
                  >
                    {t === 'exclusivo' ? '🔒 Exclusivo' : '🤝 Compartido'}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="form-label">Nombre del espacio</label>
              <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
                placeholder="Ej: Cochera techada Palermo" required />
            </div>

            {/* Dirección + Barrio */}
            <div className="form-row">
              <div>
                <label className="form-label">Dirección</label>
                <input type="text" value={form.direccion} onChange={e => set('direccion', e.target.value)}
                  placeholder="Thames 1842, CABA" required />
              </div>
              <div>
                <label className="form-label">Barrio</label>
                <select value={form.barrio} onChange={e => set('barrio', e.target.value)} required>
                  <option value="">Seleccioná barrio</option>
                  {BARRIOS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* M2 */}
            <div>
              <label className="form-label">Superficie (m²)</label>
              <input type="number" value={form.m2} onChange={e => set('m2', e.target.value)}
                placeholder="18" min="1" required />
            </div>

            {/* Precios */}
            <div className="form-row">
              <div>
                <label className="form-label">Precio por día ($)</label>
                <input type="number" value={form.precio_dia} onChange={e => set('precio_dia', e.target.value)}
                  placeholder="850" min="0" required />
              </div>
              <div>
                <label className="form-label">Precio por mes ($)</label>
                <input type="number" value={form.precio_mes} onChange={e => set('precio_mes', e.target.value)}
                  placeholder="18000" min="0" required />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="form-label">Descripción</label>
              <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                placeholder="Describí tu espacio: acceso, seguridad, características especiales…"
                rows={4} />
            </div>

            {/* Coordenadas */}
            <div>
              <label className="form-label">Coordenadas (opcional)</label>
              <div className="form-row">
                <input type="number" value={form.lat} onChange={e => set('lat', e.target.value)}
                  placeholder="Latitud (-34.5885)" step="any" />
                <input type="number" value={form.lng} onChange={e => set('lng', e.target.value)}
                  placeholder="Longitud (-58.4278)" step="any" />
              </div>
              <div className="form-hint">Si no las sabés, se usarán coordenadas aproximadas del barrio.</div>
            </div>

            {/* Fotos */}
            <div>
              <label className="form-label">Fotos (máx. 10)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotoChange}
                style={{ padding: '.5rem', borderRadius: 'var(--r2)', cursor: 'pointer' }}
              />
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.6rem' }}>
                  {previews.map((url, i) => (
                    <img key={i} src={url} alt=""
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--r1)', border: '2px solid var(--border)' }} />
                  ))}
                </div>
              )}
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => router.push('/panel')} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading} style={{ flex: 2 }}>
                📦 Publicar espacio
              </Button>
            </div>

            <p style={{ fontSize: '.75rem', color: 'var(--text3)', textAlign: 'center', marginTop: '.25rem' }}>
              Al publicar aceptás los{' '}
              <a href="/legal.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
                Términos y Condiciones
              </a>
              {' '}de TodasMisCosas.com
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
