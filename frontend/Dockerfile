FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm install --workspace=frontend

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY frontend ./frontend
COPY shared ./shared
ARG API_URL=http://api:4000
ENV API_URL=$API_URL
RUN npm run build -w frontend

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV API_URL=http://api:4000
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/package.json ./frontend/package.json
COPY --from=build /app/frontend/next.config.ts ./frontend/next.config.ts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
WORKDIR /app/frontend
EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
