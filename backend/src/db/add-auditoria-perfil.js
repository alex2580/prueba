const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS auditoria_perfil (
        id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        usuario_id BIGINT UNSIGNED NOT NULL,
        campo      VARCHAR(50)  NOT NULL,
        valor_anterior TEXT,
        valor_nuevo    TEXT,
        ip         VARCHAR(45),
        creado_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario (usuario_id),
        INDEX idx_campo   (campo),
        INDEX idx_creado  (creado_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla auditoria_perfil creada');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => { console.error('❌', e.message || e); process.exit(1); });
