/**
 * Migración: tablas para 2FA OTP y registro de sesiones.
 * Idempotente — seguro de correr múltiples veces.
 */
const { query } = require('./connection');
require('dotenv').config();

async function run() {
  // ── Tabla OTP ─────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS auth_otp (
      id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      usuario_id VARCHAR(36)  NOT NULL,
      codigo     VARCHAR(6)   NOT NULL,
      expires_at DATETIME     NOT NULL,
      usado      TINYINT(1)   NOT NULL DEFAULT 0,
      intentos   INT          NOT NULL DEFAULT 0,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      INDEX idx_usuario (usuario_id),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Tabla auth_otp lista');

  // ── Tabla sesiones ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS auth_sesiones (
      id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      usuario_id VARCHAR(36)  NOT NULL,
      ip         VARCHAR(45),
      user_agent TEXT,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      INDEX idx_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Tabla auth_sesiones lista');

  console.log('✅ Migración auth-otp completa');
  process.exit(0);
}

run().catch(e => { console.error('Error migración:', e); process.exit(1); });
