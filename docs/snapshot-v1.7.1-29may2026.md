# TMC — Snapshot v1.7.1 (29 de Mayo 2026)

Estado completo del proyecto al cierre de la sesión 29 de mayo 2026.

---

## Versión y estado

- **Versión:** v1.7.1
- **Fecha:** 29 de mayo de 2026
- **Commits:** `14c9f70`, `3075e8e`, `d84b7a1`, `9a431d7`, `66289fe`, `b13ce57`, `627dbba`, `5fccad0`, `ba4e33f`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Módulos en producción ✅

### Sistema base
- Auth (Supabase JWT + OTP por email)
- Publicación de espacios (fotos → Supabase Storage)
- Búsqueda con filtros (tipo, período, precio, seguridad, barrio, país)
- Mapa Google Maps
- Chat en tiempo real (Socket.io)
- Email SMTP Hostinger (bienvenida, confirmaciones, OTP, T&C)
- Pasarela de pago MercadoPago (Checkout Pro + QR)
- Panel oferente y demandante
- Responsive (mobile + tablet)
- Favoritos
- Cron jobs: recordatorios de vencimiento + inactividad 90d

### Admin panel (actualizado en v1.7.1)
- Tab Usuarios: listado, bloqueo/desbloqueo
- Tab Operaciones: 9 KPI financieros + lista de reservas con GMV/comisión/neto
- Tab Puntuación: solicitudes de mejora de puntuación
- Tab Publicaciones (nuevo v1.7.1): todas las publicaciones del sistema, filtro activas/inactivas, badge de estado, botón Activar/Pausar

### Flujo activo/disponible (clarificado en v1.7.1)
- `activo`: controla visibilidad en home, mapa y resultados
- `disponible`: controla si acepta reservas nuevas
- Ambos se sincronizan al activar/pausar desde admin y desde panel oferente
- `misEspacios` muestra todos los espacios del oferente sin filtrar por `activo`

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + TypeScript |
| Backend | Express.js + MySQL (mysql2) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage (buckets `espacios`, `avatars`) |
| DB | MySQL en `srv2021.hstgr.io:3306` |
| Deploy | PM2 (`tmc-backend` puerto 4000, `tmc-frontend` puerto 3000) en VPS Hostinger |
| CI/CD | GitHub Actions + `appleboy/ssh-action` (IPv4) |
| Dominio | `todasmiscosas.com` (Nginx reverse proxy) |

---

## Archivos modificados en esta sesión

### Backend
```
backend/src/
  controllers/
    adminController.js      — getPublicaciones + toggleDisponibleAdmin (nuevo)
    espaciosController.js   — misEspacios sin filtro activo; actualizar con IF(activo)
  routes/
    admin.js                — GET /publicaciones + PATCH /publicaciones/:id/disponible
```

### Frontend
```
frontend/
  app/
    admin/page.tsx          — TabPublicaciones + interfaz PublicacionAdmin
    legales/page.tsx        — Sección 5: +2 ítems prohibidos
  components/
    ui/SiteHeader.tsx       — "¿Cómo funciona?" con signo de apertura
```

### Docs
```
docs/
  novedades.md              — v1.7.1 documentado
  TMC-documentacion-tecnica.html  — v1.5 → v1.7.1 (admin endpoints + cambios recientes)
  snapshot-v1.7.1-29may2026.md    — este archivo
```

---

## Variables de entorno (producción)

**Backend** `/var/www/todasmiscosas/backend/.env`:
- `DB_HOST=srv2021.hstgr.io`, `DB_USER=u713501758_tmc_user`, `DB_NAME=u713501758_todasmiscosas`
- `SUPABASE_URL=https://ihwaxwwxdkatdxnuyjik.supabase.co`
- `FRONTEND_URL` — debe ser `https://todasmiscosas.com` (verificar con Guille)

**Frontend** `/var/www/todasmiscosas/frontend/.env.local`:
- `NEXT_PUBLIC_API_URL=https://todasmiscosas.com`
- `NEXT_PUBLIC_WS_URL=wss://todasmiscosas.com`

---

## Pendientes

- [ ] **Guille**: entrar a `/panel` y hacer click en "Activar" en "Terraza libre" (`activo=FALSE` en DB)
- [ ] **Alejandro**: correr `bash /var/www/todasmiscosas/backup.sh` desde terminal Hostinger
- [ ] Verificar que `migrate-fotos-to-supabase.js` corrió en VPS (fotos viejas → Supabase)
- [ ] Confirmar `FRONTEND_URL=https://todasmiscosas.com` en backend `.env` producción
- [ ] Fase II: nichos (e-commerce, familias mudanza, estudiantes, deportistas)

---

## Incidentes resueltos

| Fecha | Incidente | Fix |
|-------|-----------|-----|
| 29/05/2026 | "Terraza libre" no aparecía en home/mapa pese a `disponible=1` | `activo=0` en DB; fix: admin toggleDisponible sincroniza ambos campos |
| 29/05/2026 | Crash "Application error" al clickear tab Publicaciones | mysql2 devuelve DECIMAL como string; fix: `parseFloat()` en controller |
| 29/05/2026 | Tab Publicaciones cortado en pantallas medianas | TabBar sin `overflow-x: auto`; fix: overflow + `flex-shrink: 0` |
| 29/05/2026 | "Terraza libre" no aparecía en panel del oferente | `misEspacios` filtraba por `activo`; fix: eliminado el filtro |
| 27/05/2026 | Deploy fallaba por IPv6 en `VPS_HOST` secret | Reemplazado por IPv4 |
| 27/05/2026 | Favoritos redirigía al login (usuario logueado) | `useAuth()` en child → race condition; fix: `token` como prop |
