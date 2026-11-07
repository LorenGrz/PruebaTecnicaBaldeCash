# Instrucciones de repositorio para GitHub Copilot

Este repositorio es un proyecto full-stack de financiamiento con dos apps separadas: `api/` (NestJS + TypeORM + PostgreSQL) y `web/` (Next.js App Router + React + Tailwind). La regla central es mantener la lógica de negocio en `dominio/` y no duplicarla en controladores ni componentes.

## Stack y arquitectura

- Backend: `api/` con NestJS 12, TypeScript ESM, PostgreSQL 16 y migraciones versionadas.
- Frontend: `web/` con Next.js 16, React 19 y Tailwind v4.
- El dominio está duplicado en `api/src/dominio/` y `web/src/dominio/` por decisión deliberada del proyecto, sin monorepo.
- Las reglas de negocio viven en clases puras (`Solicitud`, `Usuario`), no en DTOs ni componentes.
- La API siempre valida por backend; el frontend solo ofrece UX y estimación local.

## Estructura relevante

- `api/src/dominio/`: lógica de negocio, validaciones, cálculo de cuota, estados y permisos.
- `api/src/solicitudes/` y `api/src/usuarios/`: controller, service, repository, presenter, DTO.
- `api/src/auth/`: guard de identidad y decoradores.
- `api/src/persistencia/`: entidades, mappers, migraciones y seed.
- `web/src/dominio/`: copia del dominio para el frontend.
- `web/src/app/`: rutas del App Router.
- `web/src/acciones/`: server actions.
- `web/src/lib/`: cliente HTTP, servicio, sesión y tipos.
- `web/src/components/`: UI y formularios.

## Reglas de código

- Todo en español: archivos, clases, métodos, variables y comentarios.
- Mantener la separación de capas: dominio > servicio > repositorio > persistencia.
- No poner rangos de negocio en decorators o controles de UI; el dominio decide.
- No usar `UPDATE ... SET estado`: transicionar con métodos del dominio (`aprobar`, `rechazar`).
- Las migraciones son la única forma de crear/alterar esquema; no depender de `synchronize`.
- El `presentador` serializa la salida para no exponer propiedades internas como `_estado`.
- La API devuelve errores de dominio con un filtro central, no `res.status()` a mano.
- Orden de rutas: `mias` antes que `:id` para evitar que se interprete como ID.
- Los importes monetarios son `numeric` en la base y se normalizan en el borde.

## Verificación y comandos

Usar siempre los scripts del proyecto y preferir la mínima validación útil.

### API

```bash
cd api
pnpm install
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm migration:run
pnpm seed
pnpm dev
```

### Frontend

```bash
cd web
pnpm install
pnpm typecheck
pnpm lint --max-warnings 0
pnpm build
pnpm dominio:verificar
pnpm dev
```

### Docker

```bash
docker compose up
```

## Qué no hacer

- No tocar la lógica de negocio duplicada en `api` y `web` sin reflejar ambos lados.
- No inventar nuevos estados o rangos sin migración y sin actualizar el dominio.
- No ocultar reglas de acceso en la UI; la API debe protegerlas también.
- No introducir un cambio de esquema sin migración y sin validar el impacto en `INSERT`/`SELECT`.
- No crear muestras de datos que rompan el seed o la base de extensión del proyecto.

## Pedidos esperables

Cuando hagas cambios, prioriza:

1. Mantener la arquitectura actual.
2. Corregir el problema mínimo con máxima claridad.
3. Validar con la prueba más pequeña que cubra el cambio.
4. Si tocas dominio, revisar también la versión del frontend y la migración relevante.

Si un cambio afecta módulos de negocio, la validación debe incluir dominio y persistencia, no solo UI.
