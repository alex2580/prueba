# TMC — Snapshot v1.11.0 (11 de Junio 2026)

Estado completo del proyecto al cierre de la sesión del 11 de junio de 2026.

---

## Versión y estado

- **Versión:** v1.11.0
- **Fecha:** 11 de junio de 2026
- **Último commit:** `c8d13c6`
- **Ambiente:** Producción en VPS Hostinger (`todasmiscosas.com`)

---

## Módulos en producción ✅

Todos los de v1.9.2 más:

### Consultas públicas — reconstruidas desde cero (v1.11.0)

El módulo de consultas públicas fue completamente eliminado y reescrito para resolver bugs históricos de triplicación de mensajes y 0 resultados en el panel del proveedor.

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| Consultas en publicaciones | Formulario + historial (últimas 5) en página de cada espacio | ✅ |
| Consultas pendientes — proveedor | Sección en Mi Cuenta con respuesta directa | ✅ |
| Historial respondidas — proveedor | Sección colapsable con el historial de respuestas | ✅ |
| Mis consultas — cliente | Sección en Mi Cuenta con estado de respuesta | ✅ |
| Admin — Consultas públicas | Nuevo tab ❓ con listado de todas las Q&As y eliminación | ✅ |
| Email al proveedor | `sendNuevaConsultaPublica` al recibir pregunta | ✅ |
| Email al cliente | `sendRespuestaConsultaPublica` al responder | ✅ |

#### Bugs resueltos en esta sesión

| Bug | Síntoma | Causa raíz | Solución |
|-----|---------|-----------|----------|
| Consultas triplicadas | La misma consulta aparecía 3 veces en el panel | JOIN entre tablas con distinto collation duplicaba filas | Reconstrucción completa del módulo |
| 0 resultados en sinResponder | Panel del proveedor mostraba "No hay consultas pendientes" aunque llegaran emails | JOIN entre `consultas_espacio` (utf8mb4_unicode_ci) y `espacios` (utf8mb4_0900_ai_ci) devuelve 0 filas sin importar COLLATE explícito | Eliminar todos los JOINs — usar dos queries separadas y merge en JS |
| Error 403 al responder | "No se pudo enviar la respuesta: No autorizado" | Comparación JS `espacio.oferente_id !== req.user.id` fallaba por tipo/encoding | Mover verificación a SQL: `WHERE id = ? AND oferente_id = ?` |

#### Arquitectura del controller (patrón definitivo)

```javascript
// ✅ CORRECTO — nunca JOIN directo entre consultas_espacio y espacios
const espacios = await query('SELECT id, nombre FROM espacios WHERE oferente_id = ?', [userId]);
const ids = espacios.map(e => e.id);
const consultas = await query(`SELECT ... FROM consultas_espacio WHERE espacio_id IN (${ids.map(()=>'?').join(',')})`, ids);
const nombrePorId = Object.fromEntries(espacios.map(e => [e.id, e.nombre]));
return consultas.map(c => ({ ...c, espacio_nombre: nombrePorId[c.espacio_id] }));

// ❌ INCORRECTO — cualquier variante de este JOIN devuelve 0 filas
JOIN espacios e ON e.id = c.espacio_id
JOIN espacios e ON e.id = c.espacio_id COLLATE utf8mb4_0900_ai_ci
```

#### Archivos del módulo

| Archivo | Rol |
|---------|-----|
| `backend/src/controllers/consultasEspacioController.js` | Controller con 8 funciones |
| `backend/src/routes/consultasEspacio.js` | 6 endpoints públicos y protegidos |
| `frontend/components/espacios/ConsultasEspacio.tsx` | Componente con prop `showHistorial` |
| `frontend/app/[locale]/panel/page.tsx` | Secciones proveedor + cliente |
| `frontend/app/[locale]/admin/page.tsx` | Tab `TabConsultasPublicas` |

#### Endpoints del módulo

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/espacios/:id/consultas` | — | Últimas 5 consultas públicas del espacio |
| POST | `/api/espacios/:id/consultas` | requireAuth | Crear nueva consulta |
| POST | `/api/consultas/:id/responder` | requireAuth | Responder (verifica ownership en SQL) |
| GET | `/api/consultas/mis-espacios` | requireAuth | Consultas pendientes del proveedor |
| GET | `/api/consultas/mis-espacios/respondidas` | requireAuth | Historial respondidas del proveedor |
| GET | `/api/consultas/mis-consultas` | requireAuth | Consultas hechas por el cliente |
| GET | `/api/admin/consultas-publicas` | requireAdmin | Todas las consultas (panel admin) |
| DELETE | `/api/admin/consultas-publicas/:id` | requireAdmin | Eliminar consulta desde admin |

### CI/CD — Self-hosted runner en VPS

| Cambio | Descripción |
|--------|-------------|
| GitHub Actions runner | Reemplaza deploy por SSH con runner instalado en VPS |
| Sin timeouts de red | El runner conecta OUT a GitHub, no requiere inbound SSH |
| Build en el VPS | `cd frontend && npm ci --prefer-offline && npm run build` |

```yaml
deploy:
  runs-on: self-hosted  # runner instalado en /opt/github-runner en el VPS
```

---

## Tabla de colaciones MySQL — reglas críticas

| Tabla | Colación | Notas |
|-------|---------|-------|
| `consultas_espacio` | utf8mb4_unicode_ci | Migración `fix-consultas-charset.js` del 7 jun |
| `espacios` | utf8mb4_0900_ai_ci | Default MySQL 8 |
| `usuarios` | utf8mb4_0900_ai_ci | Default MySQL 8 |

**Regla:** nunca JOIN entre `consultas_espacio` y cualquier otra tabla. Siempre dos queries + merge en JS.

---

## Migraciones en producción (acumulado)

| Migración | Fecha |
|-----------|-------|
| `add-consultas-espacio.js` | 7 jun 2026 |
| `fix-consultas-charset.js` | 7 jun 2026 |
| `add-movimientos-ledger.js` | 8 jun 2026 |
| `add-eliminado-por-oferente.js` | 8 jun 2026 |

> Sin migraciones pendientes al 11 jun 2026.

---

## Commits de esta sesión

| Commit | Descripción |
|--------|-------------|
| `5912783` | feat: remove consultas públicas feature completely |
| `6e86944` | feat: rebuild consultas públicas desde cero |
| `c27062c` | feat: remove consultas públicas from space detail page |
| `bc0a5ee` | feat: show consultas form on publications without history |
| `fd09634` | feat: show Q&A history on publications, display only first name |
| `42549d0` | fix: eliminate all JOINs in consultas controller |
| `b6bd971` | feat: limit public Q&A history to 5 per publication |
| `ab86adf` | feat: show only first name in proveedor consultas panel |
| `c8d13c6` | fix: move ownership check to SQL query in responder |
