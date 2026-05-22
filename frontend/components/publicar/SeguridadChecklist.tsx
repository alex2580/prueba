'use client';

export const SEGURIDAD_OPCIONES = [
  { key: 'techo_impermeable', label: 'Techo y paredes impermeables',   emoji: '🏠', detalle: 'Protege contra lluvia, humedad y filtraciones.' },
  { key: 'cerradura',         label: 'Acceso con llave o candado propio', emoji: '🔑', detalle: 'El inquilino tiene llave exclusiva del espacio.' },
  { key: 'camaras',           label: 'Cámara de seguridad en el área', emoji: '📷', detalle: 'Vigilancia visual del acceso al espacio.' },
  { key: 'iluminacion',       label: 'Iluminación adecuada',           emoji: '💡', detalle: 'Hay buena iluminación natural o artificial.' },
  { key: 'acceso_controlado', label: 'Acceso controlado al edificio',  emoji: '🚧', detalle: 'Portón, guardia o sistema de control de acceso.' },
  { key: 'seco_ventilado',    label: 'Espacio seco y ventilado',       emoji: '💨', detalle: 'Evita humedad y malos olores para objetos guardados.' },
  { key: 'acceso_24h',        label: 'Acceso 24hs disponible',         emoji: '⏰', detalle: 'El demandante puede ingresar en cualquier momento.' },
  { key: 'extintor',          label: 'Extintor en las cercanías',      emoji: '🔥', detalle: 'Hay extintor accesible cerca del espacio.' },
];

interface Props {
  seguridad: Record<string, boolean>;
  onChange: (key: string) => void;
}

export function SeguridadChecklist({ seguridad, onChange }: Props) {
  const total    = SEGURIDAD_OPCIONES.length;
  const selected = SEGURIDAD_OPCIONES.filter(o => seguridad[o.key]).length;
  const stars    = Math.round((selected / total) * 5);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.2rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🛡️</span>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
              Nivel de seguridad
            </span>
          </div>
          <p style={{ fontSize: '.74rem', color: 'var(--text3)', margin: 0 }}>
            Pasá el cursor sobre cada ítem para ver detalles
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
          <div style={{ fontSize: '1.15rem', color: 'var(--orange)', letterSpacing: 1, lineHeight: 1 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} style={{ opacity: n <= stars ? 1 : 0.2, transition: 'opacity .2s' }}>★</span>
            ))}
          </div>
          <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: '.25rem' }}>
            {selected}/{total} ítems
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
        {SEGURIDAD_OPCIONES.map(opt => {
          const activo = !!seguridad[opt.key];
          return (
            <div
              key={opt.key}
              title={opt.detalle}
              onClick={() => onChange(opt.key)}
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
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{opt.emoji}</span>
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
  );
}
