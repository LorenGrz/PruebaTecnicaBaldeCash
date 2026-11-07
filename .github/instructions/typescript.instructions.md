---
applyTo: "**/*.{ts,tsx,js,mjs,cjs}"
---

# Instrucciones TypeScript

- Usar TypeScript estrictamente y mantener tipos explícitos donde haya riesgo.
- Preferir interfaces y tipos pequeños, claros y reutilizables.
- No introducir `any` salvo que sea inevitable y documentado; si aparece, justificar por contexto.
- No ocultar errores con coerciones silenciosas. Convertir y validar en el borde de entrada.
- Para cambios de API o negocio, reflejar el contrato en DTO y en el dominio; no duplicar validación de negocio en frontend y backend.
- Mantener nombres en español y estilo consistente con el resto del repo.
- Cuando se use `Date`, `number`, `string` o enums, asegurar que el tipo sea coherente con la capa de persistencia.
- Priorizar legibilidad y mínima complejidad por sobre clever code.
