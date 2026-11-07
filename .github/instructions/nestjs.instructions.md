---
applyTo: "api/src/**/*.ts"
---

# Instrucciones NestJS

- Mantener la capa de dominio pura: sin Nest, sin TypeORM, sin React.
- Respetar la estructura de `dominio`, `solicitudes`, `usuarios`, `auth`, `comun`, `config`, `persistencia`.
- Los DTO validan formato y tipo; el dominio valida negocio.
- Los repositorios devuelven objetos de dominio, no entidades de TypeORM.
- Las excepciones deben pasar por `FiltroDeExcepciones`; no hacer `res.status()` directo desde el controller.
- Proteger rutas con guard por defecto y `@Publico()` solo para casos explícitos.
- Las transiciones de estado deben recorrer métodos del dominio, no `UPDATE` manual.
- Cumplir con migraciones versionadas para cualquier cambio de esquema.
