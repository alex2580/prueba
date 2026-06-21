const { query } = require('./connection');

async function run() {
  console.log('[migración] Agregando columnas de vencimiento a espacios...');

  await query(`
    ALTER TABLE espacios
      ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE NULL,
      ADD COLUMN IF NOT EXISTS vencida TINYINT(1) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS aviso_vencimiento_enviado TINYINT(1) NOT NULL DEFAULT 0
  `);

  // Retroactivo: espacios existentes vencen 60 días desde su creación
  await query(`
    UPDATE espacios
    SET fecha_vencimiento = DATE_ADD(created_at, INTERVAL 60 DAY)
    WHERE fecha_vencimiento IS NULL
  `);

  // Los que ya pasaron los 60 días quedan marcados como vencidos
  await query(`
    UPDATE espacios
    SET vencida = 1, activo = FALSE
    WHERE fecha_vencimiento < CURDATE() AND vencida = 0
  `);

  console.log('[migración] ✅ Columnas agregadas y vencimientos retroactivos aplicados.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
