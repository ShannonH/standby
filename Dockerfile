# syntax=docker/dockerfile:1.7
#
# Standby — multi-stage build.
#
# Build stage: node:20-alpine compiles the SPA. Runtime stage: nginx:alpine
# (~25 MB) serves the static dist/ with SPA routing and sensible caching.
#
# Build with a base path different from the default `/`:
#   docker build --build-arg VITE_BASE_PATH=/standby/ -t standby .

# ─── Build stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

# Install deps first (cached unless package.json changes).
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Build the SPA.
COPY . .
RUN npm run build

# ─── Runtime stage ────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Drop default config; ours handles SPA fallback + caching.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
