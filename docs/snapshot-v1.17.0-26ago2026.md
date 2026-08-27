# TMC — Snapshot v1.17.0 (26 de Agosto 2026)

Estado completo del proyecto al cierre de la sesión de desarrollo del 26 de agosto de 2026. Cubre además el resumen de todo lo que quedó sin documentar entre el último snapshot (v1.15.0, 24 de junio) y hoy — `docs/novedades.md` no se había actualizado desde el 24 de julio.

---

## Versión y estado

- **Versión:** v1.17.0
- **Fecha:** 26 de agosto de 2026
- **Último commit de código:** `6340462`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Resumen de la sesión de hoy

Se implementó **comisión configurable por usuario**: reemplaza el 15% fijo (con `early_adopter` dando 0% temporal a quienes venían de la waitlist) por `usuarios.comision_pct`, gestionado desde un tab nuevo "💰 Comisiones" en `/admin` — tabla con usuario, espacios/reservas y % editable inline. El % se fija en `reservas.comision_pct_aplicado` al momento del pago, para que un ajuste posterior del admin no reabra reservas ya pagadas con un % distinto. Se dio de baja el mecanismo automático de `early_adopter` en `middleware/auth.js`; la migración hace backfill a 0% de quienes tenían la promo vigente para no cortarla a mitad de camino. Mismo feature implementado en paralelo en TME (ver su propio snapshot/CLAUDE.md).

**Migración pendiente en el VPS:** `node backend/src/db/add-comision-pct.js` (Guille).

Además se puso al día toda la documentación acumulada de las últimas ~9 semanas (ver abajo).

---

## 🔒 Verificación de identidad — Didit (26 ago)

Antes de publicar un espacio, el proveedor verifica su identidad: DNI + selfie con prueba de vida contra RENAPER, 100% en la infraestructura de Didit (TMC no guarda fotos ni datos del documento). Gate en `espaciosController.crear`, mismo patrón que el gate de Mercado Pago.

**Límite legal deliberado:** es verificación de identidad, no antecedentes penales (Ley 25.326 reserva esa consulta a autoridades públicas).

**Pendiente:** migración `add-didit-verificacion.js` + cuenta/workflow Didit + 4 env vars + webhook.

## 💳 Pago directo al proveedor — Mercado Pago Connect (26 ago)

El cobro sigue en custodia central de MP sin cambios. Cambia cómo se identifica al proveedor para la transferencia automática al liberar el escrow:

- Intento 1 (descartado, probado con plata real): alias de MP tipeado a mano → `401 Unauthorized use of live credentials` siempre.
- Intento 2 (actual): el proveedor conecta su cuenta por OAuth, igual que TME; identificado por `mp_user_id` real.
- Si falla o no conectó cuenta, cae al aviso manual de siempre sin romper el flujo.

**Pendiente:** migración `add-mp-connect.js` + 4 env vars + marcar la app de MP como Marketplace.

## 🏠 Home: carrusel de destacados + tagline rotativo (17 ago)

Carrusel full-bleed portado de TME (hasta 3 destacados, prioridad admin vía `destacado_admin` — pasado a tri-estado `NULL`/`1`/`0` — y relleno automático por `reservas_mes`). Tagline rotativo debajo del H1. Barra de filtros flotando sobre el carrusel.

## 📣 Campaña "Lo que no usás, rinde" (27 jul – 19 ago)

Segmento de captación de proveedores por intención de ingreso extra (no por datos crediticios — decisión explícita registrada en memoria). Doc de campaña con TAM, funnel y canales; calculadora de ingreso estimado ya construida y enlazada desde el flujo real de publicación. Meta: 15 proveedores.

## 📄 Documentación y research (jul–ago, sin efecto en producto)

Diagrama de arquitectura + modelo ER, mapa de documentación, guía completa de networking para Expo Real Estate Argentina 2026 (speech, agenda, 54 sponsors, demo poblado, resumen ejecutivo), kit de contenido LinkedIn multiplicado, propuesta de Sponsoreo VIP, 4 perfiles de "oficina virtual" (subagentes Claude Code), evaluaciones de Hermes Agent y DigitalPlat FreeDomain.

## 🔐 Fix de seguridad

`package-lock.json` del backend resincronizado + Next.js actualizado por una vulnerabilidad crítica reportada en su momento.

---

## Documentación actualizada en esta sesión

- `docs/novedades.md` — agregadas todas las secciones faltantes desde el 24 jul (comisión, Didit, MP Connect, carrusel/tagline, campaña ingreso extra, documentación/research, fix de seguridad)
- `docs/DATA-IMPORTANTE/TMC-documentacion-tecnica.html` — sección 13 (Servicios Externos) con Mercado Pago Connect y Didit; sección F (confirmación de acceso) actualizada para reflejar comisión variable y transferencia automática; endpoints `/admin/comisiones` agregados; changelog v1.17.0; tablas principales con las columnas nuevas
- `docs/DATA-IMPORTANTE/INDEX.html` — fecha de la entrada de documentación técnica actualizada
- `CLAUDE.md` — decisión de arquitectura de comisión por usuario + migración pendiente documentada
- Memoria persistente en `~/.claude/projects/-home-dellnotee/memory/`

## Pendientes que quedan abiertos

- Migraciones VPS: `add-comision-pct.js`, `add-didit-verificacion.js`, `add-mp-connect.js` (Guille)
- Cuenta/workflow de Didit + env vars (Alejandro)
- Confirmar transferencia real con MP Connect una vez cargadas las env vars
- Backup del VPS (dump de DB + archivos) — pendiente que Guille lo corra directamente en el servidor, no se puede hacer desde acá
