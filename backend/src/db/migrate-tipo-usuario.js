/**
 * Migración: unifica roles en 'usuario' y 'admin'
 * Elimina la distinción oferente/demandante del campo tipo en usuarios.
 *
 * Run: node src/db/migrate-tipo-usuario.js
 */
const { transaction, query } = require('./connection');

async function run() {
  try {
    await transaction(async (conn) => {
      // 1. Ampliar el ENUM para incluir 'usuario' antes de actualizar datos
      await conn.query(`
        ALTER TABLE usuarios
        MODIFY COLUMN tipo ENUM('oferente','demandante','usuario','admin') NOT NULL DEFAULT 'usuario'
      `);
      console.log('✅ Columna tipo ampliada con valor usuario');

      // 2. Migrar todos los oferente/demandante existentes a usuario
      const [result] = await conn.query(`
        UPDATE usuarios SET tipo = 'usuario' WHERE tipo IN ('oferente', 'demandante')
      `);
      console.log(`✅ ${result.affectedRows} usuarios migrados a tipo='usuario'`);

      // 3. Dejar solo usuario y admin en el ENUM
      await conn.query(`
        ALTER TABLE usuarios
        MODIFY COLUMN tipo ENUM('usuario','admin') NOT NULL DEFAULT 'usuario'
      `);
      console.log('✅ ENUM simplificado a (usuario, admin)');
    });

    console.log('✅ Migración completa');
  } catch (e) {
    console.error('❌ Error en migración:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

run();
