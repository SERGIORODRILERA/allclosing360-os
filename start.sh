#!/bin/bash
# Arranca ALLCLOSING360 OS con HTTPS via Cloudflare Tunnel
cd /opt/allclosing360

echo "🚀 Iniciando ALLCLOSING360 OS..."
pkill -f "next dev" 2>/dev/null
pkill cloudflared 2>/dev/null
sleep 1

# Start Next.js
pnpm --filter web dev > /tmp/ac360-next.log 2>&1 &
echo "⏳ Esperando servidor..."
sleep 10

# Start cloudflare tunnel
cloudflared tunnel --url http://localhost:3000 > /tmp/ac360-cf.log 2>&1 &
sleep 8

URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/ac360-cf.log | head -1)
echo ""
echo "✅ ALLCLOSING360 OS listo!"
echo ""
echo "🔒 URL HTTPS (mic funciona): $URL"
echo "🔓 URL local:                http://localhost:3000"
echo "🔓 URL VPS:                  http://187.77.120.200:3000"
echo ""
echo "💡 Para GitHub permanente, necesitas el token en el repositorio."
