const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      ALTER TABLE espacios
        MODIFY COLUMN destacado_admin TINYINT(1) NULL DEFAULT NULL
    `);
    // Antes de este cambio no existía "excluido a propósito" — todo 0 era
    // en realidad "nunca tocado por el admin", así que vuelve a ser
    // elegible por el fallback de reservas_mes (NULL = automático).
    await conn.execute(`
      UPDATE espacios SET destacado_admin = NULL WHERE destacado_admin = 0
    `);
    console.log('✅ destacado_admin pasado a tri-estado (NULL/0/1) en espacios');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => { console.error('❌', e.message || e); process.exit(1); });
