# ADR 003: NATS con JetStream como Message Broker

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Founder / CTO

## Context

El sistema de eventos desacopla los módulos de dominio entre sí. Opciones evaluadas:

- **NATS:** Message broker ligero, alto rendimiento, pub/sub + request/reply + JetStream (persistencia). Binario único, trivial de operar.
- **Kafka (MSK):** Alto rendimiento, retención duradera, ideal para event sourcing masivo. Complejo de operar (KRaft, cluster de brokers, expertise dedicado).
- **RabbitMQ:** Cola de mensajes tradicional. Maduro para task queues, pero limitado en rendimiento a escala.
- **Redis Streams:** Integrado en Redis (que ya usamos para cache). Simple pero limitado en capacidades.

## Decision

**NATS con JetStream habilitado.**

## Rationale

1. **Simplicidad operacional.** NATS es un binario único, se despliega en segundos. Kafka requiere cluster de brokers y experiencia operacional dedicada.

2. **JetStream cubre los requisitos del MVP y Fase Early.** JetStream añade persistencia, at-least-once delivery y consumer groups sobre NATS base.

3. **Rendimiento.** NATS procesa millones de mensajes por segundo en un solo nodo. El límite no será alcanzado en las primeras fases.

4. **SDK Node.js maduro.** El paquete `nats` de npm tiene soporte completo para JetStream con tipos TypeScript.

5. **Request/reply nativo.** Útil para comunicación síncrona entre servicios sin overhead de HTTP.

## Consequences

**Positivo:**
- Un contenedor adicional en docker-compose (trivial).
- Latencia muy baja (<1ms en la misma red).
- Soporte nativo para request/reply.
- Interfaz abstracta en `packages/events` permite migrar a Kafka sin modificar productores/consumidores.

**Negativo:**
- JetStream tiene límites de retención más ajustados que Kafka.
- Para event sourcing puro (replay de historial completo) a escala masiva, NATS es inferior a Kafka.
- Menos tooling de observabilidad que Kafka.

**Mitigación:** Diseñar `packages/events` con interfaz abstracta del broker. Umbral de migración a Kafka: cuando se requiera replay de historial > 30 días o volumen > 1M eventos/hora sostenidos.
