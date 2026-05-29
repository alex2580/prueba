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
> #### 🛠️ BACKLOG — funcionalidades pendientes de implementar
>
> Las demás mejoras del backlog original están **completadas** ✅. Solo queda una:
>
> | # | Funcionalidad | Descripción | Estado |
> |---|--------------|-------------|--------|
> | D | **Historial de cambios de perfil** | Log de auditoría que registra cuándo el usuario cambió su nombre, teléfono o dirección. Útil para soporte y seguridad. | 🔴 Pendiente |
>
> **Completadas del backlog original:**
>
> | # | Funcionalidad | Estado |
> |---|--------------|--------|
> | A | Edición de perfil — nombre | ✅ Siempre disponible en el modal de perfil |
> | B | Edición de perfil — dirección física | ✅ Disponible con autocompletado Google Maps |
> | C | Baja automática por inactividad 90 días | ✅ Implementado 23/05/2026 |
> | E | Verificación OTP al cambiar teléfono | ✅ Implementado 23/05/2026 |
> | F | Reactivación de publicaciones pausadas | ✅ Implementado 23/05/2026 |

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

## 23 de Mayo 2026 — Sesión nocturna (22:00 hs aprox.)

### Fixes de producción y mejoras de UX en formularios

---

#### Fix: Crash al ver espacios compartidos sin rating

Los espacios compartidos nuevos (sin reseñas) crasheaban la app con un `RangeError` porque `rating` llega como `null` o `string` desde MySQL, y el componente hacía `'★'.repeat(NaN)`.

- **`CardEspacio.tsx`:** usa `espacio.rating ?? 0` al pasar a `RatingDisplay`
- **`RatingDisplay` (`Rating.tsx`):** clampea stars entre 0–5 con `Math.min(5, Math.max(0, Math.round(value || 0)))` y usa `Number(value || 0).toFixed(1)`
- **`MarkerEspacio.tsx`:** guarda `Number(espacio.rating) > 0` como guard y usa `Number(espacio.rating).toFixed(1)` y `Math.round(Number(espacio.rating))`

**Commits:** `d6bfd0c`, `03890d8`

---

#### Fix: Login "Error de conexión al solicitar código" en producción

El frontend en producción llamaba a `localhost:4000` desde el browser del usuario (`ERR_CONNECTION_REFUSED`). Causa: `NEXT_PUBLIC_API_URL` en `.env` tenía `http://localhost:4000` y Next.js lo hornea en el bundle al momento de compilar.

**Solución permanente:** Guille creó `/var/www/todasmiscosas/frontend/.env.local` con `NEXT_PUBLIC_API_URL=https://todasmiscosas.com` en el VPS y ejecutó `npm run build && pm2 restart all`.

**Solución en código:** Se creó `frontend/.env.production` en el repositorio con los valores correctos de producción, para que futuros deploys no necesiten intervención manual.

```
NEXT_PUBLIC_API_URL=https://todasmiscosas.com
NEXT_PUBLIC_WS_URL=https://todasmiscosas.com
```

Nginx ya rutea `/api` → `localhost:4000` y `/socket.io` → `localhost:4000` correctamente.

**Commit:** `cd7b2ef`

---

#### Mejoras al formulario de Publicar Espacio (`/publicar`)

1. **"Tipo de alquiler" sube a primera posición** — antes estaba debajo de Superficie. Ahora es el primer campo que ve el oferente al abrir el formulario.

2. **"Moneda de publicación" comparte fila con "Superficie (m²)"** — usando `form-row`. Moneda aparece a la izquierda, Superficie a la derecha.

3. **11 monedas latinoamericanas agregadas** a `MONEDAS` en `types/index.ts`:

| Código | Moneda | País |
|--------|--------|------|
| PEN | Sol peruano | 🇵🇪 Perú |
| BOB | Boliviano | 🇧🇴 Bolivia |
| PYG | Guaraní paraguayo | 🇵🇾 Paraguay |
| VES | Bolívar venezolano | 🇻🇪 Venezuela |
| DOP | Peso dominicano | 🇩🇴 Rep. Dominicana |
| CRC | Colón costarricense | 🇨🇷 Costa Rica |
| GTQ | Quetzal guatemalteco | 🇬🇹 Guatemala |
| HNL | Lempira hondureño | 🇭🇳 Honduras |
| NIO | Córdoba nicaragüense | 🇳🇮 Nicaragua |
| PAB | Balboa panameño | 🇵🇦 Panamá |
| CUP | Peso cubano | 🇨🇺 Cuba |

Total: 19 monedas disponibles (8 originales + 11 nuevas).

**Archivos:** `frontend/app/publicar/page.tsx`, `frontend/types/index.ts`
**Commit:** `53e38bd`

---

#### Calendario inteligente en Reservar Espacio (`/espacio/:id/reservar`)

El calendario detecta automáticamente el modo según los precios configurados por el oferente:

| Condición | Modo | Comportamiento |
|-----------|------|----------------|
| Solo `precio_dia > 0` | `dia` | Selección de días individuales, múltiples y salteados |
| Solo `precio_mes > 0` | `mes` | Un click selecciona el mes completo (1° al último día) |
| Ambos precios > 0 | `ambos` | Rango libre con indicador que muestra si aplica tarifa diaria o mensual |

**Modo día (días salteados):**
- Cada click en el calendario hace toggle del día (agrega o quita)
- Se pueden seleccionar días no consecutivos (ej: lunes, miércoles, viernes)
- Los días seleccionados se muestran como chips debajo del calendario con ✕ para quitarlos
- Precio = `cantidad de días seleccionados × precio_dia`
- La reserva se crea con `fecha_desde = primer día seleccionado`, `fecha_hasta = último día seleccionado`

**Modo mes:**
- Click en cualquier día de un mes → selecciona todo ese mes (del 1° al último día)
- Indicador azul: "🗓 Seleccioná un mes completo"
- Precio = `ceil(días / 30) × precio_mes`

**Modo ambos:**
- Rango libre como antes
- Etiqueta dinámica: naranja para tarifa diaria (`< 28 días`), azul para tarifa mensual (`≥ 28 días`)

**Colores diferenciados:**
- Naranja (`var(--orange)`) → tarifa diaria
- Azul (`#3b82f6`) → tarifa mensual

**Archivos:** `frontend/app/espacio/[id]/reservar/page.tsx`
**Commits:** `a018f91`, `e6a9b85`

---

## 23 de Mayo 2026 — Revisión flujo de reserva

### Correcciones flujo de reserva (`/espacio/:id/reservar`)

Se auditó el flujo completo de reserva end-to-end y se corrigieron los siguientes problemas:

#### 1. OTP no aparecía al hacer login dentro del flujo (sesión anterior)
El paso 3 ("Cuenta & Pago") mostraba el formulario de login pero al iniciar sesión no aparecía la pantalla de verificación OTP. El usuario quedaba "colgado" sin poder avanzar.

- **Causa:** la página no escuchaba `otpPending` del hook `useAuth`. Tras `login()`, `otpPending` pasa a `true` pero `user` sigue en `null` → la página no cambiaba de estado.
- **Fix:** se agregó el componente `OTPStep` con detección de `otpPending` en el paso 3.

#### 2. Error "datos inválidos" al publicar espacio (`/publicar`)
Al llegar al paso 4 y hacer click en "Publicar espacio", el backend devolvía 422.

- **Causa:** el formulario no tenía campo `m2`. La función `publicar()` enviaba `m2: 0` y la validación de backend tenía `isFloat({ min: 1 })`.
- **Fix backend:** `body('m2').optional({ nullable: true }).isFloat({ min: 0 })` — ahora es opcional.
- **Fix frontend:** se agregó campo `m2` opcional en el paso 1 del formulario; fallback cambiado de `0` a `1`.

#### 3. URL incorrecta en botón QR "Abrí en otro dispositivo"
El botón generaba `mercadopago.com.ar/checkout/v1/redirect?pref_id=<UUID-interno>` usando el ID de reserva en vez del `init_point` real de MercadoPago.

- **Fix:** se guarda `pref.init_point` en estado (`qrInitPoint`) y el botón abre esa URL directamente.

Archivos modificados: `frontend/app/espacio/[id]/reservar/page.tsx`, `frontend/app/publicar/page.tsx`, `backend/src/routes/espacios.js`

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

### Autenticación en Dos Factores (2FA / OTP)

Cada vez que un usuario inicia sesión o se registra, se genera un código numérico de 6 dígitos que debe ingresar para completar el acceso. El código se envía simultáneamente por hasta 3 canales.

#### Flujo completo

```
Usuario ingresa email + password
      → Supabase valida credenciales
      → Backend genera código OTP de 6 dígitos (válido 10 minutos)
      → Código se envía por: 📧 email + 📱 SMS (si tiene tel) + 💬 WhatsApp (si tiene tel)
      → Usuario ingresa el código en la pantalla de verificación
      → Si es correcto: acceso completo al panel
      → Notificación de acceso exitoso al usuario (IP, dispositivo, fecha/hora)
```

