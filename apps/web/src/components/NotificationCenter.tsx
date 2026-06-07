"use client";

import { useEffect, useState, useRef } from "react";
import { DIRECTOR_MAP } from "../lib/engines";
import type { UITask } from "./TasksPanel";

export interface Notification {
  id: string;
  taskId: string;
  title: string;
  directorId: string;
  createdAt: number;
  resultPreview?: string;
  skillName?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onViewResult: (taskId: string) => void;
}

// ─── Progress bar that drains over 7s ─────────────────────────────────────────
function ProgressDrain({ duration = 7000 }: { duration?: number }) {
  const [pct, setPct] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setPct(Math.max(0, 100 - (elapsed / duration) * 100));
    }, 50);
    return () => clearInterval(id);
  }, [duration]);
  return (
    <div style={{ height: 2, background: "var(--color-border)", borderRadius: 1, overflow: "hidden", marginTop: 8 }}>
      <div style={{
        height: "100%",
        width: pct + "%",
        background: "var(--color-accent)",
        borderRadius: 1,
        transition: "width 0.05s linear",
      }} />
    </div>
  );
}

// ─── Individual toast ─────────────────────────────────────────────────────────
function NotificationToast({
  notification, onDismiss, onView,
}: {
  notification: Notification;
  onDismiss: () => void;
  onView: () => void;
}) {
  const director = DIRECTOR_MAP[notification.directorId as keyof typeof DIRECTOR_MAP];
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  function dismiss() {
    setExiting(true);
    setTimeout(onDismiss, 320);
  }

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 40);
    const t2 = setTimeout(dismiss, 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const col = director?.color ?? "#22d97a";

  return (
    <div
      style={{
        width: 320,
        background: "var(--color-surface-2)",
        border: `1px solid ${col}35`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${col}15, 0 0 40px ${col}08`,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        transform: (visible && !exiting) ? "translateX(0) scale(1)" : "translateX(28px) scale(0.94)",
        opacity: (visible && !exiting) ? 1 : 0,
        cursor: "pointer",
      }}
      onClick={onView}
    >
      {/* Colored top stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${col}, ${col}80, transparent)` }} />

      <div style={{ padding: "12px 14px 10px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {/* Director avatar circle */}
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${col}25 0%, ${col}10 100%)`,
            border: `1px solid ${col}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 12px ${col}20`,
          }}>
            <span style={{ fontSize: 20 }}>{director?.icon ?? "✅"}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Event label */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, padding: "1px 6px",
                borderRadius: 6, background: "rgba(34,217,122,0.15)",
                color: "#22d97a", border: "1px solid rgba(34,217,122,0.3)",
                letterSpacing: "0.06em",
              }}>
                ✅ TAREA COMPLETADA
              </div>
            </div>

            {/* Task title */}
            <div style={{
              fontSize: 12, fontWeight: 600, color: "var(--color-text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.3,
            }}>
              {notification.title}
            </div>

            {/* Director + skill */}
            <div style={{ fontSize: 10, color: col, marginTop: 2, fontWeight: 500 }}>
              {director?.humanName} · {director?.shortName}
              {notification.skillName && (
                <span style={{ color: "var(--color-text-dim)" }}> · {notification.skillName}</span>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            style={{
              width: 20, height: 20, borderRadius: 5,
              background: "var(--color-surface-3)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-dim)",
              fontSize: 10, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Result preview */}
        {notification.resultPreview && (
          <div style={{
            marginTop: 8,
            padding: "6px 8px",
            background: "var(--color-surface-3)",
            border: "1px solid var(--color-border)",
            borderRadius: 7,
            fontSize: 10,
            color: "var(--color-text-muted)",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}>
            {notification.resultPreview}
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 8,
          display: "flex", gap: 6,
        }}>
          <div style={{
            flex: 1, padding: "5px 8px",
            borderRadius: 7, fontSize: 10, fontWeight: 600,
            background: `${col}18`, color: col,
            border: `1px solid ${col}30`,
            textAlign: "center",
          }}>
            Ver resultado →
          </div>
        </div>

        {/* Drain progress bar */}
        <ProgressDrain duration={7000} />
      </div>
    </div>
  );
}

// ─── NotificationCenter ───────────────────────────────────────────────────────
export default function NotificationCenter({
  notifications, onDismiss, onViewResult,
}: NotificationCenterProps) {
  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 20, right: 20,
      zIndex: 900,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "flex-end",
    }}>
      {notifications.map((n) => (
        <NotificationToast
          key={n.id}
          notification={n}
          onDismiss={() => onDismiss(n.id)}
          onView={() => { onViewResult(n.taskId); onDismiss(n.id); }}
        />
      ))}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
export function taskToNotification(task: UITask): Notification {
  return {
    id: `notif-${task.id}`,
    taskId: task.id,
    title: task.title,
    directorId: task.engineId,
    createdAt: Date.now(),
    resultPreview: task.result?.slice(0, 120),
    skillName: task.skillName,
  };
}
