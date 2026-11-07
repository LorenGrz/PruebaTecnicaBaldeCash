---
applyTo: "**/*.{spec,test}.{ts,tsx,js,jsx}"
---

# Instrucciones de testing

- Escribir pruebas pequeñas, explícitas y centradas en comportamiento.
- En backend, testear servicio y dominio sin tocar la base real; usar repositorio falso cuando haga falta.
- En e2e, crear y limpiar sus propios datos sin contaminar el seed.
- Probar casos de borde como validaciones, transiciones inválidas, conflictos y permisos.
- No depender de implementación interna si existe una interfaz de comportamiento clara.
- Cuando un cambio afecta una regla de negocio, cubrir al menos el caso feliz y el caso de error más probable.
