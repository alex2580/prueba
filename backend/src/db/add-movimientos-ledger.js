const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS movimientos_ledger (
        id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        reserva_id     VARCHAR(36)  NOT NULL,
        tipo           ENUM('pago','liberacion','cancelacion','comision') NOT NULL,
        descripcion    VARCHAR(255) NOT NULL,
        cuenta_debito  VARCHAR(80)  NOT NULL,
        cuenta_credito VARCHAR(80)  NOT NULL,
        monto          DECIMAL(12,2) UNSIGNED NOT NULL,
        moneda         CHAR(3)      NOT NULL DEFAULT 'ARS',
        creado_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reserva  (reserva_id),
        INDEX idx_debito   (cuenta_debito),
        INDEX idx_credito  (cuenta_credito),
        INDEX idx_tipo     (tipo),
        INDEX idx_creado   (creado_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla movimientos_ledger creada');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => { console.error('❌', e.message || e); process.exit(1); });
