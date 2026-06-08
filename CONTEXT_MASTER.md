# ALLCLOSING360 — CONTEXT MASTER
> Última actualización: 2026-06-08 v2 | CTO session — CSS office, KPIs, connectors, Playwright

---

## OBJETIVO
Construir ALLCLOSING360 como sistema operativo comercial/marketing IA en español, orientado a equipos de ventas y marketing de alto rendimiento.

---

## STACK ACTUAL

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Framework | Next.js 15.5 App Router | ✅ Live en Vercel (iad1) |
| Runtime | Node.js 22+ | ✅ |
| Monorepo | pnpm + Turborepo | ✅ |
| IA | @anthropic-ai/sdk 0.102 (Haiku + Sonnet 4.6) | ✅ Real, SSE streaming |
| Office | CSS/SVG isométrico puro (OfficeScene3D.tsx reescrito) | ✅ Funciona en producción |
| State | Zustand 5 | ⚠️ Instalado, poco utilizado |
| ORM | Drizzle ORM + PostgreSQL | ⚠️ Instalado, no conectado al web |
| Eventos | NATS | ⚠️ Instalado, no conectado al web |
| GitHub | @octokit/rest | ✅ Integrado en /api/task, falta env var |
| Voice STT | Web SpeechRecognition API | ⚠️ continuous=false, se corta |
| Voice TTS | — | 🔴 No implementado |
| Auth | — | 🔴 No implementado |
| CSS | Design system custom (CSS vars) | ✅ Completo |

---

## ESTRUCTURA CLAVE

```
/opt/allclosing360/
├── apps/web/src/
│   ├── app/
│   │   ├── page.tsx                  # Renderiza <CommandCenter />
│   │   ├── globals.css               # Design system completo
│   │   └── api/
│   │       ├── task/route.ts         # NÚCLEO: SSE + tool-use + artifacts (466 líneas)
│   │       └── chat/route.ts         # Legacy, no usado en v5
│   ├── components/
│   │   ├── CommandCenter.tsx         # Orquestador principal (528 líneas)
│   │   ├── SimsOffice3D.tsx          # 3D office — ROTO (976 líneas)
│   │   ├── ChatPanel.tsx             # Chat + STT (548 líneas)
│   │   ├── ConnectorsPanel.tsx       # 23 integraciones visuales (525 líneas)
│   │   ├── TasksPanel.tsx            # Historial + artifact viewer (323 líneas)
│   │   ├── TaskModal.tsx             # Modal completo (preview/content/PR tabs)
│   │   ├── DirectorSidePanel.tsx     # Stats/logs por director
│   │   ├── SkillsMarketplace.tsx     # Grid de 47 skills
│   │   ├── OpsPanel.tsx              # Analytics y KPIs
│   │   └── NavRail.tsx               # Navegación lateral (5 vistas)
│   └── lib/
│       ├── engines.ts                # 15 directores IA configurados
│       ├── skills.ts                 # 47 skills con keywords y metadata
│       ├── connectors.ts             # 23 integraciones (catálogo visual)
│       ├── intent.ts                 # Router por palabras clave
│       ├── store.ts                  # Zustand store
│       └── memory.ts                 # Persistencia localStorage
├── packages/
│   ├── types/                        # Tipos de dominio compartidos
│   ├── database/                     # Drizzle + schemas PostgreSQL (no conectado)
│   └── events/                       # NATS client (no conectado)
├── AUDIT.md                          # Auditoría técnica 2026-06-07
├── TASKS.md                          # Backlog de tareas
├── DECISIONS.md                      # Decisiones arquitectónicas
└── docs/ALLCLOSING360_OS_MASTER_DISCOVERY.md  # Visión estratégica (33KB)
```

---

## ESTADO ACTUAL

### ✅ TERMINADO Y FUNCIONAL
- API real con Claude (SSE streaming, tool-use, agentic loops hasta 6 iteraciones)
- Herramientas de IA: `create_html_file`, `create_document`, `create_code_file`, `github_read_repo`, `github_create_pr`
- 15 directores IA con nombre, color, icono, departamento
- 47 skills con keywords, director asignado, estimación de tokens
- Router de intención por keywords (baja latencia)
- 5 vistas UI: Chat, Skills, Ops, Connectors, Office (la 3D rota)
- Persistencia de sesión en localStorage (mensajes, tasks, órdenes)
- TaskModal con preview HTML, download, copy, re-execute
- Sistema de notificaciones (toasts)
- Timeline de acciones
- Design system completo (CSS vars, animaciones, tema oscuro)
- CompanySelector (5 empresas demo)
- Catálogo visual de 23 integraciones

### ⚠️ A MEDIAS / INCOMPLETO
- **OfficeScene3D:** Reescrito en CSS puro (sin Three.js), carga en producción, 9 salas + avatares + info panel
- **GitHub tool:** Código listo en `/api/task`, falta configurar `GITHUB_TOKEN` + `GITHUB_REPO` en Vercel
- **STT (dictado):** Funciona pero `continuous=false` → se corta a los 10-15 seg
- **Zustand store:** Instalado pero CommandCenter usa `useState` local mayormente
- **Connectors:** Catálogo visual completo, sin OAuth real ni sincronización

