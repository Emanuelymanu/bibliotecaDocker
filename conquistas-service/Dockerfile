FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json nest-cli.json tsconfig*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health > /dev/null || exit 1

CMD ["node", "dist/main"]
