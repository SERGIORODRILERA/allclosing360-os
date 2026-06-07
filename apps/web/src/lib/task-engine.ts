import type { SkillId } from "./skills";

export interface TaskStep {
  label: string;
  completed: boolean;
  current: boolean;
}

export type RiskLevel = "low" | "medium" | "high";

// Steps per skill — progress 0→100% maps to steps
const SKILL_STEPS: Record<string, string[]> = {
  crear_oferta_irresistible: [
    "Analizando mercado objetivo",
    "Investigando competencia directa",
    "Definiendo propuesta de valor única",
    "Estructurando stack de valor y bonos",
    "Calculando anclaje de precio",
    "Generando copy de oferta",
    "Revisando y optimizando",
  ],
  crear_garantia: [
    "Identificando objeciones clave",
    "Analizando benchmarks del sector",
    "Diseñando estructura de garantía",
    "Redactando términos",
    "Creando copy de presentación",
  ],
  crear_landing: [
    "Analizando buyer persona",
    "Definiendo estructura de la página",
    "Creando sección Hero y headline",
    "Desarrollando sección de beneficios",
    "Escribiendo testimonios y prueba social",
    "Diseñando CTAs y urgencia",
    "Optimizando para conversión",
  ],
  crear_campana_meta_ads: [
    "Analizando audiencias objetivo",
    "Definiendo estructura de campaña (TOF/MOF/BOF)",
    "Creando audiencias personalizadas",
    "Generando 5 hooks creativos",
    "Escribiendo 5 copies de anuncio",
    "Calculando presupuesto y KPIs",
    "Preparando plan de lanzamiento",
  ],
  crear_campana_google_ads: [
    "Investigando keywords de intención alta",
    "Analizando SERP y competencia",
    "Estructurando grupos de anuncios",
    "Escribiendo textos de anuncio (RSA)",
    "Configurando extensiones",
    "Definiendo estrategia de pujas",
    "Generando plan de optimización",
  ],
  crear_estrategia_seo: [
    "Auditando estado técnico actual",
    "Investigando keywords por intención",
    "Analizando competencia orgánica",
    "Creando arquitectura pilar-cluster",
    "Diseñando plan de link building",
    "Programando calendario de contenido",
    "Definiendo métricas y seguimiento",
  ],
  crear_campana_sem: [
    "Analizando landscape de búsqueda",
    "Definiendo objetivos y KPIs",
    "Estructurando cuentas y campañas",
    "Creando keywords negativas",
    "Diseñando estrategia de puja inteligente",
    "Generando plan de optimización semanal",
  ],
  crear_guion_video: [
    "Definiendo objetivo del vídeo",
    "Creando hook de los primeros 3 segundos",
    "Desarrollando estructura PASTOR",
    "Escribiendo cuerpo del guion",
    "Creando CTA y cierre",
    "Adaptando para formato corto y largo",
  ],
  crear_secuencia_whatsapp: [
    "Mapeando journey del lead",
    "Definiendo 7 touchpoints clave",
    "Escribiendo mensaje de bienvenida",
    "Creando mensajes de valor (D2-D4)",
    "Desarrollando urgencia y cierre (D5-D7)",
    "Añadiendo variables de personalización",
  ],
  crear_secuencia_email: [
    "Analizando lista y segmentos",
    "Definiendo objetivo de la secuencia",
    "Escribiendo email de bienvenida",
    "Creando emails de valor (2 emails)",
    "Desarrollando email de historia",
    "Escribiendo email de oferta",
    "Optimizando sujetos y preview text",
  ],
  analizar_llamada: [
    "Transcribiendo audio",
    "Identificando fases de la llamada",
    "Analizando ratio hablar/escuchar",
    "Evaluando manejo de objeciones",
    "Detectando patrones de cierre",
    "Generando scorecard de 15 métricas",
    "Creando plan de mejora",
  ],
  crear_reporte_ejecutivo: [
    "Recopilando KPIs de todos los departamentos",
    "Analizando tendencias revenue",
    "Calculando métricas de marketing (CAC/LTV)",
    "Evaluando performance de ventas",
    "Generando proyecciones 90 días",
    "Redactando recomendaciones estratégicas",
    "Formateando reporte ejecutivo",
  ],
  crear_propuesta_comercial: [
    "Analizando perfil del cliente",
    "Definiendo problema y diagnóstico",
    "Estructurando solución específica",
    "Calculando ROI proyectado",
    "Seleccionando casos de éxito",
    "Escribiendo resumen ejecutivo",
    "Añadiendo términos y garantías",
  ],
  crear_plan_seguimiento: [
    "Mapeando etapa actual del lead",
    "Definiendo 5 touchpoints de follow-up",
    "Creando scripts para cada touchpoint",
    "Programando cadencia de contacto",
    "Diseñando incentivo de cierre",
    "Generando métricas de seguimiento",
  ],
  crear_sop_operativo: [
    "Identificando proceso a documentar",
    "Definiendo roles y responsabilidades",
    "Mapeando pasos detallados",
    "Creando árbol de decisiones",
    "Desarrollando checklist de calidad",
    "Diseñando protocolo de escalamiento",
    "Revisando y validando el SOP",
  ],
};

