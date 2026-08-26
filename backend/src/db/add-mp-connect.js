const { query } = require('./connection');

async function run() {
  try {
    await query(`ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS mp_user_id          BIGINT       DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS mp_access_token      VARCHAR(500) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS mp_refresh_token     VARCHAR(500) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS mp_public_key        VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS mp_token_expires_at  DATETIME     DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS mp_connected_at      DATETIME     DEFAULT NULL`);
    console.log('✅ Columnas mp_user_id/mp_access_token/mp_refresh_token/mp_public_key/mp_token_expires_at/mp_connected_at agregadas a usuarios');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  }
  process.exit(0);
}

run();