#### Pantalla de verificación

- 6 inputs individuales (uno por dígito) con auto-avance al escribir
- Soporte para pegado del código completo (auto-detecta y completa todos los campos)
- Auto-submit cuando el sexto dígito se completa
- Backspace retrocede al campo anterior automáticamente
- Temporizador de 60 segundos antes de poder reenviar el código
- Contador de intentos: máximo 3 antes de invalidar el OTP

#### Notificación de acceso exitoso

Luego de verificar el código, el usuario recibe por los mismos 3 canales:
- IP desde la que se conectó
- Tipo de dispositivo detectado (📱 Android, 💻 Windows, 💻 Mac, etc.)
- Fecha y hora en zona Argentina
- Botón **"¿No fui yo?"** que abre email a contacto@todasmiscosas.com

#### Modo degradado (sin Twilio configurado)

Si las variables de Twilio no están en el `.env`, el sistema **no falla**: los SMS y WhatsApp se loggean en consola del servidor y el email sigue funcionando normalmente. Ver sección PENDIENTE para instrucciones de activación.

#### Emails / notificaciones involucradas

| # | Canal | Contenido |
|---|-------|-----------|
| 12 | Email | Código OTP con display monospace grande + advertencia de seguridad |
| 13 | SMS + WhatsApp | Mensaje corto: "Tu código de verificación es XXXXXX. Válido 10 min." |
| 14 | Email | Notificación post-login: IP, dispositivo, fecha/hora + botón "¿No fui yo?" |
| 15 | SMS + WhatsApp | Mensaje post-login: confirmación de acceso + contacto de soporte |

#### Cambios en base de datos

```sql
CREATE TABLE auth_otp (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id  VARCHAR(36) NOT NULL,
  codigo      VARCHAR(6)  NOT NULL,
  tipo        VARCHAR(30) NOT NULL DEFAULT 'login',  -- 'login' | 'cambio_tel'
  tel_nuevo   VARCHAR(30) NULL,                       -- solo para tipo='cambio_tel'
  expires_at  DATETIME    NOT NULL,
  usado       TINYINT(1)  NOT NULL DEFAULT 0,
  intentos    INT         NOT NULL DEFAULT 0,
  created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_sesiones (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id  VARCHAR(36) NOT NULL,
  ip          VARCHAR(45),
  user_agent  TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Archivos creados / modificados

- `backend/src/db/add-auth-otp.js` (migración — crea ambas tablas)
- `backend/src/db/add-perfil-inactividad.js` (migración — agrega columnas `tipo` y `tel_nuevo` a `auth_otp`)
- `backend/src/services/twilioService.js` (nuevo — `sendSMS`, `sendWhatsApp`, normalización de teléfonos E.164 Argentina)
- `backend/src/services/emailService.js` (funciones: `sendOTP`, `sendLoginNotificacion`)
- `backend/src/controllers/authController.js` (nuevo — `solicitarOTP`, `verificarOTP`)
- `backend/src/routes/auth.js` (nuevo — `POST /api/auth/solicitar-otp`, `POST /api/auth/verificar-otp`)
- `frontend/hooks/useAuth.ts` (reescrito — agrega `otpPending`, `otpToken`, `otpEmailHint`, `otpCanales`, `verifyOTP`, `reenviarOTP`; `otpFlowRef` bloquea el auto-load de Supabase durante el flujo)
- `frontend/components/auth/OTPStep.tsx` (nuevo — componente de 6 inputs con paste, auto-avance, countdown)
- `frontend/app/auth/login/page.tsx` (muestra `OTPStep` cuando `otpPending === true`)
- `frontend/app/auth/register/page.tsx` (ídem)

#### Consideración técnica — race condition de Supabase

Cuando `signIn()` se completa, `onAuthStateChange` dispara automáticamente con la sesión nueva y llamaría a `loadUser()`, bypasseando el paso de OTP. Se resolvió con `otpFlowRef = useRef(false)`:

```
signIn() → otpFlowRef = true → solicitar OTP → pantalla OTP
                                                     ↓
                                           usuario ingresa código
                                                     ↓
                                        verificarOTP OK → otpFlowRef = false → loadUser()
```

El listener de `onAuthStateChange` chequea el ref y no hace nada mientras sea `true`.

---

### Cambio de Teléfono con Verificación OTP

El teléfono es el canal del 2FA: si alguien pudiera cambiarlo libremente, podría redirigir los códigos de verificación de otra persona a su propio número. Por eso el cambio requiere verificación al nuevo número antes de guardarse.

#### Flujo

```
Modal "Editar perfil" → usuario modifica el campo Teléfono
      → Label muestra "🔐 requiere verificación" en tiempo real
      → Click en "Guardar perfil"
      → Nombre y dirección se guardan inmediatamente (sin OTP)
      → Backend genera OTP → lo envía al NUEVO número por SMS + WhatsApp
      → Modal pasa al paso de verificación (misma UI de 6 dígitos)
      → Usuario ingresa el código
      → Backend verifica → guarda el nuevo teléfono
      → Email de confirmación al usuario: "Tu teléfono fue actualizado"
