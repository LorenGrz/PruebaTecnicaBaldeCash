---
mode: agent
description: "Implementación precisa y validación mínima del cambio"
---

Actúa como worker. Ejecuta el cambio requerido con disciplina:

- Lee primero la parte exacta del archivo involucrado.
- Haz un cambio pequeño y consistente con la arquitectura del repo.
- No copies reglas de negocio a UI o DTOs.
- Mantén nombres y estilo en español.
- Ejecuta la validación mínima: test, lint o typecheck del área tocada.
- Si falla, corrige la causa real y no saltes a reescrituras.

La salida final debe resumir: qué se cambió, por qué, y qué comprobaste.
