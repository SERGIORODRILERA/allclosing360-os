"use client";

import type { EngineId } from "@ac360/types";
import { DIRECTORS } from "../lib/engines";

interface UITask {
  id: string;
  status: string;
  engineId: EngineId;
}

interface SidebarProps {
  activeEngineId: EngineId | null;
  onEngineSelect: (id: EngineId) => void;
  tasks: UITask[];
}

export default function Sidebar({ activeEngineId, onEngineSelect, tasks }: SidebarProps) {
  const taskCountByDirector = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.status === "in_progress" || t.status === "pending") {
      acc[t.engineId] = (acc[t.engineId] ?? 0) + 1;
    }
    return acc;
  }, {});

  const activeCount = DIRECTORS.filter((d) => (taskCountByDirector[d.id] ?? 0) > 0).length;

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-purple) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            AC
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text)" }}>
              ALLCLOSING360
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-muted)", letterSpacing: "0.05em" }}>
              OS v1.0 · MVP
            </div>
          </div>
        </div>
      </div>

      {/* System status */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <div
          className="status-dot-active"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--color-success)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          Sistema online &nbsp;·&nbsp; {activeCount} director{activeCount !== 1 ? "es" : ""} activo{activeCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Directors list */}
      <div style={{ padding: "10px 8px 0", flex: 1, overflow: "auto" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--color-text-dim)",
            padding: "0 6px",
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          Directores
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {DIRECTORS.map((director) => {
            const isActive = activeEngineId === director.id;
            const taskCount = taskCountByDirector[director.id] ?? 0;
            const hasWork = taskCount > 0;

            return (
              <button
                key={director.id}
                className={`engine-item${isActive ? " active" : ""}`}
                onClick={() => onEngineSelect(director.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 8px",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: `${director.color}18`,
                    border: `1px solid ${director.color}${isActive ? "50" : "28"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {director.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? director.color : "var(--color-text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {director.name}
                  </div>
                  {hasWork && (
                    <div style={{ fontSize: 10, color: "var(--color-text-dim)" }}>
                      {taskCount} tarea{taskCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Active dot */}
                {hasWork && (
                  <div
                    className="status-dot-active"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: director.color,
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>Instancia</span>
          <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "monospace" }}>demo-tenant</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>Directores</span>
          <span style={{ fontSize: 10, color: "var(--color-success)" }}>{DIRECTORS.length} online</span>
        </div>
      </div>
    </aside>
  );
}