```

#### Comportamiento cuando el teléfono NO cambia

Si el usuario solo modifica nombre o dirección, el proceso es directo sin OTP.

#### Comportamiento si se borra el teléfono

Si se deja el campo vacío, el número se borra directamente (no requiere OTP, ya que no hay número nuevo al que enviar el código).

#### Endpoints nuevos

```
POST /api/usuarios/me/solicitar-cambio-tel   { tel_nuevo: "+54911XXXXXXXX" }
POST /api/usuarios/me/verificar-cambio-tel   { codigo: "123456" }
```

#### Archivos modificados

- `backend/src/controllers/usuariosController.js` (funciones: `solicitarCambioTel`, `verificarCambioTel`)
- `backend/src/routes/usuarios.js` (2 rutas nuevas)
- `backend/src/services/emailService.js` (función: `sendCambioTelConfirmado`)
- `frontend/app/panel/page.tsx` (step `otp_tel` en el modal de perfil, indicador "🔐 requiere verificación")
- `frontend/lib/api.ts` (métodos: `solicitarCambioTel`, `verificarCambioTel`)

---

### Baja Automática de Publicaciones por Inactividad (90 días)

Un cron job diario detecta espacios que llevan más de 90 días sin ningún tipo de actividad y los pausa automáticamente, notificando al oferente para que decida si desea reactivarlos.

#### Lógica de inactividad

Un espacio se considera "inactivo" cuando:
- Lleva más de 90 días desde su creación **sin que el oferente lo haya editado**, y
- La columna `ultima_actividad` está vacía o tiene más de 90 días

`ultima_actividad` se actualiza cada vez que el oferente edita el espacio desde el panel (PUT /api/espacios/:id).

#### Diferencia entre "pausado manualmente" y "pausado por inactividad"

| Situación | `activo` | `inactiva_auto` | Puede reactivarse |
|-----------|----------|-----------------|-------------------|
| Activo y visible | TRUE | 0 | — |
| Pausado por el oferente | TRUE | 0 | Sí, con botón "Activar" |
| Pausado por inactividad (cron) | FALSE | 1 | Sí, con botón "▶ Reactivar" |
| Eliminado por el oferente | FALSE | 0 | No — eliminación definitiva |

#### Cron job

- Archivo: `backend/src/jobs/inactividad.js`
- Horario: todos los días a las **08:00 hs Argentina** (`America/Argentina/Buenos_Aires`)
- Consulta: `COALESCE(ultima_actividad, created_at) < NOW() - INTERVAL 90 DAY`

#### Email automático al oferente

| # | Asunto | Contenido |
|---|--------|-----------|
| 16 | ⏸️ Tu publicación "[nombre]" fue pausada por inactividad | Nombre del espacio, días de inactividad, botón "Reactivar publicación →" |

#### Cambios en base de datos

```sql
-- En tabla espacios:
ultima_actividad  DATETIME NULL          -- se actualiza al editar el espacio
inactiva_auto     TINYINT(1) DEFAULT 0   -- 1 = pausada por el cron, 0 = activa o eliminada
```

#### Archivos creados / modificados

- `backend/src/db/add-perfil-inactividad.js` (migración — agrega ambas columnas)
- `backend/src/jobs/inactividad.js` (nuevo — cron job)
- `backend/src/controllers/espaciosController.js` (actualizar toca `ultima_actividad = NOW()`, `misEspacios` incluye espacios con `inactiva_auto = 1`)
- `backend/src/services/emailService.js` (función: `sendPublicacionDesactivada`)
- `backend/src/app.js` (inicialización del cron al arrancar)
- `.github/workflows/deploy.yml` (agrega migración al pipeline)

---

### Reactivación de Publicaciones Pausadas

Cuando una publicación es pausada automáticamente por inactividad, el oferente ve un badge especial y puede reactivarla con un solo click desde su panel.

#### En el panel del oferente

- Las publicaciones pausadas por inactividad muestran badge rojo: **⏸️ Pausada por inactividad**
- Los botones "Editar" y "Pausar" se reemplazan por un único botón **▶ Reactivar**
- Al hacer click: `activo = TRUE`, `inactiva_auto = 0`, `ultima_actividad = NOW()`, `disponible = TRUE`
- La publicación vuelve a aparecer en el mapa y en los resultados de búsqueda inmediatamente

#### Endpoint

```
POST /api/espacios/:id/reactivar
```

Solo funciona si `inactiva_auto = 1`. Si alguien intenta reactivar un espacio que fue eliminado manualmente, el backend devuelve error 400.

#### Archivos modificados

- `backend/src/controllers/espaciosController.js` (función: `reactivar`)
- `backend/src/routes/espacios.js` (ruta: `POST /:id/reactivar`)
- `frontend/app/panel/page.tsx` (botón "▶ Reactivar", badge diferenciado, handler `handleReactivarEspacio`)
- `frontend/types/index.ts` (campo `inactiva_auto?: boolean` en interface `Espacio`)

---

*Para agregar nuevas novedades: editar este archivo y agregar una sección con la fecha correspondiente.*

---

## 25 de Mayo 2026

### PIN de acceso en reservas

Cada reserva genera automáticamente un código de 4 dígitos aleatorio (rango 1000–9999) que se almacena en la columna `pin_acceso` de la tabla `reservas` y se envía por email a ambas partes al momento de confirmar la reserva.

- **Demandante:** "Guardá este código — lo vas a necesitar al ingresar al espacio"
- **Oferente:** "El demandante tiene el mismo código — verificalo al momento de la entrega"
- El código es **informativo**: no se pide ingresarlo en ningún formulario de la app
- No requiere acción del usuario ni validación digital

**Migración:** `backend/src/db/add-pin-acceso.js` — agrega columna `pin_acceso CHAR(4) NULL` a la tabla `reservas`

**Archivos modificados:**
- `backend/src/db/add-pin-acceso.js` (nuevo — migración idempotente)
- `backend/src/controllers/reservasController.js` (genera PIN en `crear()`, lo pasa a ambos emails)
- `backend/src/services/emailService.js` (funciones `sendReservaConfirmada` y `sendNuevaReserva` aceptan parámetro `pin`)

**Commit:** `f38b3e7`

---

### Flujo de reserva unificado

El botón "Reservar espacio" en la página de detalle del espacio (`/espacio/:id`) ahora navega a `/espacio/:id/reservar`, igual que el botón "Reservar" del popup del mapa. Antes abría un modal propio con un formulario diferente.

Se eliminaron los estados `reservarModal`, `reservaError`, `reservaLoading`, `intentoReservar` y la función `submitReserva` de `espacio/[id]/page.tsx`. El componente quedó más liviano y el usuario siempre pasa por el mismo flujo de 3 pasos.

**Archivos modificados:**
- `frontend/app/espacio/[id]/page.tsx`

**Commit:** `0ab126c`

---

### Documento de flujo de alta de usuarios

Se creó el documento `docs/flujo-alta-usuarios.doc` en formato HTML con:
- Diagrama de flujo del proceso de registro
- Tabla de 8 pasos con responsables
- Tabla de roles (oferente / demandante / admin)
- Mecanismos de seguridad implementados
- Variables de entorno requeridas

Nota: para el piloto **no se requiere aprobación manual** ni para oferentes ni para demandantes — el alta es automática.

---

### Autenticación 2FA — correcciones de producción

Se detectaron y corrigieron cuatro bugs en el flujo OTP que impedían el correcto funcionamiento en producción.

#### Fix 1 — Modal cerraba antes de mostrar el OTP

**Problema:** Al hacer login, el modal de autenticación se cerraba inmediatamente y el usuario entraba a la app sin ingresar el código. La función `login()` devuelve `true` cuando el OTP fue *solicitado* (no verificado), y el modal interpretaba ese `true` como login completo.

**Fix:** El modal ahora escucha `otpPending` del hook `useAuth`. Cuando es `true`, muestra `OTPStep` en lugar de `LoginForm`. El modal no puede cerrarse mientras `otpPending` sea verdadero. Solo se cierra al verificar el código correctamente.

**Archivos:** `frontend/app/page.tsx`, `frontend/app/espacio/[id]/page.tsx`
**Commit:** `40a549f`

---

#### Fix 2 — Código OTP aparecía como vencido al instante (timezone)

**Problema:** Al ingresar el código recién recibido por email, el backend respondía "El código expiró o ya fue utilizado". Causa: el pool de MySQL tiene `timezone: '-03:00'`, lo que hace que `mysql2` serialice la fecha de expiración en UTC-3, pero el servidor MySQL corre en UTC. Resultado: `expires_at` se guardaba 3 horas en el pasado respecto de `NOW()`.

**Fix:** El `expires_at` ahora se calcula directamente en MySQL con `DATE_ADD(NOW(), INTERVAL ? MINUTE)`, eliminando el desfase de zona horaria.

```sql
-- Antes (problemático):
INSERT INTO auth_otp (usuario_id, codigo, expires_at) VALUES (?, ?, ?)
-- Node.js pasaba un Date en UTC-3 → MySQL lo comparaba con NOW() en UTC

-- Ahora (correcto):
INSERT INTO auth_otp (usuario_id, codigo, expires_at)
VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
```

**Archivos:** `backend/src/controllers/authController.js`
**Commit:** `ddc4c4c`

---

#### Fix 3 — SMS y WhatsApp aparecían aunque Twilio no estaba configurado

**Problema:** La pantalla de verificación mostraba "y por 📱 SMS, 💬 WhatsApp" aunque Twilio no tiene número real configurado. La condición solo verificaba que `TWILIO_ACCOUNT_SID !== 'TWILIO_PENDIENTE'`, pero el VPS tiene un SID real de una cuenta de Twilio sin número activo (`TWILIO_PHONE=+15551234567`).

**Fix:** Se agregó la verificación de que `TWILIO_PHONE` tampoco sea el placeholder:

```js
const twilioActivo = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID !== 'TWILIO_PENDIENTE' &&
  process.env.TWILIO_PHONE &&
  process.env.TWILIO_PHONE !== '+15551234567'
);
```

Ahora el mensaje solo dice "Enviamos un código a tu email" — sin mencionar SMS ni WhatsApp hasta que Twilio esté correctamente configurado.

**Archivos:** `backend/src/controllers/authController.js`, `frontend/components/auth/OTPStep.tsx`
**Commit:** `6388cc2`

---

#### Fix 4 — Temporizador de reenvío confundía al usuario con el tiempo de validez del código

**Problema:** El contador de 60 segundos para "reenviar el código" era confundido por el usuario como el tiempo de validez del código OTP. El usuario veía el contador en ~30 segundos y pensaba que el código vencía en 30 segundos.

**Fix:**
- El timer de reenvío sube de 60 a **600 segundos (10 minutos)**, alineándose con el vencimiento real del código en el backend
- El display cambia de `"30s"` a formato `"MM:SS"` (ej: `09:45`)
- El texto cambia de "Podés reenviar el código en Xs" a "Podés solicitar un nuevo código en MM:SS"

**Archivos:** `frontend/components/auth/OTPStep.tsx`
**Commit:** `6388cc2`

---

### Deploy automático con GitHub Actions

Se creó el script `deploy.sh` que faltaba en el repositorio — el workflow de GitHub Actions lo referenciaba pero nunca existió. También se corrigió el workflow que hacía `git reset --hard HEAD` (no descargaba cambios nuevos) en lugar de `git fetch + reset --hard origin/master`.

**A partir de ahora:** cada `git push origin master` dispara el deploy automático al VPS sin intervención manual.

#### `deploy.sh` — pasos ejecutados en el VPS

```
1. Backend  → npm install --omit=dev
2. Frontend → npm install + npm run build (compilación Next.js)
3. PM2      → pm2 reload all --update-env + pm2 save
```

**Archivos:**
- `deploy.sh` (nuevo)
- `.github/workflows/deploy.yml` (corregido)

**Commit:** `6688ff5`

---

## 24 de Mayo 2026 — Sesión madrugada

### Fotos de depósito como fallback en todas las vistas

Todos los espacios que no tienen fotos propias (o tienen URLs rotas de `localhost:4000`) ahora muestran automáticamente imágenes reales de depósitos y almacenes. La selección es **determinística por ID**: cada espacio siempre muestra las mismas fotos, no cambian al recargar.

**Archivo nuevo:** `frontend/lib/fotosFallback.ts`

```ts
getFotoFallback(espacioId)    // una foto para cards y popup del mapa
getFotosFallback(espacioId, 4) // 4 fotos para galerías y carousel
```

Usa `picsum.photos` con seeds fijos (`deposito1`…`almacen5`) para garantizar disponibilidad.

**Mecanismo adicional — `onError`:** cuando una imagen sí tiene URL guardada en la DB pero está rota (típico de las que se subieron con `localhost:4000`), el atributo `onError` del `<img>` activa el fallback automáticamente sin romper la UI.

**Componentes actualizados:**

| Componente | Dónde se ve |
|---|---|
| `CardEspacio.tsx` | Grid de publicaciones en la pantalla principal |
| `GaleriaFotos.tsx` | Galería completa en el detalle del espacio |
| `DetalleEspacio.tsx` | Pasa `espacioId` a la galería |
| `MarkerEspacio.tsx` | Card popup al hacer click en un pin del mapa |
| `MapaEspacios.tsx` | Tooltip con foto al hacer hover sobre un pin |
| `reservar/page.tsx` (FotoCarousel) | Carousel en el flujo de reserva (paso 1) |

**Commits:** `7b94888`, `354a5ea`, `56b3694`, `8cb678d`, `8ea0242`, `fc794e4`

---

### Recuperación de contraseña — "¿Olvidaste tu contraseña?"

Los usuarios pueden restablecer su contraseña sin intervención del equipo, directamente desde el login.

#### Flujo

```
Login → click "¿Olvidaste tu contraseña?"
      → ingresa su email
      → recibe email con link seguro (enviado por Supabase)
      → click en el link → llega a todasmiscosas.com/reset-password
      → ingresa nueva contraseña + confirmar
      → contraseña actualizada → redirige al inicio automáticamente
