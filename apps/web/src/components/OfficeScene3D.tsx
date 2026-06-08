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
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  directorIds: EngineId[];
  icon: string;
  type: "reception" | "meeting" | "office" | "networking";
}

const ROOMS: Room[] = [
  {
    id: "recepcion",
    label: "RECEPCIÓN",
    x: 30, y: 2, w: 40, h: 12,
    color: "#4f7eff",
    directorIds: [],
    icon: "🏢",
    type: "reception",
  },
  {
    id: "direccion",
    label: "SALA DIRECCIÓN",
    x: 72, y: 2, w: 26, h: 22,
    color: "#f59e0b",
    directorIds: ["ceo_advisor", "director_producto"],
    icon: "👑",
    type: "office",
  },
  {
    id: "marketing",
    label: "SALA MARKETING",
    x: 2, y: 2, w: 26, h: 30,
    color: "#ec4899",
    directorIds: ["director_marketing", "director_meta_ads", "director_sem", "director_seo"],
    icon: "📣",
    type: "office",
  },
  {
    id: "comercial",
    label: "SALA COMERCIAL",
    x: 30, y: 16, w: 40, h: 20,
    color: "#3b82f6",
    directorIds: ["director_comercial", "director_embudos"],
    icon: "💼",
    type: "office",
  },
  {
    id: "contenido",
    label: "SALA CONTENIDO",
    x: 72, y: 26, w: 26, h: 18,
    color: "#a855f7",
    directorIds: ["director_contenido"],
    icon: "✍️",
    type: "office",
  },
  {
    id: "ia",
    label: "SALA IA",
    x: 2, y: 34, w: 26, h: 26,
    color: "#14b8a6",
    directorIds: ["director_automatizaciones", "director_crm_ghl", "director_llamadas_ia"],
    icon: "⚡",
    type: "office",
  },
  {
    id: "meetings",
    label: "SALA MEETINGS",
    x: 30, y: 38, w: 40, h: 18,
    color: "#06b6d4",
    directorIds: [],
    icon: "🤝",
    type: "meeting",
  },
  {
    id: "operaciones",
    label: "SALA OPERACIONES",
    x: 72, y: 46, w: 26, h: 18,
    color: "#8b5cf6",
    directorIds: ["director_operaciones"],
    icon: "⚙️",
    type: "office",
  },
  {
    id: "finanzas",
    label: "SALA FINANZAS",
    x: 30, y: 58, w: 40, h: 20,
    color: "#10b981",
    directorIds: ["director_financiero", "director_google_ads"],
    icon: "💰",
    type: "office",
  },
];

// ─── Avatar positions within rooms ───────────────────────────────────────────
const AVATAR_OFFSETS: [number, number][] = [
  [18, 38], [45, 38], [72, 38], [28, 68], [58, 68],
];

// ─── CSS keyframes ─────────────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes idle-bob {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-3px); }
}
@keyframes idle-bob-alt {
  0%, 100% { transform: translateY(-1px); }
  50%      { transform: translateY(2px); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}
@keyframes online-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes office-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes led-scan {
  0%   { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}
`;

// ─── KPI Screen ────────────────────────────────────────────────────────────────
function KpiScreen({ color }: { color: string }) {
  return (
    <div style={{
      width: 40,
      height: 26,
      borderRadius: 3,
      background: "#050a14",
      border: `1px solid ${color}50`,
      boxShadow: `0 0 10px ${color}20`,
      display: "flex",
      flexDirection: "column",
      padding: 4,
      gap: 3,
      flexShrink: 0,
    }}>
      <div style={{ height: 3, width: "60%", background: color, borderRadius: 2, opacity: 0.8 }} />
      <div style={{ height: 3, width: "80%", background: color, borderRadius: 2, opacity: 0.5 }} />
      <div style={{ height: 3, width: "40%", background: color, borderRadius: 2, opacity: 0.3 }} />
      <div style={{ height: 3, width: "70%", background: color, borderRadius: 2, opacity: 0.6 }} />
    </div>
  );
}

// ─── Monitor on desk ──────────────────────────────────────────────────────────
function Monitor({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <div style={{
        width: 28,
        height: 18,
        borderRadius: 3,
        background: "#050a14",
        border: `1px solid ${color}40`,
        boxShadow: `0 0 8px ${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ width: "80%", height: "60%", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ height: 2, background: color, borderRadius: 1, opacity: 0.7 }} />
          <div style={{ height: 2, background: color, borderRadius: 1, opacity: 0.4, width: "70%" }} />
          <div style={{ height: 2, background: color, borderRadius: 1, opacity: 0.5, width: "85%" }} />
        </div>
      </div>
      <div style={{ width: 2, height: 4, background: "rgba(255,255,255,0.15)" }} />
      <div style={{ width: 10, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.1)" }} />
    </div>
  );
}

