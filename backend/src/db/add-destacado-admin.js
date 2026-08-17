const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      ALTER TABLE espacios
        ADD COLUMN destacado_admin TINYINT(1) NOT NULL DEFAULT 0
    `);
    console.log('✅ Columna destacado_admin agregada a espacios');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => { console.error('❌', e.message || e); process.exit(1); });
