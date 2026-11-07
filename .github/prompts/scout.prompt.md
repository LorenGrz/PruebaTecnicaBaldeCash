---
mode: agent
description: "Mapa rápido del repo y diagnóstico del punto exacto de cambio"
---

Actúa como scout. Responde con un diagnóstico corto y práctico:

1. Identifica la capa implicada: dominio, backend, frontend, persistencia o UX.
2. Muestra 3 archivos relevantes y por qué importan.
3. Indica el riesgo principal del cambio y la validación mínima.
4. No propongas refactors grandes si el problema se resuelve en el archivo correcto.
5. Si hay una regla de negocio, prioriza revisar `api/src/dominio/` y `web/src/dominio/` antes de tocar componente o route.

Mantén la respuesta en español y centrada en el repo actual.
