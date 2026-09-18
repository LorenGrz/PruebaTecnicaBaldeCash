# syntax=docker/dockerfile:1

# Next.js 16 en modo `output: "standalone"` (ver next.config.ts): la etapa de
# build genera un servidor Node autocontenido en .next/standalone, así que la
# imagen final no necesita node_modules completo ni el resto del toolchain.
#
# node:26-alpine no trae pnpm/corepack preinstalados en esta versión de Node:
# se instalan explícitamente en la etapa que compila.

ARG VERSION_PNPM=12.3.4

# NEXT_PUBLIC_API_URL la lee el navegador del usuario (Next la incrusta en el
# bundle del cliente en build time), por eso el default apunta a localhost:
# es la URL con la que el navegador de quien visita http://localhost:3000
# puede llegar a la API publicada en el host.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api

###############################################################################
# 1. dependencias: node_modules completo (con devDependencies) para compilar
###############################################################################
FROM node:26-alpine AS dependencias
ARG VERSION_PNPM
WORKDIR /app
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@${VERSION_PNPM} --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

###############################################################################
# 2. build: compila con `next build`, NEXT_PUBLIC_API_URL queda embebida
###############################################################################
FROM dependencias AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY . .
RUN pnpm build

###############################################################################
# 3. runtime: solo el output standalone, usuario no root
###############################################################################
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# node:26-alpine ya trae el usuario "node" (uid 1000) sin privilegios.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["node", "server.js"]
