/**
 * Migration: add piso and departamento to usuarios
 * Run: node src/db/add-piso-departamento.js
 */
require('dotenv').config();
const { query } = require('./connection');

async function migrate() {
  const alterations = [
    { table: 'usuarios', col: 'piso', sql: `ALTER TABLE usuarios ADD COLUMN piso VARCHAR(20) NULL` },
    { table: 'usuarios', col: 'departamento', sql: `ALTER TABLE usuarios ADD COLUMN departamento VARCHAR(20) NULL` },
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
