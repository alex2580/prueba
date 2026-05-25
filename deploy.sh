#!/bin/bash
# ============================================================
#  TodasMisCosas — Deploy Script
#  Ejecutado automáticamente por GitHub Actions en cada push a master
# ============================================================
set -e

APP_DIR="/var/www/todasmiscosas"
cd "$APP_DIR"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║    TodasMisCosas — Deploy           ║"
echo "╚══════════════════════════════════════╝"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ── Backend: instalar dependencias ────────────────────────
echo "📦 [1/3] Backend — instalando dependencias..."
cd "$APP_DIR/backend"
npm install --omit=dev --silent
echo "   ✅ Listo"

# ── Frontend: build ────────────────────────────────────────
echo "🏗️  [2/3] Frontend — compilando Next.js..."
cd "$APP_DIR/frontend"
npm install --silent
npm run build
echo "   ✅ Listo"

# ── PM2: reiniciar procesos ────────────────────────────────
echo "🔄 [3/3] Reiniciando procesos PM2..."
cd "$APP_DIR"
pm2 reload all --update-env
pm2 save --force
echo "   ✅ Listo"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         ✅ DEPLOY COMPLETADO        ║"
echo "╚══════════════════════════════════════╝"
echo ""
