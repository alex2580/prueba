const { query } = require('./connection');

async function main() {
  // 1. Columnas de retención en conversaciones
  await query(`ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS archivado_at DATETIME NULL`);
  await query(`ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS purgar_after DATE NULL`);
  console.log('✅ Columnas archivado_at / purgar_after agregadas');

  // 2. Cambiar FK de espacios: CASCADE → RESTRICT
  const fkRows = await query(`
    SELECT CONSTRAINT_NAME, COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'conversaciones'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);

  for (const fk of fkRows) {
    await query(`ALTER TABLE conversaciones DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
    console.log(`  DROP FK ${fk.CONSTRAINT_NAME} (${fk.COLUMN_NAME})`);
  }

  await query(`ALTER TABLE conversaciones
    ADD CONSTRAINT FOREIGN KEY (espacio_id)    REFERENCES espacios(id)  ON DELETE RESTRICT,
    ADD CONSTRAINT FOREIGN KEY (demandante_id) REFERENCES usuarios(id)  ON DELETE RESTRICT,
    ADD CONSTRAINT FOREIGN KEY (oferente_id)   REFERENCES usuarios(id)  ON DELETE RESTRICT
  `);
  console.log('✅ FKs recreadas con ON DELETE RESTRICT');

  // 3. Backfill: conversaciones cuya reserva ya tiene escrow liberado
  const backfill = await query(`
    UPDATE conversaciones c
    JOIN reservas r ON r.espacio_id = c.espacio_id AND r.usuario_id = c.demandante_id
    SET c.archivado_at = COALESCE(r.escrow_liberado_at, NOW()),
        c.purgar_after = DATE_ADD(COALESCE(r.escrow_liberado_at, NOW()), INTERVAL 6 MONTH)
    WHERE r.escrow_liberado = 1
      AND c.archivado_at IS NULL
  `);
  console.log(`✅ Backfill: ${backfill.affectedRows} conversación(es) archivada(s)`);

  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
