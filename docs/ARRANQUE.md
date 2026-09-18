# Arranque del proyecto

Dos caminos para levantar BaldeCash desde cero: con Docker (recomendado, un
solo comando) o sin Docker (tres procesos aparte, útil para desarrollar con
recarga en caliente).

## Con Docker Compose

Requisitos: Docker Engine con el plugin `compose` (`docker compose version`).

```bash
git clone <url-del-repositorio>
cd prueba-tecnica-baldecash
cp .env.example .env      # opcional: solo si querés cambiar algún default
docker compose up
```

Qué pasa al levantar:

1. `db` (PostgreSQL 16) arranca y espera a estar `healthy` (`pg_isready`).
2. `api` arranca recién cuando `db` está sana. Antes de servir tráfico corre,
   en este orden, las migraciones de TypeORM y el seed de datos de ejemplo
   (el seed es idempotente: borra y recarga, así que es seguro repetirlo en
   cada arranque). Cuando termina, levanta el servidor Nest y expone
   `GET /api/salud`, que es lo que su propio healthcheck consulta.
3. `web` arranca recién cuando `api` está sana.

URLs resultantes (con los puertos por defecto):

- Frontend: http://localhost:3000
- API: http://localhost:3001/api (ejemplo: http://localhost:3001/api/salud)
- PostgreSQL: `localhost:5432` (para conectarse con un cliente SQL desde el host)

Para pararlo:

```bash
docker compose down          # borra los contenedores, conserva el volumen de datos
docker compose down -v       # además borra los datos de Postgres
```

### Variable `NEXT_PUBLIC_API_URL`: por qué apunta a `localhost` y no a `api`

`NEXT_PUBLIC_API_URL` la lee el **navegador** de quien visita
`http://localhost:3000`, no el servidor de Next dentro del contenedor. Next
la incrusta en el bundle del cliente en build time (es un `ARG` de
`web/Dockerfile`), así que tiene que ser una URL a la que el navegador del
usuario pueda llegar desde fuera de la red de Docker: `http://localhost:3001/api`,
el puerto que `api` publica en el host.

El frontend **sí** llama a la API desde el servidor de Next: las pantallas
son server components y traen sus datos ahí. Esas llamadas no pueden usar
`localhost`, porque dentro del contenedor de `web` eso apunta al propio
`web` y no a `api`. Para eso está `API_URL_INTERNA`, que el compose fija en
`http://api:3001/api` (el nombre del servicio en la red de Compose). Va sin
el prefijo `NEXT_PUBLIC_` justamente para que no se filtre al bundle del
navegador.

Resumiendo las dos URLs, que son distintas a propósito:

| Variable | Quién la usa | Valor en Compose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | el navegador del usuario | `http://localhost:3001/api` |
| `API_URL_INTERNA` | el servidor de Next | `http://api:3001/api` |

### Cambiar puertos o credenciales

Editar `.env` en la raíz (ver `.env.example` para la lista completa) y volver
a levantar. Por ejemplo, para no chocar con un Postgres local en 5432:

```bash
echo "DB_PORT=5433" >> .env
docker compose up -d
```

## Sin Docker

Requisitos: Node.js v26, `pnpm` (`corepack enable` o `npm install -g pnpm`).

1. Levantar solo la base de datos con Docker:

   ```bash
   docker compose up -d db
   ```

2. API (en una terminal, desde `api/`):

   ```bash
   cd api
   cp .env.example .env      # DB_HOST=localhost por default, ya apunta al puerto publicado por "db"
   pnpm install
   pnpm migration:run
   pnpm seed
   pnpm start:dev
   ```

   Queda en http://localhost:3001/api.

3. Frontend (en otra terminal, desde `web/`):

   ```bash
   cd web
   cp .env.example .env      # NEXT_PUBLIC_API_URL=http://localhost:3001/api
   pnpm install
   pnpm dev
   ```

   Queda en http://localhost:3000.
