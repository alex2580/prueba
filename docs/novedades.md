# TodasMisCosas — Registro de Novedades

Documento interno de seguimiento de funcionalidades implementadas.
Se actualiza con cada nueva mejora incorporada al producto.

---

## 🔴🔴🔴 PENDIENTE — ACCIONES REQUERIDAS 🔴🔴🔴

> ### ⚠️ ESTAS TAREAS ESTÁN INCOMPLETAS Y BLOQUEAN FUNCIONALIDADES EN PRODUCCIÓN
>
> ---
>
> #### 🔐 2FA / OTP — Variables Twilio sin configurar en VPS
>
> El sistema de autenticación en dos pasos está implementado pero el envío de SMS y WhatsApp **no funciona en producción** hasta agregar estas 4 variables al archivo `.env` del backend en el VPS:
>
> ```
> TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
> TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
> TWILIO_PHONE=+15551234567
> TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
> ```
>
> **Pasos para activar:**
> 1. Crear cuenta en https://twilio.com (tiene crédito gratis para testing)
> 2. Ir a Console → Account Info → copiar `Account SID` y `Auth Token`
> 3. Comprar un número de teléfono SMS en Twilio (sección Phone Numbers)
> 4. Activar el Sandbox de WhatsApp en Twilio → Messaging → Try it out → WhatsApp
> 5. SSH al VPS → editar `/var/www/todasmiscosas/backend/.env` → agregar las 4 variables
> 6. Reiniciar el proceso: `pm2 restart tmc-backend`
> 7. Probar login desde la app y verificar que llega el código por SMS y WhatsApp
>
> **Mientras tanto:** el OTP por email funciona normalmente desde el primer deploy.
>
> **Reminder agendado:** Google Calendar — Sábado 23/05/2026 15:00 hs Argentina (Ale + Guille + contacto)
>
> ---
>
> #### 🛠️ PRÓXIMAS FUNCIONALIDADES A IMPLEMENTAR (backlog)
>
> Las siguientes mejoras fueron identificadas pero aún no están desarrolladas:
>
> | # | Funcionalidad | Descripción |
> |---|--------------|-------------|
> | A | **Edición de perfil — teléfono y nombre** | Permitir al usuario actualizar su número de celular (clave para el 2FA) y nombre desde el panel. Incluye validación de formato de teléfono y re-sincronización con Supabase Auth. |
> | B | **Edición de perfil — dirección física** | Actualizar la dirección del perfil con autocompletado de Google Maps. Ya existe el campo en DB; falta UI de edición más robusta y confirmación. |
> | C | **Baja automática de publicaciones inactivas** | Desactivar espacios que lleven más de 90 días sin recibir ninguna reserva (configurable). Cron job diario que cambia `activo = false` y notifica al oferente por email con opción de reactivar. |
> | D | **Historial de cambios de perfil** | Log de auditoría que registra cuándo el usuario cambió su nombre, teléfono o dirección. Útil para soporte y seguridad. |
> | E | **Verificación de nuevo teléfono por OTP** | Al cambiar el número de celular, enviar un OTP al nuevo número para confirmar que es válido antes de guardarlo. |
> | F | **Reactivación de publicaciones** | Botón en el panel del oferente para reactivar un espacio dado de baja por inactividad, con confirmación de disponibilidad actualizada. |

---

## Stack Técnico Actual

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React, TypeScript |
| Backend | Node.js, Express |
| Base de datos | MySQL |
| Autenticación | Supabase Auth |
| Hosting | VPS Hostinger |
| Deploy | GitHub Actions → SSH → deploy.sh |
| Proceso | PM2 (`tmc-backend`) |
| Mapas | Google Maps JS API |
| Pagos | MercadoPago (Checkout Pro + QR) |
| Emails | Resend (SMTP) via Nodemailer |

**URL producción:** https://todasmiscosas.com
**Repositorio:** github.com/alex2580/prueba (privado)

> Nota: existe un archivo `CLAUDE.md` viejo en la carpeta raíz que describe una versión anterior del proyecto (single HTML file + localStorage + vanilla JS). Ese archivo está desactualizado y puede ignorarse. El stack real es el descripto en esta tabla.

