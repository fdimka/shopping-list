FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/orders-api/package.json apps/orders-api/package.json
RUN npm ci
COPY apps/orders-api apps/orders-api
RUN npm run build -w apps/orders-api
FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/orders-api/package.json apps/orders-api/package.json
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/apps/orders-api/dist apps/orders-api/dist
USER node
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/orders-api/dist/main.js"]
