/**
 * Migración: columnas de auditoría de bloqueo en la tabla usuarios.
 * Idempotente — seguro de correr múltiples veces.
 */
const { query } = require('./connection');
require('dotenv').config();

async function run() {
  const cols = [
    { col: 'bloqueado_motivo', def: 'TEXT' },
    { col: 'bloqueado_en',     def: 'DATETIME' },
    { col: 'bloqueado_por',    def: 'VARCHAR(36)' },
  ];

  for (const { col, def } of cols) {
    try {
      await query(`ALTER TABLE usuarios ADD COLUMN ${col} ${def}`);
      console.log(`✅ Columna usuarios.${col} agregada`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`⏭  usuarios.${col} ya existe`);
      } else {
        throw e;
      }
    }
  }

  console.log('✅ Migración bloqueo-usuarios completa');
  process.exit(0);
}

run().catch(e => { console.error('Error migración:', e); process.exit(1); });