```

#### Cambios en `LoginForm.tsx`

- Link "¿Olvidaste tu contraseña?" al lado del label del campo contraseña
- Al hacer click cambia a un mini formulario inline (sin salir del modal) con solo el campo email
- Muestra confirmación 📬 cuando el email fue enviado con éxito
- Botón "← Volver al login" para cancelar

#### Página nueva: `/reset-password`

- Detecta automáticamente el token de recuperación del hash de la URL (evento `PASSWORD_RECOVERY` de Supabase)
- Muestra spinner mientras verifica el link
- Formulario: nueva contraseña + confirmar (con ojo para ver/ocultar)
- Validaciones: mínimo 6 caracteres, contraseñas deben coincidir
- Si el link expiró: muestra error claro
- Si fue exitoso: muestra ✅ y redirige al inicio en 3 segundos

#### Configuración necesaria en Supabase (ya hecho)

En Authentication → URL Configuration → Redirect URLs se agregó:
```
https://todasmiscosas.com/reset-password
```

#### Archivos modificados

- `frontend/components/auth/LoginForm.tsx` (link + mini formulario inline)
- `frontend/lib/supabase.ts` (funciones: `resetPasswordForEmail`, `updatePassword`)
- `frontend/app/reset-password/page.tsx` (nueva página)

**Commit:** `ceb79fb`

---

### Perfil de usuario — Foto, DNI, email editable y mapa de dirección

El modal de edición de perfil del panel fue expandido con nuevos campos y una visualización de ubicación en mapa.

#### Nuevos campos

| Campo | Detalle |
|---|---|
| Foto de perfil | Preview circular 72px + selector de archivo (JPG/PNG/WebP, máx 5MB) — se sube al backend en `/uploads/avatars/` y se guarda en `avatar_url` |
| DNI | Campo de texto libre, máx 20 caracteres |
| Email | Editable, actualiza la tabla `usuarios` en MySQL |
| Dirección | Ya existía con autocomplete Google Maps |
| Mini mapa | Aparece debajo de la dirección una vez que se selecciona una ubicación exacta del autocompletado — usa Google Maps Static API (imagen estática 460×140) |

#### Endpoint nuevo en backend

```
POST /api/usuarios/me/avatar
```
- Recibe `multipart/form-data` con campo `avatar`
- Guarda en `uploads/avatars/{uuid}.ext`
- Actualiza `avatar_url` en MySQL
- Devuelve `{ url: "https://todasmiscosas.com/uploads/avatars/..." }`

#### Cambio en base de datos

```sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dni VARCHAR(20) DEFAULT NULL;
```

La migración corre automáticamente en cada deploy via `node src/db/add-dni.js`.

#### Archivos modificados

- `backend/src/db/add-dni.js` (nuevo — migración idempotente)
- `backend/src/controllers/usuariosController.js` (función `subirAvatar`, GET/PUT incluyen `dni`)
- `backend/src/routes/usuarios.js` (ruta `POST /me/avatar`, validaciones `dni` y `email`)
- `frontend/types/index.ts` (campo `dni?: string` en interface `Usuario`)
- `frontend/lib/api.ts` (método `subirAvatar`, actualizar firma de `actualizar`)
- `frontend/app/panel/page.tsx` (estado `perfilAvatarFile/Preview`, formulario expandido con foto + DNI + email + mapa)
- `.github/workflows/deploy.yml` (agrega `add-dni.js` al pipeline)

**Commit:** `352a0fd`

---

## 25 de Mayo 2026 — Sesión (continuación)

### PIN de acceso visible en ambos paneles

El PIN de 4 dígitos que se genera al crear una reserva ahora se muestra visualmente en la app para que ambas partes puedan consultarlo en cualquier momento.

**Demandante (Mis reservas):** en la tarjeta `EstadoReserva`, aparece una fila resaltada "🔑 PIN de acceso" con el número en naranja y fuente monoespaciada, visible cuando la reserva está en estado `confirmada`, `pagada` o `finalizada`.

**Oferente (Mis espacios → Reservas recibidas):** en cada fila de reserva recibida, debajo de las fechas, aparece "🔑 PIN: XXXX" en el mismo formato.

Ambos lados muestran el mismo número, que es el que se generó al crear la reserva y se envió por email.

**Archivos modificados:**
- `frontend/types/index.ts` (campo `pin_acceso?: string` en interface `Reserva`)
- `frontend/components/reservas/EstadoReserva.tsx` (bloque PIN entre datos y botones)
- `frontend/app/panel/page.tsx` (PIN inline en reservas recibidas del oferente)

**Commit:** `78163af`

---

### Página de confirmación de pago — polling automático

La página `/reserva/[id]/confirmacion` verificaba el estado del pago **una sola vez** al cargar. Como el webhook de MercadoPago llega de forma asíncrona (puede tardar varios segundos después de que el usuario regresa a la app), la página mostraba "⏳ Pago pendiente" aunque el pago ya hubiese sido aprobado.

**Fix:** se reemplazó la verificación única por un loop de polling que consulta `GET /api/pagos/estado/:reservaId` cada 3 segundos, hasta un máximo de 15 intentos (45 segundos total). En cuanto el estado cambia a `pagada` o `cancelada`, el loop se detiene y la página actualiza la UI automáticamente sin que el usuario tenga que refrescar.

**Archivos modificados:**
- `frontend/app/reserva/[id]/confirmacion/page.tsx`

**Commit:** `63bd240`

---

### Timeline de reservas — se elimina el paso "Activa"

La barra de progreso en las tarjetas de reserva (tanto en el panel del demandante como del oferente) pasó de 4 pasos a 3:

| Antes | Ahora |
|-------|-------|
| 📋 Solicitada → ✅ Confirmada → 💳 Pago realizado → 🏠 Activa | 📋 Solicitada → ✅ Confirmada → 💳 Pago realizado |

El paso "Activa" fue removido porque genera confusión: los usuarios no distinguen entre "pagada" y "activa", y el estado `activa` no tiene un evento concreto que lo dispare en el flujo actual.

Los estados `pagada` y `finalizada` quedan mapeados al paso 3 (completo).

**Archivos modificados:**
- `frontend/components/reservas/TimelineReserva.tsx`

**Commit:** `b0de6ae`

---

### Mapa — marcadores y tooltips muestran precio, no m²

**Problema:** Los marcadores del mapa y los tooltips de hover mostraban la superficie en m² de cada espacio. Los espacios que solo tenían `precio_dia` cargado (con `precio_mes = 0`) mostraban `$0` en el pin y en el tooltip.

**Cambios:**

1. **Pin del marcador (etiqueta sobre el mapa):**
   - Usa `precio_mes` si es > 0
   - Cae a `precio_dia` si `precio_mes` es 0, agregando sufijo `/d` (ej: `$5k/d`)
   - Nunca más muestra `$0`

2. **Tooltip de hover (InfoWindow al pasar el mouse):**
   - Reemplaza "📍 Barrio · X m²" por "📍 Barrio" + precio/mes y/o precio/día en naranja
   - Si ambos precios están cargados, se muestran separados por `·`

3. **Tarjeta de click (MarkerEspacioCard):**
   - Elimina el "· X m²" del subtítulo
   - Muestra `precio_mes /mes` y/o `precio_dia /día` condicionalmente según qué precios tenga cargados el espacio (valor > 0)
   - Si ambos están cargados: precio mensual grande + precio diario más pequeño al lado

**Archivos modificados:**
- `frontend/components/mapa/MapaEspacios.tsx`
- `frontend/components/mapa/MarkerEspacio.tsx`

---

## 25 de Mayo 2026 — Sesión tarde/noche

### Corrección destino de emails de admin (ADMIN_EMAILS)

**Problema:** Los emails internos (formulario de contacto, "¿Querés mejorar tu puntuación?") llegaban a la casilla `contacto@todasmiscosas.com` en Hostinger, que nadie revisaba. No había reenvío configurado a los emails personales del equipo.

**Solución:**
- Se agregó la variable de entorno `ADMIN_EMAILS` en el backend
- `sendMejorarPuntuacion` y `sendContacto` ahora usan `process.env.ADMIN_EMAILS` como destino
- Valor en producción: `alejandro.laporte@gmail.com,guilleadominguez@gmail.com`
- También se corrigió el HTML interno del email `sendMejorarPuntuacion` (usaba clases CSS que no existían en el template base)

**Paso requerido en VPS (ejecutado manualmente):**
```bash
echo 'ADMIN_EMAILS=alejandro.laporte@gmail.com,guilleadominguez@gmail.com' >> /var/www/todasmiscosas/backend/.env
pm2 reload all --update-env
```

**Archivos modificados:**
- `backend/src/services/emailService.js`
- `backend/src/routes/email.js`
- `backend/.env` (solo local — no se sube a git)

**Commit:** `c48718e`

---

### Panel Admin — nueva pestaña "🛡️ Puntuación" (solicitudes de mejora)

**Problema:** El botón "¿Querés mejorar tu puntuación?" del formulario de publicación enviaba el email pero no dejaba registro visible en el sistema. Los admins no podían ver ni gestionar las solicitudes recibidas.

**Solución:** Se creó una tabla en la DB y una nueva pestaña en el panel admin:

**Base de datos — nueva tabla:**
```sql
CREATE TABLE admin_solicitudes_puntuacion (
  id              VARCHAR(36)   PRIMARY KEY,
  oferente_id     VARCHAR(36),
  nombre          VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  tel             VARCHAR(50),
  espacio_nombre  VARCHAR(255),
  puntaje_actual  TINYINT       NOT NULL DEFAULT 0,
  estado          ENUM('pendiente','contactado','resuelto') NOT NULL DEFAULT 'pendiente',
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
)
```

**Flujo:** cuando el oferente hace click → se guarda en DB **y** se envía el email a ADMIN_EMAILS.

**Panel admin — pestaña "🛡️ Puntuación":**
- Badge rojo con cantidad de solicitudes pendientes
- Filtros: todas / pendiente / contactado / resuelto
- Cada solicitud muestra: nombre, email, teléfono, espacio, estrellas actuales, fecha
- Acciones: ✉️ Responder (abre Gmail), 📞 Marcar contactado, ✅ Marcar resuelto

**Endpoints nuevos:**
- `GET /api/admin/solicitudes-puntuacion` (admin)
- `PATCH /api/admin/solicitudes-puntuacion/:id/estado` (admin)

**Archivos modificados:**
- `backend/src/controllers/adminController.js`
- `backend/src/routes/admin.js`
- `backend/src/routes/email.js`
- `frontend/app/admin/page.tsx`

**Commit:** `711c80b`

---

### Filtro de mapa — opción Por día / Por mes

**Funcionalidad:** Se agregaron dos nuevos botones de toggle en el panel de filtros del mapa, al lado del slider de precio: **📅 Por día** y **📆 Por mes**.

**Comportamiento:**
- **Por día:** filtra solo espacios con `precio_dia > 0`; el slider de precio va de $0 a $10.000; el label dice "Precio máx/día"
- **Por mes:** filtra solo espacios con `precio_mes > 0`; el slider va de $0 a $100.000; el label dice "Precio máx/mes"
- Ambos toggles se pueden desactivar haciendo click nuevamente
- Al cambiar de periodo el slider se resetea (precio_max = undefined)
- El badge del botón "Filtros" cuenta el periodo como filtro activo
- El backend aplica el filtro de precio al campo correcto (`precio_dia` o `precio_mes`) según el periodo seleccionado

**Campo nuevo en `FiltrosEspacios`:** `periodo?: 'dia' | 'mes' | ''`

**Archivos modificados:**
- `frontend/types/index.ts` — campo `periodo` en `FiltrosEspacios`
- `frontend/lib/api.ts` — pasa `periodo` en query string
- `frontend/components/espacios/FiltrosEspacios.tsx` — botones + slider adaptativo
- `frontend/app/page.tsx` — badge actualizado
- `backend/src/controllers/espaciosController.js` — lógica de filtrado por periodo

**Commit:** `e30fc25`

---

### Mapa — marcadores sin precio en estado inicial

**Funcionalidad:** Los marcadores del mapa ahora adaptan su apariencia según si hay filtros activos o no:

| Estado | Apariencia del marcador |
|--------|------------------------|
| Sin filtros | Pin pequeño (28×34px) con solo el color, sin texto — naranja=compartido, azul=exclusivo, gris=no disponible |
| Con filtros activos | Pin grande (68×56px) con el precio dentro (lógica existente: precio_mes si >0, sino precio_dia con "/d") |

**Lógica de activación:** se considera "filtros activos" cuando hay al menos uno de: `tipo`, `precio_max`, `periodo`, `barrio`, `q` (búsqueda).

**Prop nueva en `MapaEspacios`:** `filtrosActivos?: boolean`

Al cambiar `filtrosActivos`, un `useEffect` itera todos los marcadores existentes y swappea entre el ícono grande (con precio) y el ícono pequeño (sin precio), sin tener que recrearlos.

**Archivos modificados:**
- `frontend/components/mapa/MapaEspacios.tsx`
- `frontend/app/page.tsx`

**Commit:** `1cf9f06`

---

### Email al oferente — desglose de pago con comisión 15% y aviso 48h

**Funcionalidad:** Cuando el demandante completa el pago, el email que recibe el oferente ahora incluye:

- Valor bruto de la reserva
- Comisión de TodasMisCosas (15%) — en rojo
- **Monto neto a recibir** — en verde
- Aviso destacado: "Recibirás $X dentro de las próximas 48 horas hábiles"
- El asunto del email incluye el monto neto: `💰 Pago recibido — $X en camino · Nombre del espacio`

**Constante backend:** `const COMISION_PLATAFORMA = 0.15` en `emailService.js`

Además se actualizó `legal.html`: la comisión cobrada pasó de **10% → 15%**.

**Archivos modificados:**
- `backend/src/services/emailService.js` — `sendPagoRecibidoOferente`
- `frontend/public/legal.html`

**Commit:** `e52f588`

---

### Panel Oferente — montos netos y nuevo indicador "Ingresos del mes"

**Cambios en `PanelOferente.tsx`:**

1. **Indicadores (tarjetas de stats):**
   - `💰 Ingresos totales` → ahora muestra el 85% del bruto total (neto tras comisión TMC), con nota "neto -15% TMC"
   - `📆 Ingresos del mes` → **nuevo indicador** con el neto del mes en curso, con la misma nota

2. **Lista de reservas:**
   - Reservas en estado `pagada` / `finalizada`: muestra el **monto neto en verde** + bruto entre paréntesis en gris
   - Reservas en otros estados: muestra el valor estimado en naranja (sin descuento, porque aún no se pagó)

**Constante compartida:** `COMISION_TMC = 0.15` y helper `netoOferente(bruto)` en `frontend/lib/utils.ts` — única fuente de verdad para ambos frontend y email.

**Archivos modificados:**
- `frontend/lib/utils.ts` — constante `COMISION_TMC` y función `netoOferente()`
- `frontend/components/panel/PanelOferente.tsx`

---

### Panel Admin — nueva pestaña "💼 Operaciones"

**Funcionalidad:** Nueva pestaña en `/admin` con visión financiera completa de la plataforma.

**9 tarjetas KPI:**
| Indicador | Descripción |
|-----------|-------------|
| 📋 Total reservas | Todas las reservas del sistema |
| ✅ Completadas | Pagadas + finalizadas |
| ⏳ En curso / pendientes | Pendientes + confirmadas |
| ❌ Canceladas | Reservas canceladas |
| 💵 GMV del mes | Gross Merchandise Value del mes en curso |
| 💰 GMV total | GMV histórico total |
| 🏛️ Comisión TMC mes | 15% del GMV del mes |
| 🏛️ Comisión TMC total | 15% del GMV total |
| 🤝 Neto a oferentes | GMV total menos comisiones |

**Lista de operaciones:**
- Filtros: todas / pagadas / pendientes / canceladas + búsqueda por nombre
- Cada fila muestra: espacio, barrio, estado, fecha, demandante (email), oferente (email), fechas de la reserva, ID de pago MP
- Para reservas completadas: desglose financiero — bruto · comisión TMC (naranja) · neto oferente (verde)

**Endpoint nuevo:**
- `GET /api/admin/operaciones` → devuelve `{ resumen, reservas[] }` con todos los campos financieros calculados

**Archivos modificados:**
- `backend/src/controllers/adminController.js` — `getOperaciones()`
- `backend/src/routes/admin.js` — ruta nueva
- `frontend/app/admin/page.tsx` — `TabOperaciones` + tab en TabBar

**Commit:** `fcbaab7`

**Commits:** `b0de6ae`, `b3b0c1b`

---

### Email al oferente — datos de contacto del demandante

Cuando se crea una reserva, el email que recibe el oferente ("🔔 Nueva solicitud de reserva") ahora incluye explícitamente el **email** y el **teléfono** del demandante, con links directos `mailto:` y `tel:` para facilitar el contacto inmediato.

**Motivo:** El oferente necesita poder contactar al demandante para coordinar el acceso sin tener que entrar al panel.

**Archivos modificados:**
- `backend/src/services/emailService.js` — `sendNuevaReserva` acepta `demandanteEmail` y `demandanteTel`, los muestra con links
- `backend/src/controllers/reservasController.js` — pasa `demandanteEmail: req.user.email` al llamar a `sendNuevaReserva`

**Commit:** `4c85ff2`

---

## 25 de Mayo 2026 — Sesión noche (continuación)

### Cambios en páginas públicas

#### legal.html — sección "Seguros Disponibles" oculta

La sección completa `<div id="sec3">` (Seguros Disponibles) y su pill de navegación ("🛡 Seguros") se ocultaron con `display:none`. El contenido sigue en el HTML pero no es visible para el usuario.

**Motivo:** Los seguros aún no están operativos como servicio real; mostrarlos genera expectativas que no pueden cumplirse.

**Archivo modificado:** `frontend/public/legal.html`

---

#### servicios/page.tsx — ocultación de tipos y precios de referencia

1. **Sección "🏠 Tipos de almacenamiento"** — envuelta en `<div style="display:none">`. Los 5 tipos de espacio (Personal, Empresarial, Logística, Bauleras, Compartido) dejan de mostrarse.

2. **Precios de servicios adicionales** — se eliminó la línea `{s.precio}` de las cards de Transporte, Seguros y Embalaje. Los precios de referencia ("Desde $8.500", "Desde $2.500/mes", etc.) ya no aparecen en las tarjetas.

**Motivo:** Los precios reales son acordados por espacio; mostrar precios de referencia confunde al usuario y genera comparaciones incorrectas.

**Archivo modificado:** `frontend/app/servicios/page.tsx`

---

#### como-funciona/page.tsx — 5to paso sobre PIN compartido

Se agregó un quinto paso al flujo "Cómo funciona":

| # | Ícono | Título | Descripción |
|---|-------|--------|-------------|
| 5 | 🔐 | Acceso verificado con PIN | Tanto el demandante como el oferente reciben el mismo PIN de 4 dígitos para confirmar el inicio y fin de la operación. |

El título de la sección se actualizó de "Los 4 pasos" a **"Los 5 pasos"**.

**Archivo modificado:** `frontend/app/como-funciona/page.tsx`

**Commit:** `a5b2844`

---

### Emails de aceptación de Términos de Uso

Se implementaron dos nuevos flujos de email relacionados con la aceptación formal de los Términos de Uso y Disclaimers de la plataforma.

#### 1. Registro — bienvenida + aceptación de términos

El email de bienvenida (`sendBienvenida`) fue actualizado para incluir una sección dedicada de aceptación de T&C. Además, ahora se envía **automáticamente** al crear un usuario nuevo desde `POST /api/usuarios/sync` (antes solo se podía disparar manualmente desde una ruta de email).

**Contenido del nuevo bloque legal en el email de bienvenida:**
- Encabezado: "⚖️ Aceptación de Términos de Uso"
- 5 puntos resumidos:
  1. TMC actúa como plataforma de conexión, no es parte del contrato
  2. Prohibición de bienes peligrosos, ilegales o de procedencia no comprobable
  3. Cada usuario es responsable de sus bienes y del espacio que ofrece/usa
  4. Comisión del 15% sobre reservas efectivamente cobradas al Oferente
  5. Pagos a través de MercadoPago con retención hasta confirmación de acceso
- Link "📄 Ver los Términos y Condiciones completos →" a `/legal`

#### 2. Transacción — confirmación legal para ambas partes

Nueva función `sendAceptacionOperacion` que se envía a **demandante y oferente** en el momento de crear una reserva.

El email es personalizado por rol:

**Demandante recibe — obligaciones:**
1. Declarar veraz y completamente el tipo de bienes a almacenar
2. No ingresar bienes prohibidos, peligrosos o ilegales
3. Respetar horarios y condiciones de acceso acordados con el Oferente
4. Asumir responsabilidad civil por daños que sus bienes pudieran causar

**Oferente recibe — obligaciones:**
1. Garantizar que el espacio esté en condiciones acordadas y disponible desde la fecha pactada
2. No denegar acceso una vez confirmada y pagada la reserva
3. Informar inmediatamente ante incidentes que afecten los bienes almacenados
4. Recordatorio de la comisión TMC del 15%

Ambos reciben el disclaimer de que TMC actúa como intermediario y link a términos completos.

**Asunto:** `📋 Confirmación legal — {nombre del espacio} ({fechaDesde} → {fechaHasta})`

**Archivos modificados:**
- `backend/src/services/emailService.js` — `sendBienvenida` actualizado + nueva función `sendAceptacionOperacion` exportada
- `backend/src/controllers/usuariosController.js` — `sync()` llama `sendBienvenida` al crear usuario nuevo
- `backend/src/controllers/reservasController.js` — `crear()` llama `sendAceptacionOperacion` para demandante y oferente

**Commit:** `5945f77`

---

## 29 de Mayo 2026 — v1.7.0

### OTP de cambio de perfil — fix definitivo (timezone)

**Problema:** Al editar el perfil, el código OTP llegaba por email pero al ingresarlo aparecía "El código expiró o ya fue utilizado". La causa raíz era que la comparación `expires_at > NOW()` en MySQL dependía del timezone del servidor MySQL, que podía diferir del proceso Node.js, haciendo que el código apareciera vencido inmediatamente.

**Solución:** Se reemplazó completamente el uso de `auth_otp` para el flujo de cambio de perfil por una tabla dedicada `perfil_otp` con `expires_at` como `BIGINT` (Unix timestamp en ms). La verificación de expiración se hace en Node.js con `otp.expires_at < Date.now()`, completamente independiente del timezone del servidor MySQL.

#### Backend (`backend/src/controllers/usuariosController.js`)
- Nueva función `initPerfilOtpTable()` — crea tabla `perfil_otp` de forma lazy al primer uso
- `solicitarCambioPerfil()` — genera `expires_at = Date.now() + 10min` (Unix ms), inserta en `perfil_otp`, envía email con `sendOTP()`
- `verificarCambioPerfil()` — busca en `perfil_otp` sin filtro de tiempo SQL, compara `otp.expires_at < Date.now()` en Node.js
- `id` generado con `crypto.randomUUID()` en Node.js (sin depender de `DEFAULT (UUID())` de MySQL)

#### Tabla nueva
```sql
CREATE TABLE IF NOT EXISTS perfil_otp (
  id          VARCHAR(36)  PRIMARY KEY,
  usuario_id  VARCHAR(36)  NOT NULL,
  codigo      VARCHAR(6)   NOT NULL,
  usado       TINYINT(1)   NOT NULL DEFAULT 0,
  intentos    INT          NOT NULL DEFAULT 0,
  expires_at  BIGINT       NOT NULL,   -- Unix ms, comparado en Node.js
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuario (usuario_id)
)
```

#### UI (`frontend/app/panel/page.tsx`)
- Aviso naranja: *"⏱️ Tenés 10 minutos para ingresar el código antes de que expire. Revisá también la carpeta de spam."*
- Botón **"Reenviar código"** junto a "← Volver al formulario" para pedir un nuevo OTP sin cerrar el modal

**Commits:** `91b72c6` (UI + lazy migration parcial), `19fb50f` (fix definitivo tabla dedicada)

---

### Servicios adicionales — "a cotizar" en paso 3

**Problema:** En el paso 3 (Cuenta & Pago) del flujo de reserva, los servicios adicionales (Kit de embalaje, Seguro de contenido, etc.) mostraban `$0` porque sus precios están en `0` hasta ser coordinados con un asesor.

**Fix:** Se reemplazó `formatARS(precio)` por `precio > 0 ? formatARS(precio) : 'a cotizar'` en:
- `frontend/app/espacio/[id]/reservar/page.tsx` — resumen de Cuenta & Pago
- `frontend/components/reservas/CheckoutReserva.tsx` — card de servicio

**Commit:** `89c80ea`

---

### Sistema de Marketing & Difusión — Campañas de email

Nueva sección en el panel de administradores: **"📨 Marketing & Difusión"**.

#### Funcionalidades
1. **Envío manual:** redactás una campaña (nombre, asunto, cuerpo HTML con preview inline), elegís destinatarios y la enviás de inmediato.
2. **Envío automático programado:** toggle con tres modalidades:
   - **Una vez:** fecha exacta + hora
   - **Semanal:** día de la semana + hora (lunes a domingo)
   - **Mensual:** día del mes + hora
   - Funciona cualquier día incluyendo fines de semana y feriados
   - Hora en tiempo de Buenos Aires (UTC-3), independiente del timezone del servidor
3. **Segmentación:** Todos los usuarios / Solo Oferentes / Solo Demandantes (con conteo previo de destinatarios activos)
4. **Log de envíos:** por cada campaña enviada se registra email, estado (ok/error), fecha y hora

#### Backend
- `backend/src/controllers/mailingController.js` — CRUD completo + función `sendCampana()` con log individual por destinatario
- `backend/src/routes/mailing.js` — endpoints bajo `/api/mailing/`, todos protegidos por `requireAdmin`
- `backend/src/jobs/mailing.js` — cron cada minuto que compara hora de Buenos Aires; los envíos únicos se desactivan solos tras ejecutarse
- `backend/src/services/emailService.js` — nueva función `sendNewsletter()` con template HTML reutilizable y nota de baja al pie
- `backend/src/app.js` — registra `/api/mailing` + arranca `iniciarCronMailing()`

#### Tablas nuevas (lazy init)
```sql
CREATE TABLE mailing_campanas (
  id, nombre, asunto, cuerpo_html, destinatarios,
  estado, enviada_en, total_enviados,
  prog_activa, prog_tipo, prog_fecha, prog_hora,
  prog_dia_semana, prog_dia_mes, prog_ultimo_envio,
  creado_por, created_at, updated_at
)

