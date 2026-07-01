#!/bin/sh
export NEXT_TELEMETRY_DISABLED=1

echo ""
echo "=========================================="
echo "  Bilet Feed Dev Server"
echo "=========================================="
echo ""
echo "  ⏳ İlk açılış ~8-13 dk sürebilir — NORMAL"
echo "  ❌  Ctrl+C basma!"
echo "  🌐  Tarayıcıda localhost sekmelerini kapat"
echo "  ✅  Port açılınca → http://localhost:3000"
echo ""

if [ -d .next/cache/webpack ] && [ "${DEV_SKIP_CACHE_WIPE:-}" != "1" ]; then
  echo "  → Webpack cache temizleniyor..."
  rm -rf .next/cache/webpack
fi

TIMER_PID=

stop_timer() {
  if [ -n "$TIMER_PID" ]; then
    kill "$TIMER_PID" 2>/dev/null
    TIMER_PID=
  fi
}

# İlerleme + port kontrolü (pipe subshell bug'ından kaçın)
(
  elapsed=0
  port_seen=0
  while [ "$elapsed" -lt 1200 ]; do
    sleep 30
    elapsed=$((elapsed + 30))
    min=$((elapsed / 60))

    if lsof -ti :3000 -sTCP:LISTEN >/dev/null 2>&1; then
      port_seen=$((port_seen + 1))
      echo "  → Port 3000 açık — http://localhost:3000 (compile devam edebilir)"
      if [ "$port_seen" -ge 2 ]; then
        exit 0
      fi
    else
      echo "  → Hala başlıyor... (${min} dk geçti — devam ediyor)"
    fi
  done
  echo "  ⚠️  20 dk geçti. npm run dev:kill && npm run dev:fast ile yeniden deneyin."
) &
TIMER_PID=$!

trap "stop_timer" EXIT INT TERM

exec node ./node_modules/next/dist/bin/next dev -p 3000 "$@"
