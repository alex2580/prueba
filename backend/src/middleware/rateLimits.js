const rateLimit = require('express-rate-limit');

// General API: 200 req/min per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intentá de nuevo en un momento.' },
});

// Auth / OTP endpoints: 10 req / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación, esperá 15 minutos.' },
});

// Public contact forms: 5 req / hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas enviadas, intentá en una hora.' },
});

module.exports = { apiLimiter, authLimiter, contactLimiter };
