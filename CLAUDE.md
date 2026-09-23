# CLAUDE.md — BaldeCash

Módulo de solicitudes de financiamiento. Un estudiante elige monto y plazo, el sistema
calcula la cuota con amortización francesa y el analista de créditos la resuelve.

Prueba técnica FullStack Junior, con defensa técnica en vivo: **todo lo que se entrega
hay que poder explicarlo**. Ante la duda entre una solución más corta y una más fácil de
defender, gana la que se explica en dos oraciones.

| Capa | Tecnología |
|---|---|
| Backend | NestJS 12 + TypeScript (ESM, `"type": "module"`) |
| Base | PostgreSQL 16 + TypeORM (migraciones versionadas) |
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind v4 |
| Entorno | Docker Compose |

Documentación de producto y decisiones (no repetirla acá):
`README.md` · `docs/DECISIONES.md` (bitácora problema → opciones → elección → por qué) ·
`docs/ARRANQUE.md` · `docs/prompts/` (enunciado de la prueba y prompt de la UI).

---

## Estructura

```
api/src/
  dominio/        Clases puras: Usuario, Solicitud, errores. Sin Nest, sin TypeORM.
  solicitudes/    controller · service · repositorio · presentador · dto
  usuarios/       idem
  auth/           guard de identidad, decoradores @Publico y @UsuarioActual
  comun/          pipe de validación, filtro de excepciones, errores HTTP
  config/         lectura y validación del entorno
  persistencia/   entidades, mapeadores, migraciones, data-source, seed
web/src/
  dominio/        COPIA de api/src/dominio (ver "dominio duplicado")
  app/            rutas del App Router; (app)/ es el área con sesión
  acciones/       server actions ("use server")
  lib/            api (cliente HTTP) · servicio (un método por endpoint) · sesion · tipos
                  adaptadores (DTO → dominio) · formato (es-PE) · mensajes · configuracion
  components/     ui/ son primitivas; formularios/ son los componentes cliente
  herramientas/   verificar-dominio.mjs (lo corre `pnpm dominio:verificar`)
```

---

## Comandos

```bash
# Todo junto
docker compose up                 # db → api (migra + seed) → web

# API (desde api/)
pnpm dev                          # http://localhost:3001/api
pnpm test                         # 114 unitarios
pnpm test:e2e                     # 23 e2e — necesita la base arriba
pnpm typecheck && pnpm lint       # tsc --noEmit · oxlint
pnpm migration:create src/persistencia/migraciones/NombreDelCambio
pnpm migration:generate src/persistencia/migraciones/NombreDelCambio  # diff entidades ↔ base
pnpm migration:run | migration:show | migration:revert
pnpm seed
pnpm format                       # prettier (también en web/)

# Frontend (desde web/)
pnpm dev                          # http://localhost:3000
pnpm typecheck && pnpm lint       # lint debe pasar con --max-warnings 0
pnpm build
pnpm dominio:verificar            # falla si el dominio divergió de api/
```

Antes de commitear: en `api/` correr typecheck + lint + test; en `web/` typecheck + lint +
build + `dominio:verificar`.

---

## Reglas de arquitectura

Son las que se defienden en la entrevista. No romperlas sin una razón que se pueda escribir
en `docs/DECISIONES.md`.

1. **La regla de negocio vive en `dominio/`.** Rangos de monto, plazos permitidos,
   fórmula de la cuota, transiciones de estado y permisos están en `Solicitud` y `Usuario`.
   Son clases puras: no importan Nest, React ni TypeORM, y se testean solas.
2. **Cada capa aporta solo lo suyo.** El DTO valida formato y tipo (`class-validator`); el
   dominio valida negocio; el repositorio se ocupa de unicidad y claves foráneas; el
   componente decide cuándo mostrar el error. No copiar un rango de negocio a un decorador.
3. **El backend nunca confía en el frontend.** Que compartan el código de validación no
   cambia quién decide: la API repite todo.
4. **El repositorio devuelve objetos de dominio.** Las entidades de TypeORM no salen de
   `persistencia/`; los mapeadores traducen en los dos sentidos.
5. **La salida pasa por un presentador.** `Solicitud` guarda el estado en un campo privado,
   así que serializarla directo publicaría `_estado`. El presentador fija el contrato.
6. **El estado se transiciona, no se escribe.** Nunca un `UPDATE ... SET estado`: siempre
   `solicitud.aprobar(usuario)` / `rechazar(usuario)`, que verifican permiso y origen.
7. **El esquema solo se crea por migraciones.** `synchronize: false` siempre, también en
   desarrollo. Los importes son `numeric`, nunca `float`.
8. **Las rutas se protegen del lado del servidor.** Ocultar una opción en la barra lateral
   es comodidad de la interfaz; la regla la aplican `exigirRol()` en el layout de la ruta y
   el servicio de la API.

### Contrato de errores

Una sola forma de error en toda la API. Los errores del dominio no conocen HTTP: el
`FiltroDeExcepciones` es el único traductor.