const DEFAULT_STEPS = [
  "Analizando solicitud",
  "Procesando información",
  "Generando entregable",
  "Revisando resultado",
  "Finalizando",
];

export function getStepsForSkill(skillId: string): string[] {
  return SKILL_STEPS[skillId] ?? DEFAULT_STEPS;
}

export function computeSteps(skillId: string, progress: number): TaskStep[] {
  const labels = getStepsForSkill(skillId);
  const total = labels.length;
  const completedCount = Math.floor((progress / 100) * total);

  return labels.map((label, i) => ({
    label,
    completed: i < completedCount,
    current: i === completedCount && progress < 100,
  }));
}

// Token estimates per skill
const SKILL_TOKENS: Record<string, number> = {
  crear_oferta_irresistible: 3800,
  crear_garantia: 1200,
  crear_landing: 4200,
  crear_campana_meta_ads: 5100,
  crear_campana_google_ads: 4800,
  crear_estrategia_seo: 6200,
  crear_campana_sem: 3500,
  crear_guion_video: 3200,
  crear_secuencia_whatsapp: 2800,
  crear_secuencia_email: 3600,
  analizar_llamada: 7500,
  crear_reporte_ejecutivo: 8100,
  crear_propuesta_comercial: 4900,
  crear_plan_seguimiento: 2200,
  crear_sop_operativo: 3900,
};

const DEFAULT_TOKENS = 2500;

export function estimateTokens(skillId: string): number {
  return SKILL_TOKENS[skillId] ?? DEFAULT_TOKENS;
}

export function estimateCost(tokens: number): number {
  return parseFloat(((tokens / 1000) * 0.003).toFixed(4));
}

const SKILL_RISK: Record<string, RiskLevel> = {
  crear_estrategia_seo: "medium",
  crear_campana_meta_ads: "medium",
  crear_campana_google_ads: "medium",
  analizar_llamada: "low",
  crear_reporte_ejecutivo: "low",
  crear_sop_operativo: "low",
  crear_garantia: "low",
  crear_propuesta_comercial: "medium",
};

export function estimateRisk(skillId: string): RiskLevel {
  return SKILL_RISK[skillId] ?? "low";
}