---

## 22 de Mayo 2026

### Notificaciones por Email — Nivel 1

Se implementaron emails automáticos en cada cambio de estado de una reserva.

| Evento | Quién recibe |
|--------|-------------|
| Se crea una reserva | Oferente recibe "Nueva solicitud" con datos del demandante y teléfono |
| Oferente confirma | Demandante recibe "Tu reserva fue aprobada" con link al pago |
| Se cancela (por cualquiera) | Ambos reciben "Reserva cancelada" indicando quién canceló |
| Pago aprobado por MercadoPago | Oferente recibe "Pago recibido por tu espacio" |
| Reserva finalizada | Demandante recibe invitación a dejar reseña |

Archivos modificados: `backend/src/services/emailService.js`, `backend/src/controllers/reservasController.js`, `backend/src/controllers/pagosController.js`

#### Detalle de cada email

Todos los emails comparten el mismo diseño: fondo azul marino oscuro, logo naranja de TMC, filas de datos con etiqueta gris y valor blanco, botón naranja con link a la plataforma, y footer con "TodasMisCosas.com — Buenos Aires".

| # | Asunto | Para | Datos incluidos |
|---|--------|------|-----------------|
| 1 | ✅ Reserva confirmada | Demandante | Espacio, fechas, total, link al checkout |
| 2 | 🔔 Nueva reserva | Oferente | Nombre y teléfono del demandante, espacio, fechas, monto estimado |
| 3 | ✅ Reserva aprobada | Demandante | Espacio, fechas, total a pagar, link al pago |
| 4 | 💳 Pago confirmado | Demandante | Espacio, monto, número de pago MercadoPago |
| 5 | 💰 Pago recibido | Oferente | Nombre del inquilino, espacio, monto acreditado |
| 6 | ❌ Reserva cancelada | Ambos | Espacio, fechas, quién canceló (demandante u oferente) |
| 7 | 🏁 Estadía finalizada | Demandante | Espacio, invitación a dejar reseña con link al panel |

Preview visual disponible en: `docs/email-previews.html` (abrir en navegador)

Flujograma completo del circuito de reservas: `docs/flujo-reservas.html` (abrir en navegador)

---

### Timeline Visual de Reservas — Nivel 2

Se agregó una barra de progreso visual en cada tarjeta de reserva del panel, tanto para oferente como demandante.

```
📋 Solicitada → ✅ Confirmada → 💳 Pago realizado → 🏠 Activa
```

- Pasos completados en verde (mint)
- Paso actual resaltado en naranja con descripción
- Barra de progreso animada que conecta los pasos
- Si está cancelada, el timeline no se muestra
- Si está finalizada, muestra mensaje de cierre

Archivos: `frontend/components/reservas/TimelineReserva.tsx`, `frontend/components/reservas/EstadoReserva.tsx`

---

### Pago por QR con MercadoPago

Se agregó una segunda opción de pago en el paso 3 del flujo de reserva.

- El usuario elige entre "Pagar online" (redirección a MP) o "Pagar por QR"
- Al elegir QR: se genera el código QR del `init_point` de MercadoPago
- La pantalla hace polling cada 4 segundos hasta confirmar el pago
- Redirige automáticamente a la confirmación cuando MP aprueba

Archivos: `frontend/app/espacio/[id]/reservar/page.tsx`

---

### Sistema de Reseñas y Calificaciones

**Para demandantes (quienes alquilan):**
- Botón "⭐ Calificar espacio" aparece en reservas con estado `pagada` o `finalizada`
- Modal con selector de estrellas (1 a 5) + campo de comentario opcional
- Etiquetas descriptivas: Muy malo / Malo / Regular / Bueno / Excelente

**Para oferentes (quienes publican):**
- El checklist de seguridad (8 ítems con estrellas) ahora está disponible en el modal de edición del panel
- Los cambios se guardan junto con los demás datos del espacio

**En el mapa:**
- El popup de cada espacio muestra las estrellas de calificación si tiene reseñas

Archivos: `frontend/app/panel/page.tsx`, `frontend/components/reservas/EstadoReserva.tsx`, `frontend/components/mapa/MarkerEspacio.tsx`, `frontend/components/publicar/SeguridadChecklist.tsx`

