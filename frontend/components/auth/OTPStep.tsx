'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface OTPStepProps {
  emailHint: string;
  canales: { email: boolean; sms: boolean; whatsapp: boolean };
  onVerify: (codigo: string) => Promise<boolean>;
  onReenviar: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function OTPStep({ emailHint, canales, onVerify, onReenviar, loading, error }: OTPStepProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [reenvioTimer, setReenvioTimer] = useState(60);
  const [reenvioLoading, setReenvioLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown para reenvío
  useEffect(() => {
    if (reenvioTimer <= 0) return;
    const t = setTimeout(() => setReenvioTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [reenvioTimer]);

  // Enfocar primer input al montar
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(idx: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    // Auto-submit cuando todos están llenos
    if (v && next.every(d => d !== '')) {
      onVerify(next.join(''));
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = [...digits];
    text.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setDigits(next);
    const lastFilled = Math.min(text.length, 5);
    inputRefs.current[lastFilled]?.focus();
    if (text.length === 6) {
      onVerify(text);
    }
  }

  async function handleReenviar() {
    setReenvioLoading(true);
    await onReenviar();
    setReenvioLoading(false);
    setReenvioTimer(60);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  }

  const canalesActivos = [
    canales.email && '📧 email',
    canales.sms && '📱 SMS',
    canales.whatsapp && '💬 WhatsApp',
  ].filter(Boolean).join(', ');

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: '.5rem' }}>🔐</div>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.25rem', marginBottom: '.4rem' }}>
          Verificación de identidad
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '.85rem', lineHeight: 1.6 }}>
          Enviamos un código de 6 dígitos a{' '}
          <strong style={{ color: 'var(--text)' }}>{emailHint}</strong>
          {canalesActivos && (
            <> y por <strong style={{ color: 'var(--text)' }}>{canalesActivos}</strong></>
          )}.
        </p>
      </div>

      {/* Inputs de 6 dígitos */}
      <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={loading}
            style={{
              width: 46, height: 56,
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              borderRadius: 'var(--r2)',
              border: `2px solid ${d ? 'var(--orange)' : 'var(--border)'}`,
              background: d ? 'rgba(232,98,42,.08)' : 'var(--surface2)',
              color: 'var(--text)',
              outline: 'none',
              transition: 'border-color .15s, background .15s',
              cursor: loading ? 'not-allowed' : 'text',
              opacity: loading ? .6 : 1,
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
          borderRadius: 'var(--r2)', padding: '.75rem 1rem',
          color: '#f87171', fontSize: '.85rem', textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      <Button
        onClick={() => onVerify(digits.join(''))}
        loading={loading}
        disabled={digits.some(d => !d) || loading}
        style={{ width: '100%' }}
      >
        Verificar código
      </Button>

      <div style={{ textAlign: 'center', fontSize: '.82rem', color: 'var(--text3)' }}>
        {reenvioTimer > 0 ? (
          <>Podés reenviar el código en <strong style={{ color: 'var(--text2)' }}>{reenvioTimer}s</strong></>
        ) : (
          <button
            type="button"
            onClick={handleReenviar}
            disabled={reenvioLoading}
            style={{
              background: 'none', border: 'none',
              color: 'var(--orange)', fontWeight: 700,
              cursor: 'pointer', fontSize: '.82rem',
              opacity: reenvioLoading ? .6 : 1,
            }}
          >
            {reenvioLoading ? 'Enviando…' : '↺ Reenviar nuevo código'}
          </button>
        )}
      </div>

      <div style={{
        background: 'var(--surface2)', borderRadius: 'var(--r2)',
        padding: '.7rem 1rem', fontSize: '.75rem', color: 'var(--text3)',
        textAlign: 'center', lineHeight: 1.5,
      }}>
        🔒 Este código vence en 10 minutos y solo puede usarse una vez.
        No lo compartas con nadie — TodasMisCosas nunca te lo va a pedir.
      </div>
    </div>
  );
}
