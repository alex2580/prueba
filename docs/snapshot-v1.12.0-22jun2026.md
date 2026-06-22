# TMC — Snapshot v1.12.0 (22 de Junio 2026)

Estado completo del proyecto al cierre de la sesión de desarrollo del 19 al 22 de junio de 2026.

---

## Versión y estado

- **Versión:** v1.12.0
- **Fecha:** 22 de junio de 2026
- **Último commit de código:** `c0114d5`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Resumen de la sesión

Sesión larga y muy iterativa, principalmente sobre la **home page**, el **calendario de disponibilidad/reserva** y un **bug de datos serio** en consultas públicas. La mayoría de los cambios se probaron en producción con un navegador headless (Playwright) antes de confirmarlos.

---

## 🐛 Bug de datos corregido: consultas públicas cruzadas entre espacios

**Síntoma:** una publicación nueva mostraba las preguntas públicas de otra publicación existente (ej. "Cochera").

**Causa real:** la columna `consultas_espacio.espacio_id` estaba como `int(11)` en producción en vez de `varchar(36)` (el tipo del UUID real). MySQL truncaba cada UUID a sus dígitos numéricos iniciales (o a `0` si arrancaba con letra), así que espacios con UUID parecido terminaban compartiendo el mismo `espacio_id` y por lo tanto las mismas consultas.

**Fix:** `backend/src/db/fix-consultas-espacio-id-type.js` — vació la tabla (los 12 registros viejos tenían el UUID ya truncado, irrecuperable) y corrigió la columna a `VARCHAR(36)`. Corrida directamente por Claude contra la DB de producción (acceso vía `.env` local). Validado insertando consultas de prueba para espacios con UUID arrancando en letra (antes colisionaban en `0`) y confirmando aislamiento correcto.

**Commit:** `52e14f8`

---

## 📅 Calendario de disponibilidad/reserva — rediseño con muchas iteraciones

Pedido inicial: mejorar la UX del calendario en publicar/editar/reservar. Se probaron varios enfoques en vivo:

1. Filtro de fechas estilo Airbnb en la home (nuevo) — `FiltroFechas.tsx`, popover con rango único.
2. 2 meses lado a lado sin navegación → el usuario pidió scroll vertical de hasta 3 meses → bug de header compartido (los 3 meses mostraban "Junio Julio Agosto" todos arriba, sin relación con su grilla).
3. Carrusel horizontal con 3 instancias de `<Cal numberOfMonths={1} currentDate={mes}>` → bug real de la librería: el cálculo interno de offset de slide-transition asume un ancho de mes mucho mayor al real cuando `currentDate` está lejos de "hoy", desbordando ~2459px dentro del contenedor.
4. **Solución final:** un solo `<Cal numberOfMonths={2}>` con las flechas nativas de `react-multi-date-picker` (sin ocultarlas). `minDate`/`maxDate` acotan la navegación de forma natural — no hace falta lógica de carrusel propia. Aplicado igual en publicar, editar (comparten `CalendarioDisponibilidad.tsx`) y reservar.

**Vigencia de publicaciones:** terminó en **90 días** (hubo idas y vueltas 60→90→60→90 durante la sesión). Recalculado en producción el `fecha_vencimiento` de los espacios activos existentes.

**Commits clave:** `08fe410`, `d0daa6b`, `70e764c`, `9ee2c0f`, `754e88b`, `964d75e`, `d5f88a1`, `8237c77`, `d1a4563`, `2a0fff5`, `8c83cb3`, `a359cdf`, `3614906`, `2026657`, `862f46a`

---

## 🏠 Home page — reestructuración completa

Estructura final, de arriba a abajo:

1. `SiteHeader` (botón "Publica gratis", antes "Publicar espacio")
2. Buscador + selector de fechas — colapsa a una pastilla compacta al hacer scroll (con histéresis para no titilar), expandible de nuevo con un click
3. Hero "Guardá lo que querés / Donde querés" — reubicado desde la página Cómo Funciona (reusa las mismas keys de i18n)
4. Fila de filtros (País, Exclusivo/Compartido, Precio, Seguridad) — **desacoplada** del header colapsable, sección fija y centrada
5. Grid de tarjetas — 2 filas fijas × 5 columnas, scroll/flechas horizontales para más resultados; posicionamiento explícito (`gridRow`/`gridColumn`) para que la fila 1 se llene completa antes de la fila 2
6. Botón "Publicar mi espacio"
7. Sección "Preguntas frecuentes" (acordeón, 5 preguntas nuevas)

