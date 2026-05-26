const { query } = require('./connection');

async function run() {
  try {
    await query("ALTER TABLE espacios ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'Argentina'");
    await query("UPDATE espacios SET pais = 'Argentina' WHERE pais IS NULL OR pais = ''");
    console.log('✅ Columna pais agregada a espacios');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  }
  process.exit(0);
}

run();
