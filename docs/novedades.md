# TodasMisCosas — Registro de Novedades

Documento interno de seguimiento de funcionalidades implementadas.
Se actualiza con cada nueva mejora incorporada al producto.

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

*Para agregar nuevas novedades: editar este archivo y agregar una sección con la fecha correspondiente.*