---

### Selector de Moneda en Publicaciones

Los oferentes pueden elegir la moneda al publicar o editar un espacio: ARS, USD, EUR, BRL, MXN, UYU, CLP, COP.

---

### Perfil de Usuario con Dirección y Autoubicación

- El perfil de usuario acepta dirección con autocompletado de Google Maps
- Al iniciar sesión, el mapa se centra automáticamente en la dirección guardada

---

### Marcadores del Mapa Rediseñados

- Forma de pin (burbuja + punta triangular)
- Azul para espacios exclusivos, naranja para compartidos
- Muestra el precio en la moneda seleccionada por el oferente
- Marcador verde para la ubicación del usuario logueado

---

### Botón Filtros

- Reubicado a la derecha del mapa
- Color pastel azul cielo, vira a naranja cuando hay filtros activos
- El panel se despliega al pasar el mouse por encima (hover)

---

---

## 23 de Mayo 2026

### Recordatorios de Vencimiento de Reserva — Emails 8a/8b/8c/8d

Se implementó un sistema automático de alertas por email que avisa al demandante cuando su reserva está próxima a vencer, con cuatro mensajes distintos según la urgencia.

| # | Cuándo se envía | Asunto | Contenido |
|---|-----------------|--------|-----------|
| 8a | 5 días antes del vencimiento | ⏰ Tu reserva vence en 5 días | Espacio, fecha de vencimiento, botón "Extender mi reserva" |
| 8b | 2 días antes del vencimiento | ⚡ Tu reserva vence en 2 días | Ídem, tono más urgente |
| 8c | 1 día antes del vencimiento | 🚨 Tu reserva vence mañana | Ídem, máxima urgencia |
| 8d | El día del vencimiento | 🔔 Hoy finaliza tu reserva | Aviso de último día + CTA de extensión |

**Mecanismo técnico:**
- Se usa `node-cron` dentro del proceso del backend (sin procesos externos)
- El cron corre todos los días a las **09:00 hs Argentina** (`America/Argentina/Buenos_Aires`)
- Consulta reservas con `estado='pagada'` cuya `fecha_hasta` coincide con la fecha objetivo
- Usa 4 columnas booleanas en la tabla `reservas` (`recordatorio_5d`, `recordatorio_2d`, `recordatorio_1d`, `recordatorio_0d`) para garantizar que cada email se envíe **una sola vez**
- Si la reserva se extiende, las 4 columnas se resetean a 0 y los recordatorios se reenvían respecto a la nueva fecha

Archivos: `backend/src/jobs/recordatorios.js` (nuevo), `backend/src/services/emailService.js`, `backend/src/app.js`

---

### Sistema de Extensión de Reservas

El demandante puede prorrogar su reserva pagada antes de que venza, sin interrumpir el uso del espacio.

#### Flujo completo

```
Panel → botón "📅 Extender reserva"
      → Modal: elige nueva fecha de vencimiento
      → Backend calcula días adicionales y precio
      → Crea preferencia MercadoPago para el monto de la extensión
      → Usuario paga en MP (Checkout Pro)
      → Webhook recibe confirmación → actualiza fecha_hasta en la reserva
      → Resetea recordatorios → Email "✅ Extensión confirmada" al demandante
```

#### Detalle técnico

- **Endpoint:** `POST /api/reservas/:id/extender` (solo reservas con `estado='pagada'`)
- **Validaciones:** la nueva fecha debe ser posterior a la actual; no puede haber solapamiento con otra reserva del mismo espacio en ese período
- **Precio:** se calcula igual que la reserva original (precio por día o precio mensual si son ≥28 días adicionales)
- **Diferenciación en webhook:** las preferencias de extensión usan `external_reference = "ext_<extensionId>"` y `metadata.tipo = "extension"`, permitiendo que el webhook las procese por separado de los pagos normales
- **Historial:** cada extensión queda registrada en la tabla `reserva_extensiones` con su estado (`pendiente` / `pagada` / `cancelada`)

#### Email adicional

