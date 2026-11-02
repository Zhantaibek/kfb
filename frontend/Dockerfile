FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci --workspace=frontend
COPY frontend ./frontend
COPY shared ./shared
ARG API_URL=http://api:4000
ENV API_URL=$API_URL
RUN npm run build -w frontend

# Запуск из standalone-сборки: только трассированные файлы, без полного node_modules.
FROM node:22-alpine
ENV NODE_ENV=production
ENV API_URL=http://api:4000
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/frontend/.next/static ./frontend/.next/static
COPY --from=build --chown=node:node /app/frontend/public ./frontend/public
USER node
WORKDIR /app/frontend
EXPOSE 3000
CMD ["node", "server.js"]
