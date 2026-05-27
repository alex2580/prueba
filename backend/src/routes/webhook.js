const express = require('express');
const crypto  = require('crypto');
const { exec } = require('child_process');

const router = express.Router();

const SECRET      = process.env.GITHUB_WEBHOOK_SECRET || '';
const APP_DIR     = process.env.APP_DIR || '/var/www/todasmiscosas';
const BACKEND_PM2 = process.env.BACKEND_PM2_NAME || 'tmc-backend';
const FRONTEND_PM2= process.env.FRONTEND_PM2_NAME || 'tmc-frontend';

function verifySignature(req) {
  if (!SECRET) return true;
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const raw = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const expected = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(raw)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch { return false; }
}

// POST /api/webhook/deploy
router.post('/deploy', (req, res) => {
  if (!verifySignature(req)) {
    console.warn('[webhook] firma inválida');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const branch = req.body?.ref?.replace('refs/heads/', '');

  if (branch !== 'master') {
    return res.json({ message: `Branch ${branch} ignorada` });
  }

  console.log('[webhook] push a master detectado — iniciando deploy…');
  res.json({ message: 'Deploy iniciado' });

  const cmd = [
    `cd ${APP_DIR}`,
    'git pull origin master',
    `pm2 restart ${BACKEND_PM2}`,
    // Rebuild frontend solo si cambiaron archivos frontend
    `cd ${APP_DIR}/frontend && npm run build && pm2 restart ${FRONTEND_PM2}`,
  ].join(' && ');

  exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('[webhook] deploy error:', err.message);
      console.error(stderr);
    } else {
      console.log('[webhook] deploy OK');
      console.log(stdout);
    }
  });
});

module.exports = router;
