# Checklist de testing — Cambios del 19 al 23 de junio 2026 (v1.12.0 + v1.13.0)

> Del 15 al 18 de junio solo hubo trabajo de documentación/marketing (Eventos, prospecting, podcast, RRSS, auditoría legal) — nada de app para testear ahí.

## 📅 Calendarios (publicar / editar / reservar)
- [ ] `/publicar` muestra 1 calendario con 2 meses visibles y flechas nativas para navegar
- [ ] `/espacio/:id/reservar` ídem, se pueden seleccionar rangos y días sueltos
- [ ] Modal de editar espacio muestra el calendario igual que publicar (2 meses lado a lado)
- [ ] Leyenda de día suelto vs rango se entiende

## ⏳ Vigencia de publicaciones → 90 días
- [ ] Crear espacio nuevo → `fecha_vencimiento` queda a 90 días de hoy
- [ ] Texto en `/legales` sección 11 dice 90 días

## 🏠 Home page
- [ ] Buscador colapsa a pastilla al scrollear y se puede volver a expandir
- [ ] Slider de precio funciona desde la pastilla compacta (no solo expandida)
- [ ] Fila de filtros (País/Tipo/Precio/Seguridad) se ve centrada, independiente del header
- [ ] Grid de tarjetas: 2 filas x 5 columnas, scroll horizontal con flechas
- [ ] Filtrar por "Exclusivo" con pocos resultados → la fila 2 no deja espacio vacío
- [ ] Botón "Publicar mi espacio" debajo del segundo flujo "¿Cómo funciona?"
- [ ] FAQ se abre/cierra en acordeón, texto usa "quien cuidará tus cosas" (no "proveedor")
- [ ] Footer visible al final, no queda "anclado" al scrollear hacia arriba
- [ ] Probar en mobile (responsive)

## 🦶 Footer + páginas nuevas
- [ ] Footer aparece en todas las páginas (no solo home)
- [ ] `/sobre-nosotros` carga bien
- [ ] `/contacto` carga y el formulario envía (revisar que llegue el email/consulta)

## 🐛 Bug consultas públicas cruzadas (regresión crítica)
- [ ] Hacer una consulta pública en Espacio A
- [ ] Hacer otra consulta pública en Espacio B (UUID que arranque con letra)
- [ ] Verificar que cada espacio muestra solo sus propias consultas

## 📜 Legales / T&C
- [ ] `/legales` incluye Política de Privacidad (Ley 25.326) y derechos ARCO
- [ ] Sección de derecho al olvido / eliminación de cuenta menciona el form de Contacto
- [ ] Texto de seguro de contenido dice "intermediario", no aseguradora (en `/servicios` y paso 2 de reserva)
- [ ] Registro nuevo exige checkbox "Soy mayor de 18 años"
- [ ] Flujo de reserva exige checkbox de aceptación de T&C (y se guarda timestamp en DB)
- [ ] Sección de disputas formales y daños al espacio visibles en `/legales`

## 💰 Reservas / pagos
- [ ] Botón "Me arrepentí" disponible en una reserva propia reciente
- [ ] Cancelar con "Me arrepentí" dispara reembolso 100% al cliente
- [ ] Confirmar que la auto-liberación de escrow a las 48h sigue funcionando

## 🔐 Auth / publicar sin login
- [ ] Entrar a `/publicar` sin sesión iniciada
- [ ] Completar pasos 1-3 sin loguearse
- [ ] Loguearse en el paso 4 y confirmar que el flujo continúa sin perder los datos

## 🎨 Tarjetas y panel proveedor
- [ ] Precio en las tarjetas aparece en su propia línea, centrado (no pegado a las reseñas)
- [ ] "Mis espacios publicados" muestra el tag Exclusivo/Compartido
- [ ] Modal de editar espacio ya no tiene campo "Dirección" (pero el dato sigue en DB)

## 🗺️ Mapa
- [ ] En modo claro, los POI de Google (aeropuertos, cementerios, etc.) no se confunden con pines de publicaciones

## Migraciones a confirmar con Guille
- [ ] `fix-consultas-espacio-id-type.js` corrida en producción (20 jun) — confirmar que el backup/dump de Guille la refleja
