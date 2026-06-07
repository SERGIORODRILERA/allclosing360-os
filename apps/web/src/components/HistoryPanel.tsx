"use client";

import type { Message } from "./MessageFeed";
import type { UITask } from "./TasksPanel";
import type { StoredOrder } from "../lib/memory";
import { DIRECTOR_MAP } from "../lib/engines";

interface HistoryPanelProps {
  messages: Message[];
  tasks: UITask[];
  orders: StoredOrder[];
  onClear: () => void;
  onExport: () => void;
}

export default function HistoryPanel({ messages, tasks, orders, onClear, onExport }: HistoryPanelProps) {
  const userMessages = messages.filter((m) => m.role === "user");

  return (
    <div
      style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        gap: 20,
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Header + actions */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 3 }}>
            Memoria del Sistema
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>Historial de Sesión</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>
            {userMessages.length} mensajes · {orders.length} órdenes · {tasks.length} tareas
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onExport}
            style={{
              fontSize: 12,
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ⬇️ Exportar sesión
          </button>
          <button
            onClick={onClear}
            style={{
              fontSize: 12,
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--color-surface-2)",
              border: "1px solid rgba(245,101,101,0.3)",
              color: "var(--color-error)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            🗑️ Limpiar memoria
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Orders column */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
            Órdenes Ejecutadas · {orders.length}
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-dim)", fontSize: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
                <div>Sin órdenes en memoria.</div>
              </div>
            ) : (
              [...orders].reverse().map((order) => {
                const director = DIRECTOR_MAP[order.directorId];
                return (
                  <div
                    key={order.id}
                    style={{
                      padding: "10px 12px",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "var(--color-text)", lineHeight: 1.4 }}>
                      {order.text.length > 90 ? order.text.slice(0, 90) + "…" : order.text}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
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
                          background: "var(--color-surface-4)",
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
              })
            )}
          </div>
        </div>

        {/* Tasks column */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
            Tareas Creadas · {tasks.length}
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--color-text-dim)", fontSize: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚙️</div>
                <div>Sin tareas registradas.</div>
              </div>
            ) : (
              [...tasks].reverse().map((task) => {
                const director = DIRECTOR_MAP[task.engineId];
                const statusColor =
                  task.status === "completed"
                    ? "var(--color-success)"
                    : task.status === "in_progress"
                    ? director?.color ?? "var(--color-accent)"
                    : task.status === "failed"
                    ? "var(--color-error)"
                    : "var(--color-text-dim)";
                const statusLabel = { pending: "Pendiente", in_progress: "En curso", completed: "Completa", failed: "Fallida" }[task.status];

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: "10px 12px",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text)", lineHeight: 1.4, flex: 1 }}>
                        {task.title}
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          color: statusColor,
                          background: `${statusColor}15`,
                          border: `1px solid ${statusColor}30`,
                          borderRadius: 4,
                          padding: "2px 6px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "var(--color-surface-4)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${task.progress}%`,
                          background: statusColor,
                          borderRadius: 2,
                          transition: "width 0.4s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 4 }}>
                      {director?.icon} {director?.shortName}
                      {task.skillName && ` · ${task.skillName}`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
