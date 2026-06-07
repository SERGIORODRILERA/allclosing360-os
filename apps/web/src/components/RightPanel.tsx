"use client";

import { useState } from "react";
import type { UITask } from "./TasksPanel";
import type { StoredOrder } from "../lib/memory";
import TasksPanel from "./TasksPanel";
import { SKILLS } from "../lib/skills";
import { DIRECTOR_MAP } from "../lib/engines";

interface RightPanelProps {
  tasks: UITask[];
  orders: StoredOrder[];
  onClearMemory: () => void;
  onExport: () => void;
}

type Tab = "tareas" | "memoria" | "skills";

function MemoryPanel({ orders, onClear, onExport }: { orders: StoredOrder[]; onClear: () => void; onExport: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Actions */}
      <div style={{ padding: "10px 12px", display: "flex", gap: 6, borderBottom: "1px solid var(--color-border-subtle)" }}>
        <button
          onClick={onExport}
          style={{
            flex: 1,
            fontSize: 11,
            padding: "6px 8px",
            borderRadius: 6,
            background: "var(--color-surface-3)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span>⬇️</span> Exportar sesión
        </button>
        <button
          onClick={onClear}
          style={{
            flex: 1,
            fontSize: 11,
            padding: "6px 8px",
            borderRadius: 6,
            background: "var(--color-surface-3)",
            border: "1px solid var(--color-border)",
            color: "var(--color-error)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span>🗑️</span> Limpiar memoria
        </button>
      </div>

      {/* Order history */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 12px", color: "var(--color-text-dim)", fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🧠</div>
            <div>Memoria vacía.</div>
            <div style={{ fontSize: 11, marginTop: 3 }}>Las órdenes dadas se guardarán aquí.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-dim)", textTransform: "uppercase" }}>
              Órdenes dadas · {orders.length}
            </div>
            {[...orders].reverse().map((order) => {
              const director = DIRECTOR_MAP[order.directorId];
              return (
                <div
                  key={order.id}
                  style={{
                    padding: "9px 10px",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--color-text)", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {order.text.length > 80 ? order.text.slice(0, 80) + "…" : order.text}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 9,
                        color: director?.color ?? "var(--color-text-muted)",
                        background: `${director?.color ?? "#666"}15`,
                        border: `1px solid ${director?.color ?? "#666"}25`,
                        borderRadius: 4,
                        padding: "1px 5px",
                      }}
                    >
                      {director?.icon} {director?.shortName}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--color-text-dim)",
                        background: "var(--color-surface-3)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 4,
                        padding: "1px 5px",
                      }}
                    >
                      {order.skillIcon} {order.skillName}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--color-text-dim)", marginLeft: "auto" }}>
                      {new Date(order.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function SkillsPanel() {
  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 2 }}>
        Skills disponibles · {SKILLS.length}
      </div>
      {SKILLS.map((skill) => {
        const director = DIRECTOR_MAP[skill.primaryDirector];
        return (
          <div
            key={skill.id}
            style={{
              padding: "8px 10px",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 7,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{skill.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text)", lineHeight: 1.3 }}>
                {skill.name}
              </div>
              <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 2, lineHeight: 1.3 }}>
                {skill.description}
              </div>
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 9,
                    color: director?.color ?? "var(--color-text-muted)",
                    background: `${director?.color ?? "#666"}12`,
                    border: `1px solid ${director?.color ?? "#666"}25`,
                    borderRadius: 4,
                    padding: "1px 5px",
                  }}
                >
                  {director?.icon} {director?.shortName}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RightPanel({ tasks, orders, onClearMemory, onExport }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("tareas");

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "tareas", label: "Tareas", badge: tasks.filter((t) => t.status === "in_progress" || t.status === "pending").length || undefined },
    { id: "memoria", label: "Memoria", badge: orders.length || undefined },
    { id: "skills", label: "Skills" },
  ];

  return (
    <aside
      style={{
        width: "var(--tasks-width)",
        minWidth: "var(--tasks-width)",
        background: "var(--color-surface)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 0",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Panel del Sistema
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "var(--color-text)" : "var(--color-text-dim)",
                padding: "6px 4px",
                borderBottom: activeTab === tab.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                borderRadius: 0,
                transition: "color 0.15s, border-color 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    fontSize: 9,
                    background: activeTab === tab.id ? "var(--color-accent)" : "var(--color-surface-3)",
                    color: activeTab === tab.id ? "#fff" : "var(--color-text-dim)",
                    borderRadius: 10,
                    padding: "1px 5px",
                    minWidth: 16,
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "tareas" && <TasksPanel tasks={tasks} />}
        {activeTab === "memoria" && (
          <MemoryPanel orders={orders} onClear={onClearMemory} onExport={onExport} />
        )}
        {activeTab === "skills" && <SkillsPanel />}
      </div>
    </aside>
  );
}
