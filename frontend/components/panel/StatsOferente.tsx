'use client';

import type { Espacio, Reserva } from '@/types';
import { formatARS, netoOferente } from '@/lib/utils';
import { RatingDisplay } from '@/components/ui/Rating';

interface StatsOferenteProps {
  espacios: Espacio[];
  reservas: Reserva[];
}

export function StatsOferente({ espacios, reservas }: StatsOferenteProps) {
  const ahora = new Date();
  const ingresosMes = reservas
    .filter(r => ['pagada', 'finalizada'].includes(r.estado) && new Date(r.created_at).getMonth() === ahora.getMonth() && new Date(r.created_at).getFullYear() === ahora.getFullYear())
    .reduce((acc, r) => acc + netoOferente(r.precio_total), 0);

  const ingresosTotal = reservas
    .filter(r => ['pagada', 'finalizada'].includes(r.estado))
    .reduce((acc, r) => acc + netoOferente(r.precio_total), 0);

  const avgRating = espacios.length
    ? espacios.reduce((acc, e) => acc + e.rating, 0) / espacios.length
    : 0;

  const totalReviews = espacios.reduce((acc, e) => acc + e.reviews_count, 0);

  return (
    <div className="stats-grid">
      <StatCard emoji="💰" label="Ingresos del mes (neto)" value={formatARS(ingresosMes)} color="var(--mint)" />
      <StatCard emoji="🏦" label="Ingresos totales (neto)" value={formatARS(ingresosTotal)} color="var(--orange)" />
      <StatCard emoji="📦" label="Espacios activos" value={String(espacios.filter(e => e.disponible).length)} />
      <StatCard emoji="📅" label="Reservas recibidas" value={String(reservas.length)} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem', minWidth: 0 }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>⭐</div>
        <div style={{ marginBottom: '.15rem' }}>
          <RatingDisplay value={avgRating} count={totalReviews} />
        </div>
        <div style={{ fontSize: 'clamp(.65rem, 1.2vw, .75rem)', color: 'var(--text3)', lineHeight: 1.3, marginTop: '.1rem' }}>Valoración promedio</div>
      </div>
    </div>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '1rem', minWidth: 0 }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>{emoji}</div>
      <div style={{ fontSize: 'clamp(.95rem, 2vw, 1.25rem)', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: color || 'var(--text)', wordBreak: 'break-word' }}>
        {value}
      </div>
      <div style={{ fontSize: 'clamp(.65rem, 1.2vw, .75rem)', color: 'var(--text3)', lineHeight: 1.3, marginTop: '.1rem' }}>{label}</div>
    </div>
  );
}
