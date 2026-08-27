const { query } = require('./connection');

async function run() {
  try {
    await query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS comision_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00');
    await query('ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comision_pct_aplicado DECIMAL(5,2) NULL');

    // Reemplaza el mecanismo de early_adopter (0% automático por 3 meses):
    // a los usuarios con early_adopter vigente se les fija comision_pct = 0
    // para no cortarles la promoción ya otorgada. De acá en más el 0%
    // se maneja a mano desde el panel admin (tab Comisiones).
    await query(
      `UPDATE usuarios SET comision_pct = 0
       WHERE early_adopter = 1 AND early_adopter_hasta IS NOT NULL AND early_adopter_hasta > NOW()`
    );

    console.log('✅ comision_pct agregada a usuarios (default 15.00) y comision_pct_aplicado a reservas');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  }
  process.exit(0);
}

run();
