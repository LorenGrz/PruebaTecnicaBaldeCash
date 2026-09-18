# 00 · Contexto entregado al asistente

Punto de partida del trabajo: el enunciado de la prueba técnica, la URL de baldecash.com
como referencia visual, y las decisiones de producto que quedaban a criterio propio.

> El enunciado completo es un documento interno del proceso de selección de BaldeCash, así
> que acá va solo el resumen de requisitos, no el documento. El PDF original no se sube a
> este repositorio público.

## Requisitos del enunciado

- **Backend:** NestJS o Laravel. `POST /solicitudes` (valida, calcula la cuota, persiste y
  devuelve el registro) y `GET /solicitudes` (paginación, filtro por estado, total).
- **Cuota:** amortización francesa, tasa anual 24%. `P=3000, n=12 ⇒ S/ 283.68`.
- **Validaciones:** monto S/ 1,000–10,000 · plazo 6/12/18/24 · DNI 8 dígitos · email válido ·
  teléfono de 9 dígitos que empieza en 9 · estado `pendiente|aprobada|rechazada`.
- **Errores:** 422 indicando campo y motivo; los no controlados sin trazas ni internos.
- **Base de datos:** Postgres, MySQL o SQLite, con **migraciones versionadas** y al menos
  3 solicitudes de ejemplo cargadas.
- **Frontend:** Next.js + TypeScript. Formulario de solicitud (carga, error, éxito, cuota)
  y listado con paginación y filtro.
- **Opcionales:** tests de la cuota · `PATCH /solicitudes/:id/estado` · tasa por entorno ·
  `docker-compose.yml`.
- **Entrega:** repositorio público, historial de commits con mensajes claros (no un commit
  único), README con pasos, variables, decisiones, qué quedó fuera y **qué herramientas de
  IA se usaron y para qué**.

## Decisiones de producto tomadas fuera del enunciado

El enunciado deja explícito que lo ambiguo se asume y se documenta. Lo asumido:

1. **Dos tablas**, `usuarios` y `solicitudes`, en vez de una sola.
2. **Ingreso por DNI sin contraseña.** Si el DNI no existe, la misma pantalla da de alta al
   estudiante pidiendo nombre, correo y teléfono.
3. **Una aplicación con navegación por rol:** el administrador ve solo la gestión de
   créditos; el estudiante ve su resumen y, si no tiene solicitud activa, el formulario.
4. **Detalle de solicitud** visible para su dueño y para el administrador — endpoint extra
   sobre los dos que pide el enunciado.
5. **Una solicitud activa por estudiante**, con reenvío habilitado si fue rechazada.
6. **Los cuatro opcionales entran en el alcance.**

## Referencia visual

`https://www.baldecash.com` — de ahí salen la identidad de marca y el isotipo del balde.
La paleta concreta se fijó en el proyecto de Google Stitch (ver `01-stitch-ui.md`).
