/**
 * Agrega columnas categoria y seguridad a la tabla espacios.
 * Ejecutar UNA sola vez en el VPS:
 *   node src/db/add-categoria-seguridad.js
 */
require('dotenv').config();
const { query } = require('./connection');

async function run() {
  try {
    await query(`ALTER TABLE espacios ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT NULL`);
    console.log('✓ Columna categoria agregada');
  } catch (err) {
    console.log('categoria:', err.message);
  }
  try {
    await query(`ALTER TABLE espacios ADD COLUMN IF NOT EXISTS seguridad JSON DEFAULT NULL`);
    console.log('✓ Columna seguridad agregada');
  } catch (err) {
    console.log('seguridad:', err.message);
  }
  console.log('¡Listo!');
  process.exit(0);
}

run();
