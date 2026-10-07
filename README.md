Сайт Кыргызской фондовой биржи и Учебный центр КФБ — одно приложение: Next.js (frontend) и Express (backend).

```
kse-kg/
  frontend/            Next.js 16, UI и страницы
    src/edu/           Учебный центр (React Router внутри страницы /education/app)
  backend/             Express API, PostgreSQL CMS, загрузки
    src/edu/           API учебного центра (/api/edu)
    prisma/edu/        схема и миграции учебного центра (схема `edu` той же базы)
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

Нужен PostgreSQL (`localhost:5433`, база `kse`). Одна команда `npm run dev` поднимает и сайт, и учебный центр.

| Сервис | URL |
|--------|-----|
| Сайт КФБ | http://localhost:3000 |
| Учебный центр | http://localhost:3000/education/app |
| API КФБ | http://localhost:4000/api |
| API учебного центра | http://localhost:4000/api/edu |

## Учебный центр

- **Вход общий.** Человек входит на сайте (`/login`), а учебный центр получает токен по cookie сайта
  (`GET /api/edu/session`). Кто вошёл на сайт впервые — получает аккаунт учебного центра по email:
  админ/редактор сайта → `ADMIN`, остальные → `STUDENT`.
- **Преподаватели и студенты учебного центра** входят через тот же `/login` своими паролями.
- **База.** Таблицы учебного центра — в схеме `edu` базы `kse`; миграции применяются при старте бэкенда
  (`prisma migrate deploy --schema prisma/edu/schema.prisma`). Prisma-клиент генерируется в
  `backend/src/edu/prisma-client` (не в git).
- **Файлы** (видео, картинки уроков) — в `backend/uploads/edu`, раздаются как `/uploads/edu/…`.
- **Почта** (регистрация студентов, ссылка для входа) — переменные `SMTP_*` в `.env`.
- **Стили.** Учебный центр на Tailwind (`src/edu/index.css`), сайт — на CSS-модулях; базовые правила
  сайта лежат в `@layer base`, чтобы не перебивать утилиты Tailwind.

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

## CMS

Данные в PostgreSQL через **Prisma ORM**. Миграции: `npm run db:migrate` / `npm run db:deploy`.

## Демо-доступы

| Где | Email | Пароль |
|-----|-------|--------|
| Кабинет сайта | `investor@kse.kg` | `kse` |
| Админка `/admin` | `admin@kse.kg` | `admin` |
| Учебный центр — преподаватель | `teacher@edu.local` | `Teacher123!` |
| Учебный центр — студент | `student@edu.local` | `Student123!` |
| Учебный центр — администратор | `admin@edu.local` | `Admin123!` |
