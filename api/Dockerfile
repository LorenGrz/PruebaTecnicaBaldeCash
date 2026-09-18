# syntax=docker/dockerfile:1

# La API es ESM (NestJS 12 + TypeScript, "type": "module") y usa TypeORM en
# tiempo de ejecución para correr migraciones y el seed, así que la imagen
# final necesita el CLI de TypeORM pero no las herramientas de build de Nest.
#
# node:26-alpine porque el proyecto exige Node v26 y no trae pnpm ni corepack
# preinstalados en esta versión: se instalan explícitamente en cada etapa que
# los necesita.

ARG VERSION_PNPM=12.3.4

###############################################################################
# 1. dependencias: node_modules completo (con devDependencies) para compilar
###############################################################################
FROM node:26-alpine AS dependencias
ARG VERSION_PNPM
WORKDIR /app
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@${VERSION_PNPM} --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

###############################################################################
# 2. build: compila TypeScript -> dist/ con `nest build`
###############################################################################
FROM dependencias AS build
COPY . .
RUN pnpm build

###############################################################################
# 3. dependencias-produccion: solo las dependencies del package.json
###############################################################################
FROM node:26-alpine AS dependencias-produccion
ARG VERSION_PNPM
WORKDIR /app
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@${VERSION_PNPM} --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

###############################################################################
# 4. runtime: imagen final liviana, sin toolchain de build, usuario no root
###############################################################################
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# node:26-alpine ya trae el usuario "node" (uid 1000) sin privilegios.
COPY --from=dependencias-produccion --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3001

# El arranque real (migraciones + seed + servidor) lo define el `command`
# del servicio en docker-compose.yml, para poder encadenar los tres pasos
# sin reconstruir la imagen. Este CMD es el valor por defecto si se corre
# el contenedor suelto, sin ese `command`.
CMD ["node", "dist/main.js"]
