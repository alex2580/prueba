const { query } = require('./connection');

async function run() {
  try {
    await query(`ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS didit_session_id VARCHAR(64) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS verificado_at     DATETIME    DEFAULT NULL`);
    console.log('✅ Columnas didit_session_id/verificado_at agregadas a usuarios');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  }
  process.exit(0);
}

run();
