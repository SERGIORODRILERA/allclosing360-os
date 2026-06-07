# ADR 005: Next.js App Router como Framework Web

**Status:** Accepted  
**Date:** 2026-06-05  
**Deciders:** Founder / CTO

## Context

La aplicación web es la superficie principal de usuario del OS. Opciones evaluadas:
- **Next.js 15 con App Router**
- **Remix**
- **Astro + React islands**

## Decision

**Next.js 15 con App Router.**

## Rationale

1. **React Server Components.** Permiten renderizar componentes en el servidor sin JavaScript en el cliente, mejorando el rendimiento inicial de una app enterprise con dashboards densos de datos.

2. **App Router.** Routing basado en sistema de archivos con layouts anidados. Mapea bien a la estructura del OS: `platform-layout > module-layout > view`.

3. **Server Actions.** Eliminan la necesidad de endpoints API dedicados para mutaciones simples de formularios. Reduce el boilerplate de CRUD.

4. **API Routes.** Permiten crear endpoints BFF (Backend for Frontend) dentro del mismo proyecto para proxying de APIs de servicios internos.

5. **Ecosistema UI.** shadcn/ui, Tailwind CSS y los principales sistemas de componentes están diseñados y documentados para Next.js. Evita fricciones de integración.

6. **Compatibilidad con Turborepo.** Next.js y Turborepo son del mismo ecosistema (Vercel). La integración de cache de builds es nativa.

## Consequences

**Positivo:**
- Rendimiento óptimo para dashboards enterprise complejos.
- Soporte de primera clase de shadcn/ui para el design system.
- Menos endpoints de API que mantener para operaciones comunes.

**Negativo:**
- App Router tiene una curva de aprendizaje respecto a Pages Router. Los patrones de data fetching (Server Components vs Client Components) requieren disciplina.
- Server Components tienen restricciones: no pueden usar hooks de cliente ni browser APIs directamente.
- Los builds en CI pueden ser lentos sin Turborepo remote cache configurado.

**Convención clave:** Componentes de servidor por defecto. Solo añadir `"use client"` cuando el componente requiere interactividad real (estado local, eventos del browser, hooks de React).
