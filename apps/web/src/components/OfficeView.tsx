"use client";

import type { EngineId } from "@ac360/types";
import { DIRECTORS } from "../lib/engines";
import type { UITask } from "./TasksPanel";
import AvatarPod from "./AvatarPod";

interface OfficeViewProps {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}

export default function OfficeView({ tasks, activeDirectorId, onDirectorSelect }: OfficeViewProps) {
  function getActiveTasksFor(id: EngineId) {
    return tasks.filter((t) => t.engineId === id && t.status === "in_progress").length;
  }
  function getCompletedTasksFor(id: EngineId) {
    return tasks.filter((t) => t.engineId === id && t.status === "completed").length;
  }

  const totalActive = tasks.filter((t) => t.status === "in_progress").length;

  const ceo = DIRECTORS[0]!;
  const rest = DIRECTORS.slice(1);

  return (
    <div
      className="office-floor"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Floor header */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "var(--color-text-dim)",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Planta de Operaciones
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.1 }}>
            ALLCLOSING360 Live Office
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>
            {DIRECTORS.length} directores IA · {totalActive} tarea{totalActive !== 1 ? "s" : ""} activa{totalActive !== 1 ? "s" : ""}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
          }}
        >
          <div
            className="status-dot-active"
            style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-success)" }}
          />
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Sistema online</span>
        </div>
      </div>

      {/* Office grid — 4-column layout with SVG avatars */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          alignContent: "start",
        }}
      >
        {/* CEO — spans 2 columns */}
        <AvatarPod
          director={ceo}
          activeTasks={getActiveTasksFor(ceo.id)}
          completedTasks={getCompletedTasksFor(ceo.id)}
          isSelected={activeDirectorId === ceo.id}
          isCEO
          onClick={() => onDirectorSelect(ceo.id)}
        />

        {/* Remaining 13 directors */}
        {rest.map((director) => (
          <AvatarPod
            key={director.id}
            director={director}
            activeTasks={getActiveTasksFor(director.id)}
            completedTasks={getCompletedTasksFor(director.id)}
            isSelected={activeDirectorId === director.id}
            onClick={() => onDirectorSelect(director.id)}
          />
        ))}

        {/* Filler pod */}
        <div
          style={{
            borderRadius: 12,
            border: "1px dashed var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
            color: "var(--color-text-dim)",
            fontSize: 11,
            cursor: "default",
            minHeight: 130,
          }}
        >
          <span style={{ fontSize: 20, opacity: 0.3 }}>+</span>
          <span style={{ opacity: 0.4 }}>Próximamente</span>
        </div>
      </div>
    </div>
  );
}