| # | Asunto | Para | Datos incluidos |
|---|--------|------|-----------------|
| 9 | ✅ Extensión confirmada | Demandante | Espacio, vencimiento anterior, nuevo vencimiento, monto pagado |

#### Cambios en base de datos (se aplican automáticamente en cada deploy)

```sql
-- En tabla reservas:
recordatorio_5d TINYINT(1) DEFAULT 0
recordatorio_2d TINYINT(1) DEFAULT 0
recordatorio_1d TINYINT(1) DEFAULT 0
recordatorio_0d TINYINT(1) DEFAULT 0

-- Nueva tabla:
CREATE TABLE reserva_extensiones (
  id                VARCHAR(36) PRIMARY KEY,
  reserva_id        VARCHAR(36),
  nueva_fecha_hasta DATE,
  precio            DECIMAL(10,2),
  mp_preference_id  VARCHAR(200),
  mp_payment_id     VARCHAR(200),
  mp_status         VARCHAR(50),
  estado            ENUM('pendiente','pagada','cancelada'),
  created_at        DATETIME
)
```

Archivos modificados:
- `backend/src/db/add-recordatorios-extensiones.js` (nuevo — migración idempotente)
- `backend/src/jobs/recordatorios.js` (nuevo — cron job)
- `backend/src/services/emailService.js` (funciones: `sendRecordatorio5/2/1/0Dias`, `sendExtensionConfirmada`)
- `backend/src/services/mercadopagoService.js` (función: `crearPreferenciaExtension`)
- `backend/src/controllers/reservasController.js` (función: `extender`)
- `backend/src/controllers/pagosController.js` (webhook actualizado para detectar extensiones)
- `backend/src/routes/reservas.js` (ruta: `POST /:id/extender`)
- `backend/src/app.js` (inicialización del cron al arrancar)
- `frontend/components/reservas/EstadoReserva.tsx` (prop `onExtender`, botón "📅 Extender reserva")
- `frontend/app/panel/page.tsx` (modal de extensión con selector de fecha + redirect a MP)
- `.github/workflows/deploy.yml` (agrega migración al pipeline)