| Error | HTTP | Cuerpo |
|---|---|---|
| `ErrorDeValidacion` | 422 | `detalles: [{ campo, mensaje }]` |
| `ErrorDeConflicto` | 409 | `codigo` estable (`SOLICITUD_ACTIVA_EXISTENTE`, `TRANSICION_INVALIDA`, …) |
| `ErrorDePermiso` | 403 | `codigo` |
| `ErrorNoEncontrado` / `ErrorNoAutenticado` | 404 / 401 | `codigo` |
| cualquier otro | 500 | `requestId`; el stack va al log, nunca a la respuesta |

Al agregar un error nuevo: lanzarlo desde el dominio o el servicio con un `codigo`, y dejar
que el filtro lo traduzca. No devolver `res.status()` a mano desde un controlador.

### El ciclo de una petición en Nest

`GuardDeIdentidad` (global, `APP_GUARD`) → `ValidationPipe` (global) → controlador →
servicio → repositorio → PostgreSQL, y cualquier excepción salta al `FiltroDeExcepciones`.
El guard se saltea solo con `@Publico()`: se protege por defecto y se abre a propósito.

---

## Cosas que muerden

- **El dominio está duplicado** en `api/src/dominio/` y `web/src/dominio/`. Es deliberado
  (los dos proyectos se levantan por separado, sin workspace). Un cambio va en los dos
  lados; `pnpm dominio:verificar` en `web/` falla si divergen. La única diferencia tolerada
  es la extensión `.js` de los imports relativos, que la API necesita por ESM.
- **Una regla de negocio suele tocar tres lugares**: dominio (api + web) y, si es un rango o
  un enum, también un `CHECK` de la base → migración nueva. Agregar un plazo o un estado sin
  migración hace que el `INSERT` falle con un 500.
- **Orden de rutas**: `@Get('mias')` va declarado antes que `@Get(':id')`. Nest resuelve en
  orden; al revés, `mias` entraría como id.
- **`numeric` llega como string** desde el driver de Postgres. Se convierte a número en el
  borde: `transformer` en la entidad y `normalizarSolicitud()` en `web/src/lib/servicio.ts`.
- **`enviarSolicitud` no llama a `revalidatePath` a propósito.** Revalidar volvería a
  renderizar `/solicitar`, que ahora redirige a `/resumen`, y el estudiante no vería la
  confirmación. `resolverSolicitud` sí revalida.
- **Dos URLs de API**: `NEXT_PUBLIC_API_URL` es para el navegador (se incrusta en el bundle
  al compilar) y `API_URL_INTERNA` para el servidor de Next dentro de Compose. Hoy todas las
  llamadas salen del servidor, así que la que se usa es la interna.
- **El listado de `/creditos` elige tarjetas o tabla por consulta de contenedor**
  (`@container` + `@3xl`), no por breakpoint de viewport: la barra lateral se come 16rem y
  el viewport mentía. Si se toca el ancho de la barra o de la columna, revisar ese corte.
- **El seed es idempotente y no borra**: solo carga si las tablas están vacías.
- **Identidad simplificada**: sin contraseña, la identidad viaja en `x-usuario-id` y la
  cookie de sesión va en base64url sin firmar. Está marcado con `// SIMPLIFICACIÓN:` en
  `api/src/auth/guard-de-identidad.ts`, `web/src/lib/sesion.ts` y `web/src/lib/api.ts` (donde se
  arma la cabecera). Es el único punto donde
  entraría una autenticación real; no esparcir la simplificación a otros archivos.

---

## Convenciones de código

- **Todo en español**: nombres de archivos, clases, métodos, variables y comentarios.
  `kebab-case` para archivos de la API, `PascalCase` para componentes de React.
- **Los comentarios explican por qué, no qué.** Si un comentario describe lo que el código
  ya dice, sobra. Los que valen son los que dejan constancia de una alternativa descartada.
- **Frontend**: las pantallas son server components y traen sus datos ahí; `"use client"`
  solo donde hay interactividad real. Las mutaciones van por server actions con
  `useActionState`, no por `fetch` desde el navegador.
- **Estilos**: solo tokens de `web/src/app/globals.css`, nunca un hex suelto. El movimiento
  también es sistema: una curva (`--bc-curva`) y tres duraciones; nada rebota ni gira por
  decoración, y `prefers-reduced-motion` lo apaga todo.
- **Tests**: los unitarios del backend no tocan la base (se le pasa un repositorio falso al
  servicio). Los e2e crean y borran sus propios datos sin tocar los del seed.
- `web/CLAUDE.md` → `web/AGENTS.md` lo genera `next dev` y avisa que esta versión de Next
  trae cambios: ante una duda de API, leer `web/node_modules/next/dist/docs/`.

---

## Git

- Rama por cambio: `feature/`, `fix/`, `refactor/` + slug corto en kebab-case.
- Commits en español siguiendo Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
  El historial es criterio de evaluación: mensajes que expliquen qué entra y por qué, nunca
  un commit único con todo.
- PR con `gh pr create` describiendo qué entra, por qué y con qué se verificó.
- Merge a `main` con `--no-ff` para que cada funcionalidad se vea como su propio merge, y
  después borrar la rama local y remota.
- Cada cambio de arquitectura suma su entrada en `docs/DECISIONES.md`, en el mismo PR.
