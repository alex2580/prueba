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

> **Pendiente (26 ago 2026):** `add-payout-automatico.js` — agrega `payout_estado`/`payout_mp_id`/`payout_error` a `reservas`. Guille debe correr: `node backend/src/db/add-payout-automatico.js`.

> **Pendiente (26 ago 2026):** `add-mp-connect.js` — agrega `mp_user_id`/`mp_access_token`/`mp_refresh_token`/`mp_public_key`/`mp_token_expires_at`/`mp_connected_at` a `usuarios` (mismo esquema que ya usa TME, ver su `CLAUDE.md`). Guille debe correr: `node backend/src/db/add-mp-connect.js`. **Además**, Alejandro tiene que cargar 4 env vars nuevas en el `.env` del backend en el VPS (no versionadas): `MP_CLIENT_ID`, `MP_CLIENT_SECRET` (salen de marcar la app de MP como **Marketplace** en el dashboard de developers — un toggle distinto de los permisos sueltos tipo "Online Payout"), `MP_CONNECT_REDIRECT_URI=https://todasmiscosas.com/api/mp-connect/callback`, y `TOKEN_ENCRYPTION_KEY` (secreto random 32+ caracteres, para cifrar los tokens de MP guardados por proveedor). Hasta que esto esté cargado, `/api/mp-connect/authorize` va a fallar con las credenciales vacías.

> **Pendiente (25 jun 2026):** `add-retencion-chat.js` — agrega columnas `archivado_at`/`purgar_after` a `conversaciones`, cambia FKs de CASCADE a RESTRICT, y backfill de chats ya cerrados. Guille debe correr: `node backend/src/db/add-retencion-chat.js`

> Corridas en prod: `add-consultas-espacio.js`, `fix-consultas-charset.js` (7 jun), `add-movimientos-ledger.js`, `add-eliminado-por-oferente.js` (8 jun), `fix-consultas-espacio-id-type.js` (20 jun — corrida directo por Claude, no por Guille, vía acceso DB local), `add-destacado-admin.js` (17 ago — columna `destacado_admin` en `espacios` para el carrusel de destacados; confirmado funcionando, el toggle ⭐ del admin persiste después de refrescar), `tristate-destacado-admin.js` (17 ago — corrida directo por Claude, no por Guille, vía acceso DB local; `destacado_admin` pasa de booleano a tri-estado NULL/0/1 — mismo fix aplicado primero en TME, ver decisión de arquitectura más abajo).

## Variables de entorno críticas (backend .env en VPS)

- `JWT_SECRET` — autenticación
- `MP_WEBHOOK_SECRET` — firma webhooks MercadoPago
- `RESEND_API_KEY` — emails
- `FRONTEND_URL` — debe ser `https://todasmiscosas.com`
- `DB_*` — credenciales MySQL Hostinger

## Claude Code Plugins instalados

El entorno de Claude Code tiene 8 plugins activos. No tocan el código — son skills invocables por prompt en cualquier sesión. Total: **59 skills · ~3,705 tok siempre activos**.

| Plugin | Versión | Tokens | Skills clave |
|---|---|---|---|
| `engineering` | v1.2 | ~609 | code-review, debug, deploy-checklist, architecture, incident-response, standup, tech-debt, testing-strategy |
| `marketing` | v1.2 | ~563 | campaign-plan, draft-content, email-sequence, seo-audit, brand-review, competitive-brief |
| `sales` | v1.3 | ~654 | draft-outreach, account-research, call-prep, create-an-asset, pipeline-review, competitive-intelligence |
| `product-management` | v1.2 | ~560 | write-spec, roadmap-update, sprint-planning, stakeholder-update, synthesize-research, brainstorm |
| `legal` | v1.3 | ~646 | review-contract, triage-nda, compliance-check, legal-risk-assessment, vendor-check |
| `desktop-commander` | v0.2 | ~1,064 | terminal, knowledge-base, obsidian-vault, ai-tools-setup, computer-health-check |
| `productivity` | v1.3 | ~231 | start, task-management, memory-management, update |
| `diagram-design` | v2.3.1 | ~379 (~14k on-invoke) | diagram-design, export-diagram, import-drawio, import-mermaid — diagramas editoriales de marca (arquitectura, ER, funnel, org chart) como HTML+SVG autocontenido |

