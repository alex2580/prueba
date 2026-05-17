'use client';

import { useEffect, useRef, useState } from 'react';
import { useMensajes } from '@/hooks/useChat';

interface MensajesConversacionProps {
  conversacionId: string;
  token: string;
  userId: string;
}

export function MensajesConversacion({ conversacionId, token, userId }: MensajesConversacionProps) {
  const { mensajes, loading, enviando, typingNombre, enviar, emitirTyping, detenerTyping } = useMensajes(conversacionId, token, userId);
  const [texto, setTexto] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  function handleTyping(val: string) {
    setTexto(val);
    // Emit typing indicator with debounce
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (val.trim()) {
      emitirTyping('alguien');
      typingTimer.current = setTimeout(() => detenerTyping(), 2000);
    } else {
      detenerTyping();
    }
  }

  async function handleSend() {
    if (!texto.trim() || enviando) return;
    const msg = texto;
    setTexto('');
    detenerTyping();
    await enviar(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '.85rem' }}>Cargando…</div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '.85rem', padding: '1rem' }}>
            Empezá la conversación 👋
          </div>
        ) : (
          mensajes.map(msg => {
            const ismine = msg.autor_id === userId;
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: ismine ? 'flex-end' : 'flex-start' }}>
                {!ismine && (
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: '.15rem' }}>
                    {msg.autor_nombre}
                  </div>
                )}
                <div className={`chat-bubble ${ismine ? 'chat-bubble--mine' : 'chat-bubble--other'}`}>
                  {msg.texto}
                </div>
                <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: '.1rem' }}>
                  {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        {typingNombre && (
          <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontStyle: 'italic' }}>
            {typingNombre} está escribiendo…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '.75rem',
        display: 'flex',
        gap: '.5rem',
        background: 'var(--surface2)',
      }}>
        <textarea
          value={texto}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje… (Enter para enviar)"
          rows={2}
          style={{
            flex: 1, resize: 'none', borderRadius: 'var(--r2)',
            fontSize: '.85rem', padding: '.5rem .8rem',
            background: 'var(--surface)', border: '1.5px solid var(--border)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!texto.trim() || enviando}
          className="btn-primary"
          style={{ padding: '.5rem .9rem', fontSize: '.85rem', borderRadius: 'var(--r2)', alignSelf: 'flex-end' }}
        >
          {enviando ? '…' : '→'}
        </button>
      </div>
    </div>
  );
}
