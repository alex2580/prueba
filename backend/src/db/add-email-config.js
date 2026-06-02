const { query } = require('./connection');

const EMAIL_KEYS = [
  'nueva_reserva',
  'pago_recibido_oferente',
  'publicacion_desactivada',
  'aviso_vencimiento_publicacion',
  'publicacion_vencida',
  'consulta_publica',
  'reserva_confirmada',
  'reserva_aprobada',
  'pago_confirmado',
  'recordatorios_reserva',
  'extension_confirmada',
  'reserva_finalizada',
  'respuesta_consulta',
  'bienvenida',
  'aceptacion_operacion',
  'reserva_cancelada',
  'chat_mensaje',
  'otp',
  'login_notificacion',
  'cuenta_bloqueada',
  'cuenta_desbloqueada',
  'cambio_tel',
  'servicios_adicionales',
  'mejorar_puntuacion',
  'contacto',
  'newsletter',
];

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS email_config (
      clave VARCHAR(100) NOT NULL,
      habilitado TINYINT(1) NOT NULL DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (clave)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  for (const key of EMAIL_KEYS) {
    await query(
      'INSERT IGNORE INTO email_config (clave, habilitado) VALUES (?, 1)',
      [key]
    );
  }

  console.log(`✅ email_config: tabla creada y ${EMAIL_KEYS.length} claves inicializadas.`);
  process.exit(0);
}

migrate().catch(err => { console.error('❌', err.message); process.exit(1); });
