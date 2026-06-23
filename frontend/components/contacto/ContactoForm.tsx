'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ContactoFormProps {
  onDone?: () => void;
}

export function ContactoForm({ onDone }: ContactoFormProps) {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', tipo: 'consulta', mensaje: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function enviar() {
    if (!form.nombre || !form.email || !form.asunto || !form.mensaje) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('No se pudo enviar el mensaje');
      setSuccess(true);
      setForm({ nombre: '', email: '', asunto: '', tipo: 'consulta', mensaje: '' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginBottom: '.4rem' }}>Mensaje enviado</div>
        <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Gracias por escribirnos. Te responderemos a la brevedad.</p>
        {onDone && (
          <button className="btn-secondary" style={{ marginTop: '1.25rem' }} onClick={onDone}>
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {error && <p className="alert alert--error">{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <label className="form-label">
          Nombre *
          <input
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Tu nombre"
            style={{ marginTop: '.4rem' }}
          />
        </label>
        <label className="form-label">
          Email *
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="tu@email.com"
            style={{ marginTop: '.4rem' }}
          />
        </label>
      </div>

      <label className="form-label">
        Asunto *
        <input
          value={form.asunto}
          onChange={e => setForm(f => ({ ...f, asunto: e.target.value }))}
          placeholder="¿En qué te podemos ayudar?"
          style={{ marginTop: '.4rem' }}
        />
      </label>

      <label className="form-label">
        Tipo
        <select
          value={form.tipo}
          onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
          style={{ marginTop: '.4rem' }}
        >
          <option value="consulta">Consulta</option>
          <option value="reclamo">Reclamo</option>
          <option value="sugerencia">Sugerencia</option>
        </select>
      </label>

      <label className="form-label">
        Mensaje *
        <textarea
          rows={4}
          value={form.mensaje}
          onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
          placeholder="Escribí tu mensaje acá…"
          style={{ marginTop: '.4rem' }}
        />
      </label>

      <Button
        onClick={enviar}
        loading={sending}
        disabled={!form.nombre || !form.email || !form.asunto || !form.mensaje}
      >
        Enviar mensaje
      </Button>
    </div>
  );
}
