/**
 * Script para agregar usuarios nuevos a MySQL + Supabase Auth.
 * Ejecutar UNA sola vez en el VPS:
 *   node src/db/add-new-users.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { query } = require('./connection');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
);

const NEW_USERS = [
  {
    id: 'u6',
    nombre: 'Guillermo Domínguez',
    email: 'guilleadominguez@gmail.com',
    password: 'klpr2580',
    tel: '+54 11 0000-0001',
    tipo: 'admin',
    verificado: true,
  },
  {
    id: 'u7',
    nombre: 'Alejandro Laporte',
    email: 'alejandro.laporte@gmail.com',
    password: 'klpr2580',
    tel: '+54 11 0000-0002',
    tipo: 'admin',
    verificado: true,
  },
  {
    id: 'u8',
    nombre: 'Lucía Fernández',
    email: 'lucia.fernandez@gmail.com',
    password: 'demo1234',
    tel: '+54 11 2211-5566',
    tipo: 'oferente',
    verificado: true,
  },
  {
    id: 'u9',
    nombre: 'Martín Sosa',
    email: 'martin.sosa@gmail.com',
    password: 'demo1234',
    tel: '+54 11 3344-7788',
    tipo: 'demandante',
    verificado: false,
  },
];

async function run() {
  console.log('Agregando usuarios nuevos...\n');

  for (const u of NEW_USERS) {
    console.log(`\n→ ${u.nombre} (${u.email})`);

    // 1. Insertar en MySQL (INSERT IGNORE — no rompe si ya existe)
    try {
      const res = await query(
        `INSERT IGNORE INTO usuarios (id, supabase_id, nombre, email, tel, tipo, verificado)
         VALUES (?, NULL, ?, ?, ?, ?, ?)`,
        [u.id, u.nombre, u.email, u.tel, u.tipo, u.verificado ? 1 : 0]
      );
      if (res.affectedRows > 0) {
        console.log('  [MySQL] ✓ Insertado');
      } else {
        console.log('  [MySQL] ya existía, omitido');
      }
    } catch (err) {
      console.error('  [MySQL] ERROR:', err.message);
    }

    // 2. Crear en Supabase Auth
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });

      let supabaseId = data?.user?.id;

      if (error) {
        if (error.message?.includes('already been registered')) {
          console.log('  [Supabase] ya existe, buscando ID...');
          const { data: list } = await supabase.auth.admin.listUsers();
          const existing = list?.users?.find(x => x.email === u.email);
          supabaseId = existing?.id;
        } else {
          console.error('  [Supabase] ERROR:', error.message);
          continue;
        }
      } else {
        console.log('  [Supabase] ✓ Creado');
      }

      // 3. Linkear supabase_id en MySQL
      if (supabaseId) {
        await query(
          'UPDATE usuarios SET supabase_id = ? WHERE email = ?',
          [supabaseId, u.email]
        );
        console.log(`  [MySQL] ✓ supabase_id actualizado (${supabaseId})`);
      }
    } catch (err) {
      console.error('  [Supabase] ERROR inesperado:', err.message);
    }
  }

  console.log('\n¡Listo!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
