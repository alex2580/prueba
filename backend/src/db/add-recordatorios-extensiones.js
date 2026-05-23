/**
 * Migración: columnas de recordatorios en reservas + tabla reserva_extensiones
 * Idempotente — seguro de correr múltiples veces.
 */
const { query } = require('./connection');
require('dotenv').config();

async function run() {
  // ── 1. Columnas de seguimiento de recordatorios en reservas ──────
  const cols = [
    { col: 'recordatorio_5d', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { col: 'recordatorio_2d', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { col: 'recordatorio_1d', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { col: 'recordatorio_0d', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
  ];

  for (const { col, def } of cols) {
    try {
      await query(`ALTER TABLE reservas ADD COLUMN ${col} ${def}`);
      console.log(`✅ Columna reservas.${col} agregada`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`⏭  reservas.${col} ya existe`);
      } else {
        throw e;
      }
    }
  }

  // ── 2. Tabla reserva_extensiones ─────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS reserva_extensiones (
      id                VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
      reserva_id        VARCHAR(36)   NOT NULL,
      nueva_fecha_hasta DATE          NOT NULL,
      precio            DECIMAL(10,2) NOT NULL,
      mp_preference_id  VARCHAR(200),
      mp_payment_id     VARCHAR(200),
      mp_status         VARCHAR(50),
      estado            ENUM('pendiente','pagada','cancelada') NOT NULL DEFAULT 'pendiente',
      created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
      INDEX idx_reserva (reserva_id),
      INDEX idx_estado  (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Tabla reserva_extensiones lista');

  console.log('✅ Migración recordatorios-extensiones completa');
  process.exit(0);
}

run().catch(e => { console.error('Error migración:', e); process.exit(1); });
