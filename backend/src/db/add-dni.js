const { query } = require('./connection');

async function run() {
  try {
    await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dni VARCHAR(20) DEFAULT NULL`);
    console.log('✅ Columna dni agregada a usuarios');
  } catch (e) {
    console.log('ℹ️  dni ya existe o error:', e.message);
  }
  try {
    await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT NULL`);
    console.log('✅ Columna pais agregada a usuarios');
  } catch (e) {
    console.log('ℹ️  pais ya existe o error:', e.message);
  }
  process.exit(0);
}

run();
