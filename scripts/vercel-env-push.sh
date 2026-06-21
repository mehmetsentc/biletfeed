#!/bin/sh
# .env.local + firebase-admin.json → Vercel production env
# Kullanım: sh scripts/vercel-env-push.sh [production-url]
#
# Örnek: sh scripts/vercel-env-push.sh https://biletfeed.vercel.app

set -e

PROD_URL="${1:-https://biletfeed.vercel.app}"
PROD_HOST="${PROD_URL#https://}"
PROD_HOST="${PROD_HOST#http://}"
PROD_HOST="${PROD_HOST%/}"

if [ ! -f .env.local ]; then
  echo "❌ .env.local bulunamadı"
  exit 1
fi

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "❌ Vercel girişi yok. Önce: npx vercel login"
  exit 1
fi

echo "→ Vercel env yükleniyor (host: $PROD_HOST)"
echo "→ Proje bağlantısı yoksa: npx vercel link"

add_env() {
  name="$1"
  value="$2"
  if [ -z "$value" ]; then
    echo "  ⚠️  $name boş — atlandı"
    return
  fi
  printf '%s' "$value" | npx vercel env add "$name" production --force >/dev/null 2>&1 \
    && echo "  ✅ $name" \
    || echo "  ⚠️  $name eklenemedi"
}

# shellcheck disable=SC1091
set -a
. ./.env.local
set +a

add_env DATABASE_URL "$DATABASE_URL"
add_env NEXT_PUBLIC_APP_NAME "${NEXT_PUBLIC_APP_NAME:-Bilet Feed}"
add_env NEXT_PUBLIC_APP_DESCRIPTION "${NEXT_PUBLIC_APP_DESCRIPTION:-Modern etkinlik keşif ve bilet platformu}"
add_env NEXT_PUBLIC_APP_URL "$PROD_URL"
add_env NEXT_PUBLIC_SITE_URL "$PROD_URL"
add_env NEXT_PUBLIC_ROOT_DOMAIN "$PROD_HOST"
add_env NEXT_PUBLIC_CANONICAL_HOST "$PROD_HOST"
add_env NEXT_PUBLIC_ENABLE_SUBDOMAINS "${NEXT_PUBLIC_ENABLE_SUBDOMAINS:-false}"
add_env NEXT_PUBLIC_ENABLE_AI "${NEXT_PUBLIC_ENABLE_AI:-false}"
add_env NEXT_PUBLIC_FIREBASE_API_KEY "$NEXT_PUBLIC_FIREBASE_API_KEY"
add_env NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
add_env NEXT_PUBLIC_FIREBASE_PROJECT_ID "$NEXT_PUBLIC_FIREBASE_PROJECT_ID"
add_env NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
add_env NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
add_env NEXT_PUBLIC_FIREBASE_APP_ID "$NEXT_PUBLIC_FIREBASE_APP_ID"

if [ -f firebase-admin.json ]; then
  JSON=$(node -e "console.log(JSON.stringify(require('./firebase-admin.json')))")
  add_env FIREBASE_SERVICE_ACCOUNT_JSON "$JSON"
else
  add_env FIREBASE_ADMIN_PROJECT_ID "$FIREBASE_ADMIN_PROJECT_ID"
  add_env FIREBASE_ADMIN_CLIENT_EMAIL "$FIREBASE_ADMIN_CLIENT_EMAIL"
  add_env FIREBASE_ADMIN_PRIVATE_KEY "$FIREBASE_ADMIN_PRIVATE_KEY"
fi

TICKET="${TICKET_SECRET_KEY:-}"
if [ "$TICKET" = "dev-secret-change-in-production" ] || [ -z "$TICKET" ]; then
  TICKET=$(openssl rand -base64 32)
  echo "  → Yeni TICKET_SECRET_KEY üretildi"
fi
add_env TICKET_SECRET_KEY "$TICKET"

echo ""
echo "✅ Env yüklendi. Deploy: npm run deploy"
