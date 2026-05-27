require('dotenv').config();
const { query } = require('./connection');

async function run() {
  const CUTOFF = '2026-05-26 21:50:00';

  const a_borrar = await query(
    `SELECT id, nombre, created_at FROM espacios WHERE created_at < ?`,
    [CUTOFF]
  );

  console.log(`\n🗑️  Espacios a eliminar (${a_borrar.length}):`);
  a_borrar.forEach(e => console.log(`   - [${e.id}] ${e.nombre} (${e.created_at})`));

  if (a_borrar.length === 0) {
    console.log('Nada que borrar.');
    process.exit(0);
  }

  const ids = a_borrar.map(e => e.id);
  const placeholders = ids.map(() => '?').join(',');

  await query(`DELETE FROM espacio_fotos WHERE espacio_id IN (${placeholders})`, ids);
  await query(`DELETE FROM reservas      WHERE espacio_id IN (${placeholders})`, ids);
  await query(`DELETE FROM reviews       WHERE espacio_id IN (${placeholders})`, ids);
  await query(`DELETE FROM espacios      WHERE id         IN (${placeholders})`, ids);

  console.log(`\n✅ ${a_borrar.length} espacios y sus datos asociados eliminados.`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
