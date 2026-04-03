# Node LTS on Alpine — small image; IDE/CVE scanners often flag any base image — treat as informational.
FROM node:20-alpine

RUN apk upgrade --no-cache && apk add --no-cache curl

RUN npm install -g pnpm@9

WORKDIR /app

RUN pnpm config set network-timeout 300000 && \
	pnpm config set fetch-retries 5 && \
	pnpm config set fetch-retry-mintimeout 20000 && \
	pnpm config set fetch-retry-maxtimeout 120000 && \
	pnpm config set registry https://registry.npmjs.org/

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./

COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

RUN pnpm install

WORKDIR /app/shared
RUN cd /app/server && pnpm exec tsc --project /app/shared/tsconfig.json

WORKDIR /app/server

RUN rm -f .env .env.prod

# Runtime: Docker Compose `env_file` (root `.env`), not baked into the image.

RUN pnpm run build

RUN mkdir -p logs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
	CMD curl -f http://localhost:3002/api/health/liveness || exit 1

CMD ["node", "dist/server/src/main.js"]
