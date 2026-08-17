'use client';

import { useEffect, useState } from 'react';

const INTERVALO_MS = 2000;

export function TaglineRotativo({ frases }: { frases: string[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (frases.length <= 1) return;
    const timer = setInterval(() => {
      // Fade out, cambia el texto en el punto más invisible, fade in.
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % frases.length);
        setVisible(true);
      }, 250);
    }, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [frases.length]);

  if (frases.length === 0) return null;

  return (
    <p
      style={{
        color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: 560,
        margin: '1rem auto 0', minHeight: '3.4em',
        opacity: visible ? 1 : 0, transition: 'opacity .25s ease',
      }}
    >
      {frases[idx]}
    </p>
  );
}
