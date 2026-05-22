'use client';

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import { useAuth } from '@/hooks/useAuth';
import { useReservas } from '@/hooks/useReservas';
import { espaciosAPI, reservasAPI, usuariosAPI, reviewsAPI } from '@/lib/api';
import { SeguridadChecklist } from '@/components/publicar/SeguridadChecklist';
import type { Espacio, Reserva } from '@/types';
import { MONEDAS } from '@/types';
import { StatsOferente } from '@/components/panel/StatsOferente';
import { EstadoReserva } from '@/components/reservas/EstadoReserva';
import { EstadoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { formatARS, formatFechaCorta } from '@/lib/utils';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { CalendarioDisponibilidad, type Disponibilidad } from '@/components/publicar/CalendarioDisponibilidad';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

const CATEGORIAS = [
  { value: 'cochera',    label: '🚗 Cochera' },
  { value: 'habitacion', label: '🛏️ Habitación' },
  { value: 'sotano',     label: '🏚️ Sótano' },
  { value: 'terraza',    label: '🌿 Terraza' },
  { value: 'abierto',    label: '🌳 Abierto' },
  { value: 'estante',    label: '📦 Estantería' },
];

export default function PanelPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, logout, isAdmin } = useAuth();
  const isOferente = user?.tipo === 'oferente' || user?.tipo === 'admin';

  // Reservas propias (as demandante — for all users)
  const { reservas: misReservas, loading: misResLoading, cancelar } = useReservas(token, 'mias');

  // Oferente-specific data
  const [misEspacios, setMisEspacios] = useState<Espacio[]>([]);
  const [reservasRecibidas, setReservasRecibidas] = useState<Reserva[]>([]);
  const [loadingOferente, setLoadingOferente] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit modal
  const [editando, setEditando] = useState<Espacio | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '', descripcion: '', direccion: '',
    precio_dia: '', precio_mes: '', categoria: '', moneda: 'ARS',
  });

  // Profile edit
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombre: '', tel: '', direccion: '', lat: '', lng: '' });
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [perfilError, setPerfilError] = useState('');
  const [perfilOk, setPerfilOk] = useState(false);
  const perfilDireccionRef = useRef<HTMLInputElement>(null);
  const [editDisponibilidad, setEditDisponibilidad] = useState<Disponibilidad>({});
  const [editSeguridad, setEditSeguridad] = useState<Record<string, boolean>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Review modal
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewEspacioId, setReviewEspacioId] = useState('');
  const [reviewEspacioNombre, setReviewEspacioNombre] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTexto, setReviewTexto] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewOk, setReviewOk] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [authLoading, user, router]);

  const cargarDatosOferente = useCallback(async () => {
    if (!isOferente || !token) return;
    setLoadingOferente(true);
    try {
      const [espacios, recibidas] = await Promise.all([
        espaciosAPI.misEspacios(token),
        reservasAPI.recibidas(token),
      ]);
      setMisEspacios(espacios);
      setReservasRecibidas(recibidas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOferente(false);
    }
  }, [isOferente, token]);

  useEffect(() => { cargarDatosOferente(); }, [cargarDatosOferente, refreshKey]);

  async function handleToggleDisponible(id: string, disponible: boolean) {
    if (!token) return;
    const esp = misEspacios.find(e => e.id === id);
    if (!esp) return;
    try {
      await espaciosAPI.actualizar(id, {
        nombre: esp.nombre, direccion: esp.direccion, barrio: esp.barrio,
        m2: esp.m2, tipo: esp.tipo, precio_dia: esp.precio_dia, precio_mes: esp.precio_mes,
        descripcion: esp.descripcion || '', lat: esp.lat, lng: esp.lng,
        disponible,
      }, token);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  }

  function abrirEditar(esp: Espacio) {
    setEditando(esp);
    setEditForm({
      nombre: esp.nombre || '',
      descripcion: esp.descripcion || '',
      direccion: esp.direccion || '',
      precio_dia: String(esp.precio_dia || ''),
      precio_mes: String(esp.precio_mes || ''),
      categoria: (esp as any).categoria || '',
      moneda: esp.moneda || 'ARS',
    });
    setEditDisponibilidad((esp as any).disponibilidad || {});
    setEditSeguridad((esp as any).seguridad || {});
    setEditError(null);
  }

  function abrirPerfil() {
    setPerfilForm({
      nombre: user?.nombre || '',
      tel: user?.tel || '',
      direccion: user?.direccion || '',
      lat: user?.lat ? String(user.lat) : '',
      lng: user?.lng ? String(user.lng) : '',
    });
    setPerfilError('');
    setPerfilOk(false);
    setPerfilOpen(true);
  }

  // Google Maps autocomplete for profile address
  useEffect(() => {
    if (!perfilOpen || !MAPS_KEY || !perfilDireccionRef.current) return;
    const loader = new Loader({ apiKey: MAPS_KEY, version: 'weekly' });
    loader.load().then(async (google) => {
      if (!perfilDireccionRef.current) return;
      const { Autocomplete } = await google.maps.importLibrary('places') as any;
      const ac = new Autocomplete(perfilDireccionRef.current, {
        fields: ['formatted_address', 'geometry'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        setPerfilForm(f => ({
          ...f,
          direccion: place.formatted_address || f.direccion,
          lat: String(place.geometry.location.lat()),
          lng: String(place.geometry.location.lng()),
        }));
      });
    });
  }, [perfilOpen]);

  async function handleGuardarPerfil() {
    if (!token) return;
    if (!perfilForm.nombre.trim()) { setPerfilError('El nombre es obligatorio'); return; }
    setPerfilLoading(true);
    setPerfilError('');
    try {
      await usuariosAPI.actualizar({
        nombre: perfilForm.nombre,
        tel: perfilForm.tel,
        direccion: perfilForm.direccion || undefined,
        lat: perfilForm.lat ? Number(perfilForm.lat) : undefined,
        lng: perfilForm.lng ? Number(perfilForm.lng) : undefined,
      }, token);
      setPerfilOk(true);
      setTimeout(() => setPerfilOpen(false), 1500);
    } catch (err) {
      setPerfilError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setPerfilLoading(false);
    }
  }

  async function handleGuardarEdicion() {
    if (!token || !editando) return;
    if (!editForm.nombre.trim()) { setEditError('El nombre es obligatorio'); return; }
    setEditLoading(true);
    setEditError(null);
    try {
      await espaciosAPI.actualizar(editando.id, {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        direccion: editForm.direccion,
        barrio: editando.barrio,
        precio_dia: Number(editForm.precio_dia) || 0,
        precio_mes: Number(editForm.precio_mes) || 0,
        m2: editando.m2,
        tipo: editando.tipo,
        lat: editando.lat,
        lng: editando.lng,
        moneda: editForm.moneda || 'ARS',
        categoria: editForm.categoria || undefined,
        disponibilidad: editDisponibilidad,
        seguridad: editSeguridad,
      }, token);
      setEditando(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
  }

  function abrirReview(r: { espacio_id: string; espacio_nombre?: string }) {
    setReviewEspacioId(r.espacio_id);
    setReviewEspacioNombre(r.espacio_nombre || '');
    setReviewRating(0);
    setReviewTexto('');
    setReviewError('');
    setReviewOk(false);
    setReviewModal(true);
  }

  async function handleEnviarReview() {
    if (!token || !reviewRating) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      await reviewsAPI.crear({ espacio_id: reviewEspacioId, rating: reviewRating, texto: reviewTexto }, token);
      setReviewOk(true);
      setTimeout(() => setReviewModal(false), 1800);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleEliminarEspacio(id: string) {
    if (!token) return;
    if (!window.confirm('¿Eliminar este espacio? Esta acción no se puede deshacer.')) return;
    try {
      await espaciosAPI.eliminar(id, token);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  }

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' }}>
        Cargando…
      </div>
    );
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="site-header">
        <SiteLogo onClick={() => router.push('/')} />
        <nav className="nav">
          <button className="nav-btn active">Mi Panel</button>
          <button className="nav-btn" onClick={() => router.push('/')}>Explorar</button>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <Avatar nombre={user.nombre} size={34} />
          <div>
            <div style={{ fontSize: '.82rem', fontWeight: 600, lineHeight: 1.2 }}>{user.nombre}</div>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)', textTransform: 'capitalize' }}>{user.tipo}</div>
          </div>
          {isAdmin && (
            <button className="nav-btn" style={{ color: 'var(--orange)', fontWeight: 700 }} onClick={() => router.push('/admin')}>
              ⚙️ Admin
            </button>
          )}
          <button className="nav-btn" onClick={logout} style={{ marginLeft: '.25rem' }}>Salir</button>
        </div>
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Welcome */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: '.3rem' }}>
                Hola, {user.nombre.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: '.92rem' }}>
                {isOferente
                  ? 'Gestioná tus espacios y reservas desde acá.'
                  : 'Revisá el estado de tus reservas y encontrá nuevos espacios.'}
              </p>
              {user.direccion && (
                <p style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.25rem' }}>
                  📍 {user.direccion}
                </p>
              )}
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '.8rem', padding: '.4rem .9rem', whiteSpace: 'nowrap' }}
              onClick={abrirPerfil}
            >
              ✏️ Editar perfil
            </button>
          </div>

          {/* Stats — oferente only */}
          {isOferente && (
            <div style={{ marginBottom: '2rem' }}>
              <StatsOferente espacios={misEspacios} reservas={reservasRecibidas} />
            </div>
          )}

          {/* ── SECTION 1: Mis reservas realizadas ── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>
                📅 Mis reservas realizadas
              </h2>
              <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
                🔍 Buscar espacios
              </Button>
            </div>

            {misResLoading ? (
              <p style={{ color: 'var(--text3)' }}>Cargando…</p>
            ) : misReservas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📦</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.3rem' }}>No tenés reservas aún</div>
                <p style={{ fontSize: '.85rem' }}>Explorá espacios disponibles en Buenos Aires.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '.85rem' }}>
                {misReservas.map(r => (
                  <EstadoReserva
                    key={r.id}
                    reserva={r}
                    onCancelar={!['cancelada', 'finalizada'].includes(r.estado) ? () => cancelar(r.id) : undefined}
                    onPagar={r.estado === 'confirmada' ? () => router.push(`/reserva/${r.id}/checkout`) : undefined}
                    onCalificar={['pagada', 'finalizada'].includes(r.estado) ? () => abrirReview(r) : undefined}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── SECTION 2: Mis espacios publicados (oferente only) ── */}
          {isOferente && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>
                  🏠 Mis espacios publicados
                </h2>
                <Button variant="primary" size="sm" onClick={() => router.push('/publicar')}>
                  ➕ Publicar espacio
                </Button>
              </div>

              {loadingOferente ? (
                <p style={{ color: 'var(--text3)' }}>Cargando…</p>
              ) : misEspacios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text3)', background: 'var(--surface)', borderRadius: 'var(--r2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🏠</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.4rem' }}>No tenés espacios publicados</div>
                  <p style={{ fontSize: '.88rem' }}>Publicá tu primer espacio y empezá a recibir reservas.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.2rem' }}>
                  {misEspacios.map(esp => {
                    const reservasEsp = reservasRecibidas.filter(r => r.espacio_id === esp.id);
                    return (
                      <div key={esp.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
                        {/* Space info row */}
                        <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          {esp.img_principal && (
                            <img
                              src={esp.img_principal}
                              alt={esp.nombre}
                              style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--r1)', flexShrink: 0 }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>{esp.nombre}</div>
                            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.15rem' }}>
                              📍 {esp.barrio} · {esp.m2} m²
                            </div>
                            <div style={{ fontSize: '.82rem', color: 'var(--orange)', fontWeight: 700, marginTop: '.2rem' }}>
                              {formatARS(esp.precio_mes)}/mes
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', flexShrink: 0, alignItems: 'flex-end' }}>
                            <span className={`pill ${esp.disponible ? 'pill--green' : 'pill--gray'}`}>
                              {esp.disponible ? '✅ Activo' : '⏸️ Inactivo'}
                            </span>
                            <div style={{ display: 'flex', gap: '.4rem' }}>
                              <button
                                className="btn-ghost"
                                style={{ fontSize: '.73rem', color: 'var(--orange)' }}
                                onClick={() => abrirEditar(esp)}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                className="btn-ghost"
                                style={{ fontSize: '.73rem' }}
                                onClick={() => handleToggleDisponible(esp.id, !esp.disponible)}
                              >
                                {esp.disponible ? 'Pausar' : 'Activar'}
                              </button>
                              <button
                                className="btn-ghost"
                                style={{ fontSize: '.73rem', color: 'var(--red)' }}
                                onClick={() => handleEliminarEspacio(esp.id)}
                              >
                                Borrar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Reservations received for this space */}
                        {reservasEsp.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border)', padding: '.6rem 1rem .8rem' }}>
                            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>
                              Reservas recibidas ({reservasEsp.length})
                            </div>
                            <div style={{ display: 'grid', gap: '.5rem' }}>
                              {reservasEsp.map(r => (
                                <div
                                  key={r.id}
                                  style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'var(--surface2)', borderRadius: 'var(--r1)', padding: '.6rem .8rem',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{r.usuario_nombre}</div>
                                    <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
                                      {formatFechaCorta(r.fecha_desde)} → {formatFechaCorta(r.fecha_hasta)}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.2rem' }}>
                                    <div>
                                      <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>Obtuviste</div>
                                      <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--mint)' }}>
                                        {formatARS(r.precio_total)}
                                      </div>
                                    </div>
                                    <EstadoBadge estado={r.estado} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

        </div>
      </div>
      {/* Modal perfil */}
      <Modal
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        title="✏️ Editar perfil"
        subtitle="Actualizá tus datos personales y tu dirección"
        maxWidth="500px"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          {perfilOk ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Perfil actualizado</div>
            </div>
          ) : (
            <>
              <div className="form-row">
                <div>
                  <label className="form-label">Nombre *</label>
                  <input value={perfilForm.nombre}
                    onChange={e => setPerfilForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="form-label">Teléfono</label>
                  <input value={perfilForm.tel}
                    onChange={e => setPerfilForm(f => ({ ...f, tel: e.target.value }))}
                    placeholder="+54 9 11 ..." />
                </div>
              </div>

              <div>
                <label className="form-label">Dirección personal</label>
                <input
                  ref={perfilDireccionRef}
                  value={perfilForm.direccion}
                  onChange={e => setPerfilForm(f => ({ ...f, direccion: e.target.value, lat: '', lng: '' }))}
                  placeholder="Escribí tu dirección para autocompletar…"
                />
                {perfilForm.lat && (
                  <div style={{ fontSize: '.73rem', color: 'var(--mint)', marginTop: '.3rem' }}>
                    ✅ Ubicación guardada — el mapa te centrará automáticamente al iniciar sesión
                  </div>
                )}
                {perfilForm.direccion && !perfilForm.lat && (
                  <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.3rem' }}>
                    💡 Seleccioná una opción del autocompletado para guardar la ubicación exacta
                  </div>
                )}
              </div>

              {perfilError && <div className="alert alert--error">{perfilError}</div>}

              <div style={{ display: 'flex', gap: '.75rem' }}>
                <Button variant="secondary" onClick={() => setPerfilOpen(false)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardarPerfil} loading={perfilLoading} style={{ flex: 2 }}>
                  Guardar perfil
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal calificación */}
      <Modal
        open={reviewModal}
        onClose={() => setReviewModal(false)}
        title="⭐ Calificar espacio"
        subtitle={reviewEspacioNombre}
        maxWidth="440px"
      >
        {reviewOk ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🎉</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>¡Gracias por tu reseña!</div>
            <p style={{ color: 'var(--text2)', fontSize: '.85rem', marginTop: '.3rem' }}>Tu opinión ayuda a la comunidad.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Star picker */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: '.5rem' }}>¿Cuántas estrellas le das?</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '.3rem' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '2rem', lineHeight: 1,
                      color: n <= reviewRating ? 'var(--orange)' : '#ccc',
                      transition: 'color .15s, transform .1s',
                      transform: n <= reviewRating ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >★</button>
                ))}
              </div>
              {reviewRating > 0 && (
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '.3rem' }}>
                  {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][reviewRating]}
                </div>
              )}
            </div>

            {/* Texto */}
            <div>
              <label className="form-label">Comentario (opcional)</label>
              <textarea
                rows={3}
                value={reviewTexto}
                onChange={e => setReviewTexto(e.target.value)}
                placeholder="Contanos tu experiencia con el espacio…"
                style={{ marginTop: '.4rem' }}
              />
            </div>

            {reviewError && <div className="alert alert--error">{reviewError}</div>}

            <div style={{ display: 'flex', gap: '.75rem' }}>
              <Button variant="secondary" onClick={() => setReviewModal(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                onClick={handleEnviarReview}
                loading={reviewLoading}
                disabled={!reviewRating}
                style={{ flex: 2 }}
              >
                Enviar calificación
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal edición espacio */}
      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title="✏️ Editar espacio"
        subtitle={editando?.nombre}
        maxWidth="560px"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Categoría */}
          <div>
            <label className="form-label">Tipo de espacio</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.4rem', marginTop: '.4rem' }}>
              {CATEGORIAS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setEditForm(f => ({ ...f, categoria: c.value }))}
                  style={{
                    padding: '.5rem', borderRadius: 'var(--r2)', cursor: 'pointer',
                    border: `2px solid ${editForm.categoria === c.value ? 'var(--orange)' : 'var(--border)'}`,
                    background: editForm.categoria === c.value ? 'rgba(232,98,42,.1)' : 'var(--surface2)',
                    color: editForm.categoria === c.value ? 'var(--orange)' : 'var(--text2)',
                    fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '.75rem', textAlign: 'center',
                  }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="form-label">Nombre *</label>
            <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre del espacio" />
          </div>

          {/* Descripción */}
          <div>
            <label className="form-label">Descripción</label>
            <textarea rows={3} value={editForm.descripcion}
              onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Describí tu espacio…" />
          </div>

          {/* Dirección */}
          <div>
            <label className="form-label">Dirección</label>
            <input value={editForm.direccion} onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))}
              placeholder="Calle y número" />
          </div>

          {/* Moneda */}
          <div>
            <label className="form-label">Moneda</label>
            <select value={editForm.moneda} onChange={e => setEditForm(f => ({ ...f, moneda: e.target.value }))}>
              {MONEDAS.map(m => (
                <option key={m.value} value={m.value}>{m.flag} {m.label} ({m.simbolo})</option>
              ))}
            </select>
          </div>

          {/* Precios */}
          <div className="form-row">
            <div>
              <label className="form-label">Precio por día</label>
              <input type="number" value={editForm.precio_dia} min="0"
                onChange={e => setEditForm(f => ({ ...f, precio_dia: e.target.value }))}
                placeholder="850" />
            </div>
            <div>
              <label className="form-label">Precio por mes</label>
              <input type="number" value={editForm.precio_mes} min="0"
                onChange={e => setEditForm(f => ({ ...f, precio_mes: e.target.value }))}
                placeholder="18000" />
            </div>
          </div>

          {/* Calendario disponibilidad */}
          <CalendarioDisponibilidad
            precioDia={Number(editForm.precio_dia) || 0}
            precioMes={Number(editForm.precio_mes) || 0}
            value={editDisponibilidad}
            onChange={setEditDisponibilidad}
          />

          {/* Seguridad */}
          <SeguridadChecklist
            seguridad={editSeguridad}
            onChange={key => setEditSeguridad(s => ({ ...s, [key]: !s[key] }))}
          />

          {editError && <div className="alert alert--error">{editError}</div>}

          <div style={{ display: 'flex', gap: '.75rem' }}>
            <Button variant="secondary" onClick={() => setEditando(null)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarEdicion} loading={editLoading} style={{ flex: 2 }}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
