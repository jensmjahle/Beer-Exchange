# --- Builder Stage ---
FROM node:18 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime Stage ---
FROM node:18-slim

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/dist ./
COPY ./runtime-env.sh /app/runtime-env.sh
RUN chmod +x /app/runtime-env.sh

EXPOSE 8080

CMD ["/bin/sh", "-c", "./runtime-env.sh && serve -s . -l 8080"]