### 🔴 ROTO / NO IMPLEMENTADO
- **Three.js office:** Reemplazado por CSS puro (ver OfficeScene3D.tsx)
- **TTS (voz de salida):** No existe ninguna implementación
- **Autenticación:** No hay login, no hay modelo de usuario en web
- **PostgreSQL conectado:** Schema diseñado en `packages/database`, nunca wired al web app
- **NATS conectado:** Mismo caso que PostgreSQL
- **Conectores reales:** Ningún OAuth, ninguna sync real
- **Multi-tenancy:** Schema diseñado, no implementado
- **Tests:** Playwright suite básica escrita y pasando 8/8 en tests/e2e/basic.spec.ts
- **Observabilidad:** Sin logs, métricas ni trazas

### 🆕 AÑADIDO RECIENTEMENTE (últimos commits — sesión CTO 2026-06-08)
- **OfficeScene3D.tsx REESCRITO** — CSS isométrico puro, 9 salas, 15 avatares, info panel, animaciones idle
- **OpsPanel.tsx mejorado** — KPIs en tiempo real: mensajes enviados, sesión timer, director top, velocidad de respuesta, tokens/costo
- **lib/connectors-real.ts** — Interfaces TypeScript + implementaciones stub para GHL, WhatsApp, Meta Ads, Google Calendar
- **ConnectorsPanel.tsx** — Sección de conectores prioritarios con estado CONFIGURAR/CONECTADO + modal de env vars
- **Playwright suite 8/8** — tests/e2e/basic.spec.ts, playwright.config.ts configurado

---

## DIRECTORES IA (15)

| ID | Nombre | Dept | Focus |
|---|---|---|---|
| ceo_advisor | CEO Advisor | Dirección | Estrategia, reportes |
| director_comercial | Director Comercial | Ventas | Ofertas, cierre |
| director_marketing | Director de Marketing | Marketing | Campañas, estrategia |
| director_embudos | Director de Embudos | Conversión | Diseño de funnels |
| director_seo | Director SEO | SEO | Posicionamiento orgánico |
| director_sem | Director SEM | SEM | Búsqueda pagada |
| director_meta_ads | Director Meta Ads | Paid Social | Campañas FB/IG |
| director_google_ads | Director Google Ads | Search Ads | Google Ads |
| director_contenido | Director de Contenido | Contenido | Creación de contenido |
| director_llamadas_ia | Director de Llamadas IA | Voice AI | Análisis de llamadas |
| director_automatizaciones | Director de Automatizaciones | Automations | Workflows |
| director_crm_ghl | Director CRM/GHL | CRM | Contactos, pipelines |
| director_financiero | Director Financiero | Finance | Revenue, KPIs |
| director_operaciones | Director de Operaciones | Ops | SOPs, procesos |
| director_producto | Director de Producto | Product | GitHub, PRs |

---

## VARIABLES DE ENTORNO REQUERIDAS

```env
ANTHROPIC_API_KEY=sk-ant-...     # Requerida — IA no funciona sin esto
GITHUB_TOKEN=ghp_...              # Opcional — para tool github_create_pr
GITHUB_REPO=owner/repo            # Opcional — repo destino de PRs
```

---

## ROADMAP PRIORIZADO (Para versión vendible)

### FASE 1 — Estabilizar el MVP (1-2 semanas)
1. **[CRÍTICO] Arreglar 3D office** — Bajar R3F a `@react-three/fiber@8` + `@react-three/drei@9`, envolver Canvas en ErrorBoundary, añadir fallback 2.5D si falla WebGL
2. **[CRÍTICO] Implementar TTS** — ElevenLabs API o Web Speech API `speechSynthesis` para que los directores "hablen"
3. **[ALTO] Arreglar STT continuo** — `continuous=true` en CommandInput + auto-restart en `onend`
4. **[ALTO] Conectar GitHub tool** — Configurar `GITHUB_TOKEN` + `GITHUB_REPO` en Vercel, probar con director_producto

### FASE 2 — Primer conector real (2-3 semanas)
5. **[ALTO] GoHighLevel OAuth** — Primer conector real: auth, sync de contactos/deals
6. **[ALTO] Meta Ads connector** — Facebook Marketing API, campañas reales desde director_meta_ads
7. **[MEDIO] Autenticación** — Clerk (Vercel Marketplace) — login, modelo de usuario

### FASE 3 — Persistencia real (3-4 semanas)
8. **[MEDIO] Conectar PostgreSQL** — Wire `packages/database` al web app, migrar de localStorage a DB
9. **[MEDIO] Multi-tenancy básico** — Schema ya diseñado, implementar tenant isolation
10. **[MEDIO] NATS events** — Wire event bus para comunicación entre servicios

### FASE 4 — IA avanzada (1-2 meses)
11. **pgvector + RAG** — Memoria semántica por empresa/director
12. **Automatizaciones reales** — n8n / Make integration del flujo generado
13. **Voice calls IA** — Twilio + análisis de llamadas real
14. **Observabilidad** — Logs estructurados, métricas, alertas

### FASE 5 — Producción vendible
15. **Rate limiting** — Por tenant, por skill
16. **Billing** — Stripe integration, planes por uso
17. **Onboarding** — Wizard de setup inicial para nuevos clientes
18. **Tests E2E** — Playwright ya instalado, escribir suite básica

---

## REGLA DE SESIÓN
- **Antes de trabajar:** Leer este archivo
- **Después de trabajar:** Actualizar las secciones relevantes (Estado actual, Roadmap)
- **Al arreglar algo:** Mover de "Roto" a "Terminado" con fecha
- **Al añadir algo:** Agregar a "Añadido recientemente"
