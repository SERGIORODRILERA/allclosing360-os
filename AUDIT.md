# ALLCLOSING360 OS — Auditoría Técnica
**Fecha:** 2026-06-07 | **Rama:** main | **Commit:** b1687f4

---

## 1. STACK DETECTADO

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Framework | Next.js 15.5 App Router | ✅ Correcto |
| Runtime | Node.js 22, Vercel (iad1) | ✅ OK |
| Monorepo | pnpm + Turborepo | ✅ OK |
| 3D | three@0.184, @react-three/fiber@9, @react-three/drei@10 | ⚠️ Peer conflict React 18 vs reqs React 19 |
| IA | @anthropic-ai/sdk@0.102 | ✅ Real, lado servidor |
| Estado | React useState + useRef | ❌ Sin Zustand — todo props-drilling |
| Voz entrada (STT) | Web SpeechRecognition nativa | ⚠️ `continuous=false`, se corta |
| Voz salida (TTS) | **NADA** | ❌ No existe |
| GitHub | **NADA** | ❌ No existe |
| BD | Drizzle + pg (packages/database) | ⚠️ Instalado, nunca usado en la web |
| NATS/eventos | packages/events | ⚠️ Instalado, nunca usado en la web |

---

## 2. QUÉ CONSERVAR (no tocar)

### ✅ `/api/task/route.ts` — SÓLIDO
La ruta más importante del proyecto. Hace llamadas REALES a Claude con tool-use,
SSE streaming, y devuelve artefactos reales (HTML, documento, código).
Tiene loop agentic (hasta 4 iteraciones). Gratis de bugs conocidos.
**Acción: conservar, añadir herramienta GitHub.**

### ✅ `lib/engines.ts` — 14 directores bien definidos
Colores, iconos, nombres humanos, departamentos. Completo.
**Acción: conservar, añadir campo `realTool` para mapear cada director a su herramienta real.**

### ✅ `lib/skills.ts` — Catálogo de 35 skills con keywords
Bien estructurado. Tiene `primaryDirector` para el router.
**Acción: conservar tal cual.**

### ✅ `lib/intent.ts` — Router de intención
Funciona con keyword scoring. Simple pero efectivo para MVP.
**Acción: conservar para baja latencia; añadir fallback a Claude para intenciones ambiguas.**

### ✅ `ChatPanel.tsx` + `CommandInput.tsx` — UI del chat
Panel derecho con historial de mensajes, input con STT básico.
Bien implementado visualmente.
**Acción: conservar; arreglar STT (`continuous=true` + auto-restart); añadir TTS de salida.**

### ✅ `TaskModal.tsx` — Visor de artefactos
Previsualiza HTML vía `srcDoc`, descarga vía Blob URL, copia, re-ejecuta.
Funciona en Vercel (sin dependencia de FS).
**Acción: conservar; añadir tab para PR de GitHub.**

### ✅ `ActionTimeline.tsx` + `NotificationCenter.tsx`
Sistema de eventos bien diseñado. Se alimenta de CommandCenter.
**Acción: conservar.**

### ✅ `DirectorSidePanel.tsx`
Panel lateral por director con tabs (tareas/logs/docs/stats).
**Acción: conservar; mostrar coste real del stream.**

### ✅ `globals.css` — Design system
Variables CSS bien definidas. Scrollbars, animaciones, layout del OS shell.
**Acción: conservar; añadir variables para el bloom/glow de la oficina 3D.**

---

## 3. QUÉ REEMPLAZAR / ELIMINAR

### ❌ `SimsOffice3D.tsx` — LA OFICINA QUE NUNCA CARGA
**Problema raíz detectado:** `@react-three/fiber@9` + `@react-three/drei@10` requieren
React 19; el proyecto usa React 18. El peer conflict hace que el bundle falle en producción
(Vercel) de forma silenciosa — el `dynamic(..., { ssr: false })` carga el chunk JS pero
el módulo aborta al intentar resolver hooks de React 19. En dev local parece funcionar
porque el bundler es más permisivo.
**Además:** usa `<Environment />` de Drei que intenta cargar un preset HDR externo —
falla en contextos sin acceso a red o con CSP.
**Causa secundaria:** Sin `<ErrorBoundary>` alrededor del Canvas, el crash cae en
el `Suspense` fallback que dice "Cargando oficina 3D…" para siempre.
**Acción: REESCRIBIR COMPLETO.** Downgrade a `@react-three/fiber@8` (React 18 compatible)
+ `@react-three/drei@9` + wrapping con ErrorBoundary.

### ❌ `CommandCenter.tsx` — Intervalo de progreso falso
```ts
// Línea 150-173: FAKE — avanza progreso random cada 3.5s
const id = setInterval(() => {
  const next = Math.min(t.progress + Math.floor(Math.random() * 4 + 1), 100);
  ...
}, 3500);
```
Cuando la API SSE ya da progreso real, este intervalo crea discrepancias y
marca tareas como "completadas" aunque la API aún esté procesando.
**Acción: eliminar el intervalo fake; el progreso viene 100% del SSE.**

### ❌ `lib/mock-responses.ts` — Fallback de humo
Usado cuando la API falla. Devuelve texto inventado sin marcarlo como tal.
**Acción: reemplazar por fallback honesto con `// TODO REAL:` y mensaje claro al usuario.**

### ❌ `lib/task-engine.ts` — Estimaciones hardcodeadas de tokens/coste
Las estimaciones de tokens/coste son inventadas. La API devuelve los reales.
**Acción: mantener solo `getStepsForSkill` (útil para UI de pasos). Eliminar estimaciones
de tokens/coste (usar los reales del SSE).**

