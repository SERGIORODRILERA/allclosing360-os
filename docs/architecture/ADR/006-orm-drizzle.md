# ADR 006: Drizzle ORM

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Founder / CTO

## Context

Necesitamos una capa de acceso a datos sobre PostgreSQL con tipos TypeScript generados desde el schema, soporte para multi-tenancy (schemas PostgreSQL por tenant), migraciones versionadas, y rendimiento cercano a SQL puro.

Opciones evaluadas:
- **Drizzle ORM:** Query builder con tipos TS totalmente inferidos desde el schema. SQL-first.
- **Prisma:** ORM más abstracto con Prisma Schema Language. Query engine Rust separado.
- **Knex:** Query builder sin tipos generados. Más manual.
- **SQL puro (pg):** Máximo control, cero abstracción, cero ayuda de tipos.

## Decision

**Drizzle ORM.**

## Rationale

1. **SQL-first.** Drizzle genera SQL predecible. Lo que escribes es exactamente lo que ejecuta. Sin "magia" de query engine como en Prisma.

2. **Tipos inferidos desde el schema TS.** El schema de Drizzle es código TypeScript; los tipos se infieren automáticamente sin paso de generación separado (`prisma generate`).

3. **Sin proceso separado.** Prisma requiere un binario Rust en el runtime. En contenedores minimalistas, esto añade ~50MB y complejidad. Drizzle es puro JS/TS.

4. **Soporte nativo de schemas PostgreSQL.** Drizzle soporta `pgSchema()` de forma nativa, lo cual es crítico para el modelo de multi-tenancy (un schema de PostgreSQL por tenant).

5. **Rendimiento.** Drizzle tiene overhead mínimo sobre el driver nativo; las queries son compiladas a SQL estático cuando es posible.

## Consequences

**Positivo:**
- Queries predecibles y debuggeables directamente en los logs.
- Multi-tenancy con PostgreSQL schemas sin hacks ni workarounds.
- Sin pasos de generación de código en el pipeline de CI.
- Tipos de TypeScript correctos en queries complejas sin anotaciones manuales.

**Negativo:**
- Drizzle es más nuevo que Prisma; menos ejemplos y comunidad.
- Relaciones complejas (joins profundos, N+1 avoidance) requieren más SQL explícito que Prisma.
- Las migraciones (`drizzle-kit`) son más explícitas y manuales que Prisma Migrate.

**Convención:** Toda query de más de 3 joins va en un archivo de repositorio dedicado (`*.repository.ts`), nunca inline en handlers. Esto hace el código más testeable y las queries más visibles en code review.
