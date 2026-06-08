# TMC — Snapshot: Flujo de Consultas Públicas
## ✅ FLUJO COMPLETO Y FUNCIONANDO — 7 de Junio de 2026 — 17:30 hs (GMT-3, Buenos Aires)

---

## Estado del flujo

El flujo de consultas públicas en publicaciones está **100% operativo en producción** desde las **17:30 hs del 7 de junio de 2026**.

Commits incluidos (en orden):
- `ac328bb` — fix collations iniciales
- `436fec5` — fix JOIN en crear + feedback al usuario
- `fff7c9e` — CSS inline en emails (Gmail dark mode)
- `cae0f61` — remove COLLATE utf8mb4_bin en sinResponder
- `63a247d` — fix cross-charset JOIN en responder (query separada para autor)
- `f4eb85e` — prefijo /es/ en link email
- `eefef10` — historial Q&A en panel + fix link email usa e.id
- `5590c69` — renombrar "Respuesta del oferente" → "Respuesta del proveedor"

---

## Qué hace el flujo

1. **Cliente** ve una publicación y hace una pregunta en la sección "💬 Consultas sobre este espacio"
2. **Proveedor** recibe email de aviso con link a su panel (`/panel`)
3. **Proveedor** responde desde "❓ Consultas pendientes" en su dashboard
4. **Cliente** recibe email con la respuesta y link a la publicación (`/es/espacio/:id`)
5. La pregunta + respuesta queda visible públicamente en la publicación
6. **Proveedor** puede ver el hilo completo (pregunta + su respuesta) en "💬 Consultas respondidas" de su panel

---

## Migraciones DB corridas en producción (VPS)

```bash
# 1. Crea la tabla consultas_espacio
node src/db/add-consultas-espacio.js
# Output esperado: ✅ consultas_espacio OK

# 2. Corrige charset de la tabla a utf8mb4
node src/db/fix-consultas-charset.js
# Output esperado: ✅ consultas_espacio charset → utf8mb4
```

---

## Esquema de la tabla

```sql
CREATE TABLE consultas_espacio (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  espacio_id   VARCHAR(36)  NOT NULL,
  autor_id     VARCHAR(36)  NOT NULL,
  autor_nombre VARCHAR(120) NOT NULL,
  pregunta     TEXT         NOT NULL,
  respuesta    TEXT         NULL,
  respuesta_at DATETIME     NULL,
  created_at   DATETIME     DEFAULT NOW(),
  INDEX idx_espacio (espacio_id),
  FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Endpoints API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/espacios/:id/consultas` | pública | Lista consultas de una publicación |
| POST | `/api/espacios/:id/consultas` | requireAuth | Cliente crea una consulta |
| POST | `/api/consultas/:id/responder` | requireAuth | Proveedor responde una consulta |
| GET | `/api/consultas/mis-espacios` | requireAuth | Consultas sin responder del proveedor |
| GET | `/api/consultas/mis-espacios/respondidas` | requireAuth | Historial Q&A del proveedor (últimas 50) |

---

## Archivos del flujo

### Backend

**`backend/src/controllers/consultasEspacioController.js`** — código completo al cierre:

```javascript
const { query, queryOne } = require('../db/connection');
const { sendNuevaConsultaPublica, sendRespuestaConsultaPublica } = require('../services/emailService');

async function listar(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio
       WHERE espacio_id = ?
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { pregunta } = req.body;
    if (!pregunta?.trim()) return res.status(400).json({ error: 'La pregunta no puede estar vacía' });

    const espacio = await queryOne(
      `SELECT e.id, e.nombre, e.oferente_id, u.nombre AS oferente_nombre, u.email AS oferente_email
       FROM espacios e
       JOIN usuarios u ON e.oferente_id COLLATE utf8mb4_bin = u.id COLLATE utf8mb4_bin
       WHERE e.id = ? AND e.activo = TRUE`,
      [req.params.id]
    );
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    if (espacio.oferente_id === req.user.id) return res.status(400).json({ error: 'No podés consultar tu propio espacio' });

    const autorNombre = req.user.nombre?.split(' ')[0] || 'Usuario';
    await query(
      `INSERT INTO consultas_espacio (espacio_id, autor_id, autor_nombre, pregunta) VALUES (?, ?, ?, ?)`,
      [req.params.id, req.user.id, autorNombre, pregunta.trim()]
    );

    const nueva = await queryOne(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at
       FROM consultas_espacio WHERE espacio_id = ? AND autor_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.id, req.user.id]
    );

    sendNuevaConsultaPublica(espacio.oferente_email, espacio.oferente_nombre, {
      autorNombre, espacioNombre: espacio.nombre, pregunta: pregunta.trim(), espacioId: espacio.id,
    }).catch(() => {});

    res.status(201).json(nueva);
  } catch (err) { next(err); }
}

async function responder(req, res, next) {
  try {
    const { respuesta } = req.body;
    if (!respuesta?.trim()) return res.status(400).json({ error: 'La respuesta no puede estar vacía' });

    // IMPORTANTE: usar e.id (no c.espacio_id) para evitar diferencia de charset entre tablas
    const consulta = await queryOne(
      `SELECT c.id, c.pregunta, c.autor_id,
              e.id AS espacio_id, e.nombre AS espacio_nombre, e.oferente_id
       FROM consultas_espacio c
       JOIN espacios e ON c.espacio_id = e.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
    if (consulta.oferente_id !== req.user.id) return res.status(403).json({ error: 'Solo el oferente puede responder' });

    await query(
      `UPDATE consultas_espacio SET respuesta = ?, respuesta_at = NOW() WHERE id = ?`,
      [respuesta.trim(), req.params.id]
    );

    const actualizada = await queryOne(
      `SELECT id, autor_nombre, pregunta, respuesta, respuesta_at, created_at FROM consultas_espacio WHERE id = ?`,
      [req.params.id]
    );

    // Query separada para el autor — evita mix de collations entre tablas
    const autor = await queryOne('SELECT nombre, email FROM usuarios WHERE id = ?', [consulta.autor_id]);
    if (autor?.email) {
      sendRespuestaConsultaPublica(autor.email, autor.nombre, {
        espacioNombre: consulta.espacio_nombre, pregunta: consulta.pregunta,
        respuesta: respuesta.trim(), espacioId: consulta.espacio_id,
      }).catch(() => {});
    }

    res.json(actualizada);
  } catch (err) { next(err); }
}

