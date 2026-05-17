'use client';

import { useEffect, ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, subtitle, children, maxWidth = '480px' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ width: `min(${maxWidth}, 96vw)` }}>
        <div className="modal-accent" />
        {(title || subtitle) && (
          <div className="modal-header">
            <div>
              {title && <div className="modal-title">{title}</div>}
              {subtitle && <div className="modal-sub">{subtitle}</div>}
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
        )}
        {!title && (
          <button
            className="modal-close"
            onClick={onClose}
            style={{ position: 'absolute', top: 12, right: 12 }}
            aria-label="Cerrar"
          >✕</button>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
