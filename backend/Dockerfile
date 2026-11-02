# Сборка: все зависимости backend, генерация Prisma Client, компиляция TypeScript.
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=backend
COPY backend ./backend
COPY shared ./shared
RUN npm run build -w backend

# Запуск: только production-зависимости. Prisma CLI в них (закреплённая версия) — для migrate deploy при старте.
FROM node:22-alpine
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY backend/prisma ./backend/prisma
# Кэш загрузок npm/Prisma удаляется в том же слое: при запуске он не нужен (+250 МБ к образу).
RUN npm ci --workspace=backend --omit=dev \
  && cd backend && npx --no-install prisma generate \
  && rm -rf /root/.npm /root/.cache
COPY --from=build /app/backend/dist ./backend/dist
COPY shared ./shared
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
WORKDIR /app/backend
EXPOSE 4000
CMD ["sh", "-c", "npx --no-install prisma migrate deploy && node dist/backend/src/index.js"]
