'use client';

import { useState } from 'react';

interface RatingDisplayProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
}

export function RatingDisplay({ value, count, size = 'md' }: RatingDisplayProps) {
  const stars = Math.min(5, Math.max(0, Math.round(value || 0)));
  const fs = size === 'sm' ? '11px' : '13px';

  return (
    <div className="rating">
      <span className="rating__stars" style={{ fontSize: fs }}>
        {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      </span>
      <span className="rating__value" style={{ fontSize: size === 'sm' ? '.78rem' : '.85rem' }}>
        {(value || 0).toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="rating__count">({count})</span>
      )}
    </div>
  );
}

interface RatingInputProps {
  value: number;
  onChange: (v: number) => void;
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '.25rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: n <= (hover || value) ? 'var(--amber)' : 'var(--border2)',
            transition: 'color .1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