// ─── Avatar component ──────────────────────────────────────────────────────────
function Avatar({
  directorId,
  offsetX,
  offsetY,
  isActive,
  hasTask,
  bobDelay,
  onSelect,
}: {
  directorId: EngineId;
  offsetX: number;
  offsetY: number;
  isActive: boolean;
  hasTask: boolean;
  bobDelay: number;
  onSelect: (id: EngineId) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const director = DIRECTOR_MAP[directorId];
  if (!director) return null;

  const bobAnim = bobDelay % 2 === 0 ? "idle-bob" : "idle-bob-alt";
  const bobDuration = 2 + (bobDelay * 0.4);

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
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(directorId); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${director.humanName} — ${director.department}`}
    >
      {/* Tooltip on hover */}
      {hovered && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: 8,
          background: "rgba(8,12,20,0.97)",
          border: `1px solid ${director.color}60`,
          borderRadius: 8,
          padding: "7px 10px",
          whiteSpace: "nowrap",
          fontSize: 10,
          color: "rgba(255,255,255,0.85)",
          boxShadow: `0 4px 20px ${director.color}40`,
          zIndex: 100,
          pointerEvents: "none",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontWeight: 800, color: director.color, marginBottom: 2 }}>{director.humanName}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9 }}>{director.name}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, marginTop: 1 }}>{director.department}</div>
        </div>
      )}

      {/* Avatar body with animation */}
      <div style={{
        animation: `${bobAnim} ${bobDuration}s ease-in-out infinite`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        filter: isActive
          ? `drop-shadow(0 0 8px ${director.color})`
          : hovered
          ? `drop-shadow(0 0 5px ${director.color}80)`
          : "none",
        transform: hovered ? "scale(1.12)" : isActive ? "scale(1.06)" : "scale(1)",
        transition: "transform 0.2s ease, filter 0.2s ease",
      }}>
        {/* Head */}
        <div style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #e8c49a, #d4a574)",
          border: `2px solid ${isActive ? director.color : hovered ? director.color + "80" : "rgba(255,255,255,0.15)"}`,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: isActive ? `0 0 10px ${director.color}60` : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}>
          {/* Hair */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "42%",
            background: "#1a0a00",
            borderRadius: "50% 50% 0 0",
          }} />
          {/* Eyes */}
          <div style={{ position: "absolute", top: 8, left: 4, width: 3, height: 3, borderRadius: "50%", background: "#3a2010" }} />
          <div style={{ position: "absolute", top: 8, right: 4, width: 3, height: 3, borderRadius: "50%", background: "#3a2010" }} />
        </div>

        {/* Body / torso */}
        <div style={{
          width: 24,
          height: 18,
          borderRadius: "4px 4px 6px 6px",
          background: `linear-gradient(180deg, ${director.color}dd, ${director.color}88)`,
          border: `1px solid ${director.color}80`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 7,
          fontWeight: 800,
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "0.01em",
        }}>
          {director.initials}
        </div>
      </div>

      {/* Online status badge */}
      <div style={{
        position: "absolute",
        top: 0,
        right: -2,
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: hasTask ? "#fbbf24" : "#22c55e",
        boxShadow: `0 0 6px ${hasTask ? "#fbbf24" : "#22c55e"}`,
        animation: "pulse-glow 2s ease-in-out infinite",
        border: "1px solid rgba(8,12,20,0.8)",
      }} />

      {/* Task spinning ring */}
      {hasTask && (
        <div style={{
          position: "absolute",
          top: -3,
          left: "50%",
          transform: "translateX(-50%)",
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "1.5px solid transparent",
          borderTopColor: director.color,
          borderRightColor: director.color + "60",
          animation: "spin 1.2s linear infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Name label */}
      <div style={{
        fontSize: 8,
        fontWeight: 600,
        color: isActive ? director.color : "rgba(255,255,255,0.6)",
        textAlign: "center",
        whiteSpace: "nowrap",
        background: "rgba(6,9,18,0.8)",
        padding: "1px 4px",
        borderRadius: 3,
        maxWidth: 58,
        overflow: "hidden",
        textOverflow: "ellipsis",
        letterSpacing: "0.02em",
        transition: "color 0.2s",
        backdropFilter: "blur(4px)",
      }}>
        {director.humanName.split(" ")[0]}
      </div>
    </div>
  );
}

// ─── Desk furniture ───────────────────────────────────────────────────────────
function WorkDesk({ color, x, y }: { color: string; x: string; y: string }) {
  return (
    <div style={{
      position: "absolute",
      left: x, top: y,
      display: "flex",
      alignItems: "center",
      gap: 4,
    }}>
      <div style={{
        width: 90,
        height: 40,
        borderRadius: 6,
        background: "linear-gradient(135deg, #1a2040, #0d1420)",
        border: `1px solid rgba(255,255,255,0.1)`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}>
        <Monitor color={color} />
        <KpiScreen color={color} />
        {/* Keyboard */}
        <div style={{
          width: 30,
          height: 8,
          borderRadius: 2,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
        }} />
      </div>
    </div>
  );
}

// ─── Round meeting table ──────────────────────────────────────────────────────
function MeetingTable({ color }: { color: string }) {
  const chairs = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = 52;
    const cx = 70 + Math.cos(angle) * r;
    const cy = 55 + Math.sin(angle) * r;
    return { cx, cy };
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
      {/* Chairs */}
      {chairs.map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${c.cx}%`,
          top: `${c.cy}%`,
          transform: "translate(-50%, -50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: `rgba(6,182,212,0.15)`,
          border: `1px solid ${color}40`,
        }} />
      ))}
      {/* Table */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: 80,
        height: 80,
        borderRadius: 40,
        background: "linear-gradient(135deg, #1a2040, #0d1420)",
        border: `1px solid ${color}40`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 20px ${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ fontSize: 18, opacity: 0.5 }}>🤝</div>
      </div>
      {/* LED decorative strip */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "10%",
        right: "10%",
        height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.5,
        animation: "led-scan 3s ease-in-out infinite",
        backgroundSize: "200% 100%",
      }} />
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
  const isLedRoom = room.id === "direccion" || room.id === "marketing" || room.id === "ia";

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
          ? `linear-gradient(135deg, ${room.color}12, ${room.color}06)`
          : "linear-gradient(135deg, rgba(12,16,28,0.92), rgba(8,10,18,0.96))",
        border: `1px solid ${isActiveRoom ? room.color + "70" : hovered ? room.color + "40" : room.color + "20"}`,
        boxShadow: isActiveRoom
          ? `0 0 20px ${room.color}35, inset 0 0 30px ${room.color}08`
          : hovered
          ? `0 0 12px ${room.color}20`
          : "none",
        cursor: "pointer",
        transition: "all 0.25s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* LED strip top border for important rooms */}
      {isLedRoom && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${room.color}90, transparent)`,
          opacity: isActiveRoom ? 0.9 : 0.4,
          animation: "led-scan 4s ease-in-out infinite",
          backgroundSize: "200% 100%",
        }} />
      )}

      {/* Room label */}
      <div style={{
        padding: "5px 8px 3px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        borderBottom: `1px solid ${room.color}18`,
        flexShrink: 0,
        background: `${room.color}0a`,
      }}>
        <span style={{ fontSize: 9 }}>{room.icon}</span>
        <span style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: isActiveRoom ? room.color : `${room.color}85`,
          textTransform: "uppercase",
          transition: "color 0.2s",
        }}>{room.label}</span>
        {isActiveRoom && (
          <div style={{
            marginLeft: "auto",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: room.color,
            animation: "online-blink 1.5s infinite",
            boxShadow: `0 0 6px ${room.color}`,
          }} />
        )}
      </div>

      {/* Room interior */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Reception special layout */}
        {room.type === "reception" && (
          <>
            {/* Main logo */}
            <div style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              zIndex: 5,
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: "#4f7eff",
                textShadow: "0 0 12px rgba(79,126,255,0.9), 0 0 24px rgba(79,126,255,0.5)",
                animation: "pulse-glow 3s ease-in-out infinite",
              }}>ALLCLOSING360</div>
              <div style={{
                width: "90%",
                height: 1,
                background: "linear-gradient(90deg, transparent, #4f7eff, transparent)",
                margin: "4px auto",
                opacity: 0.6,
              }} />
              <div style={{
                fontSize: 8,
                color: "rgba(79,126,255,0.6)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}>AI Office</div>
            </div>
            {/* Reception desk / counter */}
            <div style={{
              position: "absolute",
              bottom: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: 10,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1a2040, #0d1420)",
              border: "1px solid rgba(79,126,255,0.25)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }} />
            {/* Plants */}
            <div style={{ position: "absolute", left: "8%", bottom: "10%", fontSize: 11, opacity: 0.6 }}>🌿</div>
            <div style={{ position: "absolute", right: "8%", bottom: "10%", fontSize: 11, opacity: 0.6 }}>🌿</div>
          </>
        )}

        {/* Meeting room */}
        {room.type === "meeting" && <MeetingTable color={room.color} />}

        {/* Standard office room with desks */}
        {room.type === "office" && room.directorIds.length > 0 && (
          <>
            {/* Desks positioned by director count */}
            {room.directorIds.length <= 2 && (
              <WorkDesk color={room.color} x="8%" y="15%" />
            )}
            {room.directorIds.length >= 3 && (
              <>
                <WorkDesk color={room.color} x="4%" y="12%" />
                <WorkDesk color={room.color} x="4%" y="55%" />
              </>
            )}

            {/* LED strip at bottom */}
            {isLedRoom && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${room.color}, transparent)`,
                opacity: 0.6,
              }} />
            )}

            {/* Plant decoration */}
            <div style={{
              position: "absolute",
              right: "3%",
              bottom: "5%",
              fontSize: 9,
              opacity: 0.45,
            }}>🌿</div>
          </>
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
              bobDelay={idx}
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
      width: 210,
      background: "rgba(8,12,20,0.97)",
      border: `1px solid ${d.color}55`,
      borderRadius: 12,
      padding: 14,
      boxShadow: `0 8px 32px ${d.color}25, 0 0 0 1px ${d.color}12`,
      backdropFilter: "blur(16px)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Large avatar */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `${d.color}20`,
            border: `2px solid ${d.color}70`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: `0 0 12px ${d.color}30`,
          }}>{d.icon}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: d.color }}>{d.humanName}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{d.shortName}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.35)",
            background: "none",
            border: "none",
            lineHeight: 1,
            padding: 2,
            cursor: "pointer",
          }}
        >✕</button>
      </div>

      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", marginBottom: 10, lineHeight: 1.6 }}>
        {d.description}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
        {[
          { v: active, l: "Activas", c: "#fbbf24" },
          { v: completed, l: "Completadas", c: "#22d97a" },
        ].map(({ v, l, c }) => (
          <div key={l} style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 6,
            padding: "6px 8px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 8,
        color: "#22d97a",
        marginBottom: 10,
      }}>
        <div style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#22d97a",
          animation: "pulse-glow 2s infinite",
          boxShadow: "0 0 5px #22d97a",
        }} />
        ONLINE · {d.department}
      </div>

      <button
        onClick={() => { onActivate(directorId); onClose(); }}
        style={{
          width: "100%",
          padding: "8px 12px",
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
      background: "#080c14",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Inject keyframes */}
      <style>{KEYFRAMES}</style>

      {/* Background radial gradients */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: [
          "radial-gradient(ellipse at 15% 15%, rgba(79,126,255,0.07) 0%, transparent 55%)",
          "radial-gradient(ellipse at 85% 85%, rgba(162,89,255,0.06) 0%, transparent 55%)",
          "radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.03) 0%, transparent 70%)",
        ].join(", "),
        pointerEvents: "none",
      }} />

      {/* Subtle grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: [
          "linear-gradient(rgba(79,126,255,0.05) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(79,126,255,0.05) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "44px 44px",
        pointerEvents: "none",
      }} />

      {/* Ambient corner glows */}
      <div style={{
        position: "absolute",
        top: 0, left: 0,
        width: 200, height: 200,
        background: "radial-gradient(circle, rgba(79,126,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: 0, right: 0,
        width: 250, height: 250,
        background: "radial-gradient(circle, rgba(162,89,255,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Status bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 32,
        background: "rgba(6,8,14,0.85)",
        borderBottom: "1px solid rgba(79,126,255,0.18)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 14px",
        backdropFilter: "blur(10px)",
        zIndex: 40,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.18em",
          color: "#4f7eff",
          textShadow: "0 0 10px rgba(79,126,255,0.7)",
        }}>
          ALLCLOSING360
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>·</div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
          LIVE AI OFFICE
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 8, color: "#22d97a", display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22d97a", animation: "pulse-glow 2s infinite", boxShadow: "0 0 4px #22d97a" }} />
            {DIRECTORS.length} directores online
          </div>
          {activeTasks > 0 && (
            <div style={{ fontSize: 8, color: "#fbbf24", display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fbbf24", animation: "spin 1s linear infinite" }} />
              {activeTasks} activa{activeTasks !== 1 ? "s" : ""}
            </div>
          )}
          {completedTasks > 0 && (
            <div style={{ fontSize: 8, color: "rgba(34,217,122,0.65)" }}>
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
        {/* Corridors / separators */}
        <div style={{
          position: "absolute",
          left: "28%", top: 0, bottom: 0,
          width: 2,
          background: "rgba(255,255,255,0.02)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          left: "70%", top: 0, bottom: 0,
          width: 2,
          background: "rgba(255,255,255,0.02)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          left: 0, right: 0,
          top: "36%",
          height: 2,
          background: "rgba(255,255,255,0.02)",
          pointerEvents: "none",
        }} />

        {/* SVG connection lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <line x1="50%" y1="14%" x2="50%" y2="38%" stroke="rgba(79,126,255,0.06)" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="28%" y1="27%" x2="30%" y2="27%" stroke="rgba(79,126,255,0.06)" strokeWidth="1" />
          <line x1="70%" y1="35%" x2="72%" y2="35%" stroke="rgba(79,126,255,0.06)" strokeWidth="1" />
          <line x1="28%" y1="47%" x2="30%" y2="55%" stroke="rgba(79,126,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="70%" y1="55%" x2="72%" y2="55%" stroke="rgba(79,126,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
        </svg>

        {/* Rooms */}
        {ROOMS.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            tasks={tasks}
            activeDirectorId={activeDirectorId}
            onDirectorSelect={handleDirectorSelect}
            isActiveRoom={
              activeRoomId === room.id ||
              (!!activeDirectorId && room.directorIds.includes(activeDirectorId))
            }
            onClick={() => handleRoomClick(room)}
          />
        ))}
      </div>

      {/* Director info panel overlay */}
      {infoPanelDirector && (
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 45,
        }}>
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
        maxWidth: "65%",
        pointerEvents: "none",
        zIndex: 40,
      }}>
        {[
          { label: "Click avatar → Activar director", color: "#4f7eff" },
          { label: "Click sala → Resaltar zona", color: "rgba(255,255,255,0.25)" },
        ].map(({ label, color }) => (
          <div key={label} style={{
            fontSize: 8,
            color,
            background: "rgba(6,9,18,0.75)",
            border: "1px solid rgba(79,126,255,0.12)",
            borderRadius: 4,
            padding: "3px 7px",
            backdropFilter: "blur(4px)",
          }}>{label}</div>
        ))}
      </div>
    </div>
  );
}
