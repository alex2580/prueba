import { initials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  nombre: string;
  src?: string;
  size?: number;
}

export function Avatar({ nombre, src, size = 40 }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {src ? (
        <Image src={src} alt={nombre} width={size} height={size} style={{ objectFit: 'cover', borderRadius: '99px' }} />
      ) : (
        initials(nombre)
      )}
    </div>
  );
}
