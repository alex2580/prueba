'use client';

import type { Conversacion } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface ConversacionListProps {
  conversaciones: Conversacion[];
  selectedId?: string | null;
  onSelect: (conv: Conversacion) => void;
  userId: string;
}

export function ConversacionList({ conversaciones, selectedId, onSelect, userId }: ConversacionListProps) {
  if (!conversaciones.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: '.88rem' }}>
        💬 No tenés conversaciones aún
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      {conversaciones.map(conv => {
        const otherNombre = conv.demandante_id === userId
          ? conv.oferente_nombre
          : conv.demandante_nombre;
        const isSelected = conv.id === selectedId;

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv)}
            style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: '.85rem 1rem',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              background: isSelected ? 'rgba(232,98,42,.06)' : 'transparent',
              borderLeft: `3px solid ${isSelected ? 'var(--orange)' : 'transparent'}`,
              transition: 'background .12s',
            }}
          >
            <Avatar nombre={otherNombre || '?'} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)' }}>{otherNombre}</div>
                {(conv.no_leidos ?? 0) > 0 && (
                  <span style={{
                    background: 'var(--orange)', color: '#fff',
                    borderRadius: '99px', padding: '1px 7px', fontSize: '11px', fontWeight: 700,
                  }}>
                    {conv.no_leidos}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                📦 {conv.espacio_nombre}
              </div>
              {conv.ultimo_msg && (
                <div style={{ fontSize: '.76rem', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '.1rem' }}>
                  {conv.ultimo_msg}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
