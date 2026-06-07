const { query } = require('../db/connection');

const COMISION = 0.15;

async function _insertar(reservaId, tipo, descripcion, debit, credit, monto, moneda = 'ARS') {
  await query(
    `INSERT INTO movimientos_ledger
       (reserva_id, tipo, descripcion, cuenta_debito, cuenta_credito, monto, moneda)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [String(reservaId), tipo, descripcion, debit, credit, Number(monto).toFixed(2), moneda]
  );
}

// Cliente paga → entra al depósito en garantía de TMC
async function registrarPago(reservaId, clienteId, monto, descripcion) {
  await _insertar(
    reservaId, 'pago',
    descripcion || `Pago — reserva ${reservaId}`,
    `cliente.${clienteId}`,
    'tmc.escrow',
    monto
  );
}

// Cliente confirma acceso → escrow se libera en dos movimientos:
//   tmc.escrow → proveedor (85%)
//   tmc.escrow → tmc.comision (15%)
async function registrarLiberacion(reservaId, proveedorId, montoTotal, descripcion) {
  const comision = Math.round(Number(montoTotal) * COMISION);
  const neto     = Number(montoTotal) - comision;

  await _insertar(
    reservaId, 'liberacion',
    descripcion || `Liberación depósito en garantía — reserva ${reservaId}`,
    'tmc.escrow',
    `proveedor.${proveedorId}`,
    neto
  );

  await _insertar(
    reservaId, 'comision',
    `Comisión TMC 15% — reserva ${reservaId}`,
    'tmc.escrow',
    'tmc.comision',
    comision
  );
}

// Reserva cancelada estando pagada → devolver el dinero al cliente
async function registrarCancelacion(reservaId, clienteId, monto, descripcion) {
  await _insertar(
    reservaId, 'cancelacion',
    descripcion || `Cancelación — reintegro reserva ${reservaId}`,
    'tmc.escrow',
    `cliente.${clienteId}`,
    monto
  );
}

// Saldo actual del depósito en garantía (entradas − salidas de tmc.escrow)
async function saldoEscrow() {
  const [{ entradas }] = await query(
    `SELECT COALESCE(SUM(monto), 0) AS entradas
     FROM movimientos_ledger WHERE cuenta_credito = 'tmc.escrow'`
  );
  const [{ salidas }] = await query(
    `SELECT COALESCE(SUM(monto), 0) AS salidas
     FROM movimientos_ledger WHERE cuenta_debito = 'tmc.escrow'`
  );
  return Number(entradas) - Number(salidas);
}

// Comisiones cobradas en un período (para reportes admin)
async function totalComisiones(desde, hasta) {
  const [{ total }] = await query(
    `SELECT COALESCE(SUM(monto), 0) AS total
     FROM movimientos_ledger
     WHERE tipo = 'comision' AND creado_at BETWEEN ? AND ?`,
    [desde, hasta]
  );
  return Number(total);
}

// Movimientos de una reserva específica (para detalle en panel)
async function movimientosPorReserva(reservaId) {
  return query(
    `SELECT * FROM movimientos_ledger WHERE reserva_id = ? ORDER BY creado_at ASC`,
    [String(reservaId)]
  );
}

module.exports = {
  registrarPago,
  registrarLiberacion,
  registrarCancelacion,
  saldoEscrow,
  totalComisiones,
  movimientosPorReserva,
};
