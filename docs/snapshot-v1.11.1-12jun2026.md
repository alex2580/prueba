# TMC — Snapshot v1.11.1 (12 de Junio 2026)

Estado completo del proyecto al cierre de la sesión del 12 de junio de 2026.

---

## Versión y estado

- **Versión:** v1.11.1
- **Fecha:** 12 de junio de 2026
- **Últimos commits:** `2af83a3` (chat fix), `63fde33` (fotos UX)
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## 🏆 Hito histórico — pruebas E2E completas

Durante los días 11 y 12 de junio de 2026 se realizaron las primeras pruebas end-to-end exhaustivas del producto completo en producción. **Todo el flujo funcionó a la perfección.**

| Área | Resultado |
|------|-----------|
| Reservas exclusivas (calendario, bloqueo de fechas) | ✅ |
| Reservas compartidas (cupo, múltiples clientes) | ✅ |
| Emails en todos los estados del flujo | ✅ |
| Escrow (retención → confirmación → liberación) | ✅ |
| Chat (apertura y cierre por rol) | ✅ |
| Consultas públicas Q&A | ✅ |
| Panel proveedor | ✅ |
| Panel cliente | ✅ |
| Panel admin (todas las tabs) | ✅ |

**El MVP está validado. Listo para lanzamiento comercial.**

---

## Cambios de esta sesión (12 jun 2026)

### Fix: chat del cliente al liberar escrow

| Archivo | Cambio |
|---------|--------|
| `backend/src/controllers/chatController.js` | `listarConversaciones`: unificó condición `WHERE` para que ambos roles (cliente y proveedor) dejen de ver el chat al liberar el escrow. Antes solo el proveedor tenía el filtro `escrow_liberado = 0`. |

**Commit:** `2af83a3`

### Feat: aviso UX en selector de fotos de /publicar

| Archivo | Cambio |
|---------|--------|
| `frontend/app/[locale]/publicar/page.tsx` | Texto en naranja advierte que hay que seleccionar todas las fotos juntas (hasta 5) de una sola vez, antes de subir. |

**Commit:** `63fde33`

---

## Módulos en producción ✅

Todos los de v1.11.0 más los fixes anteriores. Ver snapshot-v1.11.0-11jun2026.md para el detalle completo.

### Resumen del ciclo de vida del chat (definitivo tras v1.11.1)

```
Reserva confirmada  → chat se habilita (ambos roles)
Escrow liberado     → chat desaparece (ambos roles simultáneamente)
```

**Implementación:** `chatController.listarConversaciones` — WHERE unificado con EXISTS + escrow_liberado = 0 para cliente y proveedor.

---

## Migraciones en producción (acumulado)

| Migración | Fecha |
|-----------|-------|
| `add-consultas-espacio.js` | 7 jun 2026 |
| `fix-consultas-charset.js` | 7 jun 2026 |
| `add-movimientos-ledger.js` | 8 jun 2026 |
| `add-eliminado-por-oferente.js` | 8 jun 2026 |

> Sin migraciones pendientes al 12 jun 2026.

---

## Commits de esta sesión

| Commit | Descripción |
|--------|-------------|
| `2af83a3` | fix: cerrar chat para el cliente al liberar escrow |
| `63fde33` | feat: aviso UX en selector de fotos de /publicar |
