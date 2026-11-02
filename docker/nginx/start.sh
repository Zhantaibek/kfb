#!/bin/sh
# Запуск nginx (сервис proxy). Конфиг выбирается по наличию сертификата для DOMAIN:
#   есть /etc/letsencrypt/live/$DOMAIN/fullchain.pem → https.conf.template (HTTPS + переадресация с HTTP);
#   нет (DOMAIN не задан или certbot ещё не выпустил) → http.conf.
# Раз в 5 минут проверяем сертификат: появился или обновился (certbot продлевает сам) — пересобираем конфиг
# и перечитываем его без перезапуска контейнера.
set -eu

DOMAIN="${DOMAIN:-}"
CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

render() {
  if [ -n "$DOMAIN" ] && [ -f "$CERT" ]; then
    envsubst '${DOMAIN}' < /etc/nginx/kse/https.conf.template > /etc/nginx/conf.d/default.conf
    echo "proxy: HTTPS для $DOMAIN"
  else
    cp /etc/nginx/kse/http.conf /etc/nginx/conf.d/default.conf
    [ -n "$DOMAIN" ] && echo "proxy: сертификата для $DOMAIN пока нет — работаю по HTTP" || echo "proxy: DOMAIN не задан — HTTP"
  fi
}

fingerprint() {
  [ -n "$DOMAIN" ] && [ -f "$CERT" ] && md5sum "$CERT" | cut -d' ' -f1 || echo none
}

render
nginx -t
nginx -g 'daemon off;' &
NGINX_PID=$!
LAST="$(fingerprint)"

while kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 300
  CURRENT="$(fingerprint)"
  if [ "$CURRENT" != "$LAST" ]; then
    render
    nginx -t && nginx -s reload
    LAST="$CURRENT"
  fi
done
wait "$NGINX_PID"
