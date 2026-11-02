#!/bin/sh
# Сертификат Let's Encrypt для сайта (сервис certbot). Нужны DOMAIN (например kse.kg) и LETSENCRYPT_EMAIL
# (на него Let's Encrypt пишет о проблемах с продлением). Домен должен указывать на этот сервер, порт 80 — открыт.
# Проверка идёт через nginx (сервис proxy): файлы в /var/www/certbot, адрес /.well-known/acme-challenge/.
# Первый выпуск — сразу при старте, потом попытка продления каждые 12 часов (certbot продлевает за 30 дней до срока).
set -eu

DOMAIN="${DOMAIN:-}"
EMAIL="${LETSENCRYPT_EMAIL:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "certbot: DOMAIN или LETSENCRYPT_EMAIL не заданы — сертификат не выпускается (сайт работает по HTTP)."
  exec sleep infinity
fi

# Дать nginx подняться и начать отвечать на проверку.
sleep 15

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" \
    --email "$EMAIL" --agree-tos --no-eff-email --non-interactive \
    ${LETSENCRYPT_STAGING:+--staging} \
    || echo "certbot: выпуск не удался — проверьте, что $DOMAIN указывает на этот сервер и порт 80 открыт. Повтор через 12 часов."
fi

while :; do
  sleep 12h
  certbot renew --webroot -w /var/www/certbot --non-interactive || echo "certbot: продление не удалось, повтор через 12 часов"
done
