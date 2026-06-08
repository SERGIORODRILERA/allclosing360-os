"use client";

import { useState, useEffect, useCallback } from "react";
import type { EngineId } from "@ac360/types";
import type { UITask } from "./TasksPanel";
import { DIRECTORS, DIRECTOR_MAP } from "../lib/engines";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}

// ─── Room layout ──────────────────────────────────────────────────────────────
interface Room {
  id: string;
  label: string;
  x: number; // percent from left
  y: number; // percent from top
  w: number;
  h: number;
  color: string;
  directorIds: EngineId[];
  icon: string;
}

const ROOMS: Room[] = [
  {
    id: "recepcion",
    label: "RECEPCIÓN",
    x: 38, y: 2, w: 24, h: 11,
    color: "#4f7eff",
    directorIds: [],
    icon: "🏢",
  },
  {
    id: "direccion",
    label: "SALA DIRECCIÓN",
    x: 68, y: 2, w: 30, h: 20,
    color: "#f59e0b",
    directorIds: ["ceo_advisor", "director_producto"],
    icon: "👑",
  },
  {
    id: "marketing",
    label: "SALA MARKETING",
    x: 2, y: 2, w: 34, h: 28,
    color: "#ec4899",
    directorIds: ["director_marketing", "director_meta_ads", "director_sem", "director_seo"],
    icon: "📣",
  },
  {
    id: "comercial",
    label: "SALA COMERCIAL",
    x: 38, y: 15, w: 28, h: 20,
    color: "#3b82f6",
    directorIds: ["director_comercial", "director_embudos"],
    icon: "💼",
  },
  {
    id: "contenido",
    label: "SALA CONTENIDO",
    x: 68, y: 24, w: 30, h: 18,
    color: "#a855f7",
    directorIds: ["director_contenido"],
    icon: "✍️",
  },
  {
    id: "meetings",
    label: "SALA MEETINGS",
    x: 36, y: 37, w: 28, h: 18,
    color: "#06b6d4",
    directorIds: [],
    icon: "🤝",
  },
  {
    id: "ia",
    label: "SALA IA",
    x: 2, y: 32, w: 32, h: 24,
    color: "#14b8a6",
    directorIds: ["director_automatizaciones", "director_crm_ghl", "director_llamadas_ia"],
    icon: "⚡",
  },
  {
    id: "operaciones",
    label: "SALA OPERACIONES",
    x: 68, y: 44, w: 30, h: 18,
    color: "#8b5cf6",
    directorIds: ["director_operaciones"],
    icon: "⚙️",
  },
  {
    id: "finanzas",
    label: "SALA FINANZAS",
    x: 36, y: 57, w: 28, h: 18,
    color: "#10b981",
    directorIds: ["director_financiero"],
    icon: "💰",
  },
  {
    id: "google_ads",
    label: "SALA SEARCH ADS",
    x: 2, y: 58, w: 32, h: 18,
    color: "#ef4444",
    directorIds: ["director_google_ads"],
    icon: "🔴",
  },
  {
    id: "lounge",
    label: "ÁREA NETWORKING",
    x: 68, y: 64, w: 30, h: 14,
    color: "#6366f1",
    directorIds: [],
    icon: "☕",
  },
];

// ─── Avatar positions within rooms ───────────────────────────────────────────
const AVATAR_OFFSETS: [number, number][] = [
  [22, 35], [55, 35], [22, 65], [55, 65], [38, 50],
];

