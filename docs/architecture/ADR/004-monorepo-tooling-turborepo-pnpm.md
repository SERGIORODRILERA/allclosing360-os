# ADR 004: Turborepo + pnpm como Monorepo Tooling

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Founder / CTO

## Context

El repositorio es un monorepo con múltiples apps, servicios, paquetes y agentes. Necesitamos herramientas para gestionar dependencias entre paquetes del workspace, ejecutar builds y tests en el orden correcto, y cachear outputs para no reconstruir lo que no cambió.

Opciones evaluadas:
- **Turborepo + pnpm**
- **Nx:** Monorepo framework más completo con generators, pero más opinado y pesado.
- **pnpm workspaces solo:** Sin build orchestration adicional.

## Decision

**Turborepo como build orchestrator + pnpm como package manager.**

## Rationale

1. **pnpm workspaces** resuelve la gestión de dependencias entre paquetes locales con symlinks correctos y eficiencia de almacenamiento (hardlinks en vez de copias). La sintaxis `workspace:*` es explícita y clara.

2. **Turborepo** añade:
   - Pipeline de builds con grafo de dependencias declarativo (`dependsOn: ["^build"]`).
   - Cache local y remota: si CI ya construyó un paquete con el mismo input, no lo reconstruye.
   - Ejecución paralela de tasks independientes.

3. **Menos opinado que Nx.** Turborepo no impone generators ni estructura de archivos. Solo necesita `turbo.json`.

4. **Compatibilidad con Next.js.** Turborepo y Next.js son del mismo ecosistema (Vercel), garantizando integración de primera clase.

## Consequences

**Positivo:**
- Builds hasta 10x más rápidos con cache remota en CI.
- Un comando (`pnpm run dev`) puede iniciar todo el stack en paralelo.
- Fácil de entender para nuevos ingenieros; no hay magia oculta.

**Negativo:**
- Turborepo no tiene generators para scaffolding de nuevos servicios. Se usan scripts propios en `tools/`.
- La cache remota requiere configuración adicional (Vercel Remote Cache o self-hosted `turbo-remote-cache`). En MVP se usa solo cache local.

**Setup de cache remota:** Diferido a Fase Early cuando el equipo tenga > 1 ingeniero y CI tarde > 3 minutos.
