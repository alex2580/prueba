# TodasMisCosas.com — Instrucciones para Claude Code

## El proyecto

Marketplace de alquiler de espacios (habitaciones, cocheras, galpones, depósitos) en CABA/AMBA, estilo Airbnb pero para guardado y almacenamiento. Lanzamiento: junio/julio 2026.

- **Repo:** `alex2580/prueba` (GitHub)
- **Prod:** `https://todasmiscosas.com` — VPS Hostinger IP `2.24.105.151`
- **Proceso:** push a `master` → GitHub Actions (TypeScript check) → SSH deploy → PM2 restart

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Backend | Express.js + MySQL (mysql2) |
| Auth | Supabase JWT |
| Fotos | Supabase Storage |
| Chat | Socket.io |
| Pagos | MercadoPago |
| Deploy | PM2 en VPS Hostinger |

## Roles del equipo

- **Alejandro (CTO)** — emprendedor, product owner, toma decisiones de negocio y tecnología
- **Guille (CIO)** — administra el VPS, corre migraciones de DB, gestiona secretos en GitHub

## Reglas de código

- **Nunca** agregar comentarios salvo que el WHY sea no obvio
- **Nunca** crear archivos `.md` de documentación salvo que se pida explícitamente
- **Nunca** tocar código sin instrucción explícita
- **Siempre** hacer commit + push al terminar cambios (sin que lo pidan)
- Preferir editar archivos existentes antes de crear nuevos
- Sin manejo de errores para escenarios imposibles — solo en boundaries (input usuario, APIs externas)
- Sin abstracciones prematuras — tres líneas similares es mejor que una abstracción temprana
- Interpretar pedidos en argentino coloquial (reclamo, oferente, demandante, etc.)

## Arquitectura de archivos clave

```
backend/src/
  app.js                    ← entry point Express, middlewares, rutas
  controllers/              ← lógica de negocio
  routes/                   ← definición de endpoints
  middleware/               ← auth, contactFilter, etc.
  services/emailService.js  ← todos los templates de email (Resend)
  db/
    connection.js            ← pool MySQL
    *.js                     ← migraciones (correr manualmente en VPS)

frontend/
  app/                      ← Next.js App Router pages
  components/               ← UI reutilizable
  hooks/                    ← useAuth, useEspacios, useChat, etc.
  lib/
    api.ts                   ← todos los fetch al backend
    contactFilter.ts         ← filtro de contenido (contact/badword/sexual/political)
    utils.ts                 ← formatARS, formatFecha, netoOferente, etc.
  types/index.ts             ← tipos compartidos
```

## Workflow de desarrollo (Fábrica Agéntica)

### Antes de tocar código
1. Leer `docs/BACKLOG.md` para entender qué hay pendiente
2. Si es feature nueva: confirmar con Alejandro el scope exacto
3. Si toca DB: crear migración en `backend/src/db/` y avisar a Guille

### Durante el desarrollo
1. **Backend primero** → controller + route + middleware si aplica
2. **Frontend segundo** → tipos, API client, componente, página
3. **Filtros de contenido** → aplicar en ambos lados (frontend UX + backend seguridad)
4. **Email** → agregar en `emailService.js` + exportar + conectar en controller

### Entrega
1. Commit descriptivo con `Co-Authored-By: Claude Sonnet 4.6`
2. Push a `master` → CI/CD hace el deploy
3. Si hay migración de DB: documentar el comando que Guille debe correr
4. Actualizar `docs/BACKLOG.md` cerrando los items completados

## Migraciones DB pendientes (Guille debe correr en VPS)

> **Pendiente (25 jun 2026):** `add-retencion-chat.js` — agrega columnas `archivado_at`/`purgar_after` a `conversaciones`, cambia FKs de CASCADE a RESTRICT, y backfill de chats ya cerrados. Guille debe correr: `node backend/src/db/add-retencion-chat.js`

> Corridas en prod: `add-consultas-espacio.js`, `fix-consultas-charset.js` (7 jun), `add-movimientos-ledger.js`, `add-eliminado-por-oferente.js` (8 jun), `fix-consultas-espacio-id-type.js` (20 jun — corrida directo por Claude, no por Guille, vía acceso DB local).

