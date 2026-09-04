const { query } = require('./connection');
const { randomUUID } = require('crypto');

async function run() {
  await query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS qr_token CHAR(32) NULL`);
  await query(`ALTER TABLE reservas ADD UNIQUE INDEX IF NOT EXISTS uq_qr_token (qr_token)`);
  console.log('✅ Columna qr_token agregada a reservas');

  const sinToken = await query(`SELECT id FROM reservas WHERE qr_token IS NULL`);
  for (const r of sinToken) {
    await query(`UPDATE reservas SET qr_token = ? WHERE id = ?`, [randomUUID().replace(/-/g, ''), r.id]);
  }
  console.log(`✅ Backfill de qr_token en ${sinToken.length} reserva(s) existente(s)`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
