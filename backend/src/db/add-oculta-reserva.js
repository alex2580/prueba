/**
 * Migración: columna oculta_demandante en reservas.
 * Permite al demandante limpiar su historial de reservas finalizadas/canceladas.
 * Idempotente — seguro de correr múltiples veces.
 */
const { query } = require('./connection');
require('dotenv').config();

async function run() {
  try {
    await query(`
      ALTER TABLE reservas
      ADD COLUMN oculta_demandante TINYINT(1) NOT NULL DEFAULT 0
    `);
    console.log('✅ Columna oculta_demandante agregada a reservas');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Columna oculta_demandante ya existe — sin cambios');
    } else {
      throw err;
    }
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
