# TodasMisCosas — Guía de Backup y Restauración

**Última actualización:** 23 de Mayo 2026  
**Servidor:** VPS Hostinger · IP `2.24.105.151` · Ubuntu 22.04  
**App:** https://todasmiscosas.com

---

## Qué cubre este backup

| Componente | Dónde vive | ¿Se respalda? |
|---|---|---|
| Código fuente | GitHub (`alex2580/prueba`) | ✅ Git es el backup del código |
| Base de datos MySQL | VPS `/var/lib/mysql/todasmiscosas_db` | ✅ Script `backup.sh` |
| Variables de entorno | VPS `/var/www/todasmiscosas/backend/.env` | ✅ Script `backup.sh` |
| Frontend `.env.local` | VPS (no está en git) | ✅ Script `backup.sh` |
| Config Nginx | VPS `/etc/nginx/sites-enabled/` | ✅ Script `backup.sh` |
| Config PM2 | VPS `~/.pm2/dump.pm2` | ✅ Script `backup.sh` |
| Imágenes de espacios | Supabase Storage | ✅ Supabase tiene su propio backup |
| Certificado SSL | VPS (Let's Encrypt) | ⚠️ Auto-renovable, no necesita backup |

---

## Hacer un backup ahora

### Opción A — Terminal de Hostinger (recomendado)

1. Entrar a Hostinger → VPS → Terminal
2. Ejecutar:

```bash
bash /var/www/todasmiscosas/backup.sh
```

3. Al finalizar muestra el nombre del archivo generado, por ejemplo:
   `tmc_backup_20260523_220000.tar.gz`

4. Para descargarlo a tu computadora, ejecutar **en tu máquina** (no en el VPS):

```bash
scp root@2.24.105.151:/var/backups/todasmiscosas/tmc_backup_20260523_220000.tar.gz ~/Desktop/
```

---

### Opción B — Backup automático diario (cron job)

Para que el backup se haga solo todos los días a las 3 AM Argentina, ejecutar en el VPS:

```bash
crontab -e
```

Agregar al final del archivo:

```
0 3 * * * bash /var/www/todasmiscosas/backup.sh >> /var/log/tmc-backup.log 2>&1
```

Guardar y salir. El script conserva automáticamente los últimos 7 backups y borra los anteriores.

---

## Qué contiene el archivo .tar.gz

```
tmc_backup_YYYYMMDD_HHMMSS.tar.gz
├── database.sql          ← Dump completo de MySQL (todas las tablas + datos)
├── backend.env           ← Variables de entorno del backend (JWT, Twilio, MP, Resend...)
├── frontend.env.local    ← NEXT_PUBLIC_API_URL y NEXT_PUBLIC_WS_URL
├── nginx.conf            ← Configuración del servidor web
├── pm2.dump.json         ← Procesos PM2 (qué apps correr y cómo)
└── uploads/              ← Solo si hay imágenes guardadas localmente
```

---

## Restaurar desde backup

### Escenario 1 — Base de datos corrompida o borrada accidentalmente

```bash
# 1. Descomprimir el backup
cd /var/backups/todasmiscosas
tar -xzf tmc_backup_YYYYMMDD_HHMMSS.tar.gz

# 2. Cargar las variables del .env para tener las credenciales
source tmc_backup_YYYYMMDD_HHMMSS/backend.env

# 3. Restaurar la base de datos
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < tmc_backup_YYYYMMDD_HHMMSS/database.sql

echo "✅ Base de datos restaurada"
```

### Escenario 2 — VPS nuevo o reinstalación completa

```bash
# ── Paso 1: Instalar dependencias del sistema ──
apt update && apt install -y git nodejs npm mysql-server nginx certbot python3-certbot-nginx
npm install -g pm2

# ── Paso 2: Clonar el código ──
cd /var/www
git clone https://github.com/alex2580/prueba todasmiscosas
cd todasmiscosas

# ── Paso 3: Restaurar variables de entorno ──
tar -xzf /ruta/al/tmc_backup_YYYYMMDD_HHMMSS.tar.gz -C /tmp/tmc_restore

cp /tmp/tmc_restore/backend.env backend/.env
cp /tmp/tmc_restore/frontend.env.local frontend/.env.local

# ── Paso 4: Instalar dependencias ──
cd backend && npm install
cd ../frontend && npm install

# ── Paso 5: Restaurar base de datos ──
source /tmp/tmc_restore/backend.env
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p "$DB_NAME" < /tmp/tmc_restore/database.sql

# ── Paso 6: Compilar el frontend ──
cd /var/www/todasmiscosas/frontend
npm run build

# ── Paso 7: Restaurar config Nginx ──
cp /tmp/tmc_restore/nginx.conf /etc/nginx/sites-enabled/todasmiscosas
nginx -t && systemctl reload nginx

# ── Paso 8: Restaurar y arrancar PM2 ──
cp /tmp/tmc_restore/pm2.dump.json ~/.pm2/dump.pm2
pm2 resurrect
pm2 save

echo "✅ Restauración completa"
```

### Escenario 3 — Variables de entorno perdidas

```bash
tar -xzf tmc_backup_YYYYMMDD_HHMMSS.tar.gz
cp tmc_backup_YYYYMMDD_HHMMSS/backend.env /var/www/todasmiscosas/backend/.env
cp tmc_backup_YYYYMMDD_HHMMSS/frontend.env.local /var/www/todasmiscosas/frontend/.env.local
pm2 restart all
```

---

## Verificar que la app funciona post-restauración

```bash
# 1. Ver que los procesos PM2 están corriendo
pm2 list

# 2. Verificar conexión a MySQL desde el backend
curl http://localhost:4000/api/espacios | head -c 200

# 3. Verificar que el frontend responde
curl http://localhost:3000 | head -c 100

# 4. Verificar Nginx
systemctl status nginx

# 5. Verificar desde internet
curl https://todasmiscosas.com/api/espacios | head -c 200
```

---

## Acceso rápido a los backups en el VPS

```bash
# Listar todos los backups
ls -lh /var/backups/todasmiscosas/

# Ver contenido de un backup sin extraer
tar -tzf /var/backups/todasmiscosas/tmc_backup_YYYYMMDD_HHMMSS.tar.gz

# Ver logs del cron de backup (si está configurado)
tail -50 /var/log/tmc-backup.log
```

---

## Datos importantes del servidor

| Dato | Valor |
|---|---|
| IP del VPS | `2.24.105.151` |
| Usuario SSH | `root` |
| Directorio app | `/var/www/todasmiscosas` |
| Directorio backups | `/var/backups/todasmiscosas` |
| Config Nginx | `/etc/nginx/sites-enabled/todasmiscosas` |
| Logs PM2 | `pm2 logs` |
| DB nombre | `todasmiscosas_db` (ver `.env`) |
| Puerto backend | `4000` |
| Puerto frontend | `3000` |

---

## Checklist de backup manual recomendado

Hacer esto **antes de cualquier cambio grande** (migración de DB, update de Node, cambio de arquitectura):

- [ ] Ejecutar `bash /var/www/todasmiscosas/backup.sh`
- [ ] Descargar el `.tar.gz` a tu computadora local (`scp`)
- [ ] Guardar una copia adicional en Google Drive o Dropbox
- [ ] Verificar que el archivo no está vacío (`ls -lh ~/Desktop/tmc_backup_*.tar.gz`)
