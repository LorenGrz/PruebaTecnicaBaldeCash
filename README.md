# BaldeCash — Módulo de solicitudes de financiamiento

Un estudiante universitario envía una solicitud de financiamiento eligiendo monto y
plazo; el sistema calcula su cuota mensual con amortización francesa y el equipo de
créditos la revisa y la resuelve.

Prueba técnica FullStack Junior.

| Capa | Tecnología |
|---|---|
| Backend | NestJS 12 + TypeScript (ESM) |
| Base de datos | PostgreSQL 16, migraciones versionadas con TypeORM |
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind v4 |
| Entorno | Docker Compose |

---

## Levantar el proyecto

### Con Docker (un comando)

Requisito: Docker con el plugin `compose` (`docker compose version`).

```bash
git clone https://github.com/LorenGrz/PruebaTecnicaBaldeCash.git
cd PruebaTecnicaBaldeCash
docker compose up
```

No hace falta copiar ningún `.env`: todas las variables tienen default en el compose.
Al levantar, `db` espera a estar sana, `api` corre **las migraciones y el seed** antes
de servir tráfico, y `web` arranca cuando la API responde su healthcheck.

- Frontend → <http://localhost:3000>
- API → <http://localhost:3001/api> (prueba: <http://localhost:3001/api/salud>)
- PostgreSQL → `localhost:5432`

Para parar: `docker compose down` (conserva los datos) o `docker compose down -v`
(los borra).

### Sin Docker

Requisitos: Node 22+ y pnpm 10+. La base sí conviene levantarla con Docker:

```bash
docker compose up -d db

# API
cd api
cp .env.example .env
pnpm install
pnpm migration:run        # crea el esquema
pnpm seed                 # carga los datos de ejemplo
pnpm dev                  # http://localhost:3001/api

# Frontend, en otra terminal
cd web
cp .env.example .env.local
pnpm install
pnpm dev                  # http://localhost:3000
```

Detalle ampliado de ambos caminos, incluido cómo cambiar puertos y credenciales, en
[`docs/ARRANQUE.md`](docs/ARRANQUE.md).

### Con qué cuenta entrar

