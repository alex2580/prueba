'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useReservas } from '@/hooks/useReservas';
import { useEspacios } from '@/hooks/useEspacios';
import { PanelOferente } from '@/components/panel/PanelOferente';
import { PanelDemandante } from '@/components/panel/PanelDemandante';
import { StatsOferente } from '@/components/panel/StatsOferente';
import { Avatar } from '@/components/ui/Avatar';
import { espaciosAPI } from '@/lib/api';

export default function PanelPage() {
  const router  = useRouter();
  const { user, token, loading: authLoading, logout } = useAuth();
  const isOferente = user?.tipo === 'oferente' || user?.tipo === 'admin';

  const { reservas, loading: resLoading, cancelar } = useReservas(token, isOferente ? 'recibidas' : 'mias');
  const { espacios, loading: espLoading } = useEspacios();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  async function handleToggleDisponible(id: string, disponible: boolean) {
    if (!token) return;
    try {
      const esp = espacios.find(e => e.id === id);
      if (!esp) return;
      await espaciosAPI.actualizar(id, {
        nombre: esp.nombre, direccion: esp.direccion, barrio: esp.barrio,
        m2: esp.m2, tipo: esp.tipo, precio_dia: esp.precio_dia, precio_mes: esp.precio_mes,
        descripcion: esp.descripcion || '', lat: esp.lat, lng: esp.lng,
        disponible,
      }, token);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }

  if (authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' }}>Cargando…</div>;
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
          <button className="nav-btn active">Mi panel</button>
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

          {/* Stats for oferente */}
          {isOferente && (
            <div style={{ marginBottom: '2rem' }}>
              <StatsOferente espacios={espacios} reservas={reservas} />
            </div>
          )}

          {/* Panel por tipo */}
          {isOferente ? (
            <PanelOferente
              espacios={espacios.filter(e => e.oferente_id === user.id)}
              reservas={reservas}
              loading={resLoading || espLoading}
              onToggleDisponible={handleToggleDisponible}
            />
          ) : (
            <PanelDemandante
              reservas={reservas}
              loading={resLoading}
              onCancelar={cancelar}
            />
          )}
        </div>
      </div>
    </div>
  );
}