CREATE TABLE mailing_log (
  id, campana_id, email, nombre, estado, error_msg, enviado_en
)
```

#### Frontend
- `frontend/components/admin/TabMarketing.tsx` — componente completo con sub-tabs "Campañas" y "Redactar/Editar"
- `frontend/app/admin/page.tsx` — nuevo tab `📨 Marketing & Difusión`

**Commit:** `dfe9856`

---

### País — Puerto Rico agregado al filtro

Se agregó `🇵🇷 Puerto Rico` al selector de países en el filtro del home (`frontend/app/page.tsx`).

**Commit:** `dc44dcd`

---

### CI/CD — TypeScript check antes del deploy

El workflow de GitHub Actions ahora tiene dos etapas en secuencia:

1. **`typecheck`** (nuevo): checkout del repo → `npm ci` → `npx tsc --noEmit`. Si hay errores de tipos en el frontend, el pipeline se detiene aquí y el VPS no se toca.
2. **`deploy`** (existente, ahora condicionado a `needs: typecheck`): SSH al VPS → `git pull` → `deploy.sh` (npm install + build + pm2 reload).

Esto garantiza que ningún código con errores TypeScript llegue a producción.

**Archivo:** `.github/workflows/deploy.yml`
**Commit:** `a929634`

---

## 27–28 de Mayo 2026 — v1.6.0

### Sistema de favoritos (end-to-end)

Implementación completa del módulo de favoritos.

#### Backend
- `backend/src/controllers/favoritosController.js` — `listar()`, `listarIds()`, `agregar()` (INSERT IGNORE), `eliminar()`
- `backend/src/routes/favoritos.js` — GET `/`, GET `/ids`, POST `/`, DELETE `/:espacio_id` — todos con `requireAuth`
- Registrado en `app.js` como `/api/favoritos`

#### Frontend
- `frontend/lib/favoritosAPI.ts` — funciones `getFavoritosIds`, `toggleFavorito`
- `CardEspacio.tsx` — recibe `token` como prop (evita race condition de `useAuth` en hijos)
- `GridEspacios.tsx` — propaga `token` a cada card
- `app/page.tsx` — pasa `token` desde el estado autenticado
- `panel/page.tsx` — pestaña Favoritos con grid de espacios guardados

#### Tabla en producción
Guille ejecutó el CREATE TABLE en el VPS (`srv2021.hstgr.io:3306`, db `u713501758_todasmiscosas`):
```sql
CREATE TABLE IF NOT EXISTS favoritos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  espacio_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorito (usuario_id, espacio_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
);
```

---

### Flujo de reserva — mejoras de UX

#### Selector de período (`reservar/page.tsx`)
- Cuando el espacio tiene ambos precios (día y mes): se muestran botones de selección de período en lugar de mostrar ambos precios simultáneamente en naranja
- Modo `modoCalendario`: `'dia' | 'mes' | 'ambos'`

#### Inputs de fecha por mes (`type="month"`)
- Cuando `modoCalendario === 'mes'`: los inputs de fecha cambian a `type="month"` mostrando selector año/mes
- El valor `YYYY-MM` se convierte internamente: `fechaDesde` → primer día del mes, `fechaHasta` → último día del mes (calculado con `new Date(y, m, 0).getDate()`)

#### Ocultar calendario de días al reservar por mes
- `MiniCalendar` solo se renderiza cuando `modoCalendario !== 'mes'`
- Evita confusión de mostrar grilla de días cuando el usuario reserva por mes

**Commits:** `4b73a73`, `30b25c1`

---

### DetalleEspacio — paridad visual de precios

En el panel derecho de la ficha de espacio (`DetalleEspacio.tsx`):
- Cuando existen ambos precios (`precio_dia` y `precio_mes`): se muestran lado a lado con igual jerarquía visual (mismo tamaño de fuente 1.45rem, etiquetas "POR MES" / "POR DÍA" en 11px)
- Cuando hay un solo precio: display grande original con sufijo `/mes` o `/día`
- Fix: MySQL devuelve DECIMAL como string `"0.00"` (truthy en JS) → se usa `Number(x) > 0` para la comparación

---

### CI/CD — fix IPv6 en deploy

- Secret `VPS_HOST` tenía dirección IPv6 que `appleboy/ssh-action` no resuelve en GitHub Actions
- Fix: reemplazado por IPv4 del VPS Hostinger

---

## 26 de Mayo 2026

### Diseño responsive — mobile y tablet

Se adaptó toda la aplicación para funcionar correctamente en celulares y tablets.

#### Cambios en el header (`SiteHeader.tsx`)

- Se reescribió el componente con un **menú hamburguesa** (`useState(false)` para `menuOpen`)
- El botón hamburguesa `☰ / ✕` se muestra solo en mobile (≤640px); en desktop está oculto con CSS
- En mobile, el menú se despliega como un panel fijo debajo del header con todos los ítems de navegación: Buscar espacios, Cómo funciona, Legales, Publicar espacio y botones de auth
- La nav central y `header-actions` se ocultan con CSS en mobile

#### Cambios en `layout.tsx`

Se agregó el meta tag de viewport:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
```

