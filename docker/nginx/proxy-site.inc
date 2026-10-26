# Проксирование на сайт (web) — общее для HTTP- и HTTPS-режима (см. start.sh).
# X-Forwarded-For ПЕРЕЗАПИСЫВАЕТСЯ адресом клиента: по нему backend считает лимит попыток входа,
# и присланный клиентом заголовок не должен попадать дальше.

# Как proxyClientMaxBodySize в next.config.ts — загрузка видео и документов в админке.
client_max_body_size 100m;

location / {
  proxy_pass http://web:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
}
