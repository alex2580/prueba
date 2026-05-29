#!/bin/bash
# backup-local.sh — Corre desde la MÁQUINA LOCAL de Guille o Alejandro.
# Descarga un backup completo del VPS (DB + .env + nginx + PM2) a una carpeta local.
#
# Uso: bash backup-local.sh
# Requiere: ssh y scp instalados, acceso SSH al VPS configurado.

set -e

# ── Configuración ────────────────────────────────────────────────────────────
VPS_USER="root"
VPS_HOST="2.24.105.151"
VPS_DIR="/var/www/todasmiscosas"
DB_NAME="u713501758_todasmiscosas"
DB_USER="u713501758_tmc_user"

LOCAL_DIR="$HOME/tmc-backups"
FECHA=$(date +%Y-%m-%d_%H-%M)
DEST="$LOCAL_DIR/$FECHA"

# ── Preparar carpeta local ────────────────────────────────────────────────────
mkdir -p "$DEST"
echo "📦 Guardando backup en: $DEST"

# ── 1. Dump de MySQL ──────────────────────────────────────────────────────────
echo "🗄️  Dumpeando base de datos..."
# Lee la password del .env del VPS para no hardcodearla aquí
ssh "$VPS_USER@$VPS_HOST" "
  DB_PASS=\$(grep '^DB_PASS=' $VPS_DIR/backend/.env | cut -d= -f2-)
  mysqldump -h srv2021.hstgr.io -u $DB_USER -p\"\$DB_PASS\" $DB_NAME 2>/dev/null
" > "$DEST/database.sql"
echo "   ✅ database.sql ($(du -sh "$DEST/database.sql" | cut -f1))"

# ── 2. Archivo .env del backend ───────────────────────────────────────────────
echo "🔑 Descargando .env..."
scp -q "$VPS_USER@$VPS_HOST:$VPS_DIR/backend/.env" "$DEST/backend.env"
echo "   ✅ backend.env"

# ── 3. .env.local del frontend (si existe) ───────────────────────────────────
ssh "$VPS_USER@$VPS_HOST" "test -f $VPS_DIR/frontend/.env.local && echo yes || echo no" | grep -q yes && \
  scp -q "$VPS_USER@$VPS_HOST:$VPS_DIR/frontend/.env.local" "$DEST/frontend.env.local" && \
  echo "   ✅ frontend.env.local" || \
  echo "   ⚠️  frontend/.env.local no encontrado (no es crítico)"

# ── 4. Config nginx ───────────────────────────────────────────────────────────
echo "🌐 Descargando configuración nginx..."
scp -q "$VPS_USER@$VPS_HOST:/etc/nginx/sites-available/todasmiscosas" "$DEST/nginx.conf" 2>/dev/null && \
  echo "   ✅ nginx.conf" || \
  echo "   ⚠️  nginx config no encontrada en /etc/nginx/sites-available/todasmiscosas"

# ── 5. PM2 ecosystem ─────────────────────────────────────────────────────────
echo "⚙️  Guardando estado PM2..."
ssh "$VPS_USER@$VPS_HOST" "pm2 save --force > /dev/null 2>&1; cat ~/.pm2/dump.pm2" > "$DEST/pm2-dump.json" 2>/dev/null && \
  echo "   ✅ pm2-dump.json" || \
  echo "   ⚠️  No se pudo obtener el dump de PM2"

# ── Limpiar backups viejos (conserva los últimos 10) ─────────────────────────
echo ""
echo "🧹 Limpiando backups anteriores (conserva los últimos 10)..."
ls -dt "$LOCAL_DIR"/*/  2>/dev/null | tail -n +11 | xargs rm -rf
echo "   Backups disponibles:"
ls -dt "$LOCAL_DIR"/*/ 2>/dev/null | while read d; do echo "   • $(basename $d)"; done

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "✅ Backup completado: $DEST"
echo "═══════════════════════════════════════════"
echo ""
echo "Archivos guardados:"
ls -lh "$DEST"
