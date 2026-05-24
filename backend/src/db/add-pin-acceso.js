const { query } = require('./connection');

async function run() {
  await query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS pin_acceso CHAR(4) NULL`);
  console.log('✅ Columna pin_acceso agregada a reservas');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
