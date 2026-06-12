'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import { useAuth } from '@/hooks/useAuth';
import { espaciosAPI, emailAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { CalendarioDisponibilidad, type Disponibilidad } from '@/components/publicar/CalendarioDisponibilidad';
import { MONEDAS } from '@/types';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

const CATEGORIAS = [
  { value: 'cochera',    label: '🚗 Cochera' },
  { value: 'galpon',     label: '🏭 Galpón' },
  { value: 'local',      label: '🏪 Local' },
  { value: 'habitacion', label: '🛏️ Habitación' },
  { value: 'sotano',     label: '🏚️ Sótano' },
  { value: 'terraza',    label: '🌿 Terraza' },
  { value: 'abierto',    label: '🌳 Esp. abierto' },
  { value: 'estante',    label: '📦 Estantería' },
];

const SEGURIDAD_OPCIONES = [
  { key: 'techo_impermeable',  label: 'Techo y paredes impermeables',  emoji: '🛡️', detalle: 'Protege contra lluvia, humedad y filtraciones.' },
  { key: 'cerradura',          label: 'Acceso con llave o candado propio', emoji: '🔑', detalle: 'El inquilino tiene llave exclusiva del espacio.' },
  { key: 'camaras',            label: 'Cámara de seguridad en el área', emoji: '📷', detalle: 'Vigilancia visual del acceso al espacio.' },
  { key: 'iluminacion',        label: 'Iluminación adecuada',           emoji: '💡', detalle: 'Hay buena iluminación natural o artificial.' },
  { key: 'acceso_controlado',  label: 'Acceso controlado al edificio',  emoji: '🚧', detalle: 'Portón, guardia o sistema de control de acceso.' },
  { key: 'seco_ventilado',     label: 'Espacio seco y ventilado',       emoji: '💨', detalle: 'Evita humedad y malos olores para objetos guardados.' },
  { key: 'acceso_24h',         label: 'Acceso 24hs disponible',         emoji: '⏰', detalle: 'El demandante puede ingresar en cualquier momento.' },
  { key: 'extintor',           label: 'Extintor en las cercanías',      emoji: '🔥', detalle: 'Hay extintor accesible cerca del espacio.' },
];

const PASOS = ['Datos', 'Fotos', 'Seguridad', 'Cuenta'];

// ── Componente separado para el paso de seguridad ─────────────
function PasoSeguridad({
  seguridad,
  onToggle,
  cardStyle,
  token,
  espacioNombre,
}: {
  seguridad: Record<string, boolean>;
  onToggle: (key: string) => void;
  cardStyle: React.CSSProperties;
  token?: string | null;
  espacioNombre?: string;
}) {
  const total    = SEGURIDAD_OPCIONES.length;
  const selected = SEGURIDAD_OPCIONES.filter(o => seguridad[o.key]).length;
  const stars    = Math.round((selected / total) * 5);
  const [enviado, setEnviado]   = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleMejorar() {
    if (!token) return;
    setEnviando(true);
    try {
      await emailAPI.mejorarPuntuacion({ espacioNombre, puntajeActual: stars }, token);
      setEnviado(true);
    } catch (_) {
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1.2rem' }}>
      <div style={cardStyle} className="seguridad-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.2rem' }}>
              <span style={{ fontSize: '1.15rem' }}>🛡️</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
                Nivel de seguridad
              </span>
            </div>
            <p className="seguridad-cursor-hint" style={{ fontSize: '.74rem', color: 'var(--text3)', margin: 0 }}>
              Pasá el cursor sobre cada ítem para ver detalles
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem' }}>
            <div>
              <div style={{ fontSize: '1.15rem', color: 'var(--orange)', letterSpacing: 1, lineHeight: 1 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} style={{ opacity: n <= stars ? 1 : 0.2, transition: 'opacity .2s' }}>★</span>
                ))}
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: '.25rem' }}>
                {selected}/{total} ítems
              </div>
            </div>
            {token && (
              enviado ? (
                <div className="hide-mobile" style={{ fontSize: '.72rem', color: 'var(--mint)', fontWeight: 600 }}>
                  ✅ ¡Solicitud enviada!
                </div>
              ) : (
                <button
                  className="hide-mobile"
                  onClick={handleMejorar}
                  disabled={enviando}
                  style={{
                    background: 'linear-gradient(135deg, rgba(232,98,42,.15), rgba(245,158,11,.15))',
                    border: '1px solid rgba(232,98,42,.4)',
                    borderRadius: '999px',
                    padding: '.3rem .75rem',
                    fontSize: '.7rem',
                    fontWeight: 700,
                    color: 'var(--orange)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'opacity .15s',
                    opacity: enviando ? 0.6 : 1,
                  }}
                >
                  🚀 ¿Querés mejorar tu puntuación?
                </button>
              )
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="seguridad-lista" style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
          {SEGURIDAD_OPCIONES.map(opt => {
            const activo = !!seguridad[opt.key];
            return (
              <div
                key={opt.key}
                className="seguridad-item"
                title={opt.detalle}
                onClick={() => onToggle(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.6rem .85rem',
                  borderRadius: 'var(--r2)',
                  border: `1.5px solid ${activo ? 'rgba(232,98,42,.4)' : 'var(--border)'}`,
                  background: activo ? 'rgba(232,98,42,.07)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'background .15s, border-color .15s',
                  userSelect: 'none',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${activo ? 'var(--orange)' : '#ccc'}`,
                  background: activo ? 'var(--orange)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 800,
                  transition: 'background .15s, border-color .15s',
                }}>
                  {activo ? '✓' : ''}
                </div>
                {/* Emoji */}
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{opt.emoji}</span>
                {/* Label */}
                <span style={{
                  fontSize: '.85rem',
                  fontWeight: activo ? 600 : 400,
                  color: activo ? 'var(--text)' : 'var(--text2)',
                  transition: 'color .15s',
                }}>
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: '.74rem', color: 'var(--text3)', textAlign: 'center', margin: 0 }}>
        Este paso es opcional — podés completarlo después desde Mi Panel.
      </p>
    </div>
  );
}

export default function PublicarPage() {
  const router = useRouter();
  const { user, token, login, register, loading: authLoading, error: authError,
          otpPending, otpEmailHint, otpCanales, verifyOTP, reenviarOTP,
          emailConfirmPending, emailConfirmEmail } = useAuth();

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
    tipo: 'exclusivo',
    moneda: 'ARS',
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
  const [publicarPendiente, setPublicarPendiente] = useState(false);
  const [espacioPublicadoId, setEspacioPublicadoId] = useState<string | null>(null);

  // Cuando el usuario completa el OTP y queda logueado, publicar automáticamente
  useEffect(() => {
    if (user && token && publicarPendiente) {
      setPublicarPendiente(false);
      publicar(token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, publicarPendiente]);

  const direccionRef  = useRef<HTMLInputElement>(null);
  const cameraRef     = useRef<HTMLInputElement>(null);
  const galeriaRef    = useRef<HTMLInputElement>(null);
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

  async function comprimirImagen(file: File, maxW = 1600, quality = 0.82): Promise<File> {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxW / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setPreviews(files.map(f => URL.createObjectURL(f)));
    setFotoPrincipal(0);
    const comprimidas = await Promise.all(files.map(f => comprimirImagen(f)));
    setFotos(comprimidas);
    e.target.value = '';
  }

  async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || fotos.length >= 5) return;
    const preview = URL.createObjectURL(file);
    const comprimida = await comprimirImagen(file);
    setPreviews(prev => [...prev, preview]);
    setFotos(prev => [...prev, comprimida]);
    e.target.value = '';
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
        m2: form.m2 ? Number(form.m2) : undefined,
        tipo: (form.tipo || 'exclusivo') as 'exclusivo' | 'compartido',
        categoria: form.categoria,
        precio_dia: Number(form.precio_dia) || 0,
        precio_mes: Number(form.precio_mes) || 0,
        descripcion: form.descripcion,
        lat: Number(form.lat) || -34.6037,
        lng: Number(form.lng) || -58.3816,
        moneda: form.moneda || 'ARS',
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

      setEspacioPublicadoId(espacio.id);
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
      setPublicarPendiente(true); // publicar() se llamará automáticamente cuando el OTP se verifique
    }
    return ok;
  }

  async function handleRegister(nombre: string, email: string, password: string, _tipo: 'usuario', tel?: string) {
    const ok = await register(nombre, email, password, 'usuario', tel);
    if (ok && ok !== 'email-confirm') {
      setAuthModal(false);
      setPublicarPendiente(true);
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

  const accentColor = form.tipo === 'exclusivo' ? '#1E293B' : 'var(--orange)';
  const accentBg    = form.tipo === 'exclusivo' ? 'rgba(30,41,59,.08)' : 'rgba(232,98,42,.1)';

  // ── Pantalla de éxito ─────────────────────────────────────────
  if (espacioPublicadoId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r4)',
            overflow: 'hidden',
            width: 'min(480px, 100%)',
            boxShadow: 'var(--s5)',
          }}>
            <div style={{ height: 5, background: 'linear-gradient(90deg, var(--mint), var(--blue) 50%, var(--orange))' }} />
            <div style={{ padding: '2.5rem 2rem', textAlign: 'center', display: 'grid', gap: '1rem' }}>
              <div style={{ fontSize: '3.5rem' }}>🎉</div>
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>
                ¡Publicaste tu espacio!
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: '.9rem', lineHeight: 1.6, margin: 0 }}>
                Tu publicación ya está visible en el mapa y disponible para que otros usuarios la reserven.
              </p>
              {user && !user.cbu_alias && (
                <div style={{
                  background: 'rgba(245,158,11,.1)',
                  border: '1px solid rgba(245,158,11,.4)',
                  borderRadius: 'var(--r2)',
                  padding: '.85rem 1rem',
                  textAlign: 'left',
                  fontSize: '.83rem',
                  color: 'var(--text2)',
                }}>
                  <strong style={{ color: 'var(--amber)' }}>⚠️ Falta tu CBU/Alias bancario</strong>
                  <div style={{ marginTop: '.25rem' }}>
                    Para que TMC pueda transferirte los pagos de tus reservas, agregá tu CBU o alias en{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/panel')}
                      style={{ background: 'none', border: 'none', color: 'var(--orange)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                    >
                      Mi Panel → Editar perfil
                    </button>.
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: '.75rem', marginTop: '.5rem' }}>
                <Button
                  onClick={() => router.push(`/espacio/${espacioPublicadoId}`)}
                  style={{ width: '100%' }}
                >
                  👀 Ver mi publicación
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Resetear todo el formulario
                    setEspacioPublicadoId(null);
                    setPaso(0);
                    setForm({ categoria: '', nombre: '', descripcion: '', direccion: '', barrio: '', m2: '', precio_dia: '', precio_mes: '', lat: '', lng: '', tipo: 'exclusivo', moneda: 'ARS' });
                    setFotos([]);
                    setPreviews([]);
                    setFotoPrincipal(0);
                    setDisponibilidad({});
                    setSeguridad({});
                    setError(null);
                  }}
                  style={{ width: '100%' }}
                >
                  ➕ Publicar otro espacio
                </Button>
                <button
                  type="button"
                  onClick={() => router.push('/panel')}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '.82rem', cursor: 'pointer', padding: '.5rem' }}
                >
                  Ir a Mi Panel →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SiteHeader />

      <div className="page-scroll">
        <div className={form.tipo === 'exclusivo' ? 'form--exclusivo' : 'form--compartido'} style={{ maxWidth: 620, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Título */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '.3rem' }}>
              Publicar espacio
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
              {/* Tipo de alquiler */}
              <div>
                <label className="form-label">Tipo de alquiler *</label>
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
                  {[
                    { value: 'exclusivo', label: '🔐 Exclusivo', desc: 'Uso exclusivo del espacio' },
                    { value: 'compartido', label: '🤲 Compartido', desc: 'Espacio compartido con otros' },
                  ].map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set('tipo', t.value)}
                      style={{
                        flex: 1, padding: '.65rem .5rem',
                        borderRadius: 'var(--r2)',
                        border: `2px solid ${form.tipo === t.value ? (t.value === 'exclusivo' ? '#1E293B' : 'var(--orange)') : 'var(--border)'}`,
                        background: form.tipo === t.value ? (t.value === 'exclusivo' ? 'rgba(30,41,59,.08)' : 'rgba(232,98,42,.1)') : 'var(--surface2)',
                        color: form.tipo === t.value ? (t.value === 'exclusivo' ? '#1E293B' : 'var(--orange)') : 'var(--text2)',
                        fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.78rem',
                        cursor: 'pointer', transition: 'all .15s', textAlign: 'center',
                      }}
                    >
                      <div>{t.label}</div>
                      <div style={{ fontSize: '.65rem', fontWeight: 400, marginTop: '.15rem', opacity: .8 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="form-label">Tipo de espacio *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginTop: '.4rem' }}>
                  {CATEGORIAS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set('categoria', c.value)}
                      style={{
                        padding: '.65rem .5rem',
                        borderRadius: 'var(--r2)',
                        border: `2px solid ${form.categoria === c.value ? accentColor : 'var(--border)'}`,
                        background: form.categoria === c.value ? accentBg : 'var(--surface2)',
                        color: form.categoria === c.value ? accentColor : 'var(--text2)',
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


              {/* Moneda + Superficie */}
              <div className="form-row">
                <div>
                  <label className="form-label">Moneda de publicación</label>
                  <select value={form.moneda} onChange={e => set('moneda', e.target.value)} style={{ marginTop: '.4rem' }}>
                    {MONEDAS.map(m => (
                      <option key={m.value} value={m.value}>{m.flag} {m.label} ({m.simbolo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Superficie (m²) <span style={{ color: 'var(--text3)', fontWeight: 400 }}>— opcional</span></label>
                  <input
                    type="number"
                    value={form.m2}
                    onChange={e => set('m2', e.target.value)}
                    placeholder=""
                    min="0"
                  />
                </div>
              </div>

              {/* Precios */}
              <div className="form-row">
                <div>
                  <label className="form-label">Precio por día</label>
                  <input type="number" value={form.precio_dia} onChange={e => set('precio_dia', e.target.value)}
                    placeholder="" min="0" />
                </div>
                <div>
                  <label className="form-label">Precio por mes</label>
                  <input type="number" value={form.precio_mes} onChange={e => set('precio_mes', e.target.value)}
                    placeholder="" min="0" />
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
                <p style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: '.4rem' }}>
                  Subí fotos claras del espacio. Hacé click en una foto para marcarla como principal.
                </p>
                <p style={{ fontSize: '.78rem', color: 'var(--orange)', marginBottom: '.8rem' }}>
                  ⚠️ Seleccioná todas tus fotos juntas (hasta 5) de una sola vez. Si las elegís de a una, solo se sube la última.
                </p>
                {/* Inputs ocultos */}
                <input ref={galeriaRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFotoChange}
                  style={{ display: 'none' }} />
                <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleCameraCapture}
                  style={{ display: 'none' }} />

                {/* Botones de carga */}
                <div className="foto-upload-grid" style={{ display: 'grid', gap: '.6rem' }}>
                  <button type="button" onClick={() => galeriaRef.current?.click()} style={{
                    padding: '.7rem .5rem', borderRadius: 'var(--r2)',
                    border: '1.5px solid var(--border)', background: 'var(--surface2)',
                    cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 600,
                    fontSize: '.82rem', color: 'var(--text2)', transition: 'border-color .15s',
                  }}>
                    🖼️ Elegir fotos
                  </button>
                  <button type="button" onClick={() => cameraRef.current?.click()} disabled={fotos.length >= 5}
                    className="solo-mobile-tablet"
                    style={{
                      padding: '.7rem .5rem', borderRadius: 'var(--r2)',
                      border: '1.5px solid var(--border)', background: 'var(--surface2)',
                      cursor: fotos.length >= 5 ? 'not-allowed' : 'pointer',
                      fontFamily: 'Sora, sans-serif', fontWeight: 600,
                      fontSize: '.82rem', color: fotos.length >= 5 ? 'var(--text3)' : 'var(--text2)',
                      transition: 'border-color .15s', width: '100%',
                    }}>
                    📸 Tomar foto
                  </button>
                </div>
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
            <PasoSeguridad
              seguridad={seguridad}
              onToggle={toggleSeguridad}
              cardStyle={cardStyle}
              token={token}
              espacioNombre={form.nombre}
            />
          )}

          {/* ── PASO 4: CUENTA ────────────────────────────── */}
          {paso === 3 && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {user ? (
                /* Ya logueado: mostrar resumen y botón publicar */
                <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '.3rem' }}>
                    ¡Todo listo, {user.nombre}!
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginBottom: '.75rem' }}>
                    Tu espacio está configurado. Hacé click en Publicar para que aparezca en el mapa.
                  </p>
                  <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 'var(--r2)', padding: '.6rem .9rem', marginBottom: '1.25rem', fontSize: '.78rem', color: 'var(--text2)', textAlign: 'left' }}>
                    📅 <strong>Vigencia de 90 días:</strong> tu publicación estará activa por 90 días corridos. Te avisamos 30 días antes del vencimiento para que puedas renovarla.
                  </div>
                  <Button onClick={() => publicar(token!)} loading={loading} style={{ width: '100%' }}>
                    Publicar espacio
                  </Button>
                  {error && <div className="alert alert--error" style={{ marginTop: '.75rem' }}>{error}</div>}
                </div>
              ) : emailConfirmPending ? (
                /* Email confirm pendiente */
                <div style={cardStyle}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📧</div>
                    <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '.4rem' }}>
                      Revisá tu email
                    </p>
                    <p style={{ color: 'var(--text2)', fontSize: '.85rem', lineHeight: 1.6, marginBottom: '.5rem' }}>
                      Te enviamos un link a <strong>{emailConfirmEmail}</strong>.
                      Hacé clic para activar tu cuenta y publicar tu espacio.
                    </p>
                    <p style={{ fontSize: '.78rem', color: 'var(--text3)' }}>¿No llegó? Revisá spam.</p>
                  </div>
                </div>
              ) : otpPending ? (
                /* OTP pendiente: mostrar verificación de código */
                <div style={cardStyle}>
                  <OTPStep
                    emailHint={otpEmailHint}
                    canales={otpCanales}
                    onVerify={verifyOTP}
                    onReenviar={reenviarOTP}
                    loading={authLoading}
                    error={authError}
                  />
                  <p style={{ fontSize: '.75rem', color: 'var(--text3)', textAlign: 'center', marginTop: '1rem' }}>
                    Una vez verificado, tu espacio se publicará automáticamente.
                  </p>
                </div>
              ) : (
                /* No logueado y sin OTP pendiente: mostrar registro/login */
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
            <a href="/legales" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', textDecoration: 'underline' }}>
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
        title={emailConfirmPending ? '📧 Revisá tu email' : otpPending ? '🔐 Verificá tu identidad' : '👋 Iniciar sesión'}
        subtitle={emailConfirmPending ? undefined : otpPending ? 'Ingresá el código que enviamos a tu email' : 'Iniciá sesión para publicar tu espacio'}
      >
        {emailConfirmPending ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '.5rem' }}>
              Te enviamos un link a <strong style={{ color: 'var(--text)' }}>{emailConfirmEmail}</strong>.
              Hacé clic para activar tu cuenta.
            </p>
            <p style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.75rem' }}>¿No llegó? Revisá spam.</p>
          </div>
        ) : otpPending ? (
          <>
            <OTPStep
              emailHint={otpEmailHint}
              canales={otpCanales}
              onVerify={verifyOTP}
              onReenviar={reenviarOTP}
              loading={authLoading}
              error={authError}
            />
            <p style={{ fontSize: '.75rem', color: 'var(--text3)', textAlign: 'center', marginTop: '1rem' }}>
              Una vez verificado, tu espacio se publicará automáticamente.
            </p>
          </>
        ) : (
          <LoginForm
            onLogin={handleLogin}
            onSwitch={() => { setAuthModal(false); setAuthTab('register'); setPaso(3); }}
            error={authError}
            loading={authLoading}
          />
        )}
      </Modal>
    </div>
  );
}