Preview visual de todos los emails (incluyendo 8a–8d y #9): `docs/email-previews.html` (abrir en navegador)

Flujograma del circuito actualizado con recordatorios y extensión: `docs/flujo-reservas.html` (abrir en navegador)

---

---

### Sistema de Bloqueo de Usuarios

Los administradores pueden suspender cuentas de oferentes y demandantes que abusen de la plataforma, con registro de auditoría completo y notificación automática al afectado.

#### Acceso

Panel de administración (`/admin`) → tab **👤 Usuarios**

#### Funcionalidades

**Listado y búsqueda:**
- Buscador por nombre o email
- Filtro por tipo: Oferente / Demandante / Admin
- Filtro por estado: Activos / Bloqueados
- Cada tarjeta muestra: nombre, email, tipo, conteo de espacios publicados, conteo de reservas, fecha de alta, y si está bloqueado: el motivo

**Bloquear un usuario:**
1. Click en **⛔ Bloquear**
2. Seleccionar un motivo rápido (6 predefinidos) o escribir uno libre
3. El sistema desactiva la cuenta, registra quién bloqueó, cuándo y por qué
4. El usuario recibe un email automático con el motivo
5. En el próximo intento de uso de la API, recibe el mensaje: *"Tu cuenta fue suspendida. Motivo: [X]. Contactanos en contacto@todasmiscosas.com"*

**Motivos rápidos predefinidos:**
- Actividad fraudulenta detectada
- Usufructo de la plataforma sin contraprestación
- Datos falsos o identidad no verificable
- Conducta abusiva con otros usuarios
- Incumplimiento reiterado de las normas de uso
- Reservas fantasma o cancelaciones maliciosas

**Desbloquear:**
- Click en **✅ Desbloquear** → modal de confirmación → el usuario recibe email de reactivación y puede volver a operar normalmente

**Protecciones del sistema:**
- Los administradores no pueden ser bloqueados
- Un admin no puede bloquearse a sí mismo
- El bloqueo es inmediato: todas las sesiones activas del usuario quedan rechazadas en el próximo request

#### Emails automáticos

| # | Asunto | Para | Contenido |
|---|--------|------|-----------|
| 10 | ⛔ Tu cuenta fue suspendida | Usuario bloqueado | Motivo del bloqueo, link a contacto@todasmiscosas.com |
| 11 | ✅ Tu cuenta fue reactivada | Usuario desbloqueado | Confirmación de reactivación, botón para ingresar |

#### Cambios en base de datos (se aplican automáticamente en cada deploy)

```sql
-- En tabla usuarios:
bloqueado_motivo VARCHAR(TEXT)    -- razón del bloqueo
bloqueado_en     DATETIME         -- timestamp del bloqueo
bloqueado_por    VARCHAR(36)      -- ID del admin que bloqueó
```

El campo `activo` existente (ya verificado en el middleware de auth) se usa como interruptor. Las columnas nuevas son el registro de auditoría.

#### Archivos modificados

- `backend/src/db/add-bloqueo-usuarios.js` (nuevo — migración idempotente)
- `backend/src/services/emailService.js` (funciones: `sendCuentaBloqueada`, `sendCuentaDesbloqueada`)
- `backend/src/controllers/adminController.js` (funciones: `getUsuarios`, `bloquearUsuario`, `desbloquearUsuario`)
- `backend/src/routes/admin.js` (rutas: `GET /usuarios`, `PATCH /usuarios/:id/bloquear`, `PATCH /usuarios/:id/desbloquear`)
- `backend/src/middleware/auth.js` (mensaje de error mejorado al detectar cuenta bloqueada, incluye motivo)
- `frontend/app/admin/page.tsx` (nuevo tab "👤 Usuarios" con buscador, filtros, modal de bloqueo con motivos rápidos, modal de confirmación de desbloqueo)
- `.github/workflows/deploy.yml` (agrega migración al pipeline)

#### Cómo verificar el sistema de punta a punta

**Paso 1 — Entrar al panel de admin**

Ingresar con cuenta admin en `https://todasmiscosas.com/admin` → tab **👤 Usuarios**.

**Paso 2 — Buscar al usuario**

Usar el buscador por nombre o email. La tarjeta muestra: tipo, reservas, espacios y fecha de alta.

**Paso 3 — Bloquear**

Click en **⛔ Bloquear** → elegir motivo rápido o escribir uno libre → **⛔ Confirmar bloqueo**.

Lo que ocurre en ese instante:
- `activo = 0` en la DB
- Se registran `bloqueado_motivo`, `bloqueado_en`, `bloqueado_por`
- El usuario recibe el email ⛔ automáticamente

**Paso 4 — Email que recibe el usuario bloqueado**

> **Asunto:** ⛔ Tu cuenta en TodasMisCosas fue suspendida
> Motivo: [el motivo seleccionado] — con link a contacto@todasmiscosas.com

**Paso 5 — Comportamiento del usuario bloqueado**

Cualquier acción autenticada (panel, reserva, etc.) devuelve HTTP 403:

```json
{
  "error": "Tu cuenta fue suspendida por un administrador. Motivo: Usufructo de la plataforma sin contraprestación. Contactanos en contacto@todasmiscosas.com",
  "code": "CUENTA_BLOQUEADA"
}
```

**Paso 6 — Verificación vía curl (opcional)**

```bash
# Antes del bloqueo → responde normal
# Después del bloqueo → responde 403
curl https://todasmiscosas.com/api/reservas \
  -H "Authorization: Bearer TOKEN_DEL_USUARIO"
```

El token se obtiene desde DevTools → Application → Local Storage del navegador del usuario.

**Paso 7 — Desbloquear**

La tarjeta del usuario bloqueado muestra badge rojo **⛔ BLOQUEADO** y el motivo.
Click en **✅ Desbloquear** → confirmar → el usuario recibe email de reactivación y puede operar normalmente.

| Estado en el panel | Borde | Badge | Botón |
|--------------------|-------|-------|-------|
| Activo | Normal | — | ⛔ Bloquear |
| Bloqueado | Rojo | ⛔ BLOQUEADO + motivo | ✅ Desbloquear |

---

*Para agregar nuevas novedades: editar este archivo y agregar una sección con la fecha correspondiente.*
