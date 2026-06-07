export type ConnectorStatus = "disconnected" | "demo" | "pending" | "error" | "active";
export type AuthType = "OAuth2" | "API Key" | "Webhook" | "OAuth2 + API Key";

export interface ConnectorDef {
  id: string;
  name: string;
  category: ConnectorCategory;
  description: string;
  officialUrl: string;
  authType: AuthType;
  color: string;
  reads: string[];
  writes: string[];
  scopes: string[];
  risk: "low" | "medium" | "high";
}

export type ConnectorCategory = "CRM" | "Ads" | "Comunicación" | "Productividad" | "Base de datos" | "Pagos" | "Automatización" | "Dev";

export const CONNECTOR_CATEGORIES: ConnectorCategory[] = [
  "CRM", "Ads", "Comunicación", "Productividad", "Base de datos", "Pagos", "Automatización", "Dev",
];

export const CONNECTORS: ConnectorDef[] = [
  {
    id: "ghl",
    name: "GoHighLevel",
    category: "CRM",
    description: "CRM todo-en-uno con pipelines, automatizaciones, embudos y SMS/email integrado.",
    officialUrl: "https://www.gohighlevel.com",
    authType: "API Key",
    color: "#22c55e",
    reads: ["Contactos", "Pipelines", "Campañas", "Conversaciones", "Citas"],
    writes: ["Crear/actualizar contactos", "Mover oportunidades", "Enviar emails/SMS", "Crear tareas"],
    scopes: ["contacts.readonly", "contacts.write", "opportunities.write", "conversations.write"],
    risk: "medium",
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    category: "Ads",
    description: "Gestión de campañas publicitarias en Facebook e Instagram con Meta Business.",
    officialUrl: "https://business.facebook.com",
    authType: "OAuth2",
    color: "#1877F2",
    reads: ["Campañas", "Grupos de anuncios", "Métricas", "Audiencias", "Pixels"],
    writes: ["Crear campañas", "Editar presupuestos", "Pausar/activar anuncios", "Subir creativos"],
    scopes: ["ads_management", "ads_read", "business_management", "pages_manage_ads"],
    risk: "high",
  },
  {
    id: "google_ads",
    name: "Google Ads",
    category: "Ads",
    description: "Campañas Search, Display, YouTube y Performance Max en Google.",
    officialUrl: "https://ads.google.com",
    authType: "OAuth2",
    color: "#4285F4",
    reads: ["Campañas", "Keywords", "Conversiones", "Informes de rendimiento"],
    writes: ["Crear campañas", "Editar pujas", "Añadir keywords", "Ajustar presupuestos"],
    scopes: ["adwords", "adwords.readonly"],
    risk: "high",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "Productividad",
    description: "Sincroniza eventos, reuniones y recordatorios con Google Calendar.",
    officialUrl: "https://calendar.google.com",
    authType: "OAuth2",
    color: "#4285F4",
    reads: ["Eventos", "Calendarios", "Disponibilidad", "Invitados"],
    writes: ["Crear eventos", "Invitar asistentes", "Modificar/cancelar eventos"],
    scopes: ["calendar.events", "calendar.readonly"],
    risk: "low",
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Comunicación",
    description: "Envío y recepción de emails automatizados desde tu cuenta Google.",
    officialUrl: "https://mail.google.com",
    authType: "OAuth2",
    color: "#EA4335",
    reads: ["Emails recibidos", "Labels", "Hilos de conversación", "Adjuntos"],
    writes: ["Enviar emails", "Crear borradores", "Aplicar labels", "Archivar/eliminar"],
    scopes: ["gmail.send", "gmail.readonly", "gmail.compose", "gmail.modify"],
    risk: "high",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    category: "Productividad",
    description: "Almacena y exporta documentos, reportes y archivos en Drive.",
    officialUrl: "https://drive.google.com",
    authType: "OAuth2",
    color: "#0F9D58",
    reads: ["Archivos", "Carpetas", "Permisos", "Metadatos"],
    writes: ["Crear documentos", "Subir archivos", "Compartir", "Editar permisos"],
    scopes: ["drive.file", "drive.readonly", "drive.metadata"],
    risk: "medium",
  },
  {
    id: "notion",
    name: "Notion",
    category: "Base de datos",
    description: "Base de conocimiento, wikis, proyectos y bases de datos relacionales.",
    officialUrl: "https://www.notion.so",
    authType: "OAuth2",
    color: "#000000",
    reads: ["Páginas", "Bases de datos", "Bloques", "Propiedades"],
    writes: ["Crear/editar páginas", "Añadir entradas a BD", "Actualizar propiedades"],
    scopes: ["read_content", "update_content", "insert_content", "read_user_info"],
    risk: "low",
  },
  {
    id: "airtable",
    name: "Airtable",
    category: "Base de datos",
    description: "Bases de datos flexibles con vistas Kanban, Grid, Gallery y Forms.",
    officialUrl: "https://airtable.com",
    authType: "API Key",
    color: "#18BFFF",
    reads: ["Registros", "Tablas", "Vistas", "Campos"],
    writes: ["Crear registros", "Actualizar campos", "Eliminar registros", "Crear tablas"],
    scopes: ["data.records:read", "data.records:write", "schema.bases:read"],
    risk: "low",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "Comunicación",
    description: "Mensajes automatizados, secuencias y atención al cliente en WhatsApp.",
    officialUrl: "https://business.whatsapp.com",
    authType: "OAuth2 + API Key",
    color: "#25D366",
    reads: ["Mensajes recibidos", "Contactos", "Estado de entrega", "Templates"],
    writes: ["Enviar mensajes", "Enviar templates", "Crear flujos conversacionales"],
    scopes: ["whatsapp_business_messaging", "whatsapp_business_management"],
    risk: "medium",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "Comunicación",
    description: "Publicación de contenido, stories y gestión de comentarios en Instagram.",
    officialUrl: "https://www.instagram.com",
    authType: "OAuth2",
    color: "#E1306C",
    reads: ["Posts", "Stories", "Métricas", "Comentarios", "Mensajes directos"],
    writes: ["Publicar posts", "Publicar stories", "Responder comentarios"],
    scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_messages"],
    risk: "medium",
  },
  {
    id: "facebook_pages",
    name: "Facebook Pages",
    category: "Comunicación",
    description: "Gestión de páginas, publicaciones y mensajes de Facebook.",
    officialUrl: "https://www.facebook.com/pages",
    authType: "OAuth2",
    color: "#1877F2",
    reads: ["Posts", "Comentarios", "Mensajes", "Métricas de página", "Eventos"],
    writes: ["Crear posts", "Programar publicaciones", "Responder mensajes/comentarios"],
    scopes: ["pages_manage_posts", "pages_read_engagement", "pages_messaging"],
    risk: "medium",
  },
  {
    id: "tiktok",
    name: "TikTok for Business",
    category: "Ads",
    description: "Campañas publicitarias y gestión de contenido en TikTok Business.",
    officialUrl: "https://business.tiktok.com",
    authType: "OAuth2",
    color: "#000000",
    reads: ["Campañas", "Creativos", "Métricas", "Audiencias"],
    writes: ["Crear campañas", "Subir videos", "Ajustar presupuestos"],
    scopes: ["advertiser:read", "advertiser:write"],
    risk: "high",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "Comunicación",
    description: "Contenido profesional, lead generation y campañas B2B en LinkedIn.",
    officialUrl: "https://www.linkedin.com",
    authType: "OAuth2",
    color: "#0A66C2",
    reads: ["Perfil", "Conexiones", "Posts", "Métricas", "Leads"],
    writes: ["Publicar posts", "Enviar InMail", "Gestionar campañas Lead Gen"],
    scopes: ["r_liteprofile", "r_emailaddress", "w_member_social", "rw_ads"],
    risk: "medium",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Pagos",
    description: "Procesamiento de pagos, suscripciones, invoices y revenue analytics.",
    officialUrl: "https://dashboard.stripe.com",
    authType: "API Key",
    color: "#635BFF",
    reads: ["Pagos", "Clientes", "Suscripciones", "Invoices", "Balance"],
    writes: ["Crear cargos", "Gestionar suscripciones", "Emitir reembolsos", "Crear clientes"],
    scopes: ["charges:read", "customers:read", "subscriptions:read", "charges:write"],
    risk: "high",
  },
  {
    id: "github",
    name: "GitHub",
    category: "Dev",
    description: "Repositorios, issues, pull requests y automatización CI/CD.",
    officialUrl: "https://github.com",
    authType: "OAuth2",
    color: "#24292e",
    reads: ["Repositorios", "Issues", "Pull Requests", "Actions", "Commits"],
    writes: ["Crear issues", "Comentar PRs", "Trigger workflows", "Crear releases"],
    scopes: ["repo", "workflow", "read:org", "write:issues"],
    risk: "medium",
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "Dev",
    description: "Deployments, logs, dominios y monitoreo de apps en Vercel.",
    officialUrl: "https://vercel.com",
    authType: "API Key",
    color: "#000000",
    reads: ["Deployments", "Proyectos", "Logs", "Dominios", "Métricas"],
    writes: ["Trigger deploys", "Gestionar dominios", "Configurar variables de entorno"],
    scopes: ["deployments:read", "projects:read", "logs:read", "deployments:write"],
    risk: "medium",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Comunicación",
    description: "Notificaciones automáticas, reportes y alertas en canales Slack.",
    officialUrl: "https://slack.com",
    authType: "OAuth2",
    color: "#4A154B",
    reads: ["Canales", "Mensajes", "Usuarios", "Archivos"],
    writes: ["Enviar mensajes", "Crear canales", "Subir archivos", "Actualizar estado"],
    scopes: ["chat:write", "channels:read", "files:write", "users:read"],
    risk: "low",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automatización",
    description: "Conecta más de 5,000 apps con flujos automatizados sin código.",
    officialUrl: "https://zapier.com",
    authType: "API Key",
    color: "#FF4A00",
    reads: ["Zaps activos", "Historial de ejecuciones", "Apps conectadas"],
    writes: ["Trigger Zaps", "Crear Zaps vía API", "Pausar/activar automatizaciones"],
    scopes: ["zaps:read", "zaps:write", "zaps:run"],
    risk: "low",
  },
  {
    id: "make",
    name: "Make",
    category: "Automatización",
    description: "Flujos de automatización visual avanzados con lógica condicional.",
    officialUrl: "https://www.make.com",
    authType: "API Key",
    color: "#6D00CC",
    reads: ["Escenarios", "Ejecuciones", "Conexiones", "Módulos disponibles"],
    writes: ["Activar escenarios", "Crear escenarios", "Clonar flujos", "Programar ejecuciones"],
    scopes: ["scenarios:read", "scenarios:write", "connections:read", "hook:write"],
    risk: "low",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automatización",
    description: "Automatización open-source auto-alojada con control total de datos.",
    officialUrl: "https://n8n.io",
    authType: "API Key",
    color: "#EA4B71",
    reads: ["Workflows", "Ejecuciones", "Credenciales", "Logs"],
    writes: ["Activar workflows", "Crear workflows", "Ejecutar manualmente", "Editar nodos"],
    scopes: ["workflow:read", "workflow:write", "execution:read", "credential:read"],
    risk: "low",
  },
];

export const CONNECTOR_MAP = Object.fromEntries(
  CONNECTORS.map((c) => [c.id, c]),
) as Record<string, ConnectorDef>;

// Storage key for demo connections
export const CONNECTORS_STORAGE_KEY = "ac360_connectors_v1";

export function loadConnectorStates(): Record<string, ConnectorStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CONNECTORS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveConnectorStates(states: Record<string, ConnectorStatus>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONNECTORS_STORAGE_KEY, JSON.stringify(states));
}
