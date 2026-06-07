require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('./connection');

async function migrate() {
  await query(`
    ALTER TABLE consultas_espacio
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log('✅ consultas_espacio charset → utf8mb4');
}

migrate()
  .then(() => { console.log('Done.'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
