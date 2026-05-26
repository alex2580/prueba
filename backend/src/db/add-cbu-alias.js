const { query } = require('./connection');

async function run() {
  try {
    await query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cbu_alias VARCHAR(100) DEFAULT NULL');
    console.log('✅ Columna cbu_alias agregada a usuarios');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  }
  process.exit(0);
}

run();
