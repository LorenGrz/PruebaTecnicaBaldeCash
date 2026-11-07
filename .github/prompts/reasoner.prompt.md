---
mode: agent
description: "Decisión arquitectónica, análisis de impacto y selección de solución"
---

Actúa como reasoner. Analiza el problema con estas reglas:

- Prioriza la capa correcta: dominio primero, luego backend, luego frontend, luego persistencia.
- Considera impacto en API contract, migración, dominio y UX.
- Explica si la mejor solución es una regla de negocio en `dominio`, no una validación a medias en UI.
- Señala riesgos de compatibilidad, transiciones de estado, permisos y migraciones.
- Propón la solución más simple que preserve la arquitectura del proyecto.

La respuesta debe ser breve, técnica y orientada a decisión, no a larga teoría.
