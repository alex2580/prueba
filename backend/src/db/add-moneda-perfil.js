/**
 * Migration: add moneda to espacios, add direccion/lat/lng to usuarios
 * Run: node src/db/add-moneda-perfil.js
 */
require('dotenv').config();
const { query } = require('./connection');

async function migrate() {
  const alterations = [
    { table: 'espacios', col: 'moneda', sql: `ALTER TABLE espacios ADD COLUMN moneda VARCHAR(10) NOT NULL DEFAULT 'ARS'` },
    { table: 'usuarios', col: 'direccion', sql: `ALTER TABLE usuarios ADD COLUMN direccion VARCHAR(500) NULL` },
    { table: 'usuarios', col: 'lat', sql: `ALTER TABLE usuarios ADD COLUMN lat DECIMAL(10,7) NULL` },
    { table: 'usuarios', col: 'lng', sql: `ALTER TABLE usuarios ADD COLUMN lng DECIMAL(10,7) NULL` },
  ];

  for (const a of alterations) {
    try {
      await query(a.sql);
      console.log(`✅  ${a.table}.${a.col} added`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`⏭️  ${a.table}.${a.col} already exists — skipped`);
      } else {
        console.error(`❌  ${a.table}.${a.col}:`, e.message);
        throw e;
      }
    }
  }
}

migrate()
  .then(() => { console.log('\nDone.'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
