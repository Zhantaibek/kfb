Сайт Кыргызской фондовой биржи: Next.js (frontend) и Express (backend).

```
kse-kg/
  frontend/    Next.js 16, UI и страницы
  backend/     Express API, PostgreSQL CMS, загрузки
  shared/      общие типы CMS
```

Учебная платформа вынесена в соседнюю папку: [`../kse-edu`](../kse-edu). На сайте — только ссылка (`NEXT_PUBLIC_EDU_URL`).

## Запуск (dev)

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Нужен Docker для PostgreSQL.

| Сервис | URL |
|--------|-----|
| Сайт КФБ | http://localhost:3000 |
| API КФБ | http://localhost:4000 |
| Раздел «Учебный центр» | http://localhost:3000/education |

Ссылка «Онлайн-платформа» → `NEXT_PUBLIC_EDU_URL` (по умолчанию `http://127.0.0.1:5173/education/app`).

PostgreSQL: `localhost:5433` — БД `kse`. При первом запуске контейнера также создаётся `education_crm` для `kse-edu`.

## Учебная платформа

Отдельный проект: **`Desktop/kse-edu`**.

```bash
cd ../kse-edu
npm install
npm run db:setup
npm run dev
```

## Production (Docker)

```bash
docker compose up -d --build
```

Учебная платформа: `cd ../kse-edu && docker compose up -d --build`.

## CMS

Данные в PostgreSQL через **Prisma ORM**. Миграции: `npm run db:migrate` / `npm run db:deploy`.

## Авторизация (сайт КФБ)

- кабинет `/login`: `investor@kse.kg` / `kse`
- админка `/admin`: `admin@kse.kg` / `admin`