### ❌ Componentes huérfanos (no se usan en producción)
- `IsometricOffice.tsx` — supersedido por SimsOffice3D
- `HumanAvatar.tsx` — CSS 3D, sustituido
- `MinecraftCharacter.tsx` — voxel, obsoleto
- `AgentCharacter.tsx`, `AvatarPod.tsx`, `OfficeView.tsx` — capas anteriores
- `Sidebar.tsx`, `RightPanel.tsx` — UI de versión anterior
**Acción: eliminar los 7 archivos muertos para reducir bundle.**

---

## 4. BRECHAS CRÍTICAS (lo que falta construir)

| # | Brecha | Impacto | Esfuerzo |
|---|--------|---------|---------|
| 1 | **Oficina 3D funcional** con props reales (plantas, cafetera, futbolín, expendedora, ping pong, neon, monitores con bloom) | Máximo — es el "wow" | Alto |
| 2 | **GitHub tool** en `/api/task` — leer repo, crear PR | Diferenciador clave | Medio |
| 3 | **TTS de salida** sin cortes (fix Chrome + chunks) | Dolor explícito del cliente | Medio |
| 4 | **STT continuo** sin cortes (restart en `onend`) | Dolor explícito | Bajo |
| 5 | **Zustand store** — eliminar props drilling | Calidad interna | Medio |
| 6 | **Tokens/coste reales en UI** — ya los devuelve la API, no se muestran | UX confianza | Bajo |
| 7 | **Animaciones idle** — directores van a cafetera/futbolín cuando están libres | Efecto Roblox/Sims | Alto |
| 8 | **Bloom en monitores** — postprocessing R3F | Visual premium | Medio |
| 9 | **ErrorBoundary en Canvas** — fallback 2.5D si falla WebGL | Fiabilidad | Bajo |
| 10 | **Director de Producto** — mapear a herramienta GitHub real | Funcionalidad core | Medio |

---

## 5. RIESGOS

| Riesgo | Severidad | Mitigación |
|--------|-----------|-----------|
| R3F peer conflict React 18 | 🔴 CRÍTICO — es la causa del "never loads" | Downgrade a fiber@8 + drei@9 |
| Bundle size Three.js (>500KB) | 🟡 MEDIO | Lazy load, instancing, no importar todo drei |
| ANTHROPIC_API_KEY en cliente | 🟢 OK | Ya está en servidor únicamente |
| `write to FS` en Vercel | 🟢 OK | Ya manejado con Blob URL fallback en TaskModal |
| GITHUB_TOKEN no configurado | 🟡 MEDIO cuando se implemente | Añadir a Vercel env vars |
| WebGL no disponible en dispositivos débiles | 🟡 MEDIO | Fallback 2.5D con sprites |
| SSE timeout en Vercel (300s max) | 🟢 OK | Las tareas terminan bien antes |

---

## 6. MAPA DE DIRECTORES → HERRAMIENTA REAL (a implementar en Fase 4)

| Director ID | Herramienta real | Artefacto |
|-------------|-----------------|-----------|
| `ceo_advisor` | `create_document` | Reporte ejecutivo Markdown |
| `director_comercial` | `create_document` | Oferta + guion cierre |
| `director_embudos` | `create_html_file` | Landing page HTML renderizable |
| `director_meta_ads` | `create_document` | Plan campaña + segmentación |
| `director_google_ads` | `create_document` | Plan campaña + RSA |
| `director_marketing` | `create_document` | Estrategia de marketing |
| `director_contenido` | `create_document` | Guión + calendario editorial |
| `director_seo` | `create_document` | Plan SEO + keywords |
| `director_sem` | `create_document` | Plan SEM |
| `director_crm_ghl` | `create_code_file` (JSON) | Flujo GHL / automación |
| `director_automatizaciones` | `create_code_file` (JSON) | Flow n8n/GHL |
| `director_financiero` | `create_document` | Dashboard KPIs + proyecciones |
| `director_operaciones` | `create_document` | SOP documentado |
| `director_llamadas_ia` | `create_document` + TTS | Análisis llamada + audio |
| **[NUEVO]** `director_producto` | **`github_read_repo` + `github_create_pr`** | **PR real en GitHub** |

> ⚠️ El Director de Producto no existe en el código actual. Hay 14 directores definidos pero ninguno tiene herramienta GitHub. Se añade como director #15 o se reutiliza `director_operaciones`.

---

## 7. RESUMEN EJECUTIVO (10 líneas)

1. La **API de Claude es real y funciona bien** — artefactos, SSE, tool use, sin mock.
2. La **oficina 3D nunca carga** en producción por incompatibilidad R3F@9 + React@18 — crítico.
3. El **progreso de tareas es falso** en cliente (intervalo random) aunque la API da datos reales.
4. **No hay voz de salida** (TTS); el dictado se corta por `continuous=false`.
5. **No hay integración GitHub** de ningún tipo.
6. **No hay Zustand** — props drilling excesivo en CommandCenter (567 líneas).
7. **7 componentes muertos** inflando el bundle sin uso.
8. El **design system CSS es sólido** y reutilizable tal cual.
9. El **TaskModal con previsualización de HTML** es el mejor componente del proyecto.
10. **Plan de acción:** (1) Fix R3F→fiber@8/drei@9, (2) Construir oficina con props y bloom, (3) Eliminar mocks y conectar progreso real, (4) Añadir GitHub tool + TTS.
