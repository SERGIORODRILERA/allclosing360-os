"use client";

import type { EngineId } from "@ac360/types";
import { DIRECTORS } from "../lib/engines";
import type { UITask } from "./TasksPanel";
import type { StoredOrder } from "../lib/memory";

interface OpsPanelProps {
  tasks: UITask[];
  orders: StoredOrder[];
  activeDirectorId: EngineId | null;
}

function MetricCard({
  value,
  label,
  color,
  sublabel,
}: {
  value: number | string;
  label: string;
  color: string;
  sublabel?: string;
}) {
  return (
    <div className="metric-card">
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", marginTop: 4 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}

function DirectorLoadRow({
  director,
  activeTasks,
  totalTasks,
}: {
  director: (typeof DIRECTORS)[0];
  activeTasks: number;
  totalTasks: number;
}) {
  const pct = totalTasks > 0 ? Math.min((activeTasks / Math.max(totalTasks, 3)) * 100, 100) : 0;
  const status = activeTasks > 1 ? "Ocupado" : activeTasks === 1 ? "Trabajando" : "Disponible";
  const statusColor = activeTasks > 1 ? "var(--color-warning)" : activeTasks === 1 ? director.color : "var(--color-text-dim)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "24px 1fr 80px 64px",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <span style={{ fontSize: 13 }}>{director.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {director.shortName}
        </div>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: "var(--color-surface-4)",
            marginTop: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: director.color,
              borderRadius: 2,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>
      <div style={{ fontSize: 10, color: statusColor, textAlign: "center" }}>{status}</div>
      <div style={{ fontSize: 10, color: "var(--color-text-dim)", textAlign: "right" }}>
        {activeTasks} / {totalTasks}
      </div>
    </div>
  );
}

export default function OpsPanel({ tasks, orders, activeDirectorId: _ }: OpsPanelProps) {
  const active = tasks.filter((t) => t.status === "in_progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const failed = tasks.filter((t) => t.status === "failed").length;
  const activeDirectors = DIRECTORS.filter((d) =>
    tasks.some((t) => t.engineId === d.id && t.status === "in_progress"),
  ).length;

  // Estimated time saved: 12 min per completed task
  const timeSaved = completed * 12;

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
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 3 }}>
          Centro de Operaciones
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>Estado del Sistema</div>
      </div>

      {/* Metric cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <MetricCard value={activeDirectors} label="Directores activos" color="var(--color-accent)" sublabel={`de ${DIRECTORS.length} total`} />
        <MetricCard value={active} label="Tareas en curso" color="var(--color-warning)" sublabel="procesando ahora" />
        <MetricCard value={completed} label="Tareas completadas" color="var(--color-success)" sublabel="esta sesión" />
        <MetricCard value={`${timeSaved}m`} label="Tiempo ahorrado" color="var(--color-purple)" sublabel="estimado" />
      </div>

      {/* Second row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <MetricCard value={orders.length} label="Órdenes ejecutadas" color="var(--color-accent)" />
        <MetricCard value={failed} label="Tareas fallidas" color="var(--color-error)" />
        <MetricCard value={`${Math.round((completed / Math.max(completed + failed + active, 1)) * 100)}%`} label="Tasa de éxito" color="var(--color-success)" />
      </div>

      {/* Director load table */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Carga por Director
        </div>
        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "4px 14px",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr 80px 64px",
              gap: 10,
              padding: "8px 0 4px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {["", "Director", "Estado", "Tareas"].map((h, i) => (
              <div key={i} style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-dim)", textTransform: "uppercase", textAlign: i === 3 ? "right" : i === 2 ? "center" : "left" }}>
                {h}
              </div>
            ))}
          </div>

          {DIRECTORS.map((d) => {
            const dActive = tasks.filter((t) => t.engineId === d.id && t.status === "in_progress").length;
            const dTotal = tasks.filter((t) => t.engineId === d.id).length;
            return (
              <DirectorLoadRow
                key={d.id}
                director={d}
                activeTasks={dActive}
                totalTasks={dTotal}
              />
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      {orders.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Actividad Reciente
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...orders].reverse().slice(0, 5).map((order) => (
              <div
                key={order.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>{order.skillIcon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {order.text.length > 60 ? order.text.slice(0, 60) + "…" : order.text}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 2 }}>
                    {order.directorName} · {order.skillName}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-dim)", flexShrink: 0 }}>
                  {new Date(order.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