// Rich mock results per skill
const SKILL_RESULTS: Record<string, string> = {
  crear_campana_meta_ads: `📊 CAMPAÑA META ADS — RESULTADO

🎯 OBJETIVO: Generación de leads calificados
💰 PRESUPUESTO SUGERIDO: $1,500 USD/mes

─────────────────────────────────
AUDIENCIAS OBJETIVO
─────────────────────────────────
• Principal: 28-50 años, interesados en el sector, radio 25km
• Lookalike 1-3%: basada en clientes actuales
• Retargeting: visitantes web últimos 30 días + interactuaron

─────────────────────────────────
ESTRUCTURA DE CAMPAÑA
─────────────────────────────────
TOF Awareness     40% → Videos problema-solución (15-30s)
MOF Consideración 35% → Testimoniales + demostración
BOF Conversión    25% → Oferta directa con urgencia

─────────────────────────────────
5 HOOKS CREATIVOS
─────────────────────────────────
1. "¿Cuándo fue la última vez que realmente conseguiste [resultado]?"
2. "200 empresas ya lo hicieron. Tú eres el siguiente."
3. "ATENCIÓN: Solo quedan 10 plazas para este mes."
4. "El método que nadie en tu sector te está contando."
5. "De 0 a resultados en 90 días — o te devolvemos el dinero."

─────────────────────────────────
KPIs OBJETIVO (mes 3)
─────────────────────────────────
• CPL objetivo: < $12 USD
• CTR esperado: > 2.8%
• Frecuencia máxima: 3.5x
• ROAS objetivo: 4.5x

─────────────────────────────────
⚠️ RIESGOS IDENTIFICADOS
─────────────────────────────────
• Fatiga de anuncio: rotar creativos cada 14 días
• Saturación de audiencia en mercados < 200K personas

─────────────────────────────────
🚀 PRÓXIMOS PASOS
─────────────────────────────────
1. Crear 3 creativos A/B (imagen + vídeo + carrusel)
2. Lanzar con $300 de presupuesto de prueba (7 días)
3. Analizar resultados y escalar el ganador
4. Conectar Meta pixel con GHL para atribución`,

  crear_oferta_irresistible: `🔥 OFERTA IRRESISTIBLE — RESULTADO

─────────────────────────────────
NOMBRE DE LA OFERTA
─────────────────────────────────
"Sistema [Resultado] en [Tiempo] — Garantizado"

─────────────────────────────────
PROPUESTA DE VALOR ÚNICA
─────────────────────────────────
[Lo que obtienes] + [En qué tiempo] + [Sin qué problema] + [Para quién]

Ejemplo: "Llena tu agenda de pacientes ideales en 30 días sin
gastar en publicidad que no convierte — específico para clínicas."

─────────────────────────────────
STACK DE VALOR
─────────────────────────────────
✅ CORE: Servicio principal         Valor: $2,400/mes
✅ BONO 1: Sesión estratégica 1:1   Valor: $497
✅ BONO 2: Plantillas de prospección Valor: $297
✅ BONO 3: Acceso comunidad privada  Valor: $197
✅ BONO 4: Soporte WhatsApp 30 días  Valor: $397
────────────────────────────────────────────────
   VALOR TOTAL PERCIBIDO:            $3,788
   PRECIO DE INVERSIÓN:              $997
   AHORRO:                           $2,791 (74%)

─────────────────────────────────
ANCLAJE DE PRECIO
─────────────────────────────────
Precio original: ~~$2,400/mes~~
Precio especial hoy: $997 (pago único)
Urgencia: Disponible solo hasta el [fecha] o hasta llenar cupo.

─────────────────────────────────
🛡️ GARANTÍA INCLUIDA
─────────────────────────────────
30 días de garantía sin preguntas.
Si no estás satisfecho, devolvemos el 100%.

─────────────────────────────────
🚀 PRÓXIMOS PASOS
─────────────────────────────────
1. Validar oferta con 5 clientes potenciales
2. Crear landing page con esta estructura
3. Configurar proceso de onboarding
4. Lanzar con campaña Meta Ads`,

  crear_reporte_ejecutivo: `📊 REPORTE EJECUTIVO — SEMANA ${new Date().toLocaleDateString("es", { day: "2-digit", month: "short" }).toUpperCase()}

─────────────────────────────────
RESUMEN DE REVENUE
─────────────────────────────────
MRR actual:         $24,800 USD   ↑ 12% vs semana anterior
ARR proyectado:     $297,600 USD
Nuevos clientes:    7              ↑ 3 vs semana anterior
Churn semanal:      0.8%          ↓ Mejor que benchmark
LTV promedio:       $4,200 USD

─────────────────────────────────
MARKETING
─────────────────────────────────
CPL Meta Ads:       $11.40        ✅ En objetivo
ROAS Google:        5.2x          ✅ Superando objetivo
Leads generados:    142           ↑ 28% vs semana anterior
Tasa de conversión: 8.4%          ↑ 1.2pp mejora

─────────────────────────────────
VENTAS
─────────────────────────────────
Propuestas enviadas: 24
Tasa de cierre:      29%           ↑ Mejora vs 23% anterior
Ciclo de venta:      8 días        ↓ Reducción notable
Ticket promedio:     $1,420 USD

─────────────────────────────────
TOP 3 OPORTUNIDADES
─────────────────────────────────
1. 🔥 Escalar Meta Ads — ROAS 5.2x, budget actual bajo
2. 📧 Reactivar leads fríos (180 leads sin respuesta >30d)
3. 🤖 Automatizar seguimiento — reduce ciclo a 5 días

─────────────────────────────────
⚠️ ALERTAS
─────────────────────────────────
• 3 clientes con riesgo de churn detectado
• Presupuesto Meta Ads 87% consumido

─────────────────────────────────
🚀 ACCIONES RECOMENDADAS
─────────────────────────────────
1. Aumentar budget Meta Ads 40%
2. Lanzar campaña de reactivación leads fríos
3. Implementar NPS para detectar churn temprano`,

  crear_estrategia_seo: `🔍 ESTRATEGIA SEO — PLAN 90 DÍAS

─────────────────────────────────
AUDITORÍA TÉCNICA
─────────────────────────────────
✅ Core Web Vitals: LCP 2.1s (OK), FID <100ms (OK)
⚠️ CLS: 0.18 (mejorar — impacta rankings)
❌ 34 páginas sin meta description
❌ 12 imágenes sin atributo alt
❌ Sitemap desactualizado

─────────────────────────────────
KEYWORDS PRIORITARIAS
─────────────────────────────────
Intención Transaccional:
• "[servicio] precio" — Vol: 1,200/mes, Dif: Media
• "contratar [servicio]" — Vol: 890/mes, Dif: Alta
• "mejor [servicio] [ciudad]" — Vol: 2,100/mes, Dif: Baja

Intención Informacional:
• "cómo [resultado clave]" — Vol: 4,500/mes
• "qué es [servicio]" — Vol: 3,200/mes

─────────────────────────────────
ARQUITECTURA PILAR-CLUSTER
─────────────────────────────────
PILAR 1: [Tema principal] → 8 artículos cluster
PILAR 2: [Caso de uso 1] → 5 artículos cluster
PILAR 3: [Caso de uso 2] → 6 artículos cluster

─────────────────────────────────
PLAN DE CONTENIDO (Mes 1-3)
─────────────────────────────────
Mes 1: Correcciones técnicas + 4 artículos pilares
Mes 2: Link building (8 backlinks DA>40) + 8 artículos
Mes 3: Optimización + 6 artículos cluster

─────────────────────────────────
PROYECCIÓN
─────────────────────────────────
Mes 1: +15% tráfico orgánico
Mes 3: Posición 10-20 en keywords objetivo
Mes 6: Top 5 en 70% de keywords objetivo`,

  crear_landing: `🏠 LANDING PAGE — ESTRUCTURA COMPLETA

─────────────────────────────────
SECCIÓN 1: HERO
─────────────────────────────────
HEADLINE: "[Resultado específico] en [Tiempo] — Garantizado"
SUBHEADLINE: "Para [ICP exacto] que quieren [resultado] sin [obstáculo]"
CTA PRIMARIO: "Quiero empezar ahora →"
ELEMENTO CONFIANZA: "Más de 200 clientes · Sin permanencia · Resultado garantizado"

─────────────────────────────────
SECCIÓN 2: PROBLEMA
─────────────────────────────────
"¿Te suena familiar?"
• Punto de dolor 1 (específico y emocional)
• Punto de dolor 2 (consecuencia del no-actuar)
• Punto de dolor 3 (frustración actual)
Transición: "Existe una manera mejor..."

─────────────────────────────────
SECCIÓN 3: SOLUCIÓN
─────────────────────────────────
3 beneficios principales (NO características):
1. Beneficio 1 → Qué significa para el cliente
2. Beneficio 2 → Transformación específica
3. Beneficio 3 → Diferenciador único

─────────────────────────────────
SECCIÓN 4: PRUEBA SOCIAL
─────────────────────────────────
• 3 testimonios con nombre, foto, empresa, resultado específico
• Logo wall de clientes (si aplica)
• Métricas con números reales

─────────────────────────────────
SECCIÓN 5: OFERTA + CTA
─────────────────────────────────
Stack de valor visible
Precio con anclaje
Urgencia legítima
CTA final: "Reserva tu plaza ahora"
Garantía visible debajo del CTA

─────────────────────────────────
KPIs OBJETIVO
─────────────────────────────────
• Tasa de conversión objetivo: >7% tráfico frío
• Tiempo en página: >2:30 min
• Bounce rate objetivo: <65%`,

  analizar_llamada: `📞 ANÁLISIS DE LLAMADA — SCORECARD

─────────────────────────────────
MÉTRICAS GLOBALES
─────────────────────────────────
Duración total:        18:42 min
Ratio hablar/escuchar: 58% / 42%   ⚠️ Ideal: 40/60
Preguntas hechas:      7            ✅ Bueno (>6)
Interrupciones:        3            ✅ Aceptable

─────────────────────────────────
FASES DE LA LLAMADA
─────────────────────────────────
Rapport inicial:       2:10 min    ✅ Bien ejecutado
Descubrimiento:        6:30 min    ⚠️ Corto (necesita más)
Presentación:          7:15 min    ❌ Demasiado larga
Manejo objeciones:     2:05 min    ✅
Cierre:                0:42 min    ❌ Sin intento claro

─────────────────────────────────
OBJECIONES IDENTIFICADAS
─────────────────────────────────
1. "Es muy caro" → Respuesta: 6/10 (faltó ROI)
2. "Necesito pensarlo" → Respuesta: 4/10 (sin siguiente paso)
3. "No es el momento" → Respuesta: 3/10 (sin manejo)

─────────────────────────────────
PALABRAS CLAVE DEL CLIENTE
─────────────────────────────────
Mencionó 4 veces: "tiempo", "resultados rápidos"
Mencionó 3 veces: "equipo pequeño", "recursos limitados"
→ INSIGHT: Cliente busca velocidad con bajo esfuerzo propio

─────────────────────────────────
PLAN DE MEJORA (TOP 3)
─────────────────────────────────
1. Extender descubrimiento 3 minutos más antes de presentar
2. Añadir pregunta de ROI: "¿Cuánto vale para ti resolver esto?"
3. Siempre terminar con: "¿Qué necesitas ver para tomar decisión hoy?"`,
};

const DEFAULT_RESULT = `✅ TAREA COMPLETADA

El resultado ha sido generado correctamente por el director asignado.

─────────────────────────────────
ENTREGABLE
─────────────────────────────────
El director ha procesado tu solicitud y generado el entregable correspondiente según la skill ejecutada.

─────────────────────────────────
🚀 PRÓXIMOS PASOS SUGERIDOS
─────────────────────────────────
1. Revisar el entregable y ajustar según tu contexto
2. Implementar con tu equipo
3. Medir resultados y dar feedback al sistema
4. Crear tarea derivada si necesitas profundizar`;

export function generateResult(skillId: string): string {
  return SKILL_RESULTS[skillId] ?? DEFAULT_RESULT;
}

export function getCurrentStepLabel(skillId: string, progress: number): string {
  const steps = getStepsForSkill(skillId);
  const idx = Math.min(
    Math.floor((progress / 100) * steps.length),
    steps.length - 1,
  );
  return steps[idx] ?? "Procesando…";
}
