"use client";

import { useRef, useEffect } from "react";
import { DIRECTOR_MAP } from "../lib/engines";
import type { EngineId } from "@ac360/types";

// ─── Types ────────────────────────────────────────────────────────────────────
export type TimelineEventType = "task_start" | "task_step" | "task_complete" | "task_error" | "system";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  directorId?: string;
  title: string;
  detail?: string;
  timestamp: Date;
  skillName?: string;
}

interface Props {
  events: TimelineEvent[];
}

// ─── Config per event type ────────────────────────────────────────────────────
const TYPE_CFG: Record<TimelineEventType, { icon: string; color: string; dotColor: string }> = {
  task_start:    { icon: "▶",  color: "#4f7eff", dotColor: "#4f7eff" },
  task_step:     { icon: "◎",  color: "#a259ff", dotColor: "#a259ff" },
  task_complete: { icon: "✓",  color: "#22d97a", dotColor: "#22d97a" },
  task_error:    { icon: "✕",  color: "#ef4444", dotColor: "#ef4444" },
  system:        { icon: "⚡", color: "#7070a0", dotColor: "#404060" },
};

function formatTime(d: Date): string {
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return `hace ${Math.floor(diff)}s`;
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

// ─── ActionTimeline ───────────────────────────────────────────────────────────
export default function ActionTimeline({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new event
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const sorted = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      borderLeft: "1px solid var(--color-border)",
      background: "var(--color-surface)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 2 }}>
          Timeline
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Acciones
          <div style={{
            fontSize: 9, padding: "1px 7px", borderRadius: 10,
            background: "var(--color-accent-glow)", color: "var(--color-accent)",
            border: "1px solid var(--color-accent-glow)",
            fontWeight: 600,
          }}>
            {events.length}
          </div>
        </div>
      </div>

      {/* Events */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {sorted.length === 0 && (
          <div style={{ padding: "24px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: 11, color: "var(--color-text-dim)" }}>Sin acciones aún</div>
            <div style={{ fontSize: 10, color: "var(--color-text-dim)", opacity: 0.6, marginTop: 4 }}>Las acciones de los directores aparecerán aquí</div>
          </div>
        )}

        {sorted.map((ev, idx) => {
          const cfg      = TYPE_CFG[ev.type];
          const director = ev.directorId ? DIRECTOR_MAP[ev.directorId as keyof typeof DIRECTOR_MAP] : null;
          const isLast   = idx === sorted.length - 1;
          const col      = director?.color ?? cfg.color;

          return (
            <div key={ev.id} style={{ display: "flex", position: "relative" }}>
              {/* Timeline track */}
              <div style={{ width: 32, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10 }}>
                {/* Dot */}
                <div style={{
                  width: 8, height: 8,
                  borderRadius: "50%",
                  background: cfg.dotColor,
                  border: `1.5px solid ${col}`,
                  boxShadow: ev.type === "task_complete" ? `0 0 6px ${col}` : "none",
                  flexShrink: 0,
                  zIndex: 1,
                }} />
                {/* Connecting line */}
                {!isLast && (
                  <div style={{
                    flex: 1, width: 1,
                    background: `linear-gradient(180deg, ${col}40 0%, var(--color-border) 100%)`,
                    marginTop: 2,
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                padding: "8px 10px 10px 0",
                minWidth: 0,
              }}>
                {/* Event type + time */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700,
                      color: cfg.color,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: cfg.color + "18",
                      border: `1px solid ${cfg.color}30`,
                    }}>
                      {cfg.icon} {ev.type === "task_start" ? "INICIO" : ev.type === "task_step" ? "PASO" : ev.type === "task_complete" ? "LISTO" : ev.type === "task_error" ? "ERROR" : "SISTEMA"}
                    </span>
                  </div>
                  <span style={{ fontSize: 8, color: "var(--color-text-dim)" }}>
                    {formatTime(ev.timestamp)}
                  </span>
                </div>

                {/* Director badge */}
                {director && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      background: director.color + "25",
                      border: `1px solid ${director.color}50`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, flexShrink: 0,
                    }}>
                      {director.icon}
                    </div>
                    <span style={{ fontSize: 9, color: director.color, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {director.shortName}
                    </span>
                    {ev.skillName && (
                      <span style={{ fontSize: 8, color: "var(--color-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        · {ev.skillName}
                      </span>
                    )}
                  </div>
                )}

                {/* Title */}
                <div style={{
                  fontSize: 10,
                  color: ev.type === "task_complete" ? "#22d97a" : ev.type === "task_error" ? "#ef4444" : "var(--color-text-muted)",
                  lineHeight: 1.4,
                  fontWeight: ev.type === "task_complete" ? 600 : 400,
                }}>
                  {ev.title}
                </div>

                {/* Detail */}
                {ev.detail && (
                  <div style={{ fontSize: 9, color: "var(--color-text-dim)", marginTop: 2, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {ev.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      <div style={{
        padding: "8px 12px",
        borderTop: "1px solid var(--color-border)",
        flexShrink: 0,
        display: "flex",
        gap: 8,
      }}>
        {[
          { label: "Completas", count: events.filter(e => e.type === "task_complete").length, color: "#22d97a" },
          { label: "Pasos",     count: events.filter(e => e.type === "task_step").length,    color: "#a259ff" },
          { label: "Errores",   count: events.filter(e => e.type === "task_error").length,   color: "#ef4444" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: count > 0 ? color : "var(--color-text-dim)" }}>{count}</div>
            <div style={{ fontSize: 8, color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