async function sinResponder(req, res, next) {
  try {
    const rows = await query(
      `SELECT c.id, c.espacio_id, e.nombre AS espacio_nombre,
              c.autor_nombre, c.pregunta, c.created_at
       FROM consultas_espacio c
       JOIN espacios e ON c.espacio_id = e.id
       WHERE e.oferente_id = ? AND c.respuesta IS NULL
       ORDER BY c.created_at ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function consultasRespondidas(req, res, next) {
  try {
    const rows = await query(
      `SELECT c.id, e.nombre AS espacio_nombre,
              c.autor_nombre, c.pregunta, c.respuesta, c.respuesta_at, c.created_at
       FROM consultas_espacio c
       JOIN espacios e ON c.espacio_id = e.id
       WHERE e.oferente_id = ? AND c.respuesta IS NOT NULL
       ORDER BY c.respuesta_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

module.exports = { listar, crear, responder, sinResponder, consultasRespondidas };
```

**`backend/src/routes/consultasEspacio.js`** — código completo:

```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { rejectContactInfo } = require('../middleware/contactFilter');
const { listar, crear, responder, sinResponder, consultasRespondidas } = require('../controllers/consultasEspacioController');

router.get('/espacios/:id/consultas', listar);
router.post('/espacios/:id/consultas', requireAuth, rejectContactInfo, crear);
router.post('/consultas/:id/responder', requireAuth, rejectContactInfo, responder);
router.get('/consultas/mis-espacios', requireAuth, sinResponder);
router.get('/consultas/mis-espacios/respondidas', requireAuth, consultasRespondidas);

module.exports = router;
```

### Frontend

**`frontend/components/espacios/ConsultasEspacio.tsx`** — componente público en la publicación (código completo guardado en el repo, commit `5590c69`). Puntos clave:
- Texto: "Respuesta del proveedor" (NO "del oferente")
- Texto: "El proveedor recibirá una notificación por email" al enviar
- Filtro de contenido aplicado en onChange y onSubmit

**`frontend/app/[locale]/panel/page.tsx`** — secciones del proveedor:
- "❓ Consultas pendientes" → consultas sin responder, con textarea para responder
- "💬 Consultas respondidas" → historial Q&A, se abre automáticamente al responder

---

## Bugs resueltos (NO repetir estos errores)

### 1. COLLATE utf8mb4_bin en JOINs con consultas_espacio

**Problema:** La tabla `consultas_espacio` se creó sin `DEFAULT CHARSET=utf8mb4`. En el MySQL de Hostinger quedó con un charset diferente. Usar `COLLATE utf8mb4_bin` explícito en JOINs entre esta tabla y otras (`espacios`, `usuarios`) causa error silencioso (retorna 0 filas) o error fatal según la operación.

**Regla:** En cualquier query que involucre `consultas_espacio`:
- ✅ JOINs simples sin COLLATE: `JOIN espacios e ON c.espacio_id = e.id`
- ✅ Queries separadas con WHERE para cruzar datos de `usuarios`: `SELECT ... FROM usuarios WHERE id = ?`
- ❌ NUNCA: `JOIN usuarios u ON c.autor_id COLLATE utf8mb4_bin = u.id COLLATE utf8mb4_bin`

### 2. Email link sin prefijo de locale

**Problema:** Link `/espacio/:id` sin `/es/` falla con next-intl v4. La tabla `consultas_espacio` tiene `c.espacio_id` que puede diferir del `e.id` de `espacios` por charset. Usar siempre `e.id` del JOIN.

**Regla:** Links de email que apuntan a publicaciones: `${FRONTEND_URL}/es/espacio/${e.id}` (e.id del JOIN con espacios, no c.espacio_id de consultas_espacio).

### 3. COLLATE utf8mb4_bin en crear — sí funciona

En `crear`, el JOIN `espacios JOIN usuarios ON e.oferente_id COLLATE utf8mb4_bin = u.id COLLATE utf8mb4_bin` **sí funciona** porque ambas tablas tienen charset utf8mb4. El COLLATE problemático es cuando se involucra `consultas_espacio`.

---

## Emails relacionados al flujo

En `backend/src/services/emailService.js`:
- `sendNuevaConsultaPublica` → al proveedor cuando llega una consulta (link a `/panel`)
- `sendRespuestaConsultaPublica` → al cliente cuando el proveedor responde (link a `/es/espacio/:id`)
