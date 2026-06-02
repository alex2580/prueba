const { query } = require('../db/connection');

const CACHE_TTL = 60_000; // 1 minuto
let _cache = null;
let _cacheAt = 0;

async function _loadFromDB() {
  try {
    const rows = await query('SELECT clave, habilitado FROM email_config');
    const map = {};
    rows.forEach(r => { map[r.clave] = r.habilitado !== 0; });
    return map;
  } catch (_) {
    return {}; // tabla no existe todavía → todo habilitado por defecto
  }
}

async function _getCache() {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;
  _cache = await _loadFromDB();
  _cacheAt = Date.now();
  return _cache;
}

async function isEnabled(key) {
  const cache = await _getCache();
  if (!(key in cache)) return true; // clave no configurada → habilitada
  return cache[key];
}

async function getAll() {
  try {
    return await query('SELECT clave, habilitado FROM email_config ORDER BY clave');
  } catch (_) {
    return [];
  }
}

async function setMany(updates) {
  for (const [clave, habilitado] of Object.entries(updates)) {
    await query(
      'INSERT INTO email_config (clave, habilitado) VALUES (?, ?) ON DUPLICATE KEY UPDATE habilitado = VALUES(habilitado)',
      [clave, habilitado ? 1 : 0]
    );
  }
  _cache = null; // invalidar cache
}

function invalidateCache() {
  _cache = null;
}

module.exports = { isEnabled, getAll, setMany, invalidateCache };
