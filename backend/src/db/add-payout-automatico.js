const { query } = require('./connection');

async function run() {
  try {
    await query(`ALTER TABLE reservas
      ADD COLUMN IF NOT EXISTS payout_estado ENUM('pendiente','transferido','fallido') NOT NULL DEFAULT 'pendiente',
      ADD COLUMN IF NOT EXISTS payout_mp_id  VARCHAR(64)  DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS payout_error  VARCHAR(255) DEFAULT NULL`);
    console.log('✅ Columnas payout_estado, payout_mp_id, payout_error agregadas a reservas');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  }
  process.exit(0);
}

run();