#### Cambios en `globals.css`

| Selector | Cambio |
|----------|--------|
| `.hamburger` | `display: none` por defecto; visible en ≤640px |
| `.mobile-menu` | Dropdown fijo debajo del header con nav completa |
| `.mobile-menu__item` | Botones del menú mobile con padding y borde inferior |
| `@media (max-width: 1024px)` | Tablet: compacta el header y achica fuentes de nav |
| `@media (max-width: 640px)` | Mobile: oculta nav y header-actions; modales en bottom-sheet; búsqueda ancho completo; filter pills scrollables |

**Modales en bottom-sheet (mobile):**
- `.modal-overlay` cambia a `align-items: flex-end`
- `.modal-box` ocupa ancho 100% con bordes redondeados solo en la parte superior

**Archivos modificados:**
- `frontend/components/ui/SiteHeader.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/globals.css`

**Commit:** `8a9d8de`

---

### Fix: "Request Entity Too Large" al subir fotos

**Problema:** al finalizar el paso 4 del flujo de publicar espacio, el servidor devolvía error 413 cuando las fotos de celular superaban el límite de 5MB por archivo configurado en multer.

**Solución 1 — Compresión cliente (principal):**
Se agregó la función `comprimirImagen()` en `publicar/page.tsx`. Antes de hacer el upload, cada archivo pasa por un canvas que:
- Redimensiona a máximo 1600px en el lado más largo
- Re-encodea como JPEG con calidad 82%
- Una foto de celular típica (8MB) queda en ~400–600KB

