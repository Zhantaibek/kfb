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

## CMS

Данные в PostgreSQL через **Prisma ORM**. Миграции: `npm run db:migrate` / `npm run db:deploy`.

## Демо-доступы

| Где | Email | Пароль |
|-----|-------|--------|
| Кабинет сайта | `investor@kse.kg` | `kse` |
| Админка `/admin` | `admin@kse.kg` | `admin` |
