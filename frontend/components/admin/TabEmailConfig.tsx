'use client';

import { useState, useEffect, useCallback } from 'react';

interface EmailDef {
  key: string;
  label: string;
  desc: string;
  critico?: boolean;
}

interface GrupoDef {
  id: string;
  label: string;
  desc: string;
  color: string;
  emails: EmailDef[];
}

const GRUPOS: GrupoDef[] = [
  {
    id: 'oferente',
    label: '🏪 Oferente',
    desc: 'Mails que recibe el dueño del espacio',
    color: 'var(--mint)',
    emails: [
      { key: 'nueva_reserva',               label: '🔔 Nueva solicitud de reserva',         desc: 'Notifica al oferente cuando alguien reserva su espacio, incluye PIN y datos del solicitante.' },
      { key: 'pago_recibido_oferente',       label: '💰 Pago acreditado',                    desc: 'Informa el monto bruto, comisión 15% y neto a recibir en 48hs.' },
      { key: 'publicacion_desactivada',      label: '⏸️ Publicación pausada por inactividad', desc: 'Aviso cuando el sistema pausa automáticamente una publicación sin actividad.' },
      { key: 'aviso_vencimiento_publicacion', label: '⚠️ Aviso de vencimiento (30 días antes)', desc: 'Recordatorio 30 días antes de que venza la publicación de 90 días.' },
      { key: 'publicacion_vencida',          label: '🔴 Publicación vencida',                desc: 'Notifica cuando la publicación alcanzó los 90 días y fue dada de baja automáticamente.' },
      { key: 'consulta_publica',             label: '❓ Nueva consulta en la publicación',   desc: 'Avisa cuando un usuario hace una pregunta pública sobre el espacio.' },
    ],
  },
  {
    id: 'demandante',
    label: '🧳 Demandante',
    desc: 'Mails que recibe el buscador de espacio',
    color: 'var(--blue)',
    emails: [
      { key: 'reserva_confirmada',   label: '✅ Reserva confirmada',                    desc: 'Confirmación de reserva con PIN de acceso y link al checkout.' },
      { key: 'reserva_aprobada',     label: '✅ Reserva aprobada por el oferente',      desc: 'Aviso de que el oferente confirmó la solicitud, con link al pago.' },
      { key: 'pago_confirmado',      label: '💳 Pago aprobado',                         desc: 'Confirmación del pago procesado por MercadoPago.' },
      { key: 'recordatorios_reserva', label: '⏰ Recordatorios de vencimiento',         desc: 'Serie de avisos a 5, 2, 1 y 0 días del vencimiento de la reserva.' },
      { key: 'extension_confirmada', label: '✅ Extensión de reserva confirmada',       desc: 'Confirmación de extensión con fecha anterior vs. nueva y monto pagado.' },
      { key: 'reserva_finalizada',   label: '🏁 Estadía finalizada',                   desc: 'Aviso de cierre e invitación a dejar reseña.' },
      { key: 'respuesta_consulta',   label: '💬 Respuesta a consulta pública',          desc: 'Notifica cuando el oferente responde la pregunta del usuario.' },
    ],
  },
  {
    id: 'compartidos',
    label: '🤝 Ambos',
    desc: 'Mails que puede recibir cualquier usuario',
    color: 'var(--orange)',
    emails: [
      { key: 'bienvenida',           label: '👋 Bienvenida y términos',                 desc: 'Se envía al crear la cuenta con resumen de T&C y comisión.' },
      { key: 'aceptacion_operacion', label: '📋 Confirmación legal de operación',       desc: 'Detalle de obligaciones al crear una reserva (ambas partes).' },
      { key: 'reserva_cancelada',    label: '❌ Reserva cancelada',                     desc: 'Aviso a ambas partes cuando se cancela una reserva.' },
      { key: 'chat_mensaje',         label: '💬 Nuevo mensaje de chat',                 desc: 'Notificación de mensaje recibido en el chat de la plataforma.' },
      { key: 'otp',                  label: '🔐 Código de verificación (OTP)',          desc: 'Código de 6 dígitos para login. Desactivar impide el ingreso de usuarios.', critico: true },
      { key: 'login_notificacion',   label: '✅ Notificación de acceso exitoso',        desc: 'Aviso tras cada login exitoso con IP y dispositivo.' },
      { key: 'cuenta_bloqueada',     label: '⛔ Cuenta suspendida',                    desc: 'Informa al usuario que su cuenta fue bloqueada por un admin.' },
      { key: 'cuenta_desbloqueada',  label: '✅ Cuenta reactivada',                    desc: 'Informa al usuario que su cuenta fue reactivada por un admin.' },
      { key: 'cambio_tel',           label: '📱 Cambio de teléfono confirmado',         desc: 'Aviso de seguridad tras actualizar el número de teléfono.' },
    ],
  },
  {
    id: 'internos',
    label: '⚙️ Internos',
    desc: 'Mails que van al equipo de TodasMisCosas',
    color: 'var(--text3)',
    emails: [
      { key: 'contacto',             label: '📩 Formulario de contacto',               desc: 'Mensaje recibido del formulario de contacto público.' },
      { key: 'servicios_adicionales', label: '🛎️ Servicios adicionales solicitados',   desc: 'Aviso al admin cuando un demandante solicita transporte, seguro, embalaje, etc.' },
      { key: 'mejorar_puntuacion',   label: '🛡️ Solicitud de mejora de puntuación',   desc: 'Aviso cuando un oferente solicita mejorar su puntaje de seguridad.' },
      { key: 'newsletter',           label: '📨 Newsletter / Mailing masivo',          desc: 'Envío de campañas desde el panel de marketing.' },
    ],
  },
];