**Pendientes de instalar (14):** `langfuse`, `apollo`, `postiz`, `brand-voice` (alta prioridad), + 10 más. Ver `project_plugins_pendientes.md` en memoria.
**Instalar:** `claude plugin install [nombre]`
**Guía completa (22 plugins):** `docs/DATA-IMPORTANTE/claude-plugins-guia-21.html`
**Referencia por tabs (7 instalados):** `docs/DATA-IMPORTANTE/claude-plugins-engineering-marketing-sales.html`

## Decisiones de arquitectura

- **Fotos → Supabase Storage** (no filesystem local): multer usa `memoryStorage`
- **Chat restringido**: habilitado desde `confirmada` hasta que se libera el depósito de garantía (`escrow_liberado = 1`). El cierre es simétrico: desaparece para cliente Y proveedor al mismo tiempo. Ver [[feedback-chat-reservas]].
- **Filtro de contenido**: regex puro (no AI), 4 categorías, aplicado frontend + backend
- **Soft delete de espacios**: `activo = FALSE` + `eliminado_por_oferente` para trazabilidad
- **Comisión**: 15% TMC, 85% oferente (`netoOferente()` en utils.ts)
- **Pago directo al proveedor (26 ago 2026)** — el cobro sigue entrando y quedando retenido en la cuenta central de MP exactamente igual que siempre (custodia real, sin cambios — a diferencia de TME, acá NO se usa `marketplace_fee` para cobrar porque ese mecanismo liquida solo al aprobarse el pago y no soporta "retener y liberar después"). Lo que cambia es el momento de la liberación (`confirmarAcceso` en `reservasController.js` y el cron de `jobs/escrow.js`): en vez de solo mandar un email al admin para que transfiera a mano, `mercadopagoService.transferirDinero()` intenta la transferencia automática. Si falla, cae al aviso manual de siempre, sin romper nada — `reservas.payout_estado` queda en `'fallido'` con el motivo en `payout_error`.
  - **Primer intento (probado con plata real, falló siempre):** identificar al destinatario por un alias de MP tipeado a mano en `usuarios.cbu_alias`. Rechazado con `401 "Unauthorized use of live credentials"` en dos cuentas reales distintas, con o sin el permiso "Online Payout" tildado en el dashboard de developers.
  - **Segundo intento (actual, sin confirmar todavía si funciona):** copiar el modelo de conexión de TME — el proveedor conecta su propia cuenta de MP vía OAuth (`mpConnectController.js`, botón "Conectar con Mercado Pago" en `/panel`, mismo patrón que `mi-cuenta/page.tsx` de TME), y `transferirDinero()` identifica al destinatario por su `mp_user_id` real (`collector: { id: mp_user_id }` en vez de `collector: { email: alias }`). La hipótesis es que MP exige una referencia verificada por OAuth, no un alias suelto — pendiente de probar con plata real una vez cargadas las env vars y corrida la migración. `usuarios.cbu_alias` queda como referencia humana en el email de aviso manual cuando la transferencia falla, pero ya no es el gate para publicar/reservar — ahora el gate es `mp_access_token IS NOT NULL` (`espaciosController.crear`, `pagosController.crearPreferencia`).
