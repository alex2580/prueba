import Image from 'next/image';

interface SiteLogoProps {
  onClick?: () => void;
}

export function SiteLogo({ onClick }: SiteLogoProps) {
  return (
    <div
      className="logo"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
    >
      <Image
        src="/logo.png"
        alt="TodasMisCosas"
        width={160}
        height={48}
        style={{ objectFit: 'contain', height: 40, width: 'auto' }}
        priority
      />
    </div>
  );
}
