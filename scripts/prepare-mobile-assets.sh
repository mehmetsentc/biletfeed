#!/usr/bin/env sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/brand/favicon.png"
ASSETS="$ROOT/mobile/assets"

if [ ! -f "$SRC" ]; then
  echo "Kaynak bulunamadı: $SRC"
  echo "1024×1024 PNG'yi mobile/assets/icon-only.png olarak ekleyin."
  exit 1
fi

mkdir -p "$ASSETS"
cp "$SRC" "$ASSETS/icon-only.png"
cp "$SRC" "$ASSETS/splash.png"
echo "OK: icon-only.png ve splash.png favicon'dan kopyalandı."
echo "Mağaza gönderiminden önce 1024×1024 ikon ve 2732×2732 splash ile değiştirin."
echo "Sonra: cd mobile && npm run assets:generate && npm run cap:sync"