El preview en pantalla usa la foto original (sin delay), pero lo que se envía al servidor ya está comprimido.

```ts
async function comprimirImagen(file: File, maxW = 1600, quality = 0.82): Promise<File>
```

**Solución 2 — Límite multer (red de seguridad):**
`MAX_FILE_SIZE` subió de 5MB → 20MB en `backend/src/middleware/upload.js` y en el `.env`.

**Archivos modificados:**
- `frontend/app/publicar/page.tsx`
- `backend/src/middleware/upload.js`

**Commit:** `57909e5`

---

### Limpieza de iconos 🏠 en toda la interfaz

Se eliminó el emoji de casita (🏠) de todos los lugares donde aparecía en la UI. En casos donde cumplía función semántica fue reemplazado por un ícono más apropiado.

| Ubicación | Antes | Después |
|---|---|---|
| Botón "Publicar espacio" (2 lugares) | 🏠 Publicar espacio | Publicar espacio |
| Botón "Reservar espacio" | 🏠 Reservar espacio | Reservar espacio |
| Título sección "Mis espacios publicados" | 🏠 Mis espacios publicados | Mis espacios publicados |
| Tab "Mis espacios (N)" | 🏠 Mis espacios (N) | Mis espacios (N) |
| Estado vacío de espacios (2 lugares) | 🏠 grande decorativo | 📦 |
| Stats "Mis espacios" y "Espacios activos" | emoji: '🏠' | emoji: '📦' |
| Registro — icono de rol Oferente | 🏠 | 🔑 |
| Detalle "Oferente:" en admin | 🏠 Oferente: | 🔑 Oferente: |
| Nombre de espacio en admin/servicios | 🏠 {nombre} | 📦 {nombre} |
| Tipo notificación espacio en admin | espacio: '🏠' | espacio: '📦' |
| "Particulares" en cómo funciona | icon: '🏠' | icon: '👤' |
| Step "Detalle" en flujo de reserva | icon: '🏠' | icon: '📋' |
| Techo impermeable en checklist seguridad | emoji: '🏠' | emoji: '🛡️' |

