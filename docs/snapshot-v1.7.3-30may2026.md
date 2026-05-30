# TMC — Snapshot v1.7.3 (30 de Mayo 2026)

Estado completo del proyecto al cierre de la sesión nocturna del 30 de mayo 2026.

---

## Versión y estado

- **Versión:** v1.7.3
- **Fecha:** 30 de mayo de 2026
- **Commits:** `81583ae`, `a5d64af`, `dc20be7`, `8d455c5`, `f6aacd1`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Módulos en producción ✅

Todos los de v1.7.2 más la auditoría de seguridad completa.

### Seguridad — 18/18 puntos implementados ✅

| # | Control | Estado | Dónde |
|---|---------|--------|-------|
| 1 | Rate limiting (3 niveles) | ✅ | `middleware/rateLimits.js` + `app.js` |
| 2 | `/sync` autenticado | ✅ | `routes/usuarios.js` — `requireSyncAuth` |
| 3 | Webhook MP con firma HMAC | ✅ | `controllers/pagosController.js` + `MP_WEBHOOK_SECRET` en VPS |
| 4 | SSH por clave ED25519 | ✅ | VPS `authorized_keys` + `PasswordAuthentication no` + `SSH_PRIVATE_KEY` en GitHub |
| 5 | UFW firewall | ✅ | VPS — 22/80/443 habilitados |
| 6 | Fail2ban | ✅ | VPS — jail sshd activo |
| 7 | CORS producción limpio | ✅ | `app.js` — localhost:3001 excluido en prod |
| 8 | Content Security Policy | ✅ | `frontend/next.config.js` |
| 9 | Upload magic bytes | ✅ | `middleware/upload.js` — `validateMagicBytes` |
| 10 | Branch protection master | ✅ | GitHub Settings — force push bloqueado, TypeScript check requerido |
| 11 | Monitoreo Uptime Robot | ✅ | todasmiscosas.com cada 5 min |
| 12 | Body limit JSON 100KB | ✅ | `app.js` |
| 13 | PM2 log rotation | ✅ | pm2-logrotate — 10MB, 7 días, compresión diaria |
| 14 | Dependabot | ✅ | `.github/dependabot.yml` + alerts habilitados |
| 15 | Formularios admin con rate limit | ✅ | `routes/admin.js` — contactLimiter |
| 16 | Backup cifrado | ✅ | `backup-local.sh` — GPG AES-256 con `TMC_BACKUP_PASSPHRASE` |
| 17 | SECURITY.md | ✅ | Raíz del repo |
| 18 | Doc rotación JWT | ✅ | `docs/jwt-secret-rotation.md` |

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
| Monitoreo | Uptime Robot — HTTPS cada 5 min |
| Firewall | UFW + Fail2ban |

---

## Pendientes generales

- [ ] **Alejandro/Guille**: definir `export TMC_BACKUP_PASSPHRASE=...` en `~/.bashrc` o `~/.zshrc` de cada máquina local
- [ ] **Guille**: activar "Terraza libre" desde `/panel` (activo=FALSE en DB)
- [ ] **Alejandro**: correr `bash /var/www/todasmiscosas/backup.sh` desde Hostinger terminal
- [ ] Confirmar `FRONTEND_URL=https://todasmiscosas.com` en backend `.env` producción
- [ ] Fase II: nichos y expansión territorial
