'use client';

interface Paso {
  icon: React.ReactNode;
  titulo: string;
  desc: string;
}

const iconProps = {
  width: 26, height: 26, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
};

const PASOS: Paso[] = [
  {
    titulo: 'Buscás',
    desc: 'Filtrás por zona, precio y tipo hasta encontrar el espacio ideal.',
    icon: (
      <svg {...iconProps}>
        <circle cx="10" cy="10" r="6" />
        <line x1="15" y1="15" x2="20" y2="20" />
      </svg>
    ),
  },
  {
    titulo: 'Reservás',
    desc: 'Elegís las fechas y confirmás la reserva en minutos.',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="9.5" x2="21" y2="9.5" />
        <line x1="7.5" y1="3" x2="7.5" y2="7" />
        <line x1="16.5" y1="3" x2="16.5" y2="7" />
      </svg>
    ),
  },
  {
    titulo: 'Pagás seguro',
    desc: 'El dinero queda en garantía hasta que confirmás el acceso.',
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l7 3.2v5.8c0 4.8-3 7.8-7 9-4-1.2-7-4.2-7-9V6.2L12 3z" />
        <path d="M9 12l2 2 4-4.5" />
      </svg>
    ),
  },
  {
    titulo: 'Coordinás',
    desc: 'Chateás directo con quien cuidará tus cosas para acordar el ingreso.',
    icon: (
      <svg {...iconProps}>
        <path d="M4 5.5h16V16H9.5L4.5 19.5V16H4V5.5z" />
        <line x1="8" y1="9.2" x2="16" y2="9.2" />
        <line x1="8" y1="12.2" x2="13" y2="12.2" />
      </svg>
    ),
  },
  {
    titulo: 'Confirmás',
    desc: 'Accedés al espacio y ahí se libera el pago — listo.',
    icon: (
      <svg {...iconProps}>
        <circle cx="8" cy="8" r="4" />
        <line x1="11" y1="11" x2="20" y2="20" />
        <line x1="15.5" y1="15.5" x2="17.7" y2="13.3" />
        <line x1="18" y1="18" x2="20.2" y2="15.8" />
      </svg>
    ),
  },
];

export function ComoFuncionaFlow() {
  return (
    <div className="cf-flow">
      <style>{`
        .cf-flow { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem 3.5rem; }
        .cf-flow__title {
          font-family: Sora, sans-serif; font-weight: 800; font-size: 1.3rem;
          text-align: center; margin-bottom: 2.25rem; color: var(--text);
        }
        .cf-flow__row {
          display: flex; align-items: flex-start; gap: 0; position: relative;
        }
        .cf-flow__connector {
          position: absolute; top: 26px; left: 9%; right: 9%; height: 1.5px;
          background: repeating-linear-gradient(to right, var(--border2) 0 6px, transparent 6px 12px);
          z-index: 0;
        }
        .cf-flow__step {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 0 .6rem; position: relative; z-index: 1;
        }
        .cf-flow__icon {
          width: 54px; height: 54px; border-radius: 50%;
          background: var(--surface); border: 1.5px solid var(--orange);
          color: var(--orange);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: .85rem; flex-shrink: 0;
        }
        .cf-flow__step-titulo {
          font-family: Sora, sans-serif; font-weight: 700; font-size: .88rem;
          color: var(--text); margin-bottom: .35rem;
        }
        .cf-flow__step-desc {
          font-size: .76rem; color: var(--text3); line-height: 1.5; max-width: 160px;
        }
        @media (max-width: 860px) {
          .cf-flow__row { flex-direction: column; gap: 1.5rem; align-items: stretch; }
          .cf-flow__connector { display: none; }
          .cf-flow__step { flex-direction: row; text-align: left; padding: 0; gap: 1rem; }
          .cf-flow__icon { margin-bottom: 0; }
          .cf-flow__step-desc { max-width: none; }
        }
      `}</style>

      <h2 className="cf-flow__title">¿Cómo funciona?</h2>

      <div className="cf-flow__row">
        <div className="cf-flow__connector" />
        {PASOS.map((paso, i) => (
          <div className="cf-flow__step" key={i}>
            <div className="cf-flow__icon">{paso.icon}</div>
            <div>
              <div className="cf-flow__step-titulo">{i + 1}. {paso.titulo}</div>
              <div className="cf-flow__step-desc">{paso.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
