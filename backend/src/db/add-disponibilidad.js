/**
 * Agrega columna disponibilidad a la tabla espacios.
 * Ejecutar UNA sola vez en el VPS:
 *   node src/db/add-disponibilidad.js
 */
require('dotenv').config();
const { query } = require('./connection');

async function run() {
  try {
    await query(`
      ALTER TABLE espacios
      ADD COLUMN IF NOT EXISTS disponibilidad JSON DEFAULT NULL
    `);
    console.log('✓ Columna disponibilidad agregada correctamente');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('Ya existe la columna, omitido');
    } else {
      console.error('Error:', err.message);
    }
  }
  process.exit(0);
}

run();
