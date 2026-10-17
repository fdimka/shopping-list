FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/orders-api/package.json apps/orders-api/package.json
RUN npm ci
COPY apps/web apps/web
ENV VITE_CATALOG_API_URL=/catalog
ENV VITE_ORDERS_API_URL=/orders
RUN npm run build -w apps/web
FROM nginx:stable-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
