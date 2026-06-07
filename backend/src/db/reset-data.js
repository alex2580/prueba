require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('./connection');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      // Chat
      'mensajes',
      'conversaciones',
      // Reservas y servicios
      'servicios_adicionales',
      'reserva_extensiones',
      'reservas_ocultas',
      'movimientos_ledger',
      'reservas',
      // Espacios
      'espacio_fotos',
      'reviews',
      'favoritos',
      'consultas_espacio',
      'espacios',
      // Auth / sesiones
      'auth_otp',
      'perfil_otp',
      'auth_sesiones',
      // Admin
      'admin_notificaciones',
      'admin_consultas',
      'admin_solicitudes_puntuacion',
      'mailing_log',
    ];

    for (const table of tables) {
      try {
        await conn.execute(`DELETE FROM \`${table}\``);
        console.log(`✅ ${table} — limpia`);
      } catch (e) {
        // La tabla puede no existir aún si nunca se usó esa feature
        if (e.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⚠️  ${table} — no existe (ok)`);
        } else {
          throw e;
        }
      }
    }

    // Elimina solo usuarios de seed (sin cuenta Supabase real)
    const [result] = await conn.execute(
      `DELETE FROM usuarios WHERE supabase_id IS NULL`
    );
    console.log(`✅ usuarios seed eliminados: ${result.affectedRows} fila(s)`);

    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🎉 Base de datos lista para pruebas desde cero.');
  } catch (e) {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    console.error('❌', e.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
