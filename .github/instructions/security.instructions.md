---
applyTo: "**/*.{ts,tsx,js,mjs,env,example,md}"
---

# Instrucciones de seguridad

- No hardcodear secretos ni credenciales. Usar variables de entorno y `.env.example` para documentación.
- No confiar en el cliente para decidir permisos o validaciones.
- Validar todos los inputs en backend y conservar la regla de negocio en dominio.
- No exponer stack traces ni nombres internos en respuestas HTTP.
- Respeter la política de errores del proyecto: errores de dominio traducidos por un filtro central.
- Cuidar CORS, auth, roles y acceso por ID cuando se completen cambios de API.
