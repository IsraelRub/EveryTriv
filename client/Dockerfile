# Multi-stage: builder = Node toolchain; final image = nginx + static `dist/` only (`COPY --from=builder`).
FROM node:20-alpine AS builder

RUN apk upgrade --no-cache

RUN npm install -g pnpm@9

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

COPY .npmrc ./

RUN pnpm install

ARG VITE_API_BASE_URL=USE_ORIGIN_API_PREFIX
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app/client
RUN pnpm run build

FROM nginx:1.27-alpine

RUN apk upgrade --no-cache

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
