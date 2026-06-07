export type EngineId =
  | "ceo_advisor"
  | "director_comercial"
  | "director_marketing"
  | "director_embudos"
  | "director_seo"
  | "director_sem"
  | "director_meta_ads"
  | "director_google_ads"
  | "director_contenido"
  | "director_llamadas_ia"
  | "director_automatizaciones"
  | "director_crm_ghl"
  | "director_financiero"
  | "director_operaciones";

export type EngineStatus = "active" | "idle" | "paused" | "error";

export interface Engine {
  id: EngineId;
  name: string;
  description: string;
  status: EngineStatus;
  color: string;
  tasksRunning: number;
  agentsActive: number;
}

export const ENGINE_CONFIG: Record<EngineId, { name: string; description: string; color: string }> = {
  ceo_advisor: { name: "CEO Advisor", description: "Estrategia y reportes ejecutivos", color: "#f59e0b" },
  director_comercial: { name: "Director Comercial", description: "Ofertas y cierre de ventas", color: "#3b82f6" },
  director_marketing: { name: "Director de Marketing", description: "Estrategia de marketing integral", color: "#ec4899" },
  director_embudos: { name: "Director de Embudos", description: "Diseño y optimización de funnels", color: "#06b6d4" },
  director_seo: { name: "Director SEO", description: "Posicionamiento orgánico en buscadores", color: "#22c55e" },
  director_sem: { name: "Director SEM", description: "Publicidad de pago en buscadores", color: "#84cc16" },
  director_meta_ads: { name: "Director Meta Ads", description: "Campañas en Facebook e Instagram", color: "#6366f1" },
  director_google_ads: { name: "Director Google Ads", description: "Campañas en Google y YouTube", color: "#ef4444" },
  director_contenido: { name: "Director de Contenido", description: "Creación y estrategia de contenido", color: "#a855f7" },
  director_llamadas_ia: { name: "Director de Llamadas IA", description: "Análisis de llamadas con IA", color: "#f97316" },
  director_automatizaciones: { name: "Director de Automatizaciones", description: "Flujos y automatizaciones de negocio", color: "#14b8a6" },
  director_crm_ghl: { name: "Director CRM/GHL", description: "CRM y gestión de contactos", color: "#eab308" },
  director_financiero: { name: "Director Financiero", description: "Control financiero y proyecciones", color: "#10b981" },
  director_operaciones: { name: "Director de Operaciones", description: "Procesos operativos y SOPs", color: "#8b5cf6" },
};
