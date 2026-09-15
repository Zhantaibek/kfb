FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

COPY backend/package.json ./backend/

COPY frontend/package.json ./frontend/

COPY shared ./shared

COPY backend/prisma ./backend/prisma

RUN npm install --workspace=backend --omit=dev



FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

COPY backend ./backend

COPY shared ./shared

RUN npm install --workspace=backend

RUN npm run build -w backend



FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules

COPY --from=build /app/backend/dist ./backend/dist

COPY --from=build /app/backend/package.json ./backend/package.json

COPY --from=build /app/backend/prisma ./backend/prisma

COPY --from=build /app/shared ./shared

RUN mkdir -p /app/uploads

WORKDIR /app/backend

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/backend/src/index.js"]

