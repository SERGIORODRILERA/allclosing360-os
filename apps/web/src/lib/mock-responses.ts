import type { EngineId } from "@ac360/types";
import type { SkillId } from "./skills";

export interface BotResponse {
  text: string;
  taskTitle: string;
}

const SKILL_RESPONSES: Partial<Record<SkillId, BotResponse>> = {
  crear_oferta_irresistible: {
    text: "Analizando tu mercado objetivo y competidores directos. Voy a estructurar una oferta con: (1) propuesta de valor única diferenciada, (2) stack de bonos irresistibles, (3) precio ancla vs precio real, (4) urgencia legítima. La oferta tendrá una tasa de conversión estimada del 12-18% en audiencia calificada.",
    taskTitle: "Diseñar oferta irresistible con stack de valor",
  },
  crear_garantia: {
    text: "Diseñando garantía de triple inversión. Incluirá: garantía de resultado en 90 días, garantía de satisfacción sin preguntas en 30 días, y garantía de implementación con soporte prioritario. Esto reducirá la fricción de compra hasta un 40% según benchmarks del sector.",
    taskTitle: "Estructurar garantía de triple inversión",
  },
  crear_landing: {
    text: "Diseñando arquitectura de landing de alta conversión. Estructura: hero con promesa de transformación, proof social con testimonios específicos, sección de beneficios vs características, FAQ de objeciones clave, CTA múltiples. Objetivo: tasa de conversión > 8% en tráfico frío.",
    taskTitle: "Crear landing page de alta conversión",
  },
  crear_campana_meta_ads: {
    text: "Configurando campaña Meta Ads en 3 fases: (1) TOF — awareness con creatives de problema/solución, (2) MOF — retargeting con testimonios y demos, (3) BOF — oferta directa a audiencias calientes. Presupuesto sugerido: 70/20/10. CPL objetivo < $8 USD.",
    taskTitle: "Estructurar campaña Meta Ads en 3 fases",
  },
  crear_campana_google_ads: {
    text: "Arquitectando campaña Google Ads con: keywords de intención alta (bottom funnel), grupos de anuncios segmentados por intención, extensiones de sitelink y llamada, remarketing RLSA para visitantes del sitio. ROAS objetivo: 4x en los primeros 30 días de optimización.",
    taskTitle: "Configurar campaña Google Ads con segmentación por intención",
  },
  crear_estrategia_seo: {
    text: "Desarrollando estrategia SEO en 3 pilares: (1) auditoría técnica y correcciones prioritarias, (2) mapa de keywords por intención de búsqueda (informacional, transaccional, navegacional), (3) plan de contenido pilar-cluster para autoridad topical. Proyección: primeros resultados en posición 10-30 en 90 días.",
    taskTitle: "Crear estrategia SEO de 90 días",
  },
  crear_campana_sem: {
    text: "Diseñando estrategia SEM integrada: análisis de SERP y competidores, estructura de cuentas por categoría de servicio, estrategia de puja inteligente (tCPA/tROAS), y calendario de optimización semanal. Incluye plan de extensiones y scripts de automatización.",
    taskTitle: "Diseñar estrategia SEM con estructura de cuentas",
  },
  crear_guion_video: {
    text: "Creando guion de video con framework PASTOR: Problema que resuelve, Amplificación del dolor, Solución presentada, Transformación con testimonios, Oferta irresistible, Respuesta (CTA). Formato de 90 segundos para redes y versión extendida de 8 min para YouTube.",
    taskTitle: "Escribir guion de video con framework PASTOR",
  },
  crear_secuencia_whatsapp: {
    text: "Diseñando secuencia de 7 mensajes para WhatsApp: D1-Bienvenida con valor inmediato, D2-Historia de transformación, D3-Objeción #1 eliminada, D4-Prueba social, D5-Urgencia real, D6-Recordatorio final, D7-Re-engagement para inactivos. Tasa de apertura esperada: 85-95%.",
    taskTitle: "Crear secuencia WhatsApp de 7 mensajes",
  },
  crear_secuencia_email: {
    text: "Estructurando secuencia de email en 5 actos: email de bienvenida y expectativas, contenido de alto valor (2 emails), email de historia/transformación, email de objeciones, email de oferta con escasez. Sujetos optimizados para 35-45% de open rate.",
    taskTitle: "Crear secuencia email de 5 actos",
  },
  analizar_llamada: {
    text: "Analizando llamada de ventas con IA. Evaluando: ratio hablar/escuchar, manejo de objeciones, uso de lenguaje de beneficios vs características, cierre de compromisos, próximos pasos definidos. Generaré scorecard con 15 métricas y plan de mejora personalizado.",
    taskTitle: "Análisis de llamada con scorecard de 15 métricas",
  },
  crear_reporte_ejecutivo: {
    text: "Compilando reporte ejecutivo con datos de todos los departamentos. Incluirá: KPIs de revenue (MRR, ARR, churn), métricas de marketing (CAC, LTV, ROAS), performance de ventas (tasa de cierre, ciclo de venta), y proyecciones para los próximos 90 días con recomendaciones estratégicas.",
    taskTitle: "Compilar reporte ejecutivo multi-departamento",
  },
  crear_propuesta_comercial: {
    text: "Generando propuesta comercial de alto impacto. Estructura: resumen ejecutivo con ROI proyectado, diagnóstico de situación actual del cliente, solución específica con deliverables, inversión con opciones de paquetes, casos de éxito similares, y garantías. Formato diseñado para cierre en reunión.",
    taskTitle: "Generar propuesta comercial de alto impacto",
  },
  crear_plan_seguimiento: {
    text: "Diseñando plan de seguimiento en 5 touchpoints: T1-Inmediato post-reunión (WhatsApp 1h), T2-Email con recursos (D1), T3-Llamada de valor agregado (D3), T4-Caso de éxito relevante (D7), T5-Decisión final con incentivo (D14). Cada touchpoint con script y objetivo específico.",
    taskTitle: "Crear plan de seguimiento en 5 touchpoints",
  },
  crear_sop_operativo: {
    text: "Documentando SOP con metodología de 6 pasos: objetivo del proceso, roles y responsabilidades, pasos detallados con decisiones, métricas de control de calidad, checklist de verificación, y protocolo de escalamiento. El SOP será ejecutable por cualquier miembro del equipo sin supervisión.",
    taskTitle: "Documentar SOP con metodología de 6 pasos",
  },
};

const DEFAULT_RESPONSE: BotResponse = {
  text: "Analizando tu solicitud y asignando el director y skill óptimos. El sistema está procesando tu orden y generará un plan de acción concreto con pasos ejecutables en los próximos segundos.",
  taskTitle: "Procesando orden del sistema",
};

export function getSkillResponse(skillId: SkillId): BotResponse {
  return SKILL_RESPONSES[skillId] ?? DEFAULT_RESPONSE;
}

// Keeps existing callers working (used nowhere now but exported for safety)
export function getResponse(text: string): { text: string; engineId: EngineId; taskTitle: string } {
  return {
    ...DEFAULT_RESPONSE,
    engineId: "ceo_advisor",
  };
}
