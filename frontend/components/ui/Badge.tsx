interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'blue' | 'green' | 'gray';
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`pill pill--${variant}`}>{children}</span>
  );
}

interface EstadoBadgeProps {
  estado: 'pendiente' | 'confirmada' | 'pagada' | 'cancelada' | 'finalizada';
}

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  emoji: '⏳', variant: 'estado-pendiente' },
  confirmada: { label: 'Confirmada', emoji: '✅', variant: 'estado-confirmada' },
  pagada:     { label: 'Pagada',     emoji: '💳', variant: 'estado-pagada' },
  cancelada:  { label: 'Cancelada',  emoji: '❌', variant: 'estado-cancelada' },
  finalizada: { label: 'Finalizada', emoji: '🏁', variant: 'estado-finalizada' },
};

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <span className={`pill ${cfg.variant}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}
