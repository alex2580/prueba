'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useReservas } from '@/hooks/useReservas';
import { espaciosAPI, reservasAPI } from '@/lib/api';
import type { Espacio, Reserva } from '@/types';
import { StatsOferente } from '@/components/panel/StatsOferente';
import { EstadoReserva } from '@/components/reservas/EstadoReserva';
import { EstadoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { formatARS, formatFechaCorta } from '@/lib/utils';

export default function PanelPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, logout } = useAuth();
  const isOferente = user?.tipo === 'oferente' || user?.tipo === 'admin';

  // Reservas propias (as demandante — for all users)
  const { reservas: misReservas, loading: misResLoading, cancelar } = useReservas(token, 'mias');

  // Oferente-specific data
  const [misEspacios, setMisEspacios] = useState<Espacio[]>([]);
  const [reservasRecibidas, setReservasRecibidas] = useState<Reserva[]>([]);
  const [loadingOferente, setLoadingOferente] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
        <div className="logo" onClick={() => router.push('/')}>
          <span style={{ fontSize: '1.4rem' }}>📦</span>
          <span>Todas<span style={{ color: 'var(--orange)' }}>Mis</span>Cosas</span>
        </div>
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
          <button className="nav-btn" onClick={logout} style={{ marginLeft: '.25rem' }}>Salir</button>
        </div>
      </header>

      <div className="page-scroll">
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Welcome */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: '.3rem' }}>
              Hola, {user.nombre.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '.92rem' }}>
              {isOferente
                ? 'Gestioná tus espacios y reservas desde acá.'
                : 'Revisá el estado de tus reservas y encontrá nuevos espacios.'}
            </p>
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
    </div>
  );
}
