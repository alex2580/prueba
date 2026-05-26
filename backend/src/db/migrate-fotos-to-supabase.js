/**
 * Migración: sube las fotos existentes del filesystem local al Supabase Storage
 * y actualiza las URLs en la base de datos.
 *
 * Ejecutar en el VPS donde están los archivos:
 *   node src/db/migrate-fotos-to-supabase.js
 *
 * Prerequisitos:
 *   - SUPABASE_URL y SUPABASE_SERVICE_KEY en .env
 *   - Buckets 'espacios' y 'avatars' creados en Supabase (public)
 *   - Archivos en ./uploads/espacios/ y ./uploads/avatars/
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { query } = require('./connection');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

async function ensureBucket(name) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === name);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(name, { public: true });
    if (error) throw new Error(`No se pudo crear bucket '${name}': ${error.message}`);
    console.log(`✅ Bucket '${name}' creado`);
  } else {
    console.log(`ℹ️  Bucket '${name}' ya existe`);
  }
}

async function uploadFileToSupabase(localPath, bucket, filename) {
  const buffer = fs.readFileSync(localPath);
  const ext    = path.extname(filename).toLowerCase();
  const mimes  = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, { contentType: mimes[ext] || 'image/jpeg', upsert: true });

  if (error) throw new Error(`Upload '${filename}': ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

async function migrateEspacioFotos() {
  const fotos = await query(
    `SELECT id, url FROM espacio_fotos WHERE url NOT LIKE '%supabase%'`
  );
  console.log(`\n📷 espacio_fotos: ${fotos.length} URLs a migrar`);

  let ok = 0, skip = 0, fail = 0;
  for (const foto of fotos) {
    const filename = path.basename(foto.url);
    const localPath = path.join(UPLOAD_DIR, 'espacios', filename);

    if (!fs.existsSync(localPath)) {
      console.warn(`  ⚠️  Archivo no encontrado: ${localPath}`);
      skip++;
      continue;
    }

    try {
      const newUrl = await uploadFileToSupabase(localPath, 'espacios', filename);
      await query('UPDATE espacio_fotos SET url = ? WHERE id = ?', [newUrl, foto.id]);
      console.log(`  ✅ ${filename}`);
      ok++;
    } catch (err) {
      console.error(`  ❌ ${filename}: ${err.message}`);
      fail++;
    }
  }
  console.log(`  → OK: ${ok}, omitidos: ${skip}, errores: ${fail}`);
}

async function migrateAvatars() {
  const usuarios = await query(
    `SELECT id, avatar_url FROM usuarios WHERE avatar_url IS NOT NULL AND avatar_url NOT LIKE '%supabase%' AND avatar_url != ''`
  );
  console.log(`\n👤 avatars: ${usuarios.length} URLs a migrar`);

  let ok = 0, skip = 0, fail = 0;
  for (const u of usuarios) {
    const filename = path.basename(u.avatar_url);
    const localPath = path.join(UPLOAD_DIR, 'avatars', filename);

    if (!fs.existsSync(localPath)) {
      console.warn(`  ⚠️  Archivo no encontrado: ${localPath}`);
      skip++;
      continue;
    }

    try {
      const newUrl = await uploadFileToSupabase(localPath, 'avatars', filename);
      await query('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [newUrl, u.id]);
      console.log(`  ✅ ${filename}`);
      ok++;
    } catch (err) {
      console.error(`  ❌ ${filename}: ${err.message}`);
      fail++;
    }
  }
  console.log(`  → OK: ${ok}, omitidos: ${skip}, errores: ${fail}`);
}

async function run() {
  console.log('🚀 Iniciando migración de fotos a Supabase Storage…\n');
  await ensureBucket('espacios');
  await ensureBucket('avatars');
  await migrateEspacioFotos();
  await migrateAvatars();
  console.log('\n✅ Migración completa');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
