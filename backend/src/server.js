require('dotenv').config();
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const app = require('./app');
const { testConnection } = require('./db/connection');
const { setupSocketHandlers } = require('./controllers/chatController');

const PORT = parseInt(process.env.PORT) || 4000;

const server = http.createServer(app);

// ── Socket.io setup ────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Attach io to app for use in controllers
app.set('io', io);

// Setup socket event handlers
setupSocketHandlers(io);

// ── Boot ──────────────────────────────────────────────────────
async function start() {
  const dbOk = await testConnection();
  if (!dbOk && process.env.NODE_ENV === 'production') {
    console.error('Cannot start without database in production');
    process.exit(1);
  }

  if (dbOk) {
    const { pool } = require('./db/connection');

    // reservas_ocultas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservas_ocultas (
        reserva_id VARCHAR(36) NOT NULL,
        usuario_id VARCHAR(36) NOT NULL,
        oculta_en  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (reserva_id, usuario_id),
        INDEX idx_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).catch(e => console.error('⚠️  reservas_ocultas:', e.message));

    // Columnas de vencimiento (idempotente — IF NOT EXISTS)
    await pool.query(`ALTER TABLE espacios ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE NULL`).catch(e => console.error('⚠️  fecha_vencimiento:', e.message));
    await pool.query(`ALTER TABLE espacios ADD COLUMN IF NOT EXISTS vencida TINYINT(1) NOT NULL DEFAULT 0`).catch(e => console.error('⚠️  vencida:', e.message));
    await pool.query(`ALTER TABLE espacios ADD COLUMN IF NOT EXISTS aviso_vencimiento_enviado TINYINT(1) NOT NULL DEFAULT 0`).catch(e => console.error('⚠️  aviso_vencimiento_enviado:', e.message));

    // Retroactivo: espacios sin fecha_vencimiento la obtienen desde su created_at
    await pool.query(`
      UPDATE espacios
      SET fecha_vencimiento = DATE_ADD(created_at, INTERVAL 90 DAY)
      WHERE fecha_vencimiento IS NULL AND activo = TRUE
    `).catch(e => console.error('⚠️  retroactivo vencimiento:', e.message));

    // Expirar espacios cuya fecha_vencimiento ya pasó
    await pool.query(`
      UPDATE espacios
      SET activo = FALSE, vencida = 1, disponible = FALSE
      WHERE fecha_vencimiento IS NOT NULL
        AND fecha_vencimiento < CURDATE()
        AND vencida = 0
    `).catch(e => console.error('⚠️  expirar vencidos:', e.message));

    // Tabla email_config (feature flags de emails)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_config (
        clave      VARCHAR(100) NOT NULL,
        habilitado TINYINT(1)   NOT NULL DEFAULT 1,
        updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).catch(e => console.error('⚠️  email_config table:', e.message));

    const EMAIL_KEYS = [
      'nueva_reserva','pago_recibido_oferente','publicacion_desactivada',
      'aviso_vencimiento_publicacion','publicacion_vencida','consulta_publica',
      'reserva_confirmada','reserva_aprobada','pago_confirmado',
      'recordatorios_reserva','extension_confirmada','reserva_finalizada',
      'respuesta_consulta','bienvenida','aceptacion_operacion','reserva_cancelada','escrow_retenido','escrow_liberado',
      'chat_mensaje','otp','login_notificacion','cuenta_bloqueada',
      'cuenta_desbloqueada','cambio_tel','servicios_adicionales',
      'mejorar_puntuacion','contacto','newsletter',
    ];
    for (const clave of EMAIL_KEYS) {
      await pool.query('INSERT IGNORE INTO email_config (clave, habilitado) VALUES (?, 1)', [clave])
        .catch(e => console.error(`⚠️  email_config insert ${clave}:`, e.message));
    }

    // Columnas de escrow en reservas
    await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS escrow_liberado TINYINT(1) NOT NULL DEFAULT 0`).catch(e => console.error('⚠️  escrow_liberado:', e.message));
    await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS escrow_liberado_at DATETIME NULL`).catch(e => console.error('⚠️  escrow_liberado_at:', e.message));
    await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS escrow_neto_oferente DECIMAL(10,2) NULL`).catch(e => console.error('⚠️  escrow_neto_oferente:', e.message));

    // Columnas para reservas de días sueltos
    await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS modo VARCHAR(10) NULL`).catch(e => console.error('⚠️  reservas.modo:', e.message));
    await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS dias_json TEXT NULL`).catch(e => console.error('⚠️  reservas.dias_json:', e.message));

    console.log('✅ Startup migrations OK');
  }

  server.listen(PORT, () => {
    console.log(`\n📦 TodasMisCosas API`);
    console.log(`   HTTP  → http://localhost:${PORT}`);
    console.log(`   WS    → ws://localhost:${PORT}`);
    console.log(`   Mode  → ${process.env.NODE_ENV || 'development'}\n`);
  });
}

start();

// ── Graceful shutdown ─────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
