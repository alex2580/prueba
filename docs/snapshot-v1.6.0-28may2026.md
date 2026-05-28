# TMC — Snapshot v1.6.0 (28 de Mayo 2026)

Estado completo del proyecto al cierre de la sesión 27–28 de mayo 2026.

---

## Versión y estado

- **Versión:** v1.6.0
- **Fecha:** 28 de mayo de 2026
- **Commits principales:** `4b73a73`, `30b25c1`, `79ccbf4`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Módulos en producción ✅

### Sistema base
- Auth (Supabase JWT)
- Publicación de espacios (fotos → Supabase Storage)
- Búsqueda con filtros (tipo, período, precio, seguridad, barrio)
- Mapa Google Maps
- Chat en tiempo real (Socket.io)
- Email SMTP Hostinger (bienvenida, confirmaciones)
- Pasarela de pago MercadoPago
- Panel oferente y admin
- Responsive (mobile + tablet)

### Favoritos (nuevo en v1.6.0)
- Tabla `favoritos` en producción (MySQL, `u713501758_todasmiscosas`)
- Backend: `favoritosController.js` + `routes/favoritos.js`
- Frontend: `favoritosAPI.ts` + pestaña Favoritos en `panel/page.tsx`
- Fix race condition: `token` se pasa como prop desde parent autenticado (no `useAuth()` en child)

### Flujo de reserva (mejorado en v1.6.0)
- Selector de período: botones Día / Mes / Ambos según precios disponibles
- `type="month"` cuando `modoCalendario === 'mes'` → selector año/mes, calcula primer/último día
- `MiniCalendar` oculto cuando `modoCalendario === 'mes'` (solo días cuando corresponde)
- Precios side-by-side en `DetalleEspacio.tsx` con igual peso visual

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + TypeScript |
| Backend | Express.js + MySQL (mysql2) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage (buckets `espacios`, `avatars`) |
| DB | MySQL en `srv2021.hstgr.io:3306` |
| Deploy | PM2 (`tmc-backend`, `tmc-frontend`) en VPS Hostinger |
| CI/CD | GitHub Actions + `appleboy/ssh-action` (IPv4) |
| Dominio | `todasmiscosas.com` (Nginx reverse proxy) |

---

## Archivos clave

### Backend
```
backend/src/
  app.js
  controllers/
    espaciosController.js
    usuariosController.js
    chatController.js
    favoritosController.js       ← nuevo v1.6.0
    reservasController.js
  routes/
    favoritos.js                 ← nuevo v1.6.0
  middleware/auth.js, upload.js
  services/supabaseService.js, emailService.js
  db/connection.js
```

### Frontend
```
frontend/
  app/
    page.tsx                     — Home
    publicar/page.tsx
    panel/page.tsx               — Pestaña Favoritos nueva v1.6.0
    espacio/[id]/page.tsx
    espacio/[id]/reservar/page.tsx  — Mejoras UX v1.6.0
  components/
    espacios/
      CardEspacio.tsx            — token como prop (fix favoritos)
      DetalleEspacio.tsx         — precios side-by-side v1.6.0
      GridEspacios.tsx
  lib/
    api.ts
    favoritosAPI.ts              ← nuevo v1.6.0
    fotosFallback.ts
  types/index.ts
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

## Pendientes v1.7.0

- [ ] Verificar que `migrate-fotos-to-supabase.js` corrió en VPS (fotos viejas → Supabase)
- [ ] Confirmar `FRONTEND_URL=https://todasmiscosas.com` en backend `.env` producción
- [ ] Fase II: nichos (e-commerce, familias mudanza, estudiantes, deportistas)
- [ ] Fase II: expansión territorial (CABA → GBA → Interior → LATAM)

---

## Incidentes resueltos

| Fecha | Incidente | Fix |
|-------|-----------|-----|
| 27/05/2026 | Deploy fallaba por IPv6 en `VPS_HOST` secret | Reemplazado por IPv4 |
| 27/05/2026 | Favoritos redirigía al login (usuario logueado) | `useAuth()` en child → race condition; fix: `token` como prop |
| 27/05/2026 | Tabla `favoritos` no existía en producción | Guille ejecutó CREATE TABLE vía mysql remoto |
| 27/05/2026 | Calendario de días mostraba al reservar por mes | `MiniCalendar` envuelto en `{modoCalendario !== 'mes' && ...}` |
