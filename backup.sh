#!/bin/bash
# ============================================================
#  TodasMisCosas — Script de Backup Completo
#  Ejecutar en el VPS desde Hostinger Terminal:
#    bash /var/www/todasmiscosas/backup.sh
# ============================================================

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/todasmiscosas"
BACKUP_NAME="tmc_backup_$DATE"
APP_DIR="/var/www/todasmiscosas"
BACKEND_ENV="$APP_DIR/backend/.env"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   TodasMisCosas — Backup Completo   ║"
echo "╚══════════════════════════════════════╝"
echo "📅 Fecha: $DATE"
echo ""

# Crear directorio de backups
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# ── 1. Base de datos MySQL ──────────────────────────────────
echo "🗄️  [1/5] Dumping base de datos MySQL..."

# Leer variables del .env del backend
if [ -f "$BACKEND_ENV" ]; then
  export $(grep -v '^#' "$BACKEND_ENV" | grep -E '^DB_' | xargs)
else
  echo "❌ No se encontró $BACKEND_ENV"
  exit 1
fi

DB_HOST_VAL="${DB_HOST:-localhost}"
DB_PORT_VAL="${DB_PORT:-3306}"
DB_USER_VAL="${DB_USER:-root}"
DB_PASS_VAL="${DB_PASS:-}"
DB_NAME_VAL="${DB_NAME:-todasmiscosas_db}"

# Buscar mysqldump en ubicaciones comunes
MYSQLDUMP_BIN=""
for candidate in \
  "$(which mysqldump 2>/dev/null)" \
  /usr/bin/mysqldump \
  /usr/local/bin/mysqldump \
  /usr/mysql/bin/mysqldump \
  /usr/local/mysql/bin/mysqldump \
  /opt/mysql/bin/mysqldump \
  /usr/lib/mysql/bin/mysqldump
do
  if [ -x "$candidate" ]; then
    MYSQLDUMP_BIN="$candidate"
    break
  fi
done

if [ -z "$MYSQLDUMP_BIN" ]; then
  echo "   ⚠️  mysqldump no encontrado. Intentando con mysql client directo..."
  # Fallback: exportar via SELECT INTO OUTFILE o node
  node -e "
    require('dotenv').config({ path: '$BACKEND_ENV' });
    const { execSync } = require('child_process');
    console.log('DB_NAME:', process.env.DB_NAME);
  " 2>/dev/null || true
  echo "   ❌ No se pudo hacer dump de MySQL. Instalá mysql-client:"
  echo "      apt-get install -y mysql-client"
  echo "   Continuando con el resto del backup..."
else
  echo "   Usando: $MYSQLDUMP_BIN"
  "$MYSQLDUMP_BIN" \
    -h "$DB_HOST_VAL" \
    -P "$DB_PORT_VAL" \
    -u "$DB_USER_VAL" \
    -p"$DB_PASS_VAL" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-table \
    --column-statistics=0 \
    "$DB_NAME_VAL" \
    > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
fi

ROWS=$(grep -c "INSERT INTO" "$BACKUP_DIR/$BACKUP_NAME/database.sql" 2>/dev/null || echo "0")
echo "   ✅ Base de datos guardada ($ROWS inserts)"

# ── 2. Variables de entorno ────────────────────────────────
echo "🔐 [2/5] Copiando archivos .env..."

cp "$BACKEND_ENV" "$BACKUP_DIR/$BACKUP_NAME/backend.env"

# Frontend .env.local (solo existe en VPS, no en git)
FRONTEND_ENV_LOCAL="$APP_DIR/frontend/.env.local"
if [ -f "$FRONTEND_ENV_LOCAL" ]; then
  cp "$FRONTEND_ENV_LOCAL" "$BACKUP_DIR/$BACKUP_NAME/frontend.env.local"
  echo "   ✅ backend.env + frontend.env.local guardados"
else
  echo "   ✅ backend.env guardado (frontend.env.local no existe)"
fi

# ── 3. Configuración Nginx ─────────────────────────────────
echo "🌐 [3/5] Copiando config Nginx..."

NGINX_CONF="/etc/nginx/sites-enabled/todasmiscosas"
if [ -f "$NGINX_CONF" ]; then
  cp "$NGINX_CONF" "$BACKUP_DIR/$BACKUP_NAME/nginx.conf"
  echo "   ✅ nginx.conf guardado"
else
  echo "   ⚠️  No se encontró config Nginx en $NGINX_CONF"
fi

# ── 4. Configuración PM2 ───────────────────────────────────
echo "⚙️  [4/5] Guardando config PM2..."

pm2 save --force > /dev/null 2>&1 || true
PM2_DUMP="$HOME/.pm2/dump.pm2"
if [ -f "$PM2_DUMP" ]; then
  cp "$PM2_DUMP" "$BACKUP_DIR/$BACKUP_NAME/pm2.dump.json"
  echo "   ✅ PM2 config guardada"
else
  echo "   ⚠️  No se encontró dump PM2 en $PM2_DUMP"
fi

# ── 5. Uploads / imágenes locales ─────────────────────────
echo "📷 [5/5] Buscando uploads locales..."

UPLOADS_DIR="$APP_DIR/backend/uploads"
if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A $UPLOADS_DIR 2>/dev/null)" ]; then
  cp -r "$UPLOADS_DIR" "$BACKUP_DIR/$BACKUP_NAME/uploads"
  UPLOAD_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
  echo "   ✅ $UPLOAD_COUNT archivos de uploads copiados"
else
  echo "   ℹ️  No hay uploads locales (imágenes en Supabase Storage)"
fi

# ── Comprimir todo ─────────────────────────────────────────
echo ""
echo "🗜️  Comprimiendo backup..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# ── Limpiar backups viejos (conservar últimos 7) ───────────
echo "🧹 Limpiando backups viejos (conservando los últimos 7)..."
ls -t "$BACKUP_DIR"/tmc_backup_*.tar.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true

# ── Resumen ────────────────────────────────────────────────
SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)
TOTAL_BACKUPS=$(ls "$BACKUP_DIR"/tmc_backup_*.tar.gz 2>/dev/null | wc -l)

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                 ✅ BACKUP COMPLETADO                 ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Archivo : $BACKUP_NAME.tar.gz"
echo "║  Tamaño  : $SIZE"
echo "║  Backups guardados: $TOTAL_BACKUPS"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📥 Para descargar a tu computadora, ejecutar en tu máquina:"
echo ""
echo "   scp root@2.24.105.151:$BACKUP_DIR/$BACKUP_NAME.tar.gz ~/Desktop/"
echo ""
echo "📋 Backups disponibles en el VPS:"
ls -lh "$BACKUP_DIR"/tmc_backup_*.tar.gz 2>/dev/null | awk '{print "   " $NF "  (" $5 ")"}'
echo ""
