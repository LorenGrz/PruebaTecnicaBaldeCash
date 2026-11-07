---
applyTo: "**/*.{tsx,jsx}"
---

# Instrucciones React / Next

- Las pantallas son server components por defecto; `"use client"` solo si hay interactividad real.
- Las mutaciones deben ir por server actions con `useActionState` y no por `fetch` del navegador.
- Evitar `useEffect` para cargar datos cuando se puede hacer la consulta en servidor.
- El componente debe decidir cuándo mostrar el error, pero no la regla de negocio.
- Mantener el dominio en `web/src/dominio/` y no copiar lógica de negocio a componentes.
- Usar tokens de `web/src/app/globals.css` y no colores o valores sueltos.
- No agregar rebotes, giros o animaciones decorativas; seguir la curva de movimiento del sistema.
- Cuando haya formularios, mantener feedback claro, validaciones en el borde y estados de carga/errores simples.
