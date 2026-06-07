"use client";

import type { EngineId } from "@ac360/types";
import { DIRECTOR_MAP } from "../lib/engines";
import type { RiskLevel } from "../lib/task-engine";

export interface TaskArtifact {
  type: "html" | "code" | "document";
  url: string;
  filename: string;
  content: string;
  language?: string;
}

export interface UITask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  engineId: EngineId;
  skillId?: string;
  skillName?: string;
  progress: number;
  createdAt: Date;
  // Phase 4 fields
  currentStep?: string;
  result?: string;
  estimatedTokens?: number;
  estimatedCostUSD?: number;
  riskLevel?: RiskLevel;
  requiresApproval?: boolean;
  order?: string;
  // Manus artifact (real file created by Claude tool use)
  artifact?: TaskArtifact;
  // Real usage from API
  realTokens?: number;
  realCostUSD?: number;
  // GitHub PR (director_producto)
  prUrl?: string;
  prNumber?: number;
}

interface TasksPanelProps {
  tasks: UITask[];
  onViewResult?: (task: UITask) => void;
}

const STATUS_CONFIG = {
  pending:     { label: "Pendiente",  color: "#555" },
  in_progress: { label: "En curso",   color: "var(--color-accent)" },
  completed:   { label: "Completa",   color: "var(--color-success)" },
  failed:      { label: "Fallida",    color: "var(--color-error)" },
};

const RISK_COLOR: Record<RiskLevel, string> = {
  low:    "var(--color-success)",
  medium: "var(--color-warning)",
  high:   "var(--color-error)",
};

function TaskItem({ task, onViewResult }: { task: UITask; onViewResult?: (t: UITask) => void }) {
  const director = DIRECTOR_MAP[task.engineId];
  const statusCfg = STATUS_CONFIG[task.status];

  return (
    <div
      className="task-enter"
      style={{
        padding: "10px 12px",
        background: "var(--color-surface-2)",
        border: `1px solid ${task.status === "completed" ? "rgba(34,217,122,0.2)" : "var(--color-border)"}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: `${director?.color ?? "#666"}18`,
            border: `1px solid ${director?.color ?? "#666"}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {director?.icon ?? "⚙"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--color-text)", lineHeight: 1.35, wordBreak: "break-word" }}>
            {task.title}
          </div>
          <div style={{ fontSize: 10, color: director?.color ?? "var(--color-text-muted)", marginTop: 2 }}>
            {director?.shortName ?? task.engineId}
            {task.skillName && <span style={{ color: "var(--color-text-dim)" }}> · {task.skillName}</span>}
          </div>
        </div>

        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: statusCfg.color,
            background: `${statusCfg.color}18`,
            border: `1px solid ${statusCfg.color}30`,
            borderRadius: 4,
            padding: "2px 6px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {statusCfg.label}
        </div>
      </div>

      {/* Current step label */}
      {task.status === "in_progress" && task.currentStep && (
        <div
          style={{
            fontSize: 10,
            color: "var(--color-text-dim)",
            fontStyle: "italic",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div className="status-dot-active" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-accent)", flexShrink: 0 }} />
          {task.currentStep}
        </div>
      )}

      {/* Progress bar */}
      {(task.status === "in_progress" || task.status === "completed") && (
        <div>
          <div style={{ height: 3, borderRadius: 2, background: "var(--color-surface-4)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${task.progress}%`,
                background: task.status === "completed" ? "var(--color-success)" : (director?.color ?? "var(--color-accent)"),
                borderRadius: 2,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          {task.status === "in_progress" && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: 9, color: "var(--color-text-dim)" }}>
                {task.estimatedTokens ? `~${task.estimatedTokens.toLocaleString()} tokens` : ""}
              </span>
              <span style={{ fontSize: 9, color: "var(--color-text-dim)" }}>{task.progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Real usage row */}
      {task.status !== "pending" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(task.realTokens ?? task.estimatedTokens) && (
            <span style={{ fontSize: 9, color: "var(--color-text-dim)", background: "var(--color-surface-4)", borderRadius: 4, padding: "1px 5px" }}>
              {(task.realTokens ?? task.estimatedTokens)!.toLocaleString()} tokens
            </span>
          )}
          {(task.realCostUSD ?? task.estimatedCostUSD) !== undefined && (
            <span style={{ fontSize: 9, color: "var(--color-text-dim)", background: "var(--color-surface-4)", borderRadius: 4, padding: "1px 5px" }}>
              ${((task.realCostUSD ?? task.estimatedCostUSD) ?? 0).toFixed(4)} USD
            </span>
          )}
          {task.riskLevel && (
            <span
              style={{
                fontSize: 9,
                color: RISK_COLOR[task.riskLevel],
                background: `${RISK_COLOR[task.riskLevel]}15`,
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              {task.riskLevel === "low" ? "bajo" : task.riskLevel === "medium" ? "medio" : "alto"}
            </span>
          )}
        </div>
      )}

      {/* PR link button */}
      {task.prUrl && (
        <a
          href={task.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: "100%",
            padding: "6px 0",
            borderRadius: 6,
            background: "rgba(14,165,233,0.1)",
            border: "1px solid rgba(14,165,233,0.3)",
            color: "#0ea5e9",
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            textDecoration: "none",
          }}
        >
          🔗 Ver PR #{task.prNumber}
        </a>
      )}

      {/* Ver resultado button */}
      {task.status === "completed" && (task.result || task.artifact) && onViewResult && (
        <button
          onClick={() => onViewResult(task)}
          style={{
            width: "100%",
            padding: "6px 0",
            borderRadius: 6,
            background: "rgba(34,217,122,0.1)",
            border: "1px solid rgba(34,217,122,0.25)",
            color: "var(--color-success)",
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,217,122,0.18)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,217,122,0.1)"; }}
        >
          {task.artifact?.type === "html" ? "🌐" : task.artifact?.type === "code" ? "💻" : "📄"}
          {" "}Ver {task.artifact?.type === "html" ? "página" : task.artifact?.type === "code" ? "código" : "resultado"}
        </button>
      )}
    </div>
  );
}

export default function TasksPanel({ tasks, onViewResult }: TasksPanelProps) {
  const active = tasks.filter((t) => t.status === "in_progress" || t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");
  const failed = tasks.filter((t) => t.status === "failed");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Stats */}
      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--color-border-subtle)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[
            { label: "Activas", value: active.length, color: "var(--color-accent)" },
            { label: "Listas", value: completed.length, color: "var(--color-success)" },
            { label: "Fallidas", value: failed.length, color: "var(--color-error)" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                padding: "5px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 9, color: "var(--color-text-dim)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 12px", color: "var(--color-text-dim)", fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚙️</div>
            <div>Sin tareas activas.</div>
            <div style={{ fontSize: 11, marginTop: 3 }}>Envía una orden para comenzar.</div>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-dim)", textTransform: "uppercase" }}>
                  En curso · {active.length}
                </div>
                {active.map((t) => <TaskItem key={t.id} task={t} onViewResult={onViewResult} />)}
              </>
            )}
            {completed.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-text-dim)", textTransform: "uppercase", paddingTop: 4 }}>
                  Completadas · {completed.length}
                </div>
                {completed.map((t) => <TaskItem key={t.id} task={t} onViewResult={onViewResult} />)}
              </>
            )}
            {failed.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: "var(--color-error)", textTransform: "uppercase", paddingTop: 4 }}>
                  Fallidas · {failed.length}
                </div>
                {failed.map((t) => <TaskItem key={t.id} task={t} onViewResult={onViewResult} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
