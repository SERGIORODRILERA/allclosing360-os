#!/bin/bash
# Run this script AFTER adding the A record DNS: app.allclosing360.com → 187.77.120.200
# It will get the SSL cert and switch nginx to HTTPS

DOMAIN="app.allclosing360.com"
EMAIL="sergio@salehuntac.com"

echo "==> Checking DNS resolution for $DOMAIN..."
RESOLVED=$(dig +short $DOMAIN A | head -1)
if [ "$RESOLVED" != "187.77.120.200" ]; then
  echo "DNS not yet pointing to this server (got: $RESOLVED). Waiting..."
  for i in $(seq 1 30); do
    sleep 10
    RESOLVED=$(dig +short $DOMAIN A | head -1)
    echo "  Attempt $i: $RESOLVED"
    if [ "$RESOLVED" = "187.77.120.200" ]; then break; fi
  done
fi

if [ "$RESOLVED" != "187.77.120.200" ]; then
  echo "ERROR: DNS still not resolved after 5 minutes. Please check your DNS settings."
  exit 1
fi

echo "==> DNS OK. Obtaining SSL certificate..."
certbot certonly --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domains "$DOMAIN" \
  --redirect

echo "==> Switching to full HTTPS config..."
ln -sf /etc/nginx/sites-available/allclosing360 /etc/nginx/sites-enabled/allclosing360
nginx -t && systemctl reload nginx

echo ""
echo "✅ DONE — App available at: https://$DOMAIN"
echo ""
echo "Auto-renewal is handled by certbot's systemd timer."
systemctl status certbot.timer --no-pager | grep -E "Active:|Next"
