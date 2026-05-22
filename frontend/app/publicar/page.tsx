'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import { useAuth } from '@/hooks/useAuth';
import { espaciosAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { CalendarioDisponibilidad, type Disponibilidad } from '@/components/publicar/CalendarioDisponibilidad';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

const CATEGORIAS = [
  { value: 'cochera',    label: '🚗 Cochera' },
  { value: 'habitacion', label: '🛏️ Habitación' },
  { value: 'sotano',     label: '🏚️ Sótano' },
  { value: 'terraza',    label: '🌿 Terraza' },
  { value: 'abierto',    label: '🌳 Espacio abierto' },
  { value: 'estante',    label: '📦 Estantería' },
];

const SEGURIDAD_OPCIONES = [
  { key: 'camaras',     label: '📹 Cámaras de seguridad' },
  { key: 'cerradura',   label: '🔒 Cerradura propia' },
  { key: 'acceso_24h',  label: '🕐 Acceso 24 horas' },
  { key: 'vigilancia',  label: '👮 Vigilancia' },
  { key: 'alarma',      label: '🚨 Alarma' },
  { key: 'iluminacion', label: '💡 Iluminación' },
];

const PASOS = ['Datos', 'Fotos', 'Seguridad', 'Cuenta'];

export default function PublicarPage() {
  const router = useRouter();
  const { user, token, login, register, loading: authLoading, error: authError } = useAuth();

  const [paso, setPaso] = useState(0);

  const [form, setForm] = useState({
    categoria: '',
    nombre: '',
    descripcion: '',
    direccion: '',
    barrio: '',
    m2: '',
    precio_dia: '',
    precio_mes: '',
    lat: '',
    lng: '',
  });

  const [fotos, setFotos]                   = useState<File[]>([]);
  const [previews, setPreviews]             = useState<string[]>([]);
  const [fotoPrincipal, setFotoPrincipal]   = useState(0);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>({});
  const [seguridad, setSeguridad]           = useState<Record<string, boolean>>({});
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [authModal, setAuthModal]           = useState(false);
  const [authTab, setAuthTab]               = useState<'login' | 'register'>('register');

  const direccionRef  = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapObjRef     = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef     = useRef<any>(null);
  const mapPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!MAPS_KEY || paso !== 0) return;

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

        let barrio = '';
        for (const comp of place.address_components || []) {
          if (comp.types.includes('sublocality_level_1') || comp.types.includes('neighborhood') || comp.types.includes('locality')) {
            barrio = comp.long_name;
            break;
          }
        }

        setForm(f => ({ ...f, direccion: place.formatted_address || f.direccion, lat: String(lat), lng: String(lng), barrio }));

        if (mapPreviewRef.current) {
          const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
          if (!mapObjRef.current) {
            mapObjRef.current = new Map(mapPreviewRef.current, {
              center: { lat, lng }, zoom: 15, disableDefaultUI: true, zoomControl: true,
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
          }
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          } else {
            markerRef.current = new google.maps.Marker({
              map: mapObjRef.current, position: { lat, lng },
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#e8622a"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>')}`,
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32),
              },
            });
          }
        }
      });
    });
  }, [paso]);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setFotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
    setFotoPrincipal(0);
  }

  function toggleSeguridad(key: string) {
    setSeguridad(s => ({ ...s, [key]: !s[key] }));
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function validarPaso(): string | null {
    if (paso === 0) {
      if (!form.categoria) return 'Seleccioná el tipo de espacio';
      if (!form.nombre.trim()) return 'Ingresá el nombre del espacio';
      if (!form.direccion.trim()) return 'Ingresá la dirección';
      if (!form.precio_dia && !form.precio_mes) return 'Ingresá al menos un precio';
    }
    return null;
  }

  function siguiente() {
    const err = validarPaso();
    if (err) { setError(err); return; }
    setError(null);
    if (paso === 3) {
      // Último paso — si logueado publicar, sino mostrar auth
      if (token) {
        publicar(token);
      } else {
        setAuthModal(true);
      }
      return;
    }
    setPaso(p => p + 1);
  }

  async function publicar(tkn: string) {
    setLoading(true);
    setError(null);
    try {
      const espacio = await espaciosAPI.crear({
        nombre: form.nombre,
        direccion: form.direccion,
        barrio: form.barrio || 'Buenos Aires',
        m2: form.m2 ? Number(form.m2) : 0,
        tipo: 'exclusivo',
        categoria: form.categoria,
        precio_dia: Number(form.precio_dia) || 0,
        precio_mes: Number(form.precio_mes) || 0,
        descripcion: form.descripcion,
        lat: Number(form.lat) || -34.6037,
        lng: Number(form.lng) || -58.3816,
        disponibilidad,
        seguridad,
      }, tkn);

      if (fotos.length > 0) {
        // Reordenar para que la foto principal quede primera
        const ordenadas = [...fotos];
        if (fotoPrincipal > 0) {
          const [principal] = ordenadas.splice(fotoPrincipal, 1);
          ordenadas.unshift(principal);
        }
        await espaciosAPI.subirFotos(espacio.id, ordenadas, tkn);
      }

      router.push('/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    const ok = await login(email, password);
    if (ok) {
      setAuthModal(false);
      setTimeout(() => {
        const tkn = localStorage.getItem('tmc_token');
        if (tkn) publicar(tkn);
      }, 300);
    }
    return ok;
  }

  async function handleRegister(nombre: string, email: string, password: string, tipo: 'oferente' | 'demandante', tel?: string) {
    const ok = await register(nombre, email, password, tipo, tel);
    if (ok) {
      setAuthModal(false);
      setTimeout(() => {
        const tkn = localStorage.getItem('tmc_token');
        if (tkn) publicar(tkn);
      }, 300);
    }
    return ok;
  }

  // ── UI ─────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r2)',
    padding: '1rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <div />
        {user && <button className="nav-btn" onClick={() => router.push('/panel')}>← Mi Panel</button>}
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Título */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '.3rem' }}>
              🏠 Publicar espacio
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>
              Podés crear tu cuenta al final si todavía no tenés una.
            </p>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: 0 }}>
            {PASOS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < PASOS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.8rem',
                    background: i < paso ? 'var(--mint)' : i === paso ? 'var(--orange)' : 'var(--surface2)',
                    color: i <= paso ? '#fff' : 'var(--text3)',
                    border: `2px solid ${i < paso ? 'var(--mint)' : i === paso ? 'var(--orange)' : 'var(--border)'}`,
                    transition: 'all .2s',
                  }}>
                    {i < paso ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '.68rem', color: i === paso ? 'var(--orange)' : i < paso ? 'var(--mint)' : 'var(--text3)', fontWeight: i === paso ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < paso ? 'var(--mint)' : 'var(--border)', margin: '0 6px', marginBottom: 20, transition: 'background .2s' }} />
                )}
              </div>
            ))}
          </div>

          {error && <div className="alert alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {/* ── PASO 1: DATOS ─────────────────────────────── */}
          {paso === 0 && (
            <div style={{ display: 'grid', gap: '1.2rem' }}>
              {/* Categoría */}
              <div>
                <label className="form-label">Tipo de espacio *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem', marginTop: '.4rem' }}>
                  {CATEGORIAS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set('categoria', c.value)}
                      style={{
                        padding: '.65rem .5rem',
                        borderRadius: 'var(--r2)',
                        border: `2px solid ${form.categoria === c.value ? 'var(--orange)' : 'var(--border)'}`,
                        background: form.categoria === c.value ? 'rgba(232,98,42,.1)' : 'var(--surface2)',
                        color: form.categoria === c.value ? 'var(--orange)' : 'var(--text2)',
                        fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '.78rem',
                        cursor: 'pointer', transition: 'all .15s', textAlign: 'center',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="form-label">Nombre del espacio *</label>
                <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Cochera techada Palermo" />
              </div>

              {/* Descripción */}
              <div>
                <label className="form-label">Descripción</label>
                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                  placeholder="Describí tu espacio: acceso, características especiales…" rows={3} />
              </div>

              {/* Dirección */}
              <div>
                <label className="form-label">Dirección *</label>
                <input ref={direccionRef} type="text" value={form.direccion}
                  onChange={e => set('direccion', e.target.value)}
                  placeholder="Escribí la dirección y seleccioná de la lista…" />
                {form.lat && (
                  <div style={{ fontSize: '.75rem', color: 'var(--mint)', marginTop: '.3rem' }}>
                    ✅ Ubicación detectada{form.barrio ? ` · ${form.barrio}` : ''}
                  </div>
                )}
              </div>

              {/* Mapa preview */}
              <div ref={mapPreviewRef} style={{
                width: '100%', height: form.lat ? 200 : 0,
                borderRadius: 'var(--r2)', overflow: 'hidden',
                border: form.lat ? '1.5px solid var(--border)' : 'none',
                transition: 'height .3s ease',
              }} />


              {/* Precios */}
              <div className="form-row">
                <div>
                  <label className="form-label">Precio por día ($)</label>
                  <input type="number" value={form.precio_dia} onChange={e => set('precio_dia', e.target.value)}
                    placeholder="850" min="0" />
                </div>
                <div>
                  <label className="form-label">Precio por mes ($)</label>
                  <input type="number" value={form.precio_mes} onChange={e => set('precio_mes', e.target.value)}
                    placeholder="18000" min="0" />
                </div>
              </div>

              {/* Calendario disponibilidad */}
              <CalendarioDisponibilidad
                precioDia={Number(form.precio_dia) || 0}
                precioMes={Number(form.precio_mes) || 0}
                value={disponibilidad}
                onChange={setDisponibilidad}
              />
            </div>
          )}

          {/* ── PASO 2: FOTOS ─────────────────────────────── */}
          {paso === 1 && (
            <div style={{ display: 'grid', gap: '1.2rem' }}>
              <div style={cardStyle}>
                <label className="form-label" style={{ marginBottom: '.6rem', display: 'block' }}>
                  📷 Fotos del espacio <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '.75rem' }}>— máx. 5</span>
                </label>
                <p style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: '.8rem' }}>
                  Subí fotos claras del espacio. Hacé click en una foto para marcarla como principal.
                </p>
                <input
                  type="file" accept="image/*" multiple onChange={handleFotoChange}
                  style={{ padding: '.5rem', borderRadius: 'var(--r2)', cursor: 'pointer', width: '100%' }}
                />
                {previews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '.5rem', marginTop: '.8rem' }}>
                    {previews.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setFotoPrincipal(i)}
                        style={{ position: 'relative', cursor: 'pointer' }}
                      >
                        <img src={url} alt="" style={{
                          width: '100%', aspectRatio: '4/3', objectFit: 'cover',
                          borderRadius: 8,
                          border: `2.5px solid ${i === fotoPrincipal ? 'var(--orange)' : 'var(--border)'}`,
                          transition: 'border-color .15s',
                        }} />
                        <span style={{
                          position: 'absolute', bottom: 5, left: 5,
                          background: i === fotoPrincipal ? 'var(--orange)' : 'rgba(0,0,0,.5)',
                          color: '#fff', fontSize: '.6rem', fontWeight: 700,
                          padding: '2px 7px', borderRadius: 4, transition: 'background .15s',
                        }}>
                          {i === fotoPrincipal ? '⭐ Principal' : `Foto ${i + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {fotos.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: '.85rem' }}>
                    No es obligatorio subir fotos ahora, podés hacerlo después desde Mi Panel.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PASO 3: SEGURIDAD ─────────────────────────── */}
          {paso === 2 && (
            <div style={{ display: 'grid', gap: '1.2rem' }}>
              <div style={cardStyle}>
                <label className="form-label" style={{ marginBottom: '.6rem', display: 'block' }}>
                  🔐 Características de seguridad
                </label>
                <p style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: '1rem' }}>
                  Marcá las medidas de seguridad que tiene tu espacio. Esto ayuda a generar más confianza.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                  {SEGURIDAD_OPCIONES.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleSeguridad(opt.key)}
                      style={{
                        padding: '.75rem',
                        borderRadius: 'var(--r2)',
                        border: `2px solid ${seguridad[opt.key] ? 'var(--orange)' : 'var(--border)'}`,
                        background: seguridad[opt.key] ? 'rgba(232,98,42,.1)' : 'var(--surface)',
                        color: seguridad[opt.key] ? 'var(--orange)' : 'var(--text2)',
                        fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '.82rem',
                        cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '.75rem', color: 'var(--text3)', textAlign: 'center' }}>
                Este paso es opcional. Podés saltearlo y completarlo después.
              </p>
            </div>
          )}

          {/* ── PASO 4: CUENTA ────────────────────────────── */}
          {paso === 3 && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {user ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '.3rem' }}>
                    ¡Todo listo, {user.nombre}!
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: '1.25rem' }}>
                    Tu espacio está configurado. Hacé click en Publicar para que aparezca en el mapa.
                  </p>
                  <Button onClick={() => publicar(token!)} loading={loading} style={{ width: '100%' }}>
                    🏠 Publicar espacio
                  </Button>
                </div>
              ) : (
                <div style={cardStyle}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '.3rem' }}>
                    Creá tu cuenta para publicar
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '.82rem', marginBottom: '1rem' }}>
                    Es gratis. Ya tenés todo cargado, solo falta confirmar tu identidad.
                  </p>
                  <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem' }}>
                    {(['register', 'login'] as const).map(tab => (
                      <button key={tab} type="button" onClick={() => setAuthTab(tab)} style={{
                        flex: 1, padding: '.5rem',
                        borderRadius: 'var(--r2)',
                        border: `2px solid ${authTab === tab ? 'var(--orange)' : 'var(--border)'}`,
                        background: authTab === tab ? 'rgba(232,98,42,.1)' : 'var(--surface2)',
                        color: authTab === tab ? 'var(--orange)' : 'var(--text2)',
                        fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                      }}>
                        {tab === 'register' ? 'Crear cuenta' : 'Ya tengo cuenta'}
                      </button>
                    ))}
                  </div>
                  {authTab === 'register' ? (
                    <RegisterForm
                      onRegister={handleRegister}
                      onSwitch={() => setAuthTab('login')}
                      error={authError}
                      loading={authLoading}
                    />
                  ) : (
                    <LoginForm
                      onLogin={handleLogin}
                      onSwitch={() => setAuthTab('register')}
                      error={authError}
                      loading={authLoading}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navegación */}
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
            {paso > 0 && (
              <Button type="button" variant="secondary" onClick={() => { setError(null); setPaso(p => p - 1); }} style={{ flex: 1 }}>
                ← Anterior
              </Button>
            )}
            {paso < 3 && (
              <Button type="button" onClick={siguiente} style={{ flex: 2 }}>
                Siguiente →
              </Button>
            )}
          </div>

          <p style={{ fontSize: '.72rem', color: 'var(--text3)', textAlign: 'center', marginTop: '1rem' }}>
            Al publicar aceptás los{' '}
            <a href="/legal.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
              Términos y Condiciones
            </a>
            {' '}de TodasMisCosas.com
          </p>
        </div>
      </div>

      {/* Auth Modal fallback */}
      <Modal
        open={authModal}
        onClose={() => setAuthModal(false)}
        title="👋 Iniciar sesión"
        subtitle="Iniciá sesión para publicar tu espacio"
      >
        <LoginForm
          onLogin={handleLogin}
          onSwitch={() => { setAuthModal(false); setAuthTab('register'); setPaso(3); }}
          error={authError}
          loading={authLoading}
        />
      </Modal>
    </div>
  );
}
