const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tipo          ENUM('proveedor','cliente') NOT NULL,
        nombre        VARCHAR(120)  NOT NULL,
        email         VARCHAR(180)  NOT NULL,
        whatsapp      VARCHAR(30),
        barrio        VARCHAR(100),
        tipo_espacio  VARCHAR(60),
        descripcion   TEXT,
        para_que      VARCHAR(80),
        duracion      VARCHAR(40),
        created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tipo       (tipo),
        INDEX idx_email      (email),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla waitlist creada');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(e => { console.error('❌', e.message || e); process.exit(1); });
