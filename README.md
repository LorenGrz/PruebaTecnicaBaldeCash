# BaldeCash — Módulo de solicitudes de financiamiento

Prueba técnica FullStack Junior. Un estudiante universitario envía una solicitud de
financiamiento (monto y plazo), el sistema calcula su cuota mensual con amortización
francesa, y el equipo de créditos revisa y resuelve las solicitudes.

> **Estado:** en construcción. Este README se completa en el último PR con los pasos
> exactos de instalación, las variables de entorno y las decisiones técnicas.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Base de datos | PostgreSQL 16 con migraciones versionadas (TypeORM) |
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind v4 |
| Entorno | Docker Compose |

## Estructura

```
api/    API NestJS
web/    Frontend Next.js
docs/   Decisiones técnicas, prompts de IA usados y assets de marca
```

## Cálculo de la cuota

Amortización francesa (cuota fija), tasa anual configurable por entorno (24% por defecto):

```
cuota = P * ( i * (1 + i)^n ) / ( (1 + i)^n - 1 )
```

`P` = monto financiado · `n` = número de cuotas en meses · `i` = tasa anual / 12

Caso de verificación: `P = 3000`, `n = 12` ⇒ **S/ 283.68**

## Documentación

- [`docs/DECISIONES.md`](docs/DECISIONES.md) — bitácora de decisiones técnicas
- [`docs/prompts/`](docs/prompts) — prompts de IA usados durante el desarrollo
