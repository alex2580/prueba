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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservas_ocultas (
        reserva_id VARCHAR(36) NOT NULL,
        usuario_id VARCHAR(36) NOT NULL,
        oculta_en  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (reserva_id, usuario_id),
        INDEX idx_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).catch(e => console.error('⚠️  reservas_ocultas:', e.message));
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
