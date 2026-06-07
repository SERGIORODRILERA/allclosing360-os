# ADR 002: Orquestación de Agentes — Job Queue Propia para MVP, Temporal.io para V2

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Founder / CTO

## Context

El motor de orquestación de agentes es el componente más crítico del sistema. Opciones evaluadas:

- **Temporal.io:** Workflow orchestration con durabilidad garantizada, estado persistente, retry automático, soporte para workflows de larga duración. Requiere cluster Temporal o Temporal Cloud (~$200-500/mes).
- **LangGraph:** Grafos de estado para agentes IA. SDK JS menos maduro que la versión Python.
- **Job queue propia sobre NATS + PostgreSQL:** Tareas en PostgreSQL, workers que las consumen vía NATS, estado persistido en PostgreSQL.

## Decision

**Job queue propia sobre NATS + PostgreSQL para el MVP.** Temporal.io se prepara como migración target para V1/V2.

## Rationale

El MVP necesita:
1. Ejecutar tareas de agentes en background (enriquecimiento, análisis de llamadas, scoring).
2. Persistir estado de ejecución para retry en caso de fallo.
3. Límites de concurrencia por tenant.
4. Auditoría de cada ejecución.

Temporal.io resuelve todo esto, pero introduce:
- Un cluster adicional que operar antes de tener ningún cliente.
- Curva de aprendizaje del modelo Workflows/Activities/Workers.
- Complejidad operacional injustificada en volúmenes bajos del MVP.

Una job queue sobre PostgreSQL + NATS:
- Usa infraestructura que ya tenemos.
- Es simple de depurar.
- Puede ser reemplazada por Temporal sin cambiar la interfaz de los agentes si se diseña con `IJobQueue` abstracto desde el inicio.

**La clave:** La interfaz `IJobQueue` se define desde el día 1 para que Temporal reemplace la implementación en V2 sin modificar los agentes consumidores.

## Consequences

**Positivo:**
- Cero infraestructura adicional en el MVP.
- Simplicidad operacional para el equipo inicial.
- Ciclos de iteración rápidos.

**Negativo:**
- Menos garantías de durabilidad que Temporal.io (exactly-once semántico nativo).
- Workflows complejos de larga duración (días/semanas) son más difíciles.
- Hay que implementar manualmente retry con backoff, timeouts y compensación.

**Mitigación:**
- Implementar `IJobQueue` como interfaz abstracta desde el día 1.
- Documentar explícitamente qué funcionalidades serán cubiertas por Temporal en V2.
- En MVP, limitar los workflows complejos; usar orquestación paso a paso simple.
- Umbral de migración: cuando hay > 5 tipos de workflows distintos activos en producción.
