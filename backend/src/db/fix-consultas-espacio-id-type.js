require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('./connection');

// espacio_id quedó como int(11) en vez de varchar(36) (el tipo real del UUID
// de espacios.id). MySQL trunca cada UUID a sus dígitos numéricos iniciales
// (o a 0 si arranca con letra), así que espacios distintos con UUIDs que
// arrancan igual terminan compartiendo el mismo espacio_id y por lo tanto
// las mismas consultas públicas. Los valores ya truncados no son
// recuperables (se perdió el UUID original al insertarlos), así que se
// vacía la tabla antes de corregir el tipo de columna.
async function migrate() {
  const [{ total }] = await query('SELECT COUNT(*) AS total FROM consultas_espacio');
  console.log(`Registros con espacio_id corrupto (truncado a entero) a eliminar: ${total}`);

  await query('TRUNCATE TABLE consultas_espacio');

  await query(`
    ALTER TABLE consultas_espacio
    MODIFY COLUMN espacio_id VARCHAR(36) NOT NULL
  `);

  console.log('✅ espacio_id ahora es VARCHAR(36) — tabla vaciada, lista para usarse de nuevo.');
}

migrate()
  .then(() => { console.log('Done.'); process.exit(0); })
  .catch(e => { console.error('❌', e.message); process.exit(1); });
