require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { query } = require('./connection');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    realtime: { transport: ws },
  }
);

const DEMO_USERS = [
  { email: 'carlos@todasmiscosas.com',    password: 'demo1234'  },
  { email: 'marta@todasmiscosas.com',     password: 'demo1234'  },
  { email: 'ana@gmail.com',               password: 'demo1234'  },
  { email: 'pablo@empresa.com',           password: 'demo1234'  },
  { email: 'admin@todasmiscosas.com',     password: 'admin1234' },
  { email: 'guilleadominguez@gmail.com',  password: 'klpr2580'  },
  { email: 'alejandro.laporte@gmail.com', password: 'klpr2580'  },
  { email: 'lucia.fernandez@gmail.com',   password: 'demo1234'  },
  { email: 'martin.sosa@gmail.com',       password: 'demo1234'  },
];

async function seedSupabaseUsers() {
  console.log('Iniciando seed de usuarios en Supabase Auth...\n');

  for (const { email, password } of DEMO_USERS) {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        if (error.message && error.message.includes('already been registered')) {
          console.log(`[SKIP] ${email} — ya existe en Supabase Auth`);

          // Try to get the existing user to update MySQL
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
          if (!listError && listData?.users) {
            const existing = listData.users.find(u => u.email === email);
            if (existing) {
              await updateMySQLSupabaseId(email, existing.id);
            }
          }
        } else {
          console.error(`[ERROR] ${email} — ${error.message}`);
        }
        continue;
      }

      const supabaseId = data.user?.id;
      if (!supabaseId) {
        console.error(`[ERROR] ${email} — no se obtuvo ID de Supabase`);
        continue;
      }

      console.log(`[OK] ${email} — creado en Supabase (${supabaseId})`);
      await updateMySQLSupabaseId(email, supabaseId);

    } catch (err) {
      console.error(`[ERROR] ${email} — excepcion inesperada:`, err.message);
    }
  }

  console.log('\nSeed finalizado.');
  process.exit(0);
}

async function updateMySQLSupabaseId(email, supabaseId) {
  try {
    const result = await query(
      'UPDATE usuarios SET supabase_id = ? WHERE email = ?',
      [supabaseId, email]
    );
    if (result.affectedRows > 0) {
      console.log(`  -> MySQL actualizado: ${email} = ${supabaseId}`);
    } else {
      console.log(`  -> [WARN] ${email} no encontrado en tabla usuarios de MySQL`);
    }
  } catch (err) {
    console.error(`  -> [ERROR] MySQL update para ${email}:`, err.message);
  }
}

seedSupabaseUsers().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
