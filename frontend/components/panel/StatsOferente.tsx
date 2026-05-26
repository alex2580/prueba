'use client';

import type { Espacio, Reserva } from '@/types';
import { formatARS } from '@/lib/utils';
import { RatingDisplay } from '@/components/ui/Rating';

interface StatsOferenteProps {
  espacios: Espacio[];
  reservas: Reserva[];
}

export function StatsOferente({ espacios, reservas }: StatsOferenteProps) {
  const ingresosMes = reservas
    .filter(r => r.estado === 'pagada' && new Date(r.created_at).getMonth() === new Date().getMonth())
    .reduce((acc, r) => acc + r.precio_total, 0);

  const ingresosTotal = reservas
    .filter(r => ['pagada', 'finalizada'].includes(r.estado))
    .reduce((acc, r) => acc + r.precio_total, 0);

  const avgRating = espacios.length
    ? espacios.reduce((acc, e) => acc + e.rating, 0) / espacios.length
    : 0;

  const totalReviews = espacios.reduce((acc, e) => acc + e.reviews_count, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      <StatCard emoji="💰" label="Ingresos del mes" value={formatARS(ingresosMes)} color="var(--mint)" />
      <StatCard emoji="🏦" label="Ingresos totales" value={formatARS(ingresosTotal)} color="var(--orange)" />
      <StatCard emoji="📦" label="Espacios activos" value={String(espacios.filter(e => e.disponible).length)} />
      <StatCard emoji="📅" label="Reservas recibidas" value={String(reservas.length)} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>⭐</div>
        <div style={{ marginBottom: '.15rem' }}>
          <RatingDisplay value={avgRating} count={totalReviews} />
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>Valoración promedio</div>
      </div>
    </div>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>{emoji}</div>
      <div style={{ fontSize: '1.25rem', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: color || 'var(--text)' }}>
        {value}
      </div>
      <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}
