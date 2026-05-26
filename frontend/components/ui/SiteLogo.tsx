interface SiteLogoProps {
  onClick?: () => void;
}

export function SiteLogo({ onClick }: SiteLogoProps) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
        letterSpacing: '-.025em',
        lineHeight: 1,
      }}
    >
      <span style={{
        fontFamily: 'Sora, sans-serif',
        fontWeight: 800,
        fontSize: '1.28rem',
        color: '#e8622a',
      }}>Todas</span>
      <span style={{
        fontFamily: 'Sora, sans-serif',
        fontWeight: 800,
        fontSize: '1.28rem',
        color: '#1E293B',
      }}>MisCosas</span>
    </div>
  );
}
