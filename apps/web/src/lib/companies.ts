export interface Company {
  id: string;
  name: string;
  sector: string;
  color: string;
  emoji: string;
  description: string;
}

export const COMPANIES: Company[] = [
  {
    id: "allclosing360",
    name: "AllClosing360",
    sector: "Agencia IA",
    color: "#4f7eff",
    emoji: "🚀",
    description: "Sistema operativo empresarial de IA",
  },
  {
    id: "ocean_baby",
    name: "Ocean Baby",
    sector: "E-commerce",
    color: "#06b6d4",
    emoji: "🌊",
    description: "Tienda online de productos para bebés",
  },
  {
    id: "clinica_dental",
    name: "Clínica Dental Demo",
    sector: "Salud",
    color: "#10b981",
    emoji: "🦷",
    description: "Clínica dental en expansión",
  },
  {
    id: "inmobiliaria_demo",
    name: "Inmobiliaria Demo",
    sector: "Real Estate",
    color: "#f97316",
    emoji: "🏠",
    description: "Agencia inmobiliaria digital",
  },
  {
    id: "agencia_demo",
    name: "Agencia Marketing Demo",
    sector: "Marketing",
    color: "#a855f7",
    emoji: "📣",
    description: "Agencia de marketing performance",
  },
];

export const COMPANY_MAP = Object.fromEntries(
  COMPANIES.map((c) => [c.id, c]),
) as Record<string, Company>;

export const DEFAULT_COMPANY_ID = "allclosing360";
