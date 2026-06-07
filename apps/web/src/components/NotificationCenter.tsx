"use client";

import { useEffect, useState } from "react";
import { DIRECTOR_MAP } from "../lib/engines";
import type { UITask } from "./TasksPanel";

export interface Notification {
  id: string;
  taskId: string;
  title: string;
  directorId: string;
  createdAt: number;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onViewResult: (taskId: string) => void;
}

function NotificationToast({
  notification,
  onDismiss,
  onView,
}: {
  notification: Notification;
  onDismiss: () => void;
  onView: () => void;
}) {
  const director = DIRECTOR_MAP[notification.directorId as keyof typeof DIRECTOR_MAP];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--color-surface-2)",
        border: `1px solid ${director?.color ?? "var(--color-success)"}40`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${director?.color ?? "var(--color-success)"}20`,
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform: visible ? "translateX(0) scale(1)" : "translateX(20px) scale(0.95)",
        opacity: visible ? 1 : 0,
        minWidth: 280,
        maxWidth: 340,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${director?.color ?? "#22d97a"}20`,
          border: `1px solid ${director?.color ?? "#22d97a"}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {director?.icon ?? "✅"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-success)" }}>
          ✅ Tarea completada
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {notification.title}
        </div>
        <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 1 }}>
          {director?.name} · {director?.shortName}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <button
          onClick={onView}
          style={{
            fontSize: 10,
            padding: "4px 8px",
            borderRadius: 5,
            background: `${director?.color ?? "var(--color-success)"}20`,
            border: `1px solid ${director?.color ?? "var(--color-success)"}30`,
            color: director?.color ?? "var(--color-success)",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Ver resultado
        </button>
        <button
          onClick={onDismiss}
          style={{
            fontSize: 10,
            padding: "3px 8px",
            borderRadius: 5,
            background: "var(--color-surface-3)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-dim)",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function NotificationCenter({
  notifications,
  onDismiss,
  onViewResult,
}: NotificationCenterProps) {
  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end",
      }}
    >
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

// Helper to build a notification from a completed task
export function taskToNotification(task: UITask): Notification {
  return {
    id: `notif-${task.id}`,
    taskId: task.id,
    title: task.title,
    directorId: task.engineId,
    createdAt: Date.now(),
  };
}
