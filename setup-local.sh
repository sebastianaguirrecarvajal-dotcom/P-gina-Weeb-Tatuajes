#!/usr/bin/env bash
# Arranque de desarrollo local (macOS / Linux).
# Ejecútalo desde dentro de la carpeta del proyecto: bash setup-local.sh
#
# Requisitos previos: Node.js 20+, y una base PostgreSQL local escuchando en
# localhost:5432 (ver docs/DESARROLLO-LOCAL.md para levantarla con Docker).
set -euo pipefail

cd "$(dirname "$0")"

echo "▶ Comprobando Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo "✗ No se encontró Node.js. Instálalo desde https://nodejs.org (LTS)." >&2
  exit 1
fi
node -v

# 1) .env
if [ ! -f .env ]; then
  echo "▶ Creando .env para desarrollo local..."
  cat > .env <<'ENV'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/estudio?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/estudio?schema=public"
AUTH_SECRET="desarrollo-local-cambia-esto-si-quieres-0123456789"
ADMIN_EMAIL="tatuador@estudio.demo"
ADMIN_PASSWORD="estudio123"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
STORAGE_DRIVER="local"
ENV
  echo "  .env creado."
else
  echo "▶ .env ya existe; lo respeto."
fi

# 2) Dependencias
echo "▶ Instalando dependencias (npm install)..."
npm install

# 3) Base de datos
echo "▶ Aplicando migraciones..."
npm run db:migrate:deploy

echo "▶ Cargando datos de demostración (seed)..."
npm run db:seed

echo ""
echo "✅ Listo. Arranca el servidor con:"
echo "     npm run dev"
echo "   y abre http://localhost:3000  (panel: /admin/login)"
