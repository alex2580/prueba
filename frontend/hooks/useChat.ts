'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatAPI } from '@/lib/api';
import type { Conversacion, Mensaje } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export function useConversaciones(token: string | null) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await chatAPI.listarConversaciones(token);
      setConversaciones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  return { conversaciones, loading, error, recargar: cargar };
}

export function useMensajes(conversacionId: string | null, token: string | null, userId: string | null) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [typingNombre, setTypingNombre] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load messages from API
  const cargar = useCallback(async () => {
    if (!conversacionId || !token) return;
    setLoading(true);
    try {
      const data = await chatAPI.obtenerMensajes(conversacionId, token);
      setMensajes(data);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversacionId, token]);

  // Connect Socket.io
  useEffect(() => {
    if (!conversacionId || !token) return;

    const socket = io(WS_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join_conversation', conversacionId);

    socket.on('nuevo_mensaje', (msg: Mensaje) => {
      setMensajes(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    socket.on('user_typing', ({ nombre }: { nombre: string }) => {
      setTypingNombre(nombre);
    });

    socket.on('user_stop_typing', () => {
      setTypingNombre(null);
    });

    cargar();

    return () => {
      socket.emit('leave_conversation', conversacionId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversacionId, token, cargar]);

  const enviar = useCallback(async (texto: string) => {
    if (!conversacionId || !token || !texto.trim()) return;
    setEnviando(true);
    try {
      const msg = await chatAPI.enviarMensaje(conversacionId, texto, token);
      // Optimistic update — the socket will also broadcast it
      setMensajes(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } finally {
      setEnviando(false);
    }
  }, [conversacionId, token]);

  const emitirTyping = useCallback((nombre: string) => {
    socketRef.current?.emit('typing', { conversacionId, nombre });
  }, [conversacionId]);

  const detenerTyping = useCallback(() => {
    socketRef.current?.emit('stop_typing', { conversacionId });
  }, [conversacionId]);

  return { mensajes, loading, enviando, typingNombre, enviar, emitirTyping, detenerTyping };
}
