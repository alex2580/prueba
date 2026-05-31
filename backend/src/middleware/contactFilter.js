// Patrones de datos de contacto prohibidos
const PATTERNS = [
  /\b[\w.+%-]{2,}@[\w-]{2,}\.[a-z]{2,}\b/i,                      // email
  /(\+?54[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/,   // teléfonos AR
  /@[a-zA-Z0-9_.]{3,30}\b/,                                         // @handle (ig, tw, etc.)
  /\b(instagram|insta|\bIG\b|facebook|\bFB\b|twitter|tiktok|telegram|whatsapp|snapchat)\b/i,
  /\bhttps?:\/\/\S+/i,                                               // URLs
  /\bwww\.[a-z0-9-]{2,}\.[a-z]{2,}/i,                              // www.algo.com
  /\bwa\.me\b/i,                                                     // wa.me
];

/**
 * Returns true if the text contains contact information.
 */
function hasContactInfo(text) {
  return PATTERNS.some(p => p.test(text));
}

/**
 * Express middleware — rejects request with 422 if body.texto or body.pregunta
 * contains contact information.
 */
function rejectContactInfo(req, res, next) {
  const campo = req.body?.pregunta ?? req.body?.respuesta ?? req.body?.texto ?? '';
  if (hasContactInfo(campo)) {
    return res.status(422).json({
      error: 'No se pueden brindar datos de contacto en las consultas públicas.',
    });
  }
  next();
}

module.exports = { hasContactInfo, rejectContactInfo };
