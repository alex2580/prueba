# TMC — Snapshot v1.15.0 (24 de Junio 2026)

Estado completo del proyecto al cierre de la sesión de desarrollo del 24 de junio de 2026.

---

## Versión y estado

- **Versión:** v1.15.0
- **Fecha:** 24 de junio de 2026
- **Último commit de código:** `0fc632e`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Resumen de la sesión

Sesión larga centrada en bugs reales de **mobile** (footer, calendario, filtros, OTP), un **bug de datos** en el filtro de fechas Ingreso/Salida que dejaba la home sin resultados con rangos amplios, **traducción completa a portugués** de cómo funciona / FAQ / legales / flujos sintéticos, y 5 documentos nuevos en `docs/DATA-IMPORTANTE/`. La mayoría de los fixes de mobile se verificaron con Playwright contra builds de producción reales (no `next dev`, que en este entorno no hidrata bien por una restricción de CSP/eval) antes de confirmarlos, incluyendo eventos táctiles reales vía CDP para el bug del slider de precio.

---

## 🐛 Bug de datos corregido: filtro Ingreso/Salida exigía el rango entero libre

**Síntoma:** buscar con un rango amplio (ej. 1 de agosto al 18 de septiembre) no traía ninguna publicación, pese a que varios espacios tenían bastante disponibilidad dentro de ese rango.

**Causa real:** tanto el filtro SQL (`espaciosController.js`) como el filtro JS de `disponibilidad.dias` implementaban "el rango entero tiene que estar libre": el SQL excluía un espacio exclusivo si tenía **cualquier** reserva que se solapara con el rango pedido, sin importar cuánto; el JS exigía que **todos** los días pedidos estuvieran en la lista configurada por el proveedor. Con un rango de 49 días, bastaba un solo día ocupado o fuera de configuración para que la publicación desapareciera entera.

**Fix:** unificado con la misma lógica de "al menos un día libre" ya usada para el caso sin fechas elegidas (ver más abajo) — alcanza con que exista un solo día dentro del rango pedido que esté permitido por `disponibilidad.dias` (si está configurada) y, para exclusivos, libre de reservas activas. El SQL ya no excluye por solapamiento; ese chequeo fino se hace en JS, día por día. También se corrigió que el tope superior del rango quedara acotado por el **más restrictivo** entre lo pedido por el visitante y el propio `fecha_vencimiento` del espacio (antes, con fechas explícitas, nunca se chequeaba contra el vencimiento en JS). Lista y mapa comparten el mismo array de datos (`useEspacios` → `listar()`), así que este único fix corrige ambos a la vez.

**Validado:** 14 casos sintéticos (6 nuevos del rango explícito + 8 ya validados del caso sin fechas).

**Commit:** `9516f70`

---

## 🐛 Espacios sin días libres en su vigencia — ahora se ocultan siempre

**Pedido:** si una publicación no tiene ningún día disponible entre hoy y el fin de sus 90 días de vigencia, no debe aparecer en la home ni en el mapa, sin importar si está activa o con cupo. Si el proveedor habilita un día, debe reaparecer solo.

**Antes:** el chequeo de disponibilidad real solo corría cuando el visitante buscaba con `fecha_desde`/`fecha_hasta` explícitas. Navegando sin elegir fechas, un espacio activo y con cupo aparecía igual aunque no le quedara ningún día libre en toda su vigencia.

**Fix:** se agrega el mismo chequeo para el caso sin fechas — alcanza con encontrar un solo día libre en `[hoy, fecha_vencimiento]`. Para exclusivos, un día cuenta como bloqueado si hay una reserva activa que lo cubre; compartidos nunca se bloquean por reserva (solo por `cupo_disponible`, sin cambios ahí).

**Validado:** 8 casos sintéticos (exclusivo 100% reservado, con 1 día libre, compartido nunca bloqueado, días configurados en el pasado/futuro, publicación vencida, día configurado coincidiendo con una reserva).

**Commit:** `71dc559`

---

## 🐛 Calendario (reservar + publicar/editar) desbordaba en mobile

