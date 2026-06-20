const { query } = require('./connection');

async function run() {
  await query(`
    ALTER TABLE reservas
      ADD COLUMN cancelacion_motivo VARCHAR(50) NULL
  `);
  console.log('Migration add-cancelacion-motivo: OK');
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
