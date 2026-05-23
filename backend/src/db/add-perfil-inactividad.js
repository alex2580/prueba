/**
 * Migración: columnas para OTP de cambio de teléfono y gestión de inactividad de espacios.
 * Idempotente — seguro de correr múltiples veces.
 */
const { query } = require('./connection');
require('dotenv').config();

async function run() {
  // auth_otp: tipo + tel_nuevo
  const otpCols = [
    { col: 'tipo',      def: "VARCHAR(30) NOT NULL DEFAULT 'login'" },
    { col: 'tel_nuevo', def: 'VARCHAR(30) NULL' },
  ];
  for (const { col, def } of otpCols) {
    try {
      await query(`ALTER TABLE auth_otp ADD COLUMN ${col} ${def}`);
      console.log(`✅ Columna auth_otp.${col} agregada`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log(`⏭  auth_otp.${col} ya existe`);
      else throw e;
    }
  }

  // espacios: ultima_actividad + inactiva_auto
  const espCols = [
    { col: 'ultima_actividad', def: 'DATETIME NULL' },
    { col: 'inactiva_auto',    def: 'TINYINT(1) NOT NULL DEFAULT 0' },
  ];
  for (const { col, def } of espCols) {
    try {
      await query(`ALTER TABLE espacios ADD COLUMN ${col} ${def}`);
      console.log(`✅ Columna espacios.${col} agregada`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log(`⏭  espacios.${col} ya existe`);
      else throw e;
    }
  }

  console.log('✅ Migración perfil-inactividad completa');
  process.exit(0);
}

run().catch(e => { console.error('Error migración:', e); process.exit(1); });
