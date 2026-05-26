/**
 * Migración: reemplaza URLs de fotos con http://localhost:PORT
 * por la URL pública de producción (API_BASE_URL).
 *
 * Ejecutar en producción después de configurar API_BASE_URL en .env
 */
require('dotenv').config();
const { query } = require('./connection');

const PROD_URL = process.env.API_BASE_URL || 'https://todasmiscosas.com';

async function run() {
  try {
    // Fix espacio_fotos
    const r1 = await query(
      `UPDATE espacio_fotos
       SET url = REGEXP_REPLACE(url, 'https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?', ?)
       WHERE url REGEXP 'https?://(localhost|127\\.0\\.0\\.1)'`,
      [PROD_URL]
    );
    console.log(`✅ espacio_fotos: ${r1.affectedRows ?? 0} URLs actualizadas`);

    // Fix avatars if also stored with localhost
    const r2 = await query(
      `UPDATE usuarios
       SET avatar_url = REGEXP_REPLACE(avatar_url, 'https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?', ?)
       WHERE avatar_url REGEXP 'https?://(localhost|127\\.0\\.0\\.1)'`,
      [PROD_URL]
    );
    console.log(`✅ usuarios.avatar_url: ${r2.affectedRows ?? 0} URLs actualizadas`);

  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  }
  process.exit(0);
}

run();
