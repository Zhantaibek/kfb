Сайт Кыргызской фондовой биржи: Next.js (frontend) и Express (backend).

Учебный центр КФБ — отдельный проект ([kse-edu](https://github.com/Zhantaibek/kse-edu)) со своим сервером, базой и входом.
Сайт только ссылается на него: адрес задаётся `NEXT_PUBLIC_EDU_URL`, старые адреса `/education/…` перенаправляют туда.

```
kse-kg/
  frontend/            Next.js 16, UI и страницы
  backend/             Express API, PostgreSQL CMS, загрузки
  shared/              общие типы CMS
```

## Запуск (dev)

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Нужен PostgreSQL (`localhost:5433`, база `kse`). `npm run dev` поднимает сайт и его API.

| Сервис | URL |
|--------|-----|
| Сайт КФБ | http://localhost:3000 |
| API КФБ | http://localhost:4000/api |

## Живые данные торгов с kse.kg

Бэкенд (`backend/src/modules/kse-sync`) раз в 15 минут забирает с kse.kg итоги торгов, архив, индекс и капитализацию,
котировки, драгметаллы, расписание и результаты аукционов ГЦБ, объём ГЦБ, депозитные аукционы, рейтинг и список
участников, «Финансовый рынок KG» — и хранит последний удачный снимок каждого раздела в таблице `kse_snapshots`.
Если kse.kg недоступен, сайт показывает прежние данные (страница подписывает время и источник).

- API: `GET /api/public/market/:key`; выключить синхронизацию — `KSE_SYNC=off` (например, без интернета).
- Страницы: `/market`, `/market/archive`, `/market/index`, `/market/quotes`, `/market/metals`, `/gcb`,
  `/gcb/results`, `/gcb/volume`, `/gcb/deposits`, `/members`, `/members/rating`, `/finmarket`.
- Бегущая строка, блок «Рынок» на главной и подвал берут цифры отсюда же (`frontend/src/lib/market-data.ts`);
  пока снимков нет — демо-данные `frontend/src/data/catalog.ts`.
- Тексты разделов kse.kg — `node backend/scripts/import-kse-pages.mjs` (страницы попадают в админку, правки не затираются).

## Production (Docker)

```bash
docker compose up -d --build
```

Снаружи сайт открывается через сервис `proxy` (nginx, порты 80 и 443, конфиги `docker/nginx`); `web` и `api`
доступны только с этой машины. Nginx **перезаписывает** `X-Forwarded-For` адресом клиента — по нему считается
ограничение попыток входа, и подставной заголовок клиента его не обходит. Свой прокси вместо `proxy` тоже должен ставить
`proxy_set_header X-Forwarded-For $remote_addr;` (не `$proxy_add_x_forwarded_for`).

### HTTPS

Обязателен: cookie входа в production помечена `Secure`. В `.env`:

```bash
DOMAIN=kse.kg                      # домен указывает на этот сервер, порты 80 и 443 открыты
LETSENCRYPT_EMAIL=admin@kse.kg     # сюда Let's Encrypt пишет о проблемах с продлением
CORS_ORIGIN=https://kse.kg
```

Сервис `certbot` сам выпускает сертификат Let's Encrypt при первом запуске и продлевает его (проверка каждые 12 часов).
Пока сертификата нет, `proxy` работает по HTTP и отвечает на проверку Let's Encrypt; как только сертификат появился —
в течение 5 минут переключается на HTTPS без перезапуска (HTTP → переадресация на HTTPS, TLS 1.2/1.3).
Для пробного запуска без лимитов Let's Encrypt — `LETSENCRYPT_STAGING=1` (сертификат будет недоверенным).

### Двухфакторный вход

В production каждый сотрудник входит с паролем **и** 6-значным кодом из приложения-аутентификатора (Google
Authenticator, Microsoft Authenticator, Яндекс Ключ). При первом входе админка открывает «Профиль» с QR-кодом —
пока 2FA не настроен, остальные разделы недоступны. Потерян телефон — администратор нажимает «Сбросить 2FA»
в разделе «Пользователи». Секреты хранятся в базе зашифрованными (ключ из `SESSION_SECRET`: при его смене
сотрудникам нужно настроить 2FA заново). `MFA_REQUIRED=off` снимает требование (не рекомендуется).

### Раскрытие информации

Существенные факты эмитентов хранятся в базе (`disclosure_events`). Раз в 6 часов API обходит страницы эмитентов
kse.kg и добавляет новые события; вручную событие добавляют или удаляют в админке («Раскрытие информации»).
Первое заполнение — снимок `shared/disclosure-seed.ts`.

### Резервные копии

Сервис `backup` раз в сутки кладёт в `./backups` дамп базы (`kse-db-*.dump`) и архив загруженных файлов
(`kse-uploads-*.tar.gz`), хранит 14 дней (`BACKUP_KEEP_DAYS`). Папку `./backups` стоит копировать на другой сервер.
Восстановление:

```bash
docker compose exec -T postgres pg_restore -U kse -d kse --clean --if-exists < backups/kse-db-<дата>.dump
docker run --rm -v kfb_kse_uploads:/uploads -v "$PWD/backups:/b" alpine tar -xzf /b/kse-uploads-<дата>.tar.gz -C /uploads
```

### Мониторинг

- `GET /api/health` — API и база (200 / ошибка).
- `GET /api/health/market` — свежесть данных торгов с kse.kg: **503**, если какой-то снимок не обновлялся больше 2 часов
  (сломался разбор страниц или kse.kg недоступен), а раскрытие информации — больше 13 часов. Оба адреса стоит
  поставить во внешний uptime-мониторинг.

### Уведомления о заявках

Заявки с форм сайта всегда сохраняются и видны в админке («Заявки»). Дополнительно — письмо и/или Telegram:
`SMTP_URL` + `REQUEST_NOTIFY_EMAIL` (+ `SMTP_FROM`), `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — см. `.env.example`.

## CMS

Данные в PostgreSQL через **Prisma ORM**. Миграции: `npm run db:migrate` / `npm run db:deploy`.

## Демо-доступы

| Где | Email | Пароль |
|-----|-------|--------|
| Админка `/admin` | `admin@kse.kg` | `admin` |
