#!/bin/sh
# Next.js yanlış workspace root seçimini düzelt
# Sebep: /Users/user/package-lock.json → tüm home dizini taranıyor, dev 20+ dk takılıyor

STRAY="/Users/user/package-lock.json"
BACKUP="/Users/user/package-lock.json.bak.biletfeed"

if [ -f "$STRAY" ]; then
  echo "→ Sorunlu dosya bulundu: $STRAY"
  echo "→ Yedekleniyor: $BACKUP"
  mv "$STRAY" "$BACKUP"
  echo "✅ Taşındı. Dev server artık doğru klasörü tarayacak."
else
  echo "→ $STRAY yok (zaten düzeltilmiş)."
fi

cd "$(dirname "$0")/.." || exit 1
node -e "const {findRootDir}=require('next/dist/lib/find-root'); console.log('Workspace root:', findRootDir(process.cwd()));"
