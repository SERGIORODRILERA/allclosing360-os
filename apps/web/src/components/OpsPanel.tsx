"use client";

import { useState, useEffect, useRef } from "react";
import type { EngineId } from "@ac360/types";
import { DIRECTORS, DIRECTOR_MAP } from "../lib/engines";
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
  trend,
}: {
  value: number | string;
  label: string;
  color: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="metric-card" style={{ position: "relative" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", marginTop: 4 }}>{label}</div>
      {sublabel && (
        <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 2 }}>
          {trend === "up" && <span style={{ color: "#22d97a", marginRight: 3 }}>↑</span>}
          {trend === "down" && <span style={{ color: "#f56565", marginRight: 3 }}>↓</span>}
          {sublabel}
        </div>
      )}
    </div>
  );
}

function DirectorLoadRow({
  director,
  activeTasks,
  totalTasks,
  isTopDirector,
}: {
  director: (typeof DIRECTORS)[0];
  activeTasks: number;
  totalTasks: number;
  isTopDirector: boolean;
}) {
  const pct = totalTasks > 0 ? Math.min((totalTasks / Math.max(totalTasks, 3)) * 100, 100) : 0;
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
        background: isTopDirector ? `${director.color}06` : "transparent",
        borderRadius: isTopDirector ? 4 : 0,
        paddingLeft: isTopDirector ? 4 : 0,
      }}
    >
      <span style={{ fontSize: 13 }}>{director.icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: isTopDirector ? director.color : "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {director.shortName}
          {isTopDirector && <span style={{ marginLeft: 4, fontSize: 8, color: director.color, fontWeight: 700 }}>★ TOP</span>}
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

// ─── Session timer ────────────────────────────────────────────────────────────
function useSessionTimer() {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const formatted = h > 0
    ? `${h}h ${m.toString().padStart(2, "0")}m`
    : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  return formatted;
}

// ─── Response speed tracker ───────────────────────────────────────────────────
function useResponseSpeed(tasks: UITask[]) {
  const prevLen = useRef(tasks.length);
  const [avgMs, setAvgMs] = useState<number | null>(null);
  const timestamps = useRef<number[]>([]);

  useEffect(() => {
    if (tasks.length > prevLen.current) {
      timestamps.current.push(Date.now());
      if (timestamps.current.length > 1) {
        const diffs: number[] = [];
        for (let i = 1; i < timestamps.current.length; i++) {
          diffs.push((timestamps.current[i]! - timestamps.current[i - 1]!) / 1000);
        }
        const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        setAvgMs(avg);
      }
    }
    prevLen.current = tasks.length;
  }, [tasks.length]);

  return avgMs;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OpsPanel({ tasks, orders, activeDirectorId: _activeId }: OpsPanelProps) {
  const sessionTime = useSessionTimer();
  const avgResponse = useResponseSpeed(tasks);

  const active = tasks.filter((t) => t.status === "in_progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const failed = tasks.filter((t) => t.status === "failed").length;
  const activeDirectors = DIRECTORS.filter((d) =>
    tasks.some((t) => t.engineId === d.id && t.status === "in_progress"),
  ).length;

  // Estimated time saved: 12 min per completed task
  const timeSaved = completed * 12;

  // Most active director
  const directorTaskCounts = DIRECTORS.map((d) => ({
    director: d,
    count: tasks.filter((t) => t.engineId === d.id).length,
    active: tasks.filter((t) => t.engineId === d.id && t.status === "in_progress").length,
  })).sort((a, b) => b.count - a.count);

  const topDirector = directorTaskCounts[0];

  // Total tokens / cost from completed tasks
  const totalTokens = tasks.reduce((sum, t) => sum + (t.estimatedTokens ?? 0), 0);
  const totalCost = tasks.reduce((sum, t) => sum + (t.estimatedCostUSD ?? 0), 0);

  // Session message count (orders = messages sent)
  const messageCount = orders.length;

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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 3 }}>
            Centro de Operaciones
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>Estado del Sistema</div>
        </div>
        <div style={{
          fontSize: 11,
          color: "var(--color-text-dim)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-success)" }} />
          Sesión: {sessionTime}
        </div>
      </div>

      {/* Session KPIs row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <MetricCard value={messageCount} label="Mensajes enviados" color="var(--color-accent)" sublabel="esta sesión" />
        <MetricCard value={completed} label="Tareas completadas" color="var(--color-success)" sublabel="con éxito" trend="up" />
        <MetricCard
          value={topDirector && topDirector.count > 0 ? topDirector.director.shortName : "—"}
          label="Director más activo"
          color={topDirector && topDirector.count > 0 ? topDirector.director.color : "var(--color-text-dim)"}
          sublabel={topDirector && topDirector.count > 0 ? `${topDirector.count} tarea${topDirector.count !== 1 ? "s" : ""}` : "sin actividad"}
        />
        <MetricCard
          value={avgResponse !== null ? `${avgResponse.toFixed(1)}s` : "—"}
          label="Velocidad de respuesta"
          color="var(--color-purple)"
          sublabel="promedio entre tareas"
        />
      </div>

      {/* Metrics row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <MetricCard value={activeDirectors} label="Directores activos" color="var(--color-accent)" sublabel={`de ${DIRECTORS.length} total`} />
        <MetricCard value={active} label="Tareas en curso" color="var(--color-warning)" sublabel="procesando ahora" />
        <MetricCard value={`${timeSaved}m`} label="Tiempo ahorrado" color="var(--color-purple)" sublabel="estimado (12min/tarea)" />
        <MetricCard value={failed} label="Tareas fallidas" color="var(--color-error)" sublabel={`tasa éxito: ${Math.round((completed / Math.max(completed + failed + active, 1)) * 100)}%`} />
      </div>

      {/* Token / cost metrics */}
      {(totalTokens > 0 || totalCost > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <MetricCard value={orders.length} label="Órdenes ejecutadas" color="var(--color-accent)" />
          <MetricCard value={totalTokens.toLocaleString()} label="Tokens totales" color="rgba(162,89,255,0.9)" sublabel="input + output" />
          <MetricCard value={`$${totalCost.toFixed(4)}`} label="Costo de sesión" color="var(--color-warning)" sublabel="USD (Claude API)" />
        </div>
      )}

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
            const isTop = topDirector?.director.id === d.id && (topDirector?.count ?? 0) > 0;
            return (
              <DirectorLoadRow
                key={d.id}
                director={d}
                activeTasks={dActive}
                totalTasks={dTotal}
                isTopDirector={isTop}
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
            {[...orders].reverse().slice(0, 8).map((order) => {
              const director = DIRECTOR_MAP[order.directorId as EngineId];
              return (
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
                    borderLeft: director ? `3px solid ${director.color}40` : "none",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{order.skillIcon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.text.length > 60 ? order.text.slice(0, 60) + "…" : order.text}
                    </div>
                    <div style={{ fontSize: 10, color: director ? director.color : "var(--color-text-dim)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {director && <span>{director.icon}</span>}
                      {order.directorName} · {order.skillName}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-dim)", flexShrink: 0 }}>
                    {new Date(order.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
