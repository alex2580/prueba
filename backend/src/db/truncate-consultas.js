require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('./connection');

async function run() {
  const [result] = await query('SELECT COUNT(*) AS total FROM consultas_espacio');
  console.log(`Registros antes: ${result.total}`);
  await query('TRUNCATE TABLE consultas_espacio');
  console.log('✅ consultas_espacio vaciada');
  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
