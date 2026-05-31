/**
 * Migration: columnas eliminado_por_oferente y eliminado_at en espacios
 * Run: node src/db/add-eliminado-por-oferente.js
 */
require('dotenv').config();
const { query } = require('./connection');

async function migrate() {
  const cols = [
    ['eliminado_por_oferente', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['eliminado_at',           'DATETIME NULL'],
  ];
  for (const [col, def] of cols) {
    try {
      await query(`ALTER TABLE espacios ADD COLUMN ${col} ${def}`);
      console.log(`✅ espacios.${col} agregada`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`⏭  espacios.${col} ya existe`);
      } else {
        throw e;
      }
    }
  }
}

migrate()
  .then(() => { console.log('Done.'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
