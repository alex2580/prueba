/**
 * Migration: create consultas_espacio table
 * Run: node src/db/add-consultas-espacio.js
 */
require('dotenv').config();
const { query } = require('./connection');

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS consultas_espacio (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      espacio_id  INT NOT NULL,
      autor_id    VARCHAR(36) NOT NULL,
      autor_nombre VARCHAR(120) NOT NULL,
      pregunta    TEXT NOT NULL,
      respuesta   TEXT NULL,
      respuesta_at DATETIME NULL,
      created_at  DATETIME DEFAULT NOW(),
      INDEX idx_espacio (espacio_id)
    )
  `);
  console.log('✅ consultas_espacio table created (or already exists)');
}

migrate()
  .then(() => { console.log('Done.'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
