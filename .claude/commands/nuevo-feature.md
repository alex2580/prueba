# Checklist nueva feature — TodasMisCosas

Usá este checklist cada vez que implementes una funcionalidad nueva en TMC.
Marcá cada ítem a medida que lo completás.

## Backend
- [ ] Controller: función(es) nueva(s) en `backend/src/controllers/`
- [ ] Route: endpoint(s) registrado(s) en `backend/src/routes/`
- [ ] app.js: ruta registrada con `app.use('/api/...')` si es un router nuevo
- [ ] DB: ¿necesita tabla o columna nueva?
  - Si sí → lazy init (CREATE TABLE IF NOT EXISTS dentro del controller) o migration en `backend/src/db/`
  - Si no → marcar como N/A
- [ ] Middlewares: ¿requiere `requireAuth` o `requireAdmin`?
- [ ] Email: ¿hay que notificar algo? → agregar función en `emailService.js`

## Frontend
- [ ] Componente(s): creado(s) en `frontend/components/` o `frontend/app/`
- [ ] API: función(es) agregada(s) en `frontend/lib/api.ts`
- [ ] Types: interfaces o tipos actualizados en `frontend/types/index.ts`
- [ ] Hook: ¿necesita un hook custom en `frontend/hooks/`?
- [ ] Panel admin: ¿aparece en `frontend/app/admin/page.tsx`?
- [ ] Panel usuario: ¿aparece en `frontend/app/panel/page.tsx`?

## Calidad
- [ ] TypeScript: correr `cd frontend && npx tsc --noEmit` → sin errores
- [ ] Casos borde: ¿qué pasa si el usuario no está logueado? ¿si la DB falla?
- [ ] Mobile: ¿se ve bien en pantalla chica?

## Deploy
- [ ] `docs/novedades.md` actualizado con descripción de la feature
- [ ] Commit con mensaje descriptivo
- [ ] Push → GitHub Actions en verde

## Recordatorios TMC
- Lazy migrations: siempre usar `CREATE TABLE IF NOT EXISTS` o try/catch con `ALTER TABLE`
- IDs: generar con `crypto.randomUUID()` en Node.js, no depender de `DEFAULT (UUID())` de MySQL
- Emails: fire-and-forget con `.catch()` para no bloquear la respuesta
- Timezone: nunca comparar fechas con `NOW()` en MySQL — hacerlo en Node.js con `Date.now()`
- Fotos: siempre Supabase Storage, nunca diskStorage local
