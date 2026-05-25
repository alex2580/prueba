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