No hay contraseñas: se ingresa con el DNI (ver
[Identidad sin contraseña](#identidad-sin-contrasena)). El seed deja cargadas estas
cuentas:

| DNI | Nombre | Rol | Qué ve |
|---|---|---|---|
| `10293847` | Emilio Gonzales | admin | Gestión de créditos: listado, detalle, aprobar y rechazar |
| `45871203` | Clara Fernández | estudiante | Una solicitud pendiente |
| `78129034` | Ethel Castillo | estudiante | Una solicitud aprobada |
| `61203948` | Rodrigo Salazar | estudiante | Una rechazada y una pendiente: muestra el historial con más de una |
| `39485712` | Milagros Quispe | estudiante | Una solicitud pendiente |

Un DNI que no exista abre el alta de estudiante en la misma pantalla, así que también
se puede probar el flujo completo desde cero.

---

## Variables de entorno

Cada proyecto tiene su `.env.example`, y hay uno en la raíz para el compose. Todas
tienen default: el proyecto levanta sin configurar nada.

| Variable | Default | Para qué |
|---|---|---|
| `PORT` | `3001` | Puerto de la API |
| `WEB_PORT` | `3000` | Puerto del frontend |
| `WEB_ORIGIN` | `http://localhost:3000` | Origen permitido por CORS |
| `TASA_ANUAL` | `0.24` | Tasa anual **en decimal**. Se valida al arrancar: un valor fuera de `[0, 1)` impide que la API levante |
| `DB_HOST` · `DB_PORT` · `DB_USER` · `DB_PASSWORD` · `DB_NAME` | `localhost` · `5432` · `baldecash` · `baldecash` · `baldecash` | PostgreSQL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | URL de la API que usa **el navegador**. Se incrusta en el bundle al compilar |
| `API_URL_INTERNA` | (vacía) | URL que usa el **servidor** de Next para llamar a la API. Dentro de Compose es `http://api:3001/api`, porque ahí `localhost` es el propio contenedor de `web` |

---

## API

Base `/api`. La identidad viaja en la cabecera `x-usuario-id`.

| Método | Ruta | Quién | Respuestas |
|---|---|---|---|
| `POST` | `/auth/ingresar` | público | `200 {usuario}` · `404 USUARIO_NO_ENCONTRADO` |
| `POST` | `/usuarios` | público | `201 {usuario}` · `409 DNI_DUPLICADO` / `EMAIL_DUPLICADO` |
| `POST` | `/solicitudes` | estudiante | `201 {solicitud}` · `422` · `409 SOLICITUD_ACTIVA_EXISTENTE` |
| `GET` | `/solicitudes?estado=&page=&limit=` | admin | `200 {data,total,page,limit}` · `403` |
| `GET` | `/solicitudes/mias` | estudiante | `200 {data,total}` — su historial completo |
| `GET` | `/solicitudes/:id` | dueño o admin | `200` · `403` · `404` |
| `PATCH` | `/solicitudes/:id/estado` | admin | `200` · `403` · `409 TRANSICION_INVALIDA` |
| `GET` | `/salud` | público | `200 {"estado":"ok"}` |

Los errores de validación devuelven **422** indicando qué campo falló y por qué:

```json
{
  "statusCode": 422,
  "error": "ValidacionFallida",
  "mensaje": "Los datos de la solicitud son inválidos",
  "detalles": [
    { "campo": "monto", "mensaje": "El monto debe estar entre S/ 1,000 y S/ 10,000" }
  ]
}
```

Lo no previsto sale como `500` genérico con un `requestId` que se loguea del lado del
servidor: nunca un stack ni el nombre de una tabla en la respuesta.

### Cálculo de la cuota

Amortización francesa, tasa anual configurable (24% por defecto):

```
cuota = P * ( i * (1 + i)^n ) / ( (1 + i)^n - 1 )
```

`P` = monto · `n` = cuotas en meses · `i` = tasa anual / 12

Caso de verificación del enunciado: `P = 3000`, `n = 12` ⇒ **S/ 283.68**.

---

## Decisiones técnicas

La bitácora completa, con las alternativas que descarté y por qué, está en
[`docs/DECISIONES.md`](docs/DECISIONES.md). Lo esencial:

### Las reglas de negocio viven en clases de dominio, no en el controller

`Usuario` y `Solicitud` (`api/src/dominio/`) son clases puras: no conocen Nest, ni
React, ni la base de datos. Ahí están el cálculo de la cuota, los rangos de monto y
plazo, las transiciones de estado y quién puede ver qué.

Eso permite que **el frontend use exactamente las mismas clases**: el formulario valida
campo por campo y muestra la cuota estimada en vivo sin consultar al servidor, con el
mismo código que después aplica la API. El backend nunca confía en esa validación: la
repite.

Cada capa aporta lo suyo. Los DTO de Nest validan formato y tipo con `class-validator`;
el repositorio se ocupa de unicidad y claves foráneas; el componente de React decide
cuándo mostrar el error. La regla de negocio está en un solo lugar.

### El dominio está duplicado, y hay un script que lo vigila

Los dos proyectos son independientes, sin workspace de pnpm: `api/` y `web/` se
levantan cada uno con su `pnpm install`. El precio es que las clases de dominio están
copiadas en `web/src/dominio/`. La copia es deliberada y `pnpm dominio:verificar`
(en `web/`) falla si las dos versiones divergen. Con más tiempo iría en un
`packages/dominio` de un monorepo.

### <a name="identidad-sin-contrasena"></a>Identidad sin contraseña — simplificación consciente

Se ingresa con el DNI. La API recibe la identidad en la cabecera `x-usuario-id` y un
guard la resuelve a un usuario con su rol.

**Cualquiera que conozca un id puede hacerse pasar por ese usuario.** Es inaceptable en
producción y deliberado acá: ninguno de los criterios de evaluación premia la
autenticación, y un JWT sin expiración ni refresh sería peor, porque aparenta seguridad
donde no la hay. Está acotado a un archivo
(`api/src/auth/guard-de-identidad.ts`, marcado con `// SIMPLIFICACIÓN:`), que es
exactamente el punto donde entraría la verificación real del token: ni los servicios ni
los controladores cambiarían.

### El esquema solo se crea por migraciones

`synchronize: false` siempre, también en desarrollo. Si el ORM crea las tablas solo, lo
que corre en una máquina deja de ser lo que describe la migración. Los importes son
`numeric`, nunca `float`.

La base **repite** las reglas del dominio como `CHECK` (monto entre 1000 y 10000, plazo
en 6/12/18/24, estados válidos). No es duplicación por descuido: la aplicación valida
para dar mensajes útiles, la base para que ningún `INSERT` externo meta datos
imposibles.

### El estado se transiciona, no se escribe

`PATCH /solicitudes/:id/estado` llama a `solicitud.aprobar(usuario)` o
`rechazar(usuario)`, nunca a un `UPDATE` de la columna. Una solicitud ya resuelta no
puede volver a cambiar de estado desde ningún lado. El seeder construye los datos de
ejemplo con esos mismos métodos: si mañana una transición deja de ser válida, el seed
falla en vez de generar filas que la aplicación nunca habría producido.

### Una sola aplicación, navegación por rol

El administrador ve solo *Gestión de créditos*; el estudiante ve *Mi resumen* y, si no
tiene una solicitud activa, *Solicitar financiamiento*. El filtro se aplica dos veces:
la barra lateral oculta la opción y el layout de la ruta lo bloquea del lado del
servidor. Esconder un botón es comodidad de la interfaz; la regla la aplica el servidor.

### El historial se pagina en el navegador, el listado del admin en el servidor

`GET /solicitudes/mias` devuelve el historial completo del estudiante y la pantalla lo
pagina de a cinco sin tocar la red. Un estudiante junta unas pocas solicitudes —solo
puede tener una activa—, así que paginar en el servidor costaría una consulta de conteo
y un viaje por página para ordenar seis filas. El listado del administrador sí se pagina
en el servidor, porque ahí las filas crecen sin techo.

---

## Supuestos que tomé

El enunciado pide asumir lo razonable y documentarlo. Lo que decidí por mi cuenta:

1. **Dos tablas**, `usuarios` y `solicitudes`, en vez de una sola: sin usuarios no hay
   forma de que el detalle de una solicitud sea privado.
2. **Un endpoint extra de detalle** (`GET /solicitudes/:id`) sobre los dos que pide el
   enunciado, visible para su dueño y para el administrador.
3. **Una solicitud activa por estudiante.** Si fue rechazada, puede enviar otra. Se
   valida en el servidor con un `409`, no ocultando el formulario.
4. **Alta de estudiante sin contraseña** desde la pantalla de ingreso, para poder probar
   el flujo completo sin conocer los datos del seed.
5. **El formulario envía los datos personales** además del monto y el plazo, aunque el
   estudiante ya esté identificado: así las validaciones de DNI, correo y teléfono que
   pide el enunciado se ejercitan en el endpoint que se va a probar, y el estudiante
   puede corregir sus datos si cambiaron.

---

## Qué dejé fuera y qué haría con más tiempo

En orden de lo que atacaría primero:

1. **Autenticación real.** Contraseña con hash, JWT con expiración, refresh con
   rotación y revocación, y protección de rutas en SSR. El guard actual es el único
   punto a cambiar.
2. **Índice parcial único para la solicitud activa.** Hoy la regla es de aplicación: dos
   `POST` simultáneos del mismo estudiante podrían pasar los dos. Se cierra con
   `CREATE UNIQUE INDEX ... ON solicitudes (usuario_id) WHERE estado IN ('pendiente','aprobada')`.
3. **Monorepo con `packages/dominio`** para eliminar la copia del dominio y el script
   que la vigila.
4. **Tests de frontend** (Testing Library sobre el formulario y el historial) y e2e de
   navegador. Hoy hay 111 tests unitarios y 23 e2e, todos del backend.
5. **Cronograma de pagos**, que el enunciado explícitamente no pedía.
6. **CI** que corra lint, typecheck y tests en cada PR.
7. **Paginación por cursor** en el listado del administrador, si el volumen creciera lo
   suficiente como para que `OFFSET` deje de rendir.
8. **Catálogo de laptops y "Mis cuotas"**, que aparecen en el diseño pero están fuera
   del alcance de la prueba.

---

## Verificación

```bash
# Backend
cd api
pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e
#  → 111 tests unitarios, 23 e2e

# Frontend
cd web
pnpm typecheck && pnpm lint && pnpm build && pnpm dominio:verificar
```

Los e2e necesitan PostgreSQL corriendo (`docker compose up -d db`); crean y borran sus
propios datos sin tocar los del seed.

---

## Uso de inteligencia artificial

Todo el proyecto se desarrolló con **Claude Code** (modelo Opus 5), y está declarado
acá como pide el enunciado.

| Parte | Cómo se usó |
|---|---|
| Diseño de interfaz | **Google Stitch** para generar las pantallas a partir de un prompt con la paleta y las tipografías extraídas de baldecash.com. El prompt exacto quedó en [`docs/prompts/01-stitch-ui.md`](docs/prompts/01-stitch-ui.md) |
| Arquitectura y decisiones | Conversación para comparar alternativas antes de escribir código; las decisiones tomadas y sus descartes están en [`docs/DECISIONES.md`](docs/DECISIONES.md) |
| Backend, frontend y Docker | Implementación asistida, repartida en agentes por área, con revisión y verificación de cada bloque antes de integrarlo |
| Documentación | Este README, la bitácora de decisiones y la guía de arranque |

El contexto de partida y los supuestos que se tomaron sobre el enunciado están en
[`docs/prompts/00-contexto-prueba.md`](docs/prompts/00-contexto-prueba.md).

Cada PR del repositorio explica qué entra, por qué, y con qué se verificó.