**Archivos modificados:** 11 archivos de frontend  
**Commit:** `76c65cb`

---

### Botón Cancelar en paso de pago del flujo de reserva

**Problema:** en el paso 3 (Cuenta & Pago) del flujo `/espacio/:id/reservar` solo existía el botón "← Volver a servicios" (vuelve al paso 2), pero no había forma de **cancelar y volver a la página del espacio**.

**Solución:** el único botón "← Volver a servicios" fue reemplazado por dos botones lado a lado:

| Botón | Acción |
|---|---|
| ← Volver | `setStep(2)` — regresa al paso 2 (Servicios) |
| Cancelar | `router.push('/espacio/${espacioId}')` — regresa a la página del espacio |

**Archivo modificado:** `frontend/app/espacio/[id]/reservar/page.tsx`  
**Commit:** `0ba0048`

---

### Precios día y mes en panel de usuario

**Problema:** las tarjetas de espacios en "Mis espacios publicados" solo mostraban el precio por mes aunque el espacio tuviera precio por día cargado.

**Solución:** se muestran ambos precios de forma condicional (solo los que tienen valor > 0):

```
$15.000/día  ·  $300.000/mes
```

Si solo tiene uno de los dos cargado, se muestra ese solo.

**Archivos modificados:**
- `frontend/components/panel/PanelOferente.tsx`
- `frontend/app/panel/page.tsx`

**Commit:** `0ba0048`

---

### Fix: ingresos del oferente aplicaban comisión incorrectamente

**Problema:** `StatsOferente.tsx` sumaba `r.precio_total` (valor bruto) en lugar de `netoOferente(r.precio_total)` para los indicadores "Ingresos del mes" e "Ingresos totales". El usuario veía los montos sin descontar la comisión del 15%.

Adicionalmente:
- El filtro de mes solo incluía reservas en estado `'pagada'`, omitiendo las `'finalizada'`
- La sección "Obtuviste" en `panel/page.tsx` también mostraba el bruto

**Fix:**
- `StatsOferente.tsx`: aplica `netoOferente()` en ambos acumuladores, corrige filtro de mes para incluir `'finalizada'`
- `panel/page.tsx`: importa `netoOferente` y lo aplica en la columna "Obtuviste (neto)" de reservas recibidas

**Regla:** `netoOferente(bruto) = round(bruto × 0.85)` — definido en `frontend/lib/utils.ts`, única fuente de verdad.

**Archivos modificados:**
- `frontend/components/panel/StatsOferente.tsx`
- `frontend/app/panel/page.tsx`

**Commit:** `38d3958`

---

## 29 de Mayo 2026 — v1.7.1 (tarde/noche)

### Tab "Publicaciones" en panel Admin

**Nuevo:** Se agregó un tab **Publicaciones** en el panel de administración (`/admin`), accesible solo para el rol `admin`. Permite ver todas las publicaciones del sistema con filtros:

- **Activas**: espacios con `activo = 1` y `disponible = 1`  
- **Inactivas**: espacios con `activo = 0` o `disponible = 0`

Cada tarjeta muestra:
- Nombre, tipo, barrio, precio
- Badge de estado: `● Activa`, `● Pausada`, `● Pausada auto` o `● No visible` (cuando `activo = 0`)
- Botón **Activar / Pausar** que llama a `PATCH /api/admin/publicaciones/:id/disponible`

**Archivos modificados:**
- `frontend/app/admin/page.tsx` — nuevo tab `TabPublicaciones`, interfaz `PublicacionAdmin`, lógica de filtros y toggle
- `backend/src/controllers/adminController.js` — nuevas funciones `getPublicaciones` y `toggleDisponibleAdmin`
- `backend/src/routes/admin.js` — nuevas rutas `GET /publicaciones` y `PATCH /publicaciones/:id/disponible`

**Commits:** `3075e8e`, `d84b7a1`

---

### Fix: overflow horizontal en TabBar del panel Admin

**Problema:** En pantallas de ancho medio, los tabs del admin quedaban cortados y no se podían ver ni hacer click. La causa era que `.page-scroll` tiene `overflow-y: auto`, que implícitamente hace `overflow-x: hidden`, recortando el TabBar horizontal.

**Fix:** Se agregó `overflowX: 'auto'` al div del TabBar y `flexShrink: 0; whiteSpace: 'nowrap'` a los botones de tab.

**Archivos modificados:**
- `frontend/app/admin/page.tsx`

**Commit:** `9a431d7`

---

### Fix: crash "Application error" al clickear tab Publicaciones

**Problema:** mysql2 devuelve columnas `DECIMAL` como strings. `pub.rating?.toFixed(1)` se llamaba sobre el string `"4.90"`, y `.toFixed` es `undefined` en strings → TypeError → crash del cliente.

**Fix:** El controlador `getPublicaciones` castea con `parseFloat()` los campos `precio_dia`, `precio_mes` y `rating` antes de responder.

**Archivos modificados:**
- `backend/src/controllers/adminController.js`

**Commit:** `9a431d7`

---

### Fix: campo `activo` distinguido de `disponible` en admin y panel

**Contexto:** La tabla `espacios` tiene dos campos separados:
- `activo`: controla si el espacio aparece en home, mapa y resultados de búsqueda
- `disponible`: controla si acepta reservas

Hasta este fix el admin panel mostraba un espacio como "Activa" basándose solo en `disponible = 1`, aunque `activo = 0` lo ocultaba de la plataforma.

**Cambios:**
1. `getPublicaciones` ahora incluye `e.activo` en el SELECT
2. Badge de estado usa `activo && disponible` para determinar "Activa"; si `activo = 0` muestra `● No visible`
3. Botón **Activar/Pausar** opera sobre ambos campos: setea `disponible = nuevoEstado` y `activo = nuevoEstado`
4. `toggleDisponibleAdmin` en el backend actualiza ambos campos: `UPDATE espacios SET disponible = ?, inactiva_auto = 0, activo = ? WHERE id = ?`

**Archivos modificados:**
- `frontend/app/admin/page.tsx`
- `backend/src/controllers/adminController.js`

**Commits:** `66289fe`, `b13ce57`

---

### Fix: "mis espacios publicados" muestra todos los espacios del oferente

**Problema:** La query `misEspacios` filtraba por `activo = TRUE OR inactiva_auto = 1`, por lo que un espacio con `activo = 0` e `inactiva_auto = 0` no aparecía en el panel del oferente aunque le perteneciera.

**Fix:** Se eliminó el filtro de `activo` de `misEspacios` — los oferentes siempre ven todos sus espacios (activos e inactivos).

**Archivos modificados:**
- `backend/src/controllers/espaciosController.js`

**Commit:** `627dbba`

---

### Fix: "Activar" desde panel del oferente reactiva la visibilidad en home y mapa

**Problema:** El endpoint `PUT /api/espacios/:id` (actualizar) solo actualizaba `disponible`, nunca `activo`. Un espacio podía tener `disponible = 1` pero `activo = 0` y seguir sin aparecer en home/mapa aunque el oferente lo "activara".

**Fix:** Se modificó la query de `actualizar` para que, cuando `disponible = true`, también setee `activo = TRUE` usando `activo = IF(?, TRUE, activo)`.

**Archivos modificados:**
- `backend/src/controllers/espaciosController.js`

**Commit:** `5fccad0`

---

### Contenido: Objetos prohibidos en Legales (sección 5)

Se agregaron dos ítems a la lista de objetos prohibidos:
- **Animales muertos**
- **Elementos de riesgo biológico**

Ubicados entre "Animales vivos" y "Objetos robados o de procedencia ilícita".

**Archivos modificados:**
- `frontend/app/legales/page.tsx`

**Commit:** `627dbba`

---

### Contenido: Signo de apertura de pregunta en "¿Cómo funciona?"

El botón de navegación (desktop y mobile) que decía "Cómo funciona" ahora dice **"¿Cómo funciona?"** con el signo de apertura correcto en español.

**Archivos modificados:**
- `frontend/components/ui/SiteHeader.tsx`

**Commit:** `627dbba`