- **Consultas públicas**: `consultas_espacio` tiene collation `utf8mb4_unicode_ci` distinto a `espacios` (`utf8mb4_0900_ai_ci`). NUNCA usar JOIN entre ellas — siempre dos queries separadas y merge en JS. Ver `consultasEspacioController.js`.
- **CI/CD deploy**: self-hosted runner instalado en VPS (`/opt/github-runner`). El runner conecta OUT a GitHub. Ver `.github/workflows/deploy.yml`.
- **Vigencia de publicaciones**: 90 días corridos desde la creación (`fecha_vencimiento`). Tocar en `espaciosController.js`, `server.js`, `add-vencimiento-espacios.js`, `CalendarioDisponibilidad.tsx`, `reservar/page.tsx`, `emailService.js`, `legales/page.tsx`, `publicar/page.tsx`, `messages/es.json` + `pt.json` si cambia de nuevo.
- **Calendarios** (publicar/editar/reservar): `numberOfMonths` responsive — 1 en mobile (`≤640px`), 2 en desktop, vía `useState` + listener de `resize` (arranca en 2, igual que SSR, se ajusta post-montaje para no generar hydration mismatch). 2 meses fijos desbordan ~430px en mobile y se llevan el botón "Continuar" fuera del viewport. Flechas nativas de react-multi-date-picker. NO usar `currentDate` para forzar mes ni armar un carrusel propio — la librería calcula mal el offset de transición y desborda el layout.
- **Grid de tarjetas en la home**: posicionamiento explícito (`gridRow`/`gridColumn` inline) para llenar fila 1 completa antes de fila 2 — el auto-placement de CSS Grid con `grid-auto-flow: column` no lo permite por reordenamiento de array.
- **Footer en mobile**: visible solo en `/`, `/como-funciona` y `/legales` — oculto en el resto (reserva, publicación, panel, detalle de espacio) donde el espacio de pantalla importa más. En tablet/desktop siempre visible. Ver `components/ui/Footer.tsx`.
- **Disponibilidad de espacios (home + filtro Ingreso/Salida)**: un espacio se muestra si tiene **al menos un día libre** en el rango relevante — nunca se exige que el rango entero esté libre. "Libre" = permitido por `disponibilidad.dias` (si está configurada) y, para exclusivos, sin reserva activa ese día. Mismo criterio con o sin fechas elegidas por el visitante (sin fechas, el rango relevante es [hoy, `fecha_vencimiento`]). Ver `espaciosController.js` función `listar`.
- **i18n de `/legales`**: la página no usa next-intl por string — está separada en `ContenidoES()` y `ContenidoPT()` (mismo archivo, mismos anchors `#disputas`/`#danos`/`#politica-privacidad`), elegida según `useLocale()`. Si se edita el texto legal en español, el portugués NO se actualiza solo — hay que tocar `ContenidoPT()` a mano.
- **Carrusel de destacados en la home (17 ago 2026)** — portado de TME (`components/espacios/DestacadoCarrusel.tsx`), mismo mecanismo: banner full-bleed (100vw), autoplay 5s, paginación por puntos, brillo de imagen medido con canvas oculto para elegir texto blanco u oscuro por foto. Selección: hasta 3 destacados, prioridad 1 los marcados a mano por admin (`destacado_admin`, toggle ⭐ en `/admin` → tab Publicaciones), prioridad 2 relleno automático por `reservas_mes` desc. Con un solo destacado, el carrusel muestra todas sus fotos en vez de una sola fija. A diferencia de TME, acá NO hace falta el truco de `marginTop` negativo para pegarlo a la cabecera — la home de TMC tiene Hero + banner de waitlist + barra de filtros antes de la sección de resultados, así que no hay franja de padding vacía que cancelar. El carrusel se calcula sobre `espacios` (ya filtrado por los filtros activos, igual que TME), no hay lista separada — los destacados siguen apareciendo también en la grilla de abajo.
- **`destacado_admin` a tri-estado (17 ago 2026)** — mismo fix aplicado primero en TME. Antes era booleano (`0`/`1`): desmarcar un espacio destacado a mano no lo sacaba del carrusel si tenía `reservas_mes > 0`, porque el fallback "más reservado" no distinguía "nunca tocado" de "excluido a propósito". Ahora `destacado_admin` es `NULL` (automático, elegible por `reservas_mes`) / `1` (forzado destacado) / `0` (forzado excluido, nunca entra por reservas). El botón ⭐ del admin cicla los 3 estados en cada clic (`⭐ Destacado` → `🚫 Excluido` → `☆ Automático` → …), calculado server-side en `adminController.toggleDestacadoAdmin`. Migración `tristate-destacado-admin.js` ya corrida en prod (ver arriba) — el backfill pasó todos los `0` previos a `NULL`, asumiendo que ningún espacio había sido "excluido a propósito" todavía (la distinción no existía antes de este cambio).
