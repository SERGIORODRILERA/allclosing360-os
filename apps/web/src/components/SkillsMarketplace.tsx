"use client";

import { SKILLS } from "../lib/skills";
import { DIRECTOR_MAP } from "../lib/engines";
import type { StoredOrder } from "../lib/memory";

interface SkillsMarketplaceProps {
  orders: StoredOrder[];
}

export default function SkillsMarketplace({ orders }: SkillsMarketplaceProps) {
  // Usage stats from orders
  const usageMap: Record<string, number> = {};
  const lastUsedMap: Record<string, string> = {};
  for (const order of orders) {
    usageMap[order.skillId] = (usageMap[order.skillId] ?? 0) + 1;
    if (!lastUsedMap[order.skillId]) lastUsedMap[order.skillId] = order.timestamp;
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 3 }}>
            Marketplace Interno
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>
            Skills Disponibles
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>
            {SKILLS.length} skills activas · Escribe una orden para ejecutarlas
          </div>
        </div>
        <div
          style={{
            padding: "6px 12px",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 11,
            color: "var(--color-success)",
          }}
        >
          {SKILLS.length} ACTIVAS
        </div>
      </div>

      {/* Skills grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {SKILLS.map((skill) => {
          const director = DIRECTOR_MAP[skill.primaryDirector];
          const useCount = usageMap[skill.id] ?? 0;
          const lastUsed = lastUsedMap[skill.id];

          return (
            <div key={skill.id} className="skill-card">
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${director?.color ?? "#666"}15`,
                    border: `1px solid ${director?.color ?? "#666"}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {skill.icon}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: useCount > 0 ? "var(--color-success)" : "var(--color-text-dim)",
                    background: useCount > 0 ? "var(--color-success-glow)" : "var(--color-surface-4)",
                    border: `1px solid ${useCount > 0 ? "rgba(34,217,122,0.25)" : "var(--color-border)"}`,
                    borderRadius: 4,
                    padding: "2px 7px",
                  }}
                >
                  {useCount > 0 ? `${useCount}× usada` : "LISTA"}
                </div>
              </div>

              {/* Name */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.35, marginBottom: 4 }}>
                {skill.name}
              </div>

              {/* Description */}
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.4, marginBottom: 10 }}>
                {skill.description}
              </div>

              {/* Director + last used */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: 9,
                    color: director?.color ?? "var(--color-text-dim)",
                    background: `${director?.color ?? "#666"}12`,
                    border: `1px solid ${director?.color ?? "#666"}20`,
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontWeight: 500,
                  }}
                >
                  {director?.icon} {director?.shortName}
                </span>
                {lastUsed && (
                  <span style={{ fontSize: 9, color: "var(--color-text-dim)" }}>
                    {new Date(lastUsed).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                  </span>
                )}
              </div>

              {/* Keywords preview */}
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 3 }}>
                {skill.keywords.slice(0, 3).map((kw) => (
                  <span
                    key={kw}
                    style={{
                      fontSize: 9,
                      color: "var(--color-text-dim)",
                      background: "var(--color-surface-4)",
                      borderRadius: 3,
                      padding: "1px 5px",
                      fontFamily: "monospace",
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
