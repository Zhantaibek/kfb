#!/bin/sh
# Резервные копии (сервис backup в docker-compose.yml): раз в сутки дамп базы и архив загруженных файлов
# в /backups (на хосте — ./backups). Хранятся BACKUP_KEEP_DAYS дней (по умолчанию 14).
# Восстановление — см. README, раздел «Резервные копии».
set -eu

KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"

run_backup() {
  stamp=$(date +%Y-%m-%d_%H%M)
  # Сначала во временный файл: оборванная копия не выдаст себя за готовую.
  pg_dump --format=custom --no-owner --file="/backups/kse-db-$stamp.dump.part" \
    && mv "/backups/kse-db-$stamp.dump.part" "/backups/kse-db-$stamp.dump"
  tar -czf "/backups/kse-uploads-$stamp.tar.gz.part" -C /uploads . \
    && mv "/backups/kse-uploads-$stamp.tar.gz.part" "/backups/kse-uploads-$stamp.tar.gz"
  find /backups -name 'kse-*' -mtime +"$KEEP_DAYS" -delete
  echo "$(date -Iseconds) backup ok: kse-db-$stamp.dump, kse-uploads-$stamp.tar.gz"
}

while true; do
  run_backup || echo "$(date -Iseconds) BACKUP FAILED" >&2
  sleep "$INTERVAL"
done
