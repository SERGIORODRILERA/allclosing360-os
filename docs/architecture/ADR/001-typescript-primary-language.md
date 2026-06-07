# ADR 001: TypeScript como Lenguaje Principal

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Founder / CTO

## Context

ALLCLOSING360 OS es un monorepo que incluye frontend (Next.js), servicios de backend, agentes de IA, runtime de integraciones y paquetes compartidos. La elección del lenguaje determina el tooling, las convenciones y la capacidad de compartir código entre capas.

Opciones evaluadas:
- TypeScript (Node.js runtime)
- Python
- Híbrido TypeScript + Python

## Decision

**TypeScript** como lenguaje único para todo el monorepo.

## Rationale

1. **Tipos end-to-end.** Un paquete `@ac360/types` define contratos consumidos por backend, frontend y agentes sin transformación. Con híbrido TS+Python esos contratos se duplican o se generan con herramientas adicionales.

2. **Ecosistema de agentes IA.** Las SDKs de Anthropic, OpenAI y NATS tienen soporte de primera clase en TypeScript.

3. **Next.js es TypeScript.** Forzar Python en el backend crea una brecha innecesaria con el frontend.

4. **Un solo toolchain.** pnpm + Turborepo + ESLint + Prettier cubre todo el monorepo sin cambio de contexto.

## Consequences

**Positivo:**
- Un equipo, un lenguaje, una convención de código.
- Tipos compartidos sin fricción entre todas las capas.
- Onboarding de nuevos ingenieros más simple.

**Negativo:**
- Python tiene librerías de ML/Data Science más maduras. Para pipelines de datos analíticos en Fase Scale, se añadirán workers Python como servicios independientes con interfaz REST, fuera del monorepo principal.
- Node.js es single-threaded; tareas CPU-intensivas pueden requerir worker threads.

**Mitigación:** Componentes Python en Fase Scale se añaden como microservicios independientes con interfaz REST/gRPC, no dentro del monorepo TS.