// ─── CSS keyframes injected once ─────────────────────────────────────────────
const KEYFRAMES = `
@keyframes avatar-bob {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-4px); }
}
@keyframes room-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(79,126,255,0); }
  50%      { box-shadow: 0 0 12px 3px rgba(79,126,255,0.25); }
}
@keyframes online-blink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
@keyframes iso-float {
  0%,100% { transform: rotateX(55deg) rotateZ(-45deg) scale(0.98); }
  50%      { transform: rotateX(55deg) rotateZ(-45deg) scale(1); }
}
`;

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({
  directorId,
  offsetX,
  offsetY,
  isActive,
  hasTask,
  onSelect,
}: {
  directorId: EngineId;
  offsetX: number;
  offsetY: number;
  isActive: boolean;
  hasTask: boolean;
  onSelect: (id: EngineId) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const director = DIRECTOR_MAP[directorId];
  if (!director) return null;

  const delay = Math.abs(directorId.charCodeAt(3) % 20) / 10;

  return (
    <div
      style={{
        position: "absolute",
        left: `${offsetX}%`,
        top: `${offsetY}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        cursor: "pointer",
        zIndex: hovered ? 20 : 10,
        transition: "z-index 0s",
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(directorId); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: 6,
          background: "rgba(10,10,26,0.95)",
          border: `1px solid ${director.color}50`,
          borderRadius: 8,
          padding: "6px 10px",
          whiteSpace: "nowrap",
          fontSize: 10,
          color: "var(--color-text)",
          boxShadow: `0 4px 20px ${director.color}30`,
          zIndex: 30,
          pointerEvents: "none",
        }}>
          <div style={{ fontWeight: 700, color: director.color, marginBottom: 1 }}>{director.humanName}</div>
          <div style={{ color: "var(--color-text-muted)" }}>{director.name}</div>
          <div style={{ color: "var(--color-text-dim)", fontSize: 9 }}>{director.department}</div>
        </div>
      )}

      {/* Avatar body */}
      <div style={{
        animation: `avatar-bob ${1.8 + delay}s ease-in-out infinite`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${hovered ? 1.15 : isActive ? 1.08 : 1})`,
        transition: "transform 0.2s ease",
        filter: isActive ? `drop-shadow(0 0 8px ${director.color})` : hovered ? `drop-shadow(0 0 5px ${director.color}80)` : "none",
      }}>
        {/* Head */}
        <div style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f5c9a0, #e8a87c)",
          border: `2px solid ${isActive ? director.color : "rgba(255,255,255,0.15)"}`,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Hair */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "45%",
            background: "#1a0a00",
            borderRadius: "50% 50% 0 0",
          }} />
        </div>

        {/* Body */}
        <div style={{
          width: 22,
          height: 16,
          borderRadius: "4px 4px 6px 6px",
          background: `linear-gradient(180deg, ${director.color}cc, ${director.color}66)`,
          border: `1px solid ${director.color}80`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
          fontSize: 7,
          fontWeight: 800,
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "0.01em",
        }}>
          {director.initials}
        </div>
      </div>

      {/* Name label */}
      <div style={{
        fontSize: 8,
        fontWeight: 600,
        color: isActive ? director.color : "rgba(255,255,255,0.55)",
        textAlign: "center",
        whiteSpace: "nowrap",
        background: "rgba(6,6,15,0.75)",
        padding: "1px 4px",
        borderRadius: 3,
        maxWidth: 54,
        overflow: "hidden",
        textOverflow: "ellipsis",
        transition: "color 0.2s",
      }}>
        {director.humanName.split(" ")[0]}
      </div>

      {/* Online badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        fontSize: 7,
        color: hasTask ? "#fbbf24" : "#22d97a",
        background: hasTask ? "rgba(251,191,36,0.12)" : "rgba(34,217,122,0.12)",
        border: `1px solid ${hasTask ? "rgba(251,191,36,0.3)" : "rgba(34,217,122,0.3)"}`,
        borderRadius: 3,
        padding: "1px 4px",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          width: 4, height: 4, borderRadius: "50%",
          background: hasTask ? "#fbbf24" : "#22d97a",
          animation: "online-blink 2s infinite",
        }} />
        {hasTask ? "ACTIVO" : "ONLINE"}
      </div>

      {/* Task progress ring */}
      {hasTask && (
        <div style={{
          position: "absolute",
          top: -2, left: "50%",
          transform: "translateX(-50%)",
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: director.color,
          borderRightColor: director.color,
          animation: "spin 1.5s linear infinite",
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}

// ─── Room component ───────────────────────────────────────────────────────────
function RoomCard({
  room,
  tasks,
  activeDirectorId,
  onDirectorSelect,
  isActiveRoom,
  onClick,
}: {
  room: Room;
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
  isActiveRoom: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const glow = isActiveRoom || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: `${room.x}%`,
        top: `${room.y}%`,
        width: `${room.w}%`,
        height: `${room.h}%`,
        borderRadius: 12,
        background: glow
          ? `linear-gradient(135deg, ${room.color}18, ${room.color}08)`
          : "linear-gradient(135deg, rgba(15,15,25,0.9), rgba(10,10,20,0.95))",
        border: `1px solid ${isActiveRoom ? room.color + "80" : hovered ? room.color + "40" : room.color + "20"}`,
        boxShadow: isActiveRoom
          ? `0 0 20px ${room.color}30, inset 0 0 30px ${room.color}08`
          : hovered
          ? `0 0 10px ${room.color}20`
          : "none",
        cursor: "pointer",
        transition: "all 0.25s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Room label */}
      <div style={{
        padding: "5px 8px 3px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        borderBottom: `1px solid ${room.color}15`,
        flexShrink: 0,
        background: `${room.color}08`,
      }}>
        <span style={{ fontSize: 9 }}>{room.icon}</span>
        <span style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: isActiveRoom ? room.color : `${room.color}90`,
          textTransform: "uppercase",
          transition: "color 0.2s",
        }}>{room.label}</span>
        {isActiveRoom && (
          <div style={{
            marginLeft: "auto",
            width: 5, height: 5,
            borderRadius: "50%",
            background: room.color,
            animation: "online-blink 1.5s infinite",
          }} />
        )}
      </div>

      {/* Furniture */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Center desk */}
        {room.directorIds.length > 0 && (
          <div style={{
            position: "absolute",
            left: "20%", top: "15%",
            width: "60%", height: "55%",
            borderRadius: 6,
            background: `linear-gradient(135deg, rgba(30,30,50,0.8), rgba(20,20,38,0.9))`,
            border: `1px solid ${room.color}25`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}>
            {/* Screen glow on desk */}
            <div style={{
              position: "absolute",
              bottom: 3, left: "15%",
              width: "70%", height: 3,
              borderRadius: 2,
              background: `${room.color}60`,
              boxShadow: `0 0 8px ${room.color}80`,
            }} />
          </div>
        )}

        {/* Meeting room: round table */}
        {room.id === "meetings" && (
          <div style={{
            position: "absolute",
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: "55%", height: "60%",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.04))",
            border: "1px solid rgba(6,182,212,0.3)",
            boxShadow: "0 0 20px rgba(6,182,212,0.1)",
          }} />
        )}

        {/* Reception: logo */}
        {room.id === "recepcion" && (
          <div style={{
            position: "absolute",
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "#4f7eff",
              textShadow: "0 0 10px rgba(79,126,255,0.8)",
            }}>ALLCLOSING360</div>
            <div style={{
              width: "80%",
              height: 1,
              background: "linear-gradient(90deg, transparent, #4f7eff, transparent)",
              margin: "3px auto",
            }} />
            <div style={{ fontSize: 7, color: "rgba(79,126,255,0.6)", letterSpacing: "0.1em" }}>AI OFFICE</div>
          </div>
        )}

        {/* Networking: circles */}
        {room.id === "lounge" && (
          <>
            {[[-18, -10], [0, 0], [18, -10]].map(([ox = 0, oy = 0], i) => (
              <div key={i} style={{
                position: "absolute",
                left: `${50 + ox}%`,
                top: `${50 + oy}%`,
                transform: "translate(-50%, -50%)",
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.4)",
              }} />
            ))}
            <div style={{
              position: "absolute",
              left: "20%", top: "70%",
              fontSize: 10, opacity: 0.4,
            }}>🌿</div>
          </>
        )}

        {/* Plants decoration */}
        {room.id !== "lounge" && room.id !== "recepcion" && (
          <div style={{
            position: "absolute",
            right: "3%", bottom: "5%",
            fontSize: 8,
            opacity: 0.5,
          }}>🌿</div>
        )}

        {/* Avatars */}
        {room.directorIds.map((did, idx) => {
          const [ox, oy] = AVATAR_OFFSETS[idx % AVATAR_OFFSETS.length] ?? [50, 50];
          const hasTask = tasks.some((t) => t.engineId === did && t.status === "in_progress");
          return (
            <Avatar
              key={did}
              directorId={did}
              offsetX={ox}
              offsetY={oy}
              isActive={activeDirectorId === did}
              hasTask={hasTask}
              onSelect={onDirectorSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Director info panel ──────────────────────────────────────────────────────
function DirectorInfoPanel({
  directorId,
  tasks,
  onClose,
  onActivate,
}: {
  directorId: EngineId;
  tasks: UITask[];
  onClose: () => void;
  onActivate: (id: EngineId) => void;
}) {
  const d = DIRECTOR_MAP[directorId];
  if (!d) return null;
  const dTasks = tasks.filter((t) => t.engineId === directorId);
  const active = dTasks.filter((t) => t.status === "in_progress").length;
  const completed = dTasks.filter((t) => t.status === "completed").length;

  return (
    <div style={{
      position: "absolute",
      right: 12, top: 12,
      width: 200,
      background: "rgba(8,8,20,0.95)",
      border: `1px solid ${d.color}50`,
      borderRadius: 12,
      padding: 14,
      boxShadow: `0 8px 32px ${d.color}20, 0 0 0 1px ${d.color}10`,
      zIndex: 50,
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `${d.color}20`,
            border: `2px solid ${d.color}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>{d.icon}</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: d.color }}>{d.humanName}</div>
            <div style={{ fontSize: 9, color: "var(--color-text-muted)" }}>{d.shortName}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            fontSize: 14, color: "var(--color-text-dim)",
            background: "none", border: "none",
            lineHeight: 1, padding: 2,
          }}
        >✕</button>
      </div>

      <div style={{ fontSize: 9, color: "var(--color-text-muted)", marginBottom: 10, lineHeight: 1.5 }}>
        {d.description}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 6, marginBottom: 10,
      }}>
        {[
          { v: active, l: "Activas", c: "#fbbf24" },
          { v: completed, l: "Completadas", c: "#22d97a" },
        ].map(({ v, l, c }) => (
          <div key={l} style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 6, padding: "6px 8px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: 8, color: "var(--color-text-dim)", marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 8, color: "#22d97a",
        marginBottom: 10,
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "#22d97a",
          animation: "online-blink 2s infinite",
        }} />
        ONLINE · {d.department}
      </div>

      <button
        onClick={() => { onActivate(directorId); onClose(); }}
        style={{
          width: "100%",
          padding: "7px 12px",
          borderRadius: 7,
          background: `${d.color}20`,
          border: `1px solid ${d.color}60`,
          color: d.color,
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.06em",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${d.color}35`; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${d.color}20`; }}
      >
        ACTIVAR EN CHAT
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OfficeScene3D({ tasks, activeDirectorId, onDirectorSelect }: Props) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [infoPanelDirector, setInfoPanelDirector] = useState<EngineId | null>(null);

  // When active director changes from chat, highlight their room
  useEffect(() => {
    if (!activeDirectorId) return;
    const room = ROOMS.find((r) => r.directorIds.includes(activeDirectorId));
    if (room) setActiveRoomId(room.id);
  }, [activeDirectorId]);

  const handleDirectorSelect = useCallback((id: EngineId) => {
    setInfoPanelDirector(id);
    onDirectorSelect(id);
  }, [onDirectorSelect]);

  const handleRoomClick = useCallback((room: Room) => {
    setActiveRoomId((prev) => prev === room.id ? null : room.id);
  }, []);

  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "#0a0a1a",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Inject keyframes */}
      <style>{KEYFRAMES}{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
      `}</style>

      {/* Background gradient */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 20% 20%, rgba(79,126,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(162,89,255,0.05) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Neon grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(79,126,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(79,126,255,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Status bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 32,
        background: "rgba(6,6,15,0.8)",
        borderBottom: "1px solid rgba(79,126,255,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 14px",
        backdropFilter: "blur(8px)",
        zIndex: 40,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: "#4f7eff", textShadow: "0 0 8px rgba(79,126,255,0.6)" }}>
          ALLCLOSING360
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>·</div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
          LIVE AI OFFICE
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 8, color: "#22d97a", display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22d97a", animation: "online-blink 2s infinite" }} />
            {DIRECTORS.length} directores online
          </div>
          {activeTasks > 0 && (
            <div style={{ fontSize: 8, color: "#fbbf24", display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fbbf24", animation: "spin 1s linear infinite" }} />
              {activeTasks} tarea{activeTasks !== 1 ? "s" : ""} activa{activeTasks !== 1 ? "s" : ""}
            </div>
          )}
          {completedTasks > 0 && (
            <div style={{ fontSize: 8, color: "rgba(34,217,122,0.7)" }}>
              {completedTasks} completada{completedTasks !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Office canvas */}
      <div style={{
        position: "absolute",
        top: 32,
        left: 0, right: 0, bottom: 0,
        overflow: "hidden",
      }}>
        {/* Floor tiles subtle texture */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 80px)",
          pointerEvents: "none",
        }} />

        {/* Rooms */}
        {ROOMS.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            tasks={tasks}
            activeDirectorId={activeDirectorId}
            onDirectorSelect={handleDirectorSelect}
            isActiveRoom={activeRoomId === room.id || (!!activeDirectorId && room.directorIds.includes(activeDirectorId))}
            onClick={() => handleRoomClick(room)}
          />
        ))}

        {/* Corridors / connections between rooms */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {[
            { x1: "50%", y1: "13%", x2: "50%", y2: "35%" },
            { x1: "36%", y1: "30%", x2: "36%", y2: "37%" },
            { x1: "64%", y1: "26%", x2: "64%", y2: "44%" },
          ].map((line, i) => (
            <line key={i} {...line} stroke="rgba(79,126,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
          ))}
        </svg>
      </div>

      {/* Director info panel */}
      {infoPanelDirector && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 45 }}>
          <div style={{ position: "absolute", right: 12, top: 40, pointerEvents: "all" }}>
            <DirectorInfoPanel
              directorId={infoPanelDirector}
              tasks={tasks}
              onClose={() => setInfoPanelDirector(null)}
              onActivate={onDirectorSelect}
            />
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: 8, left: 8,
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        maxWidth: "60%",
        pointerEvents: "none",
        zIndex: 40,
      }}>
        {[
          { label: "Click avatar → Activar director", color: "#4f7eff" },
          { label: "Click sala → Resaltar zona", color: "rgba(255,255,255,0.3)" },
        ].map(({ label, color }) => (
          <div key={label} style={{
            fontSize: 8,
            color,
            background: "rgba(6,6,15,0.7)",
            border: "1px solid rgba(79,126,255,0.1)",
            borderRadius: 4,
            padding: "3px 7px",
            backdropFilter: "blur(4px)",
          }}>{label}</div>
        ))}
      </div>
    </div>
  );
}
