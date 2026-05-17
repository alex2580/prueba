'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MensajesConversacion } from './MensajesConversacion';
import { chatAPI } from '@/lib/api';
import type { Conversacion } from '@/types';

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  espacioId: string;
  espacioNombre: string;
  token: string;
  userId: string;
}

export function ChatModal({ open, onClose, espacioId, espacioNombre, token, userId }: ChatModalProps) {
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function initConv() {
      setLoading(true);
      try {
        const conv = await chatAPI.iniciarConversacion({ espacio_id: espacioId }, token);
        setConvId(conv.id);
      } catch (err) {
        console.error('Error starting conversation:', err);
      } finally {
        setLoading(false);
      }
    }

    initConv();
  }, [open, espacioId, token]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`💬 Chat — ${espacioNombre}`}
      subtitle="Conversá con el oferente"
      maxWidth="520px"
    >
      <div style={{ minHeight: 400 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
            Conectando…
          </div>
        ) : convId ? (
          <MensajesConversacion
            conversacionId={convId}
            token={token}
            userId={userId}
          />
        ) : (
          <div className="alert alert--error">No se pudo abrir la conversación</div>
        )}
      </div>
    </Modal>
  );
}
