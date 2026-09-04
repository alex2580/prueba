const QRCode = require('qrcode');

function generarQRToken() {
  const { randomUUID } = require('crypto');
  return randomUUID().replace(/-/g, '');
}

async function generarQRDataURL(token) {
  const url = `${process.env.FRONTEND_URL || 'https://todasmiscosas.com'}/es/checkin/${token}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
  });
}

module.exports = { generarQRToken, generarQRDataURL };