**Síntoma:** en el flujo de reserva, en mobile, el calendario no se veía completo y el botón "Continuar" aparecía cortado, sin scroll posible para alcanzarlo.

**Causa real:** `numberOfMonths={2}` fuerza que react-multi-date-picker renderice dos meses lado a lado — cada mes tiene su propio mínimo de contenido interno que el `width:100% !important` del wrapper no logra comprimir. La tarjeta contenedora (`overflow:hidden`, pero sin ancho fijo propio) crecía para acomodar al calendario en vez de clipearlo, y el botón "Continuar" (`width:100%` de esa misma tarjeta) heredaba el mismo ancho de más, quedando fuera del viewport.

**Confirmado con una réplica exacta de la estructura real:** en un viewport de 390px, el calendario rendereaba a 429.59px (`right: 474.59`, fuera de pantalla). Con el fix: 300px, dentro del viewport.

**Fix:** `numberOfMonths` pasa a ser responsive — 1 mes en mobile (`≤640px`), 2 en desktop — vía `useState` + listener de `resize`. Arranca en 2 (igual que SSR) y se ajusta recién después de montar, para no generar un hydration mismatch (mismo patrón que el fix de hydration de esta misma sesión). Aplicado en `/espacio/[id]/reservar` y en `CalendarioDisponibilidad.tsx` (compartido por publicar y el modal de editar en `/panel`). No se tocó la navegación nativa de la librería (sigue prohibido usar `currentDate` para forzar mes o armar un carrusel propio).

**Commit:** `1a872f9`

---

## 🐛 Filtros de la home no se podían deslizar en mobile

**Síntoma:** la barra de filtros (País/Exclusivo/Compartido/Precio/Seguridad) parecía "fija" en mobile, sin responder a swipe.

**Causa real (confirmada con eventos táctiles reales vía CDP, no con mouse emulado):** la barra ya tenía `overflow-x:auto` y respondía bien a un swipe que empezara cerca de "País" — el problema era específicamente el slider de precio (`<input type="range">`): cualquier swipe que empezara sobre él quedaba capturado por el slider (le cambiaba el valor) en vez de scrollear el contenedor. Confirmado paso a paso: `scrollLeft` se movía con un swipe lejos del slider, se quedaba en 0 con un swipe sobre él.

**Fix:** en mobile, el slider inline se reemplaza por un botón que abre el mismo popover que ya usa la pastilla del header colapsado (reutilizando el estado `precioPillPos` existente) — un botón no le roba el gesto de swipe al contenedor, y un tap simple sigue abriendo el popover. Desktop no se tocó (sin el problema, ahí se usa mouse).

**Commit:** `6d260e8`

---

## 🐛 Código OTP de 6 dígitos desbordaba el modal en celulares chicos

**Causa real:** las 6 cajas (46px + `.5rem` de separación) necesitan 316px; en mobile el modal pasa a ser un bottom-sheet a `width:100%`, y con el padding del `modal-body` (1.5rem por lado) en pantallas de ~320-360px solo quedaban entre 270 y 312px disponibles.

**Fix:** dos breakpoints que achican cajas y separación en pantallas chicas (40px/.4rem bajo 480px, 34px/.3rem bajo 360px). Verificado con Playwright montando los componentes reales (`Modal` + `OTPStep`) sin overflow entre 320px y 414px de ancho — incluida una captura visual a 320px.

**Commit:** `7b1c7b8`

---

## 🎨 Grid de tarjetas — scrollbar oculta y flechas destacadas

