const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`ALTER TABLE movimientos_ledger CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci`);
    console.log('✅ movimientos_ledger charset corregido');

    await conn.execute(`ALTER TABLE auditoria_perfil CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci`);
    console.log('✅ auditoria_perfil charset corregido');
  } catch (e) {
    console.error('❌', e.message || e);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
