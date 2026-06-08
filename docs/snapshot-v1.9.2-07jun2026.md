# TMC — Snapshot v1.9.2 (7 de Junio 2026 — Noche)

Estado completo del proyecto al cierre de la sesión nocturna del 7 de junio de 2026.

---

## Versión y estado

- **Versión:** v1.9.2
- **Fecha:** 7 de junio de 2026 (noche)
- **Commits:** `274ac58`, `112601c`, `836e6f0`, `fc261b0`, `113522e`, `52463c1`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Módulos en producción ✅

Todos los de v1.9.1 (consultas públicas) más:

### Mejoras panel proveedor y admin (v1.9.2)

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| Chat — ciclo de vida | Habilitado desde `confirmada`, deshabilitado al liberar escrow | ✅ |
| Chat — filtro proveedor | Backend solo muestra conversaciones con reservas activas | ✅ |
| MP back_urls con /es/ | Todas las back_urls de MP tienen prefijo /es/ para next-intl v4 | ✅ |
| Terminología UI | "escrow" → "depósito de garantía", "Respuesta del proveedor" | ✅ |
| Admin — Servicios adicionales | Tab muestra solicitudes reales de clientes con datos de contacto | ✅ |
| Admin — Movimientos financieros | Nuevo tab 💵 con resumen y lista de movimientos_ledger | ✅ |
| Admin — Calendario | Nuevo tab 📅 con grilla mensual de reservas | ✅ |
| Panel proveedor — Calendario | Grilla mensual de reservas recibidas con puntos por estado | ✅ |
| Panel proveedor — Orden | Espacios publicados antes que reservas realizadas | ✅ |

---

## Archivos clave modificados en v1.9.2

```
frontend/
  app/[locale]/
    panel/page.tsx               ← chat lifecycle, calendario, orden secciones
    admin/page.tsx               ← TabServiciosAdicionales, TabMovimientos, TabCalendarioAdmin

  components/
    reservas/EstadoReserva.tsx   ← banners "depósito de garantía", acción en confirmada

backend/src/
  services/
    mercadopagoService.js        ← back_urls con /es/
  controllers/
    chatController.js            ← filtro conversaciones proveedor
    adminController.js           ← getMovimientos()
  routes/
    admin.js                     ← GET /movimientos
```

---

## Endpoints nuevos en v1.9.2

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/movimientos` | Lista completa de movimientos_ledger con resumen financiero |

---

## Bugs corregidos en v1.9.2

### 1. TypeScript CI — unknown no asignable a ReactNode
- **Síntoma:** CI fallaba en `npx tsc --noEmit` con `Type 'unknown' is not assignable to type 'ReactNode'`
- **Causa:** `d?.telDemandante && <div>...</div>` donde `d` es `Record<string, unknown> | null`
- **Fix:** `!!d?.telDemandante && <div>...</div>`
- **Commit:** `52463c1`

### 2. Admin tab servicios adicionales vacío
- **Síntoma:** El tab mostraba solicitudes de puntuación en vez de servicios adicionales
- **Causa:** Tab key `solicitudes-puntaje` renderizaba el componente equivocado
- **Fix:** Tab renderiza `TabServiciosAdicionales` que lee `admin_notificaciones` filtrado por `tipo='servicios_adicionales'`

### 3. MP redirect no volvía al sitio
- **Síntoma:** Al completar pago en MP, el usuario quedaba en la pantalla de MP
- **Causa:** `back_urls` sin prefijo `/es/` — next-intl v4 no resuelve rutas sin locale
- **Fix:** Todas las back_urls con `/es/` explícito

---

## Versión anterior: v1.9.1 (7 junio mañana)

- Consultas públicas Q&A en publicaciones
- Fix charset MySQL para tabla `consultas_espacio`
- Emails con links `/es/espacio/:id`

## Versión anterior: v1.9.0 (5 junio)

- Sistema de escrow / depósito de garantía completo
- Columnas `escrow_liberado`, `escrow_liberado_at`, `escrow_neto_oferente` en `reservas`
- Cron auto-release 48h
- 5 nuevas plantillas de email de escrow
- `movimientos_ledger` para trazabilidad financiera

---

## Stack en producción

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js App Router + TypeScript | 14.x |
| Backend | Express.js + MySQL (mysql2) | 4.x |
| Auth | Supabase Auth (JWT) | — |
| Storage | Supabase Storage | — |
| Pagos | MercadoPago Checkout Pro | — |
| Emails | Resend vía Nodemailer | — |
| Chat | Socket.io | — |
| Deploy | PM2 + VPS Hostinger + GitHub Actions | — |
| CI/CD | TypeScript check → SSH deploy | — |

---

## Reglas críticas de código (no repetir bugs)

1. **Charset MySQL:** Nunca `COLLATE utf8mb4_bin` en JOINs con `consultas_espacio`. Query separada para datos del autor.
2. **Locale prefix:** Todos los links internos y `back_urls` MP con `/es/`.
3. **Terminología:** "depósito de garantía" / "proveedor" / "cliente" en UI. `oferente`/`demandante` solo en código.
4. **TypeScript JSX:** Nunca valor `unknown` directo en condición JSX. Usar `!!valor`.
5. **Rename:** Solo texto visible al usuario, nunca tipos TS, variables, columnas DB.
