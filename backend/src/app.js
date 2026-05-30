const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimits');
const { iniciarCronRecordatorios } = require('./jobs/recordatorios');
const { iniciarCronInactividad } = require('./jobs/inactividad');
const { iniciarCronMailing } = require('./jobs/mailing');

// Routes
const espaciosRouter  = require('./routes/espacios');
const reservasRouter  = require('./routes/reservas');
const usuariosRouter  = require('./routes/usuarios');
const reviewsRouter   = require('./routes/reviews');
const pagosRouter     = require('./routes/pagos');
const chatRouter      = require('./routes/chat');
const emailRouter     = require('./routes/email');
const adminRouter     = require('./routes/admin');
const authRouter      = require('./routes/auth');
const webhookRouter   = require('./routes/webhook');
const favoritosRouter = require('./routes/favoritos');
const mailingRouter   = require('./routes/mailing');

const app = express();

// ── Security & middleware ───────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3001'] : []),
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({
  limit: '100kb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Rate limiting ──────────────────────────────────────────────
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── Static uploads ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'todasmiscosas-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ─────────────────────────────────────────────────
app.use('/api/espacios',  espaciosRouter);
app.use('/api/reservas',  reservasRouter);
app.use('/api/usuarios',  usuariosRouter);
app.use('/api/reviews',   reviewsRouter);
app.use('/api/pagos',     pagosRouter);
app.use('/api/chat',      chatRouter);
app.use('/api/email',     emailRouter);
app.use('/api/admin',     adminRouter);
app.use('/api/auth',      authRouter);
app.use('/api/webhook',   webhookRouter);
app.use('/api/favoritos', favoritosRouter);
app.use('/api/mailing',  mailingRouter);

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Cron jobs ─────────────────────────────────────────────────
iniciarCronRecordatorios();
iniciarCronInactividad();
iniciarCronMailing();

module.exports = app;
