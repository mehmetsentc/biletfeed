#!/bin/sh
# Tüm Next.js süreçlerini durdur

echo "→ Süreçler durduruluyor..."

for port in 3000 3001; do
  pids=$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Port ${port}: PID ${pids}"
    kill -9 $pids 2>/dev/null || true
  fi
done

pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "next/dist/bin/next" 2>/dev/null || true
pkill -9 -f "platforms-main/node_modules/.bin/next" 2>/dev/null || true

sleep 1
echo "→ Portlar temiz"