const TOTAL_KEYS = GRUPOS.reduce((s, g) => s + g.emails.length, 0);

function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      disabled={disabled}
      style={{
        flexShrink: 0,
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        background: on ? 'var(--mint)' : 'var(--surface2)',
        position: 'relative',
        cursor: disabled ? 'wait' : 'pointer',
        transition: 'background .2s',
        outline: 'none',
        boxShadow: on ? '0 0 0 1px rgba(16,185,129,.4)' : '0 0 0 1px var(--border)',
        opacity: disabled ? .5 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)',
        transition: 'left .2s',
        display: 'block',
      }} />
    </button>
  );
}

export function TabEmailConfig({ token }: { token: string }) {
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/email-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar configuración de emails');
      setConfig(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function patchConfig(updates: Record<string, boolean>) {
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Error al guardar');
    } catch {
      load(); // revertir en caso de error
    }
  }

  async function toggle(key: string) {
    const newVal = !(config[key] !== false);
    setConfig(prev => ({ ...prev, [key]: newVal }));
    setSaving(prev => ({ ...prev, [key]: true }));
    await patchConfig({ [key]: newVal });
    setSaving(prev => ({ ...prev, [key]: false }));
  }

  async function toggleGroup(grupo: GrupoDef, value: boolean) {
    const updates: Record<string, boolean> = {};
    grupo.emails.forEach(e => { updates[e.key] = value; });
    setConfig(prev => ({ ...prev, ...updates }));
    await patchConfig(updates);
  }

  const totalEnabled = GRUPOS.reduce(
    (sum, g) => sum + g.emails.filter(e => config[e.key] !== false).length,
    0
  );

  if (loading) return <p style={{ color: 'var(--text3)', padding: '2rem 0' }}>Cargando configuración de emails…</p>;
  if (error) return <p style={{ color: 'var(--red)', padding: '1rem 0' }}>{error}</p>;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>

      {/* Resumen */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r3)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '.95rem' }}>
            ✉️ Configuración de notificaciones por email
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.2rem' }}>
            <span style={{ color: totalEnabled === TOTAL_KEYS ? 'var(--mint)' : totalEnabled === 0 ? 'var(--red)' : 'var(--amber)', fontWeight: 700 }}>
              {totalEnabled}
            </span>
            {' '}de {TOTAL_KEYS} tipos habilitados · Los cambios se aplican de inmediato, sin reiniciar el servidor
          </div>
        </div>
        <div style={{
          fontSize: '.75rem',
          color: 'var(--amber)',
          background: 'rgba(245,158,11,.1)',
          border: '1px solid rgba(245,158,11,.3)',
          borderRadius: 'var(--r2)',
          padding: '.5rem .85rem',
          maxWidth: 280,
          lineHeight: 1.5,
        }}>
          ⚠️ Deshabilitar el <strong>OTP</strong> impide que los usuarios puedan iniciar sesión
        </div>
      </div>

      {/* Grupos */}
      {GRUPOS.map(grupo => {
        const habilitados = grupo.emails.filter(e => config[e.key] !== false).length;
        const todosOn  = habilitados === grupo.emails.length;
        const todosOff = habilitados === 0;

        return (
          <div key={grupo.id} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r3)',
            overflow: 'hidden',
          }}>
            {/* Header del grupo */}
            <div style={{
              background: 'var(--surface2)',
              borderBottom: '1px solid var(--border)',
              padding: '.9rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '.9rem', color: grupo.color }}>
                  {grupo.label}
                </div>
                <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.15rem' }}>
                  {grupo.desc} · <span style={{ fontWeight: 600 }}>{habilitados}/{grupo.emails.length}</span> habilitados
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => toggleGroup(grupo, true)}
                  disabled={todosOn}
                  style={{
                    padding: '.28rem .75rem',
                    borderRadius: 99,
                    fontSize: '.72rem',
                    fontWeight: 700,
                    border: '1px solid rgba(16,185,129,.4)',
                    background: 'rgba(16,185,129,.1)',
                    color: 'var(--mint)',
                    cursor: todosOn ? 'default' : 'pointer',
                    opacity: todosOn ? .4 : 1,
                  }}
                >
                  Activar todos
                </button>
                <button
                  onClick={() => toggleGroup(grupo, false)}
                  disabled={todosOff}
                  style={{
                    padding: '.28rem .75rem',
                    borderRadius: 99,
                    fontSize: '.72rem',
                    fontWeight: 700,
                    border: '1px solid rgba(239,68,68,.4)',
                    background: 'rgba(239,68,68,.08)',
                    color: 'var(--red)',
                    cursor: todosOff ? 'default' : 'pointer',
                    opacity: todosOff ? .4 : 1,
                  }}
                >
                  Desactivar todos
                </button>
              </div>
            </div>

            {/* Filas de emails */}
            <div>
              {grupo.emails.map((email, idx) => {
                const on = config[email.key] !== false;
                const isSaving = saving[email.key];

                return (
                  <div
                    key={email.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '.85rem 1.25rem',
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      background: on ? 'transparent' : 'rgba(239,68,68,.025)',
                      transition: 'background .2s',
                    }}
                  >
                    <Toggle on={on} disabled={isSaving} onChange={() => toggle(email.key)} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.18rem' }}>
                        <span style={{
                          fontSize: '.85rem',
                          fontWeight: 700,
                          fontFamily: 'Sora, sans-serif',
                          color: on ? 'var(--text)' : 'var(--text3)',
                          transition: 'color .2s',
                        }}>
                          {email.label}
                        </span>
                        {email.critico && (
                          <span style={{
                            fontSize: '.62rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 99,
                            background: 'rgba(245,158,11,.18)',
                            color: 'var(--amber)',
                            border: '1px solid rgba(245,158,11,.35)',
                          }}>
                            ⚠️ CRÍTICO
                          </span>
                        )}
                        <span style={{
                          fontSize: '.62rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 99,
                          background: on ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.1)',
                          color: on ? 'var(--mint)' : 'var(--red)',
                          transition: 'all .2s',
                        }}>
                          {on ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', lineHeight: 1.45 }}>
                        {email.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