**Fix adicional:** el botón "← Volver" de una publicación perdía los filtros activos de la home al volver. Causa: `router.push` de Next.js reutilizaba una instancia cacheada de la home sin releer el querystring nuevo. Fix: `window.location.href` (navegación dura) en vez de `router.push` para ese botón específico — ver memoria `feedback-nextjs-router-push-cache`.

**Commits clave:** `8d08cf9`, `f0a463f`, `5427fa2`, `20ab312`, `e1c586c`, `6b510a9`, `c1a5dc3`, `f39337f`, `c0f24d1`, `4613ea2`, `dc6050d`, `dea107f`, `2d18d04`, `b919776`, `f33d38c`, `c0114d5`

---

## Otros fixes de la sesión

| Área | Cambio | Commit |
|---|---|---|
| Filtro de precio | `precio_max=0` no se enviaba al backend (`if (filtros.precio_max)` descartaba el `0` por falsy) | `e6e748c` |
| Mapa | POI nativos de Google (aeropuerto, cementerio, etc.) se confundían visualmente con los pines de publicaciones en modo claro | `9e7d498` |
| Legales | Links de Política de Privacidad en modales de reserva/publicar apuntaban a `/legales` sin anchor ni `/es/` | `eb3962f` |
| Listado home | Compartidos sin cupo solo se excluían si se filtraba explícitamente por tipo — ahora siempre | `89fced3` |
| Modal Editar espacio | Quitado campo Superficie (ya se había quitado de publicar, no de editar); Precio junto a Moneda; calendario 2 meses lado a lado | `e90dc0e` |
| Cómo Funciona | Texto del paso "Elegís y reservás" actualizado (sin alquiler por mes, sin "limpieza", con mención a "Me arrepentí") | `7ead994` |

---

## Migraciones en producción (acumulado)

| Migración | Fecha |
|-----------|-------|
| `add-consultas-espacio.js` | 7 jun 2026 |
| `fix-consultas-charset.js` | 7 jun 2026 |
| `add-movimientos-ledger.js` | 8 jun 2026 |
| `add-eliminado-por-oferente.js` | 8 jun 2026 |
| `fix-consultas-espacio-id-type.js` | 20 jun 2026 (corrida directo por Claude, no por Guille) |

> Sin migraciones pendientes al 22 jun 2026.

---

## Pendiente / a confirmar con Guille

- Backup de DB + archivos del VPS (no lo puede correr Claude — requiere clave SSH que solo tiene Guille).
- Revisar que la corrección directa de `fecha_vencimiento` (UPDATE manual a +90 días) quedó reflejada también en cualquier backup/dump que Guille mantenga aparte.

---

## Commits de esta sesión (código, orden cronológico)

```
9d03044 4cafc7f 81f7c5c 7e86b75 fe6d947 ec5ad40 f10e9b6 18c423e 118e81c
def8c56 6e46979 1cdf5f5 196814d eb112e7 92f6325 d88fd19 dd9d822 cc0366e
292e288 a361f86 d599c1f 35143f0 547aa7b a9b95b5 2678bb2 65b4968 c560b8d
93d6f1d 604837a d6d7b47 7cee845 07c405b b4d7382 40d4648 08fe410 d0daa6b
70e764c 9ee2c0f 754e88b 964d75e e6e748c 8d08cf9 f0a463f 5427fa2 9e7d498
eb3962f 89fced3 e90dc0e 8bd1930 7ead994 52e14f8 d5f88a1 8237c77 d1a4563
2a0fff5 8c83cb3 a359cdf 3614906 2026657 20ab312 e1c586c 6b510a9 c1a5dc3
f39337f c0f24d1 4613ea2 dc6050d dea107f 2d18d04 b919776 862f46a f33d38c
c0114d5
```
