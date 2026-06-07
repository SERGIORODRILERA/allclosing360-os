# ADR 007: PostgreSQL para Analytics en MVP; ClickHouse en V2

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Founder / CTO

## Context

El sistema necesita capacidades analíticas: reporting de negocio, métricas de pipeline, análisis histórico. Opciones:

- **PostgreSQL (mismo OLTP):** Sin infraestructura adicional. Queries analíticas compiten con transacciones en producción.
- **PostgreSQL réplica de lectura dedicada:** Separa carga OLTP y OLAP sin nueva tecnología. Mismo paradigma, cero curva de aprendizaje.
- **ClickHouse:** Base de datos columnar diseñada para analytics a alta velocidad. Requiere nueva infraestructura, pipeline ETL y expertise específico.
- **BigQuery / Redshift:** Managed data warehouses. Costo y complejidad operacional desde el inicio.

## Decision

**PostgreSQL con réplica de lectura para analytics en MVP. ClickHouse activado en V2.**

## Rationale

En el MVP el volumen de datos analíticos no justifica ClickHouse. Añadirlo desde el inicio introduce:
- Una réplica de PostgreSQL (o la misma instancia con cuidado en dev) es suficiente para dashboards con miles de registros.
- Un pipeline ETL prematuro que mantener antes de tener usuarios.
- Expertise operacional en una nueva tecnología cuando el equipo está construyendo el producto.

El diseño **prepara la migración a ClickHouse** desde el inicio:
1. Las queries analíticas se aislan en `services/reporting/` — nunca mezcladas con queries OLTP.
2. La interfaz `IAnalyticsRepository` es abstracta; la implementación PostgreSQL es intercambiable.
3. Las tablas con alto volumen de escritura analítica se documentan como "candidatas a ClickHouse".

## Umbral de Migración

ClickHouse se activa cuando **cualquiera** de estas condiciones se cumple:
- Queries de reporting tardan > 2 segundos en PostgreSQL optimizado con índices.
- Volumen supera ~50M de registros en tablas analíticas.
- Se necesita análisis cross-tenant en tiempo real para el tier Enterprise.

## Consequences

**Positivo:**
- Cero infraestructura adicional en MVP.
- Un solo sistema de datos para operar y monitorear.
- Sin pipeline ETL histórico que mantener.

**Negativo:**
- Queries analíticas pesadas compiten con transacciones (mitigado con réplica de lectura desde Fase Early).
- PostgreSQL no es eficiente para scans completos de tablas muy grandes (decenas de millones de filas).
- La migración a ClickHouse en V2 requerirá un pipeline ETL histórico para datos ya generados.

**Monitoreo:** Alertas en dashboards de observabilidad cuando queries de reporting superen 500ms. Esa es la señal de que hay que revisar índices antes de escalar la solución.
