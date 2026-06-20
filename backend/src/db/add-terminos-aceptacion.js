const { query } = require('./connection');

async function run() {
  await query(`
    ALTER TABLE usuarios
      ADD COLUMN terminos_aceptados    TINYINT(1)  NOT NULL DEFAULT 0,
      ADD COLUMN terminos_aceptados_at DATETIME    NULL,
      ADD COLUMN terminos_version      VARCHAR(30) NULL
  `);
  console.log('Migration add-terminos-aceptacion: OK');
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
