'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import { useAuth } from '@/hooks/useAuth';
import { espaciosAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { SiteLogo } from '@/components/ui/SiteLogo';
import type { EspacioTipo } from '@/types';
import { CalendarioDisponibilidad, type Disponibilidad } from '@/components/publicar/CalendarioDisponibilidad';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

export default function PublicarPage() {
  const router = useRouter();
  const { user, token, login, register, loading: authLoading, error: authError } = useAuth();

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

  const [fotos, setFotos]               = useState<File[]>([]);
  const [previews, setPreviews]         = useState<string[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>({});
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [authModal, setAuthModal]       = useState(false);
  const [authTab, setAuthTab]           = useState<'login' | 'register'>('register');

  const direccionRef  = useRef<HTMLInputElement>(null);
  const mapPreviewRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapObjRef     = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef     = useRef<any>(null);

  // Load Google Maps + Places Autocomplete
  useEffect(() => {
    if (!MAPS_KEY) return;

    const loader = new Loader({ apiKey: MAPS_KEY, version: 'weekly' });

    loader.load().then(async (google) => {
      if (!direccionRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { Autocomplete } = await google.maps.importLibrary('places') as any;

      const autocomplete = new Autocomplete(direccionRef.current, {
        componentRestrictions: { country: 'ar' },
        fields: ['formatted_address', 'geometry', 'address_components'],
      });

      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Extraer barrio de address_components
        let barrio = '';
        for (const comp of place.address_components || []) {
          if (comp.types.includes('sublocality_level_1') || comp.types.includes('neighborhood') || comp.types.includes('locality')) {
            barrio = comp.long_name;
            break;
          }
        }

        setForm(f => ({
          ...f,
          direccion: place.formatted_address || f.direccion,
          lat: String(lat),
          lng: String(lng),
          barrio,
        }));

        // Mostrar mapa preview
        if (mapPreviewRef.current) {
          const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

          if (!mapObjRef.current) {
            mapObjRef.current = new Map(mapPreviewRef.current, {
              center: { lat, lng },
              zoom: 15,
              disableDefaultUI: true,
              zoomControl: true,
              styles: [
                { elementType: 'geometry', stylers: [{ color: '#0a0e1a' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#9aacc5' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1525' }] },
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
              ],
            });
          } else {
            mapObjRef.current.panTo({ lat, lng });
            mapObjRef.current.setZoom(15);
          }

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          } else {
            markerRef.current = new google.maps.Marker({
              map: mapObjRef.current,
              position: { lat, lng },
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#e8622a">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32),
              },
            });
          }
        }
      });
    });
  }, []);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 10);
    setFotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  async function submitEspacio(tkn: string) {
    setLoading(true);
    setError(null);
    try {
      const espacio = await espaciosAPI.crear({
        nombre: form.nombre,
        direccion: form.direccion,
        barrio: form.barrio || 'Buenos Aires',
        m2: form.m2 ? Number(form.m2) : 0,
        tipo: form.tipo,
        precio_dia: Number(form.precio_dia),
        precio_mes: Number(form.precio_mes),
        descripcion: form.descripcion,
        lat: Number(form.lat) || -34.6037,
        lng: Number(form.lng) || -58.3816,
        disponibilidad,
      }, tkn);

      if (fotos.length > 0) {
        await espaciosAPI.subirFotos(espacio.id, fotos, tkn);
      }

      router.push('/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar el espacio');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.direccion || !form.m2 || !form.precio_dia || !form.precio_mes) {
      setError('Completá todos los campos obligatorios');
      return;
    }
    if (token) {
      await submitEspacio(token);
    } else {
      setAuthModal(true);
    }
  }

  async function handleLogin(email: string, password: string) {
    const ok = await login(email, password);
    if (ok) {
      setAuthModal(false);
      setTimeout(async () => {
        const tkn = localStorage.getItem('tmc_token');
        if (tkn) await submitEspacio(tkn);
      }, 300);
    }
    return ok;
  }

  async function handleRegister(nombre: string, email: string, password: string, tipo: 'oferente' | 'demandante', tel?: string) {
    const ok = await register(nombre, email, password, tipo, tel);
    if (ok) {
      setAuthModal(false);
      setTimeout(async () => {
        const tkn = localStorage.getItem('tmc_token');
        if (tkn) await submitEspacio(tkn);
      }, 300);
    }
    return ok;
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div />
        {user && (
          <button className="nav-btn" onClick={() => router.push('/panel')}>← Mi Panel</button>
        )}
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: '.4rem' }}>
              🏠 Publicar espacio
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '.92rem' }}>
              Completá los datos de tu espacio. Podés crear tu cuenta al final si todavía no tenés una.
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
              <label className="form-label">Nombre del espacio *</label>
              <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
                placeholder="Ej: Cochera techada Palermo" required />
            </div>

            {/* Dirección con autocomplete */}
            <div>
              <label className="form-label">Dirección *</label>
              <input
                ref={direccionRef}
                type="text"
                value={form.direccion}
                onChange={e => set('direccion', e.target.value)}
                placeholder="Escribí la dirección y seleccioná de la lista…"
                required
              />
              {form.lat && (
                <div style={{ fontSize: '.75rem', color: 'var(--mint)', marginTop: '.3rem' }}>
                  ✅ Ubicación detectada{form.barrio ? ` · ${form.barrio}` : ''}
                </div>
              )}
            </div>

            {/* Mapa preview */}
            <div
              ref={mapPreviewRef}
              style={{
                width: '100%',
                height: form.lat ? 220 : 0,
                borderRadius: 'var(--r2)',
                overflow: 'hidden',
                border: form.lat ? '1.5px solid var(--border)' : 'none',
                transition: 'height .3s ease',
              }}
            />

            {/* M2 */}
            <div>
              <label className="form-label">Superficie (m²)</label>
              <input type="number" value={form.m2} onChange={e => set('m2', e.target.value)}
                placeholder="18" min="1" />
            </div>

            {/* Precios */}
            <div className="form-row">
              <div>
                <label className="form-label">Precio por día ($) *</label>
                <input type="number" value={form.precio_dia} onChange={e => set('precio_dia', e.target.value)}
                  placeholder="850" min="0" required />
              </div>
              <div>
                <label className="form-label">Precio por mes ($) *</label>
                <input type="number" value={form.precio_mes} onChange={e => set('precio_mes', e.target.value)}
                  placeholder="18000" min="0" required />
              </div>
            </div>

            {/* Calendario disponibilidad */}
            <CalendarioDisponibilidad
              precioDia={Number(form.precio_dia) || 0}
              precioMes={Number(form.precio_mes) || 0}
              value={disponibilidad}
              onChange={setDisponibilidad}
            />

            {/* Descripción */}
            <div>
              <label className="form-label">Descripción</label>
              <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                placeholder="Describí tu espacio: acceso, seguridad, características especiales…"
                rows={4} />
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
              <Button type="button" variant="secondary" onClick={() => router.push('/')} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading} style={{ flex: 2 }}>
                🏠 Publicar espacio
              </Button>
            </div>

            {!user && (
              <p style={{ fontSize: '.78rem', color: 'var(--text3)', textAlign: 'center' }}>
                Al publicar te pediremos crear una cuenta o iniciar sesión.
              </p>
            )}

            <p style={{ fontSize: '.75rem', color: 'var(--text3)', textAlign: 'center' }}>
              Al publicar aceptás los{' '}
              <a href="/legal.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
                Términos y Condiciones
              </a>
              {' '}de TodasMisCosas.com
            </p>
          </form>
        </div>
      </div>

      {/* Auth Modal */}
      <Modal
        open={authModal}
        onClose={() => setAuthModal(false)}
        title={authTab === 'login' ? '👋 Iniciar sesión' : '🚀 Crear cuenta'}
        subtitle={authTab === 'login'
          ? 'Iniciá sesión para publicar tu espacio'
          : 'Creá tu cuenta para publicar tu espacio'}
      >
        {authTab === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitch={() => setAuthTab('register')}
            error={authError}
            loading={authLoading}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitch={() => setAuthTab('login')}
            error={authError}
            loading={authLoading}
          />
        )}
      </Modal>
    </div>
  );
}
