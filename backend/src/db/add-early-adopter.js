const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      ALTER TABLE usuarios
        ADD COLUMN early_adopter       TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN early_adopter_hasta DATETIME   NULL
    `);
    console.log('✅ Columnas early_adopter y early_adopter_hasta agregadas a usuarios');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => { console.error('❌', e.message || e); process.exit(1); });
