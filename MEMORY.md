# TodasMisCosas.com — MEMORY (Estado vivo del proyecto)

> Este archivo se actualiza en cada sesión. Refleja el estado real del proyecto ahora.
> Para arquitectura y reglas de código ver `CLAUDE.md`.

---

## Versión actual en producción

**v1.7.3** — deployada el 30 mayo 2026

---

## Historial de versiones recientes

| Versión | Fecha | Qué entró |
|---------|-------|-----------|
| v1.7.3 | 30/05 | Auditoría de seguridad completa (18 puntos). SECURITY.md, rate limiting, CSP, CORS, body limit, MP webhook firma, magic bytes, deploy key ED25519, Dependabot, branch protection, Uptime Robot, backup GPG. |
| v1.7.2 | 30/05 | Idem (parte 1 de la auditoría) |
| v1.7.1 | 29/05 | Fix DECIMAL→string crash en getPublicaciones |
| v1.7.0 | 29/05 | StatsOferente ingresos netos, tab Publicaciones en admin (activar/pausar), fix TabBar scrollable, legales sección 5, Nav "¿Cómo funciona?" con apertura de pregunta |
| v1.6.0 | 27/05 | Sistema de favoritos completo, reserva por mes (type=month), ocultar MiniCalendar en modo mes, paridad visual de precios, fix CI/CD IPv6 |
| v1.5.x | 26/05 | Fotos→Supabase Storage, categoría Galpón, filtros home, CBU/Alias, carousel fotos, chat "Consultar", admin chat audit |

---

## Pendientes operativos — Guille debe hacer en VPS

- [ ] Correr `bash /var/www/todasmiscosas/backup.sh` desde terminal Hostinger
- [ ] Verificar que `node src/db/migrate-fotos-to-supabase.js` corrió exitosamente
- [ ] Confirmar `FRONTEND_URL=https://todasmiscosas.com` en `backend/.env` de producción
- [ ] Hardening VPS: UFW, Fail2ban, deshabilitar `PasswordAuthentication`, PM2 log rotation
- [ ] Agregar `MP_WEBHOOK_SECRET` al `.env` de producción
- [ ] Correr migraciones DB pendientes (ver CLAUDE.md sección Migraciones)

## Pendientes operativos — Alejandro y Guille

- [ ] Definir `TMC_BACKUP_PASSPHRASE` en `~/.bashrc` o `~/.zshrc` de cada máquina local (necesario para descifrar backups GPG)

---

## Migraciones DB pendientes (Guille corre en VPS)

```bash
cd /var/www/todasmiscosas/backend
node src/db/add-consultas-espacio.js
node src/db/add-eliminado-por-oferente.js
```

---

## Decisiones tomadas en sesiones recientes

- **"Terraza libre"** activada el 30/05 desde `/panel` por Guille ✅
- **Backup cifrado**: GPG AES-256 con passphrase. Script en `/var/www/todasmiscosas/backup.sh`
- **Uptime Robot**: monitor configurado cada 5 minutos sobre `https://todasmiscosas.com`
- **SSH deploy key**: ED25519 — Guille agregó la pública a GitHub, la privada está en VPS como `~/.ssh/id_ed25519`
- **VPS_PASS eliminado** de GitHub Secrets — reemplazado por SSH key

---

## Fase II — En planificación

Ver `docs/fase2-expansion-strategy.html` para el plan completo.

Nichos P1: e-commerce/micro-emprendedores, familias en mudanza.  
Territorio: CABA densificación → GBA → Interior ARG → LATAM.

---

## Contactos clave

| Quién | Rol | Email |
|-------|-----|-------|
| Alejandro | Product Owner | alejandro.laporte@gmail.com |
| Guille | DevOps / VPS | guilleadominguez@gmail.com |