## Variables de entorno críticas (backend .env en VPS)

- `JWT_SECRET` — autenticación
- `MP_WEBHOOK_SECRET` — firma webhooks MercadoPago
- `RESEND_API_KEY` — emails
- `FRONTEND_URL` — debe ser `https://todasmiscosas.com`
- `DB_*` — credenciales MySQL Hostinger

## Decisiones de arquitectura

- **Fotos → Supabase Storage** (no filesystem local): multer usa `memoryStorage`
- **Chat restringido**: habilitado desde `confirmada` hasta que se libera el depósito de garantía (`escrow_liberado = 1`). El cierre es simétrico: desaparece para cliente Y proveedor al mismo tiempo. Ver [[feedback-chat-reservas]].
- **Filtro de contenido**: regex puro (no AI), 4 categorías, aplicado frontend + backend
- **Soft delete de espacios**: `activo = FALSE` + `eliminado_por_oferente` para trazabilidad
- **Comisión**: 15% TMC, 85% oferente (`netoOferente()` en utils.ts)
- **Consultas públicas**: `consultas_espacio` tiene collation `utf8mb4_unicode_ci` distinto a `espacios` (`utf8mb4_0900_ai_ci`). NUNCA usar JOIN entre ellas — siempre dos queries separadas y merge en JS. Ver `consultasEspacioController.js`.
- **CI/CD deploy**: self-hosted runner instalado en VPS (`/opt/github-runner`). El runner conecta OUT a GitHub. Ver `.github/workflows/deploy.yml`.
- **Vigencia de publicaciones**: 90 días corridos desde la creación (`fecha_vencimiento`). Tocar en `espaciosController.js`, `server.js`, `add-vencimiento-espacios.js`, `CalendarioDisponibilidad.tsx`, `reservar/page.tsx`, `emailService.js`, `legales/page.tsx`, `publicar/page.tsx`, `messages/es.json` + `pt.json` si cambia de nuevo.
- **Calendarios** (publicar/editar/reservar): `numberOfMonths` responsive — 1 en mobile (`≤640px`), 2 en desktop, vía `useState` + listener de `resize` (arranca en 2, igual que SSR, se ajusta post-montaje para no generar hydration mismatch). 2 meses fijos desbordan ~430px en mobile y se llevan el botón "Continuar" fuera del viewport. Flechas nativas de react-multi-date-picker. NO usar `currentDate` para forzar mes ni armar un carrusel propio — la librería calcula mal el offset de transición y desborda el layout.
- **Grid de tarjetas en la home**: posicionamiento explícito (`gridRow`/`gridColumn` inline) para llenar fila 1 completa antes de fila 2 — el auto-placement de CSS Grid con `grid-auto-flow: column` no lo permite por reordenamiento de array.
- **Footer en mobile**: visible solo en `/`, `/como-funciona` y `/legales` — oculto en el resto (reserva, publicación, panel, detalle de espacio) donde el espacio de pantalla importa más. En tablet/desktop siempre visible. Ver `components/ui/Footer.tsx`.
- **Disponibilidad de espacios (home + filtro Ingreso/Salida)**: un espacio se muestra si tiene **al menos un día libre** en el rango relevante — nunca se exige que el rango entero esté libre. "Libre" = permitido por `disponibilidad.dias` (si está configurada) y, para exclusivos, sin reserva activa ese día. Mismo criterio con o sin fechas elegidas por el visitante (sin fechas, el rango relevante es [hoy, `fecha_vencimiento`]). Ver `espaciosController.js` función `listar`.
- **i18n de `/legales`**: la página no usa next-intl por string — está separada en `ContenidoES()` y `ContenidoPT()` (mismo archivo, mismos anchors `#disputas`/`#danos`/`#politica-privacidad`), elegida según `useLocale()`. Si se edita el texto legal en español, el portugués NO se actualiza solo — hay que tocar `ContenidoPT()` a mano.