- Scrollbar horizontal debajo de la fila 2 ocultada (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`), sin afectar el scroll real.
- Flechas de navegación pasaban desapercibidas (borde fino, blanco sobre blanco, 38px) → círculo naranja sólido de 44px con sombra, flecha blanca y hover. En el camino se descubrió (y descartó como falso positivo) que `next dev` no hidrata bien en este entorno por una restricción de CSP que bloquea `eval` — la lógica de habilitar/deshabilitar las flechas en sí ya funcionaba bien, confirmado con un build de producción real.

**Commit:** `34f01f3`

---

## 🌐 Portugués — cómo funciona, FAQ, legales y flujos sintéticos

1. **`comoFunciona.pasosReservar`** (pt.json) tenía solo 4 de los 5 pasos del español, y los existentes estaban desactualizados (sin mención de servicios adicionales, depósito en garantía, chat, PIN). Se completó.
2. **FAQ de la home** estaba hardcodeada en español directo en `page.tsx`, sin pasar por next-intl — un visitante en portugués la veía en español. Extraída a `home.faq` en `es.json`/`pt.json`.
3. **`/legales`** (17 secciones de Términos + 10 de Política de Privacidad) no tenía ningún soporte de idioma, 100% hardcodeado en español. Se separó en `ContenidoES()` (el JSX existente, sin tocar una palabra) y `ContenidoPT()` (traducción completa nueva), elegidos según `useLocale()` — cero riesgo sobre el texto legal ya en producción. Mismos anchors (`#disputas`, `#danos`, `#politica-privacidad`) en ambas versiones.
4. **Flujos sintéticos de la home** ("El flujo para hacer una reserva" / "El flujo para publicar tu espacio", los diagramas cortos con íconos debajo de las tarjetas) también estaban hardcodeados en español. Se separaron los íconos (quedan en `ComoFuncionaFlow.tsx`, como `ICONOS_RESERVAR`/`ICONOS_PUBLICAR`) de los textos (pasan a `home.flowReservarPasos`/`home.flowPublicarPasos`), combinados posicionalmente en `page.tsx`.

**Verificado en builds de producción reales:** las 27 secciones de legales presentes en portugués con los mismos anchors; FAQ y flujos correctos en `/es` y `/pt`.

⚠️ **Traducción hecha por IA** — recomendado que alguien la revise antes de darla por definitiva, especialmente el texto legal (así se acordó explícitamente al elegir el alcance de este trabajo).

**Commits:** `f19327d`, `0fc632e`

---

## 📄 Documentación viva — 5 documentos nuevos

Agregados e indexados en `docs/DATA-IMPORTANTE/INDEX.html`:

1. Referencia de comandos de Claude Code (built-in del CLI + skills del proyecto + comandos personalizados `.claude/commands/`).
2. Snapshot de stack y arquitectura actual, generado desde el propio Claude Code leyendo `CLAUDE.md` y `package.json`.
3. Análisis de escalado: "hoy vs. recomendaciones a futuro" para el escenario de 1000 publicaciones (500 compartidas + 500 exclusivas), con filosofía de gastar solo lo necesario.
4. Pitch para inversores con gancho y cierre, basado 100% en la funcionalidad end-to-end real (no aspiracional).
5. Guion de video de 90 segundos, escena por escena, con 7 visuales generados con la IA de Canva.

**Commits:** `a42bf24`…`13748fe`

---

## Otros cambios menores

- **Footer en mobile:** oculto en `/publicar`, `/panel`, `/reserva/*`, `/espacio/*` (le comía espacio a flujos críticos); reactivado en `/como-funciona` y `/legales` (páginas de contenido). Tablet/desktop sin cambios (siempre visible). **Commits:** `91cff91`, `7c9a02a`
- **FAQ de la home:** se simplificó la respuesta de cancelación, quitando "siempre antes de coordinar el acceso..." (la condición real ya está en `/legales`). **Commit:** `21e3fbd`

---

## Documentación actualizada en esta sesión

- `docs/novedades.md` — sección v1.15.0 agregada
- `docs/DATA-IMPORTANTE/TMC-documentacion-tecnica.html` — actualizado a v1.15.0, con las secciones v1.13.0, v1.14.0 y v1.15.0 agregadas al changelog (v1.13.0 y v1.14.0 habían quedado sin documentar ahí)
- `CLAUDE.md` — nuevas decisiones de arquitectura: calendario responsive, reglas de footer en mobile, semántica de "al menos un día libre" en disponibilidad, patrón de i18n de `/legales`
- Memoria persistente en `~/.claude/projects/-home-dellnotee/memory/`
