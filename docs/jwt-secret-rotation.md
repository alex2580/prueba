# Rotación del JWT Secret — TodasMisCosas

## Cuándo rotar

- Cada 6 meses (rutina)
- Inmediatamente si hay sospecha de filtración del secret
- Antes de cualquier cambio de personal con acceso al VPS

## Pasos

### 1. Obtener el nuevo secret en Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard) → Proyecto TMC
2. **Settings → API → JWT Settings**
3. Hacer clic en **Generate new secret** (o anotar el actual si solo se actualiza el VPS)
4. Copiar el nuevo valor de `JWT_SECRET`

> ⚠️ Al rotar en Supabase, **todos los tokens existentes quedan inválidos**. Los usuarios deberán iniciar sesión nuevamente.

### 2. Actualizar el `.env` en el VPS

```bash
ssh root@2.24.105.151
nano /var/www/todasmiscosas/backend/.env
```

Actualizar la línea:
```
SUPABASE_JWT_SECRET=nuevo_valor_aqui
```

### 3. Reiniciar el backend

```bash
pm2 restart tmc-backend
pm2 logs tmc-backend --lines 5 --nostream
```

Verificar que el servidor arrancó sin errores.

### 4. Verificar que el login funciona

Abrir `https://todasmiscosas.com` e iniciar sesión con una cuenta de prueba. Confirmar que la sesión se establece correctamente.

### 5. Registro

Anotar la fecha de rotación en este archivo:

| Fecha | Quién | Motivo |
|-------|-------|--------|
| — | — | Documento inicial |
