"use client";

import { useState } from "react";
import type { DirectorConfig } from "../lib/engines";
import type { UITask } from "./TasksPanel";

interface Props {
  director: DirectorConfig;
  tasks: UITask[];
  onClose: () => void;
}

type Tab = "tareas" | "logs" | "docs" | "stats";

export default function DirectorSidePanel({ director, tasks, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("tareas");

  const completed  = tasks.filter(t => t.status === "completed");
  const inProgress = tasks.filter(t => t.status === "in_progress");
  const totalTokens = tasks.reduce((a, t) => a + (t.estimatedTokens ?? 0), 0);
  const totalCost   = tasks.reduce((a, t) => a + (t.estimatedCostUSD ?? 0), 0);
  const totalTime   = tasks.length * 3.5;

  const col = director.color;

  return (
    <div style={{
      position: "absolute",
      top: 0, right: 0,
      width: 320,
      height: "100%",
      background: "linear-gradient(180deg, rgba(8,8,20,0.98) 0%, rgba(4,4,12,0.99) 100%)",
      borderLeft: `1px solid ${col}30`,
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
      boxShadow: `-8px 0 32px rgba(0,0,0,0.8), inset 1px 0 0 ${col}15`,
      animation: "slideInRight 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0 }
          to   { transform: translateX(0); opacity: 1 }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 16px 0",
        borderBottom: `1px solid ${col}25`,
        flexShrink: 0,
      }}>
        {/* Top row: avatar + close */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar circle */}
            <div style={{
              width: 48, height: 48,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${col}30 0%, ${col}12 100%)`,
              border: `2px solid ${col}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: `0 0 16px ${col}30`,
              flexShrink: 0,
            }}>
              {director.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                {director.humanName}
              </div>
              <div style={{ fontSize: 10, color: col, fontWeight: 600, marginTop: 2 }}>
                {director.name}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                {director.department}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: 7,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Status badge */}
        {inProgress.length > 0 ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 12px",
            background: `${col}12`,
            border: `1px solid ${col}30`,
            borderRadius: 10,
            marginBottom: 12,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}`, flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ fontSize: 10, color: col, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inProgress[0]?.currentStep ?? "Procesando…"}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
              {inProgress[0]?.progress ?? 0}%
            </div>
          </div>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            marginBottom: 12,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#444" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Sin tareas activas</span>
          </div>
        )}

        {/* Mini stats row */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[
            { v: completed.length,            l: "Completadas", c: "#22d97a" },
            { v: inProgress.length,           l: "Activas",     c: col },
            { v: `$${totalCost.toFixed(3)}`,  l: "Coste",       c: "#f59e0b" },
          ].map(({ v, l, c }) => (
            <div key={l} style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "6px 4px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: -1 }}>
          {(["tareas", "logs", "docs", "stats"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "6px 4px",
                fontSize: 9,
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? col : "rgba(255,255,255,0.3)",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === t ? col : "transparent"}`,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                transition: "all 0.15s ease",
              }}
            >
              {t === "tareas" ? "Tareas" : t === "logs" ? "Logs" : t === "docs" ? "Docs" : "Stats"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}>

        {tab === "tareas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.length === 0 && (
              <Empty icon="📋" text="Sin tareas aún" />
            )}
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} color={col} />
            ))}
          </div>
        )}

        {tab === "logs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tasks.length === 0 && <Empty icon="📄" text="Sin logs disponibles" />}
            {tasks.flatMap((task) => {
              const lines: { text: string; time: string; type: "start" | "step" | "done" | "error" }[] = [];
              lines.push({ text: `▶ Tarea iniciada: ${task.title}`, time: task.createdAt.toLocaleTimeString("es"), type: "start" });
              if (task.skillName) lines.push({ text: `⚡ Skill asignada: ${task.skillName}`, time: task.createdAt.toLocaleTimeString("es"), type: "step" });
              if (task.currentStep && task.status !== "completed") lines.push({ text: `◎ Paso actual: ${task.currentStep}`, time: new Date().toLocaleTimeString("es"), type: "step" });
              if (task.status === "completed") lines.push({ text: `✓ Completada al 100%`, time: new Date().toLocaleTimeString("es"), type: "done" });
              if (task.estimatedTokens) lines.push({ text: `🔢 Tokens: ${task.estimatedTokens.toLocaleString()}`, time: "", type: "step" });
              return lines;
            }).map((line, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                fontSize: 10,
                color: line.type === "done" ? "#22d97a" : line.type === "error" ? "#ef4444" : line.type === "start" ? col : "rgba(255,255,255,0.5)",
                padding: "4px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ flexShrink: 0, color: "rgba(255,255,255,0.2)", fontSize: 8, marginTop: 2, minWidth: 48 }}>
                  {line.time || "—"}
                </span>
                <span style={{ flex: 1, lineHeight: 1.4 }}>{line.text}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "docs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {completed.filter(t => t.result).length === 0 && <Empty icon="📂" text="Sin documentos generados" />}
            {completed.filter(t => t.result).map((task) => (
              <div key={task.id} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "10px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{task.artifact?.type === "html" ? "🌐" : task.artifact?.type === "code" ? "💻" : "📄"}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const }}>
                  {task.result?.slice(0, 180) ?? "—"}
                </div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
                  {task.skillName} · {task.createdAt.toLocaleDateString("es")}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Tareas completadas",    value: completed.length,                icon: "✅" },
              { label: "Tareas en progreso",    value: inProgress.length,               icon: "⚡" },
              { label: "Total tareas",          value: tasks.length,                    icon: "📋" },
              { label: "Tokens consumidos",     value: totalTokens.toLocaleString(),    icon: "🔢" },
              { label: "Coste estimado",        value: `$${totalCost.toFixed(4)}`,      icon: "💰" },
              { label: "Tiempo empleado (est)", value: `${totalTime.toFixed(1)} min`,   icon: "⏱️" },
              { label: "Departamento",          value: director.department,             icon: "🏢" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{value}</span>
              </div>
            ))}

            {/* Description */}
            <div style={{
              padding: "10px 12px",
              background: `${col}0c`,
              border: `1px solid ${col}25`,
              borderRadius: 10,
              marginTop: 4,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: col, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Especialidad
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                {director.description}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, color }: { task: UITask; color: string }) {
  const isActive = task.status === "in_progress";
  const isDone   = task.status === "completed";
  const statusColor = isDone ? "#22d97a" : isActive ? color : "#6b6b8a";

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${isDone ? "#22d97a22" : isActive ? color + "30" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 10,
      padding: "10px 12px",
      transition: "border-color 0.3s ease",
    }}>
      {/* Status + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, boxShadow: isActive ? `0 0 5px ${statusColor}` : "none", flexShrink: 0, marginTop: 4 }} />
        <div style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>{task.title}</div>
      </div>

      {/* Progress bar */}
      {isActive && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${task.progress}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
      )}

      {/* Meta row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {task.skillName && (
          <span style={{ fontSize: 8, color: color, background: color + "15", border: `1px solid ${color}25`, borderRadius: 6, padding: "1px 6px", fontWeight: 600 }}>
            {task.skillName}
          </span>
        )}
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>
          {isDone ? "✓ completada" : isActive ? `${task.progress}% · ${task.currentStep?.slice(0, 20) ?? ""}` : "pendiente"}
        </span>
        {task.estimatedCostUSD != null && (
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
            ${task.estimatedCostUSD.toFixed(4)}
          </span>
        )}
      </div>
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 0" }}>
      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.25 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{text}</div>
    </div>
  );
}
