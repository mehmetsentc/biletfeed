#!/bin/bash
cd "$(dirname "$0")"
echo "=== BiletFeed favicon üretiliyor ==="

# sips ile PNG boyutlandır (macOS built-in, Pillow gerekmez)
sips -z 512 512 favicon_neon.png --out public/brand/favicon.png
echo "favicon.png OK (512x512)"

sips -z 192 192 favicon_neon.png --out public/brand/favicon-192.png
echo "favicon-192.png OK (192x192)"

echo ""
echo "=== Git commit & push ==="
git add public/brand/favicon.png public/brand/favicon-192.png
git commit -m "chore: favicon güncelle — neon logo [deploy]"
git push
echo ""
echo "=== Tamamlandı ==="
