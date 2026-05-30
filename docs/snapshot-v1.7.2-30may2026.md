# TMC — Snapshot v1.7.2 (30 de Mayo 2026)

Estado completo del proyecto al cierre de la sesión 30 de mayo 2026.

---

## Versión y estado

- **Versión:** v1.7.2
- **Fecha:** 30 de mayo de 2026
- **Commits:** `81583ae`, `a5d64af`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Módulos en producción ✅

Todos los de v1.7.1 más:

### Seguridad implementada en v1.7.2

| Control | Estado | Dónde |
|---------|--------|-------|
| Rate limiting (3 niveles) | ✅ | `middleware/rateLimits.js` + `app.js` |
| `/sync` autenticado | ✅ | `routes/usuarios.js` — `requireSyncAuth` |
| Webhook MP con firma HMAC | ✅ | `controllers/pagosController.js` — activo con `MP_WEBHOOK_SECRET` |
| Magic bytes en uploads | ✅ | `middleware/upload.js` — `validateMagicBytes` |
| Content Security Policy | ✅ | `frontend/next.config.js` |
| CORS producción limpio | ✅ | `app.js` — localhost:3001 excluido en prod |
| Body limit JSON 100KB | ✅ | `app.js` |
| Formularios admin con rate limit | ✅ | `routes/admin.js` |
| SECURITY.md | ✅ | Raíz del repo |
| Deploy via SSH key (ED25519) | ✅ | `.github/workflows/deploy.yml` + GitHub Secret `SSH_PRIVATE_KEY` |
| Dependabot semanal | ✅ | `.github/dependabot.yml` |
| Branch protection master | ✅ | GitHub Settings — block force push, restrict deletions, require TS check |
| Dependabot alerts | ✅ | GitHub Settings — habilitado |

---

## Pendientes de seguridad (requieren Guille)

| # | Tarea | Detalle |
|---|-------|---------|
| 4 | VPS — SSH key pública | Agregar al VPS: `echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHY/vUOxcf/f0Z2N1Mx62vDau+EV4ilQprimlUZXiX64 tmc-github-actions-deploy" >> ~/.ssh/authorized_keys` |
| 4 | VPS — Deshabilitar password auth | `PasswordAuthentication no` en `/etc/ssh/sshd_config` + `systemctl reload ssh` (después de verificar que el deploy funciona con la clave) |
| 5 | UFW firewall | `ufw allow 22,80,443/tcp && ufw enable` |
| 6 | Fail2ban | `apt install fail2ban -y && systemctl enable fail2ban` |
| 11 | Uptime Robot | Registrar en uptimerobot.com, monitorear todasmiscosas.com cada 5min |
| 13 | PM2 log rotation | `pm2 install pm2-logrotate` |
| 3 | MP_WEBHOOK_SECRET | Obtener del dashboard de MercadoPago → Webhooks → Secret y agregar al `.env` del VPS |

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + TypeScript |
| Backend | Express.js + MySQL (mysql2) + express-rate-limit |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage (buckets `espacios`, `avatars`) |
| DB | MySQL en `srv2021.hstgr.io:3306` |
| Deploy | PM2 + VPS Hostinger + GitHub Actions (SSH key ED25519) |
| CI/CD | GitHub Actions → TypeScript check → deploy si pasa |
| Dominio | `todasmiscosas.com` (Nginx reverse proxy) |

---

## Pendientes generales (arrastrado)

- [ ] **Guille**: activar "Terraza libre" desde `/panel` (activo=FALSE en DB)
- [ ] **Alejandro**: correr `bash /var/www/todasmiscosas/backup.sh` desde Hostinger terminal
- [ ] Verificar `migrate-fotos-to-supabase.js` corrió en VPS
- [ ] Confirmar `FRONTEND_URL=https://todasmiscosas.com` en backend `.env` producción
- [ ] Fase II: nichos y expansión territorial
