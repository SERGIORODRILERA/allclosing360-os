"use client";

import { useState, useRef, useEffect } from "react";
import type { EngineId } from "@ac360/types";
import { DIRECTORS, DIRECTOR_MAP } from "../lib/engines";
import type { UITask } from "./TasksPanel";
import HumanAvatar from "./HumanAvatar";

interface Props {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
  onViewResult?: (task: UITask) => void;
}

interface Room {
  id: string;
  label: string;
  color: string;
  wallColor: string;
  floorPattern: string;
  col: number; row: number; cols: number; rows: number;
  directors: EngineId[];
  emoji: string;
}

const ROOMS: Room[] = [
  {
    id: "ceo",
    label: "Suite Ejecutiva CEO",
    color: "#f59e0b", wallColor: "#1e1608", emoji: "👑",
    floorPattern: "radial-gradient(circle at 50% 50%, #1e1a08 0%, #0f0c03 100%)",
    col: 0, row: 0, cols: 2, rows: 2, directors: ["ceo_advisor"],
  },
  {
    id: "mkt",
    label: "Marketing & Contenido",
    color: "#ec4899", wallColor: "#1a0812", emoji: "📣",
    floorPattern: "radial-gradient(circle at 30% 30%, #1a0812 0%, #0c0408 100%)",
    col: 2, row: 0, cols: 3, rows: 2, directors: ["director_marketing","director_contenido","director_embudos"],
  },
  {
    id: "ads",
    label: "Sala de Ads",
    color: "#6366f1", wallColor: "#08081a", emoji: "📊",
    floorPattern: "radial-gradient(circle at 70% 30%, #0d0d1e 0%, #060610 100%)",
    col: 0, row: 2, cols: 2, rows: 2, directors: ["director_meta_ads","director_google_ads"],
  },
  {
    id: "seo",
    label: "SEO / SEM",
    color: "#22c55e", wallColor: "#04140a", emoji: "🔍",
    floorPattern: "radial-gradient(circle at 50% 70%, #081408 0%, #030a03 100%)",
    col: 2, row: 2, cols: 2, rows: 2, directors: ["director_seo","director_sem"],
  },
  {
    id: "ventas",
    label: "Ventas & CRM",
    color: "#3b82f6", wallColor: "#040a1a", emoji: "💼",
    floorPattern: "radial-gradient(circle at 50% 50%, #08101e 0%, #030610 100%)",
    col: 4, row: 0, cols: 1, rows: 4, directors: ["director_comercial","director_crm_ghl"],
  },
  {
    id: "ops",
    label: "Operaciones",
    color: "#8b5cf6", wallColor: "#0a0414", emoji: "⚙️",
    floorPattern: "radial-gradient(circle at 30% 70%, #100818 0%, #060410 100%)",
    col: 0, row: 4, cols: 2, rows: 2, directors: ["director_operaciones","director_automatizaciones"],
  },
  {
    id: "finanzas",
    label: "Finanzas & IA Calls",
    color: "#10b981", wallColor: "#021410", emoji: "💰",
    floorPattern: "radial-gradient(circle at 60% 40%, #081410 0%, #030a06 100%)",
    col: 2, row: 4, cols: 2, rows: 2, directors: ["director_financiero","director_llamadas_ia"],
  },
  {
    id: "terraza",
    label: "Terraza",
    color: "#14b8a6", wallColor: "#031a18", emoji: "🌿",
    floorPattern: "radial-gradient(circle at 50% 50%, #0a1e1c 0%, #030e0c 100%)",
    col: 4, row: 4, cols: 1, rows: 2, directors: [],
  },
];

const CELL   = 180;
const WALL_H = 60;
const GAP    = 6;

// ─── CSS injection ───────────────────────────────────────────────────────────
const OFFICE_STYLE = `
@keyframes iso-particle {
  0%,100%{transform:translateY(0) scale(1);opacity:0.9}
  50%{transform:translateY(-28px) scale(0.3);opacity:0}
}
@keyframes iso-glow-pulse {
  0%,100%{opacity:0.35} 50%{opacity:0.7}
}
@keyframes iso-star {
  0%,100%{opacity:0.2} 50%{opacity:0.9}
}
@keyframes iso-roof-glow {
  0%,100%{opacity:0.12} 50%{opacity:0.28}
}
@keyframes iso-floor-shimmer {
  0%{background-position:0% 50%}
  50%{background-position:100% 50%}
  100%{background-position:0% 50%}
}
`;

let officeStyleInjected = false;

// ─── Room furniture helpers ──────────────────────────────────────────────────
function Desk({ color, x, y, flip = false }: { color: string; x: number; y: number; flip?: boolean }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 42, height: 24, pointerEvents: "none" }}>
      {/* Desktop surface */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(135deg, #1e1e2e 0%, #14141e 100%)`,
        border: `1px solid ${color}30`,
        borderRadius: 4,
        boxShadow: `0 3px 8px rgba(0,0,0,0.4), 0 0 6px ${color}12`,
      }} />
      {/* Monitor */}
      <div style={{
        position: "absolute",
        top: -20, left: flip ? 4 : 8,
        width: 26, height: 16,
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border: `1px solid ${color}55`,
        borderRadius: 3,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 8px ${color}30`,
      }}>
        {/* Screen content lines */}
        <div style={{ width: "80%", display: "flex", flexDirection: "column", gap: 2 }}>
          {[0.8, 0.5, 0.7].map((w, i) => (
            <div key={i} style={{ height: 2, width: `${w * 100}%`, background: color + "60", borderRadius: 1 }} />
          ))}
        </div>
        {/* Monitor stand */}
        <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 6, height: 5, background: "#0a0a14" }} />
      </div>
      {/* Keyboard hint */}
      <div style={{ position: "absolute", bottom: 3, left: flip ? 4 : 6, width: 14, height: 5, background: `${color}18`, border: `1px solid ${color}20`, borderRadius: 2 }} />
    </div>
  );
}

function Plant({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      <div style={{ width: 14, height: 14, background: "radial-gradient(circle, #22c55e50 0%, #16a34a30 100%)", borderRadius: "50% 50% 30% 30%", border: "1px solid #22c55e30" }}>
        <div style={{ position: "absolute", top: -6, left: 3, width: 8, height: 10, background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)", borderRadius: "50% 50% 30% 30%" }} />
      </div>
      <div style={{ width: 14, height: 6, background: `${color}20`, borderRadius: "0 0 4px 4px", border: `1px solid ${color}20` }} />
    </div>
  );
}

function Whiteboard({ color, x, y, w = 40, h = 28 }: { color: string; x: number; y: number; w?: number; h?: number }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)",
      border: `1px solid ${color}40`,
      borderRadius: 3,
      padding: 4,
      boxShadow: `0 0 10px ${color}15`,
      pointerEvents: "none",
    }}>
      {[0.9, 0.6, 0.75, 0.5].map((w2, i) => (
        <div key={i} style={{ height: 2, width: `${w2 * 100}%`, background: i % 2 === 0 ? color + "50" : "rgba(255,255,255,0.08)", borderRadius: 1, marginBottom: 3 }} />
      ))}
    </div>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────
function RoomParticles({ color }: { color: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 2 + (i % 3),
          height: 2 + (i % 3),
          borderRadius: "50%",
          background: color,
          left: `${6 + i * 13}%`,
          bottom: 8 + (i % 4) * 6,
          opacity: 0.9,
          boxShadow: `0 0 4px ${color}`,
          animation: `iso-particle ${1.1 + i * 0.3}s ease-in-out ${i * 0.22}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── IsometricOffice ─────────────────────────────────────────────────────────
export default function IsometricOffice({ tasks, activeDirectorId, onDirectorSelect, onViewResult }: Props) {
  const [dragging, setDragging]   = useState(false);
  const [rotation, setRotation]   = useState({ x: 32, y: -22 });
  const [zoom, setZoom]           = useState(0.74);
  const [hovered, setHovered]     = useState<string | null>(null);
  const dragStart = useRef<{ mx: number; my: number; rx: number; ry: number } | null>(null);
  const totalActive = tasks.filter(t => t.status === "in_progress").length;

  useEffect(() => {
    if (officeStyleInjected || typeof document === "undefined") return;
    officeStyleInjected = true;
    const el = document.createElement("style");
    el.id = "iso-office-style";
    el.textContent = OFFICE_STYLE;
    document.head.appendChild(el);
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-char]")) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, rx: rotation.x, ry: rotation.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    setRotation({
      x: Math.max(10, Math.min(75, dragStart.current.rx - (e.clientY - dragStart.current.my) * 0.4)),
      y: dragStart.current.ry + (e.clientX - dragStart.current.mx) * 0.4,
    });
  }
  function onMouseUp() { setDragging(false); dragStart.current = null; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => Math.min(1.3, Math.max(0.4, z - e.deltaY * 0.001)));
  }

  function isRoomActive(room: Room) {
    return tasks.some(t => room.directors.includes(t.engineId as EngineId) && t.status === "in_progress");
  }

  const totalW = CELL * 5;
  const totalH = CELL * 6;

  // Deterministic star field
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 139.1) % 100, y: (i * 83.7) % 100,
    s: 0.8 + (i % 3) * 0.6,
    d: (i * 0.11) % 3.5,
    dur: 1.8 + (i % 5) * 0.7,
  }));

  return (
    <div
      className="office-floor"
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, overflow: "hidden", position: "relative", zIndex: 1 }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 1 }}>
            Vista 3D Sims · Arrastra para rotar
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            ALLCLOSING360 HQ
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>
            {DIRECTORS.length} directores IA · {totalActive} tarea{totalActive !== 1 ? "s" : ""} activa{totalActive !== 1 ? "s" : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {/* Zoom */}
          <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid var(--color-border)" }}>
            <button onClick={() => setZoom(z => Math.min(1.3, z + 0.1))} style={{ fontSize: 12, padding: "4px 10px", background: "var(--color-surface-2)", color: "var(--color-text-muted)", borderRight: "1px solid var(--color-border)" }}>+</button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} style={{ fontSize: 12, padding: "4px 10px", background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}>−</button>
          </div>
          <button
            onClick={() => { setRotation({ x: 32, y: -22 }); setZoom(0.74); }}
            style={{ fontSize: 10, padding: "5px 10px", borderRadius: 6, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >⊙ Reset</button>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 6 }}>
            <div className="status-dot-active" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)" }} />
            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>Online</span>
          </div>
        </div>
      </div>

      {/* ── 3D Scene ── */}
      <div
        style={{ flex: 1, overflow: "hidden", cursor: dragging ? "grabbing" : "grab", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        {/* Starfield backdrop */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, #0a0a1a 0%, #030306 100%)" }}>
          {stars.map((s, i) => (
            <div key={i} style={{
              position: "absolute",
              left: s.x + "%", top: s.y + "%",
              width: s.s, height: s.s,
              borderRadius: "50%",
              background: "#fff",
              opacity: 0.25,
              animation: `iso-star ${s.dur}s ease-in-out ${s.d}s infinite`,
            }} />
          ))}
          {/* Nebula blobs */}
          <div style={{ position: "absolute", left: "10%", top: "15%", width: 200, height: 200, background: "radial-gradient(circle, rgba(79,126,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: "15%", bottom: "20%", width: 180, height: 180, background: "radial-gradient(circle, rgba(162,89,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        </div>

        <div style={{ perspective: "1500px", perspectiveOrigin: "50% 32%" }}>
          <div style={{
            transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: "preserve-3d",
            transition: dragging ? "none" : "transform 0.12s ease-out",
            width: totalW,
            height: totalH,
            position: "relative",
          }}>

            {/* ── Base floor platform ── */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "#08081a",
              backgroundImage: `
                repeating-linear-gradient(0deg,  #0e0e20 0px, #0e0e20 1px, transparent 1px, transparent 36px),
                repeating-linear-gradient(90deg, #0e0e20 0px, #0e0e20 1px, transparent 1px, transparent 36px)
              `,
              borderRadius: 10,
              boxShadow: "0 30px 120px rgba(0,0,0,0.98)",
              transformStyle: "preserve-3d",
            }}>
              {/* Platform front face */}
              <div style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                height: WALL_H + 20,
                background: "linear-gradient(180deg, #0a0a18 0%, #040408 100%)",
                borderRadius: "0 0 10px 10px",
                transformOrigin: "top center",
                transform: "rotateX(-90deg)",
                borderTop: "1px solid #1a1a2e",
              }} />
              {/* Platform right face */}
              <div style={{
                position: "absolute",
                top: 0, right: 0,
                height: "100%", width: WALL_H + 20,
                background: "linear-gradient(90deg, #080814 0%, #040408 100%)",
                transformOrigin: "left center",
                transform: "rotateY(90deg)",
              }} />
            </div>

            {/* ── Rooms ── */}
            {ROOMS.map((room) => {
              const rx = room.col * CELL;
              const ry = room.row * CELL;
              const rw = room.cols * CELL - GAP;
              const rh = room.rows * CELL - GAP;
              const active  = isRoomActive(room);
              const isHov   = hovered === room.id;
              const activeDirs = room.directors.filter(d => tasks.some(t => t.engineId === d && t.status === "in_progress"));

              return (
                <div
                  key={room.id}
                  onMouseEnter={() => setHovered(room.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: "absolute",
                    left: rx + GAP / 2, top: ry + GAP / 2,
                    width: rw, height: rh,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* ── Floor tile ── */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: active
                      ? room.floorPattern.replace("0%, #", "0%, transparent 60%, #").replace("100%)", "100%)") + `, radial-gradient(ellipse at 40% 40%, ${room.color}14 0%, transparent 70%)`
                      : room.floorPattern,
                    border: `1.5px solid ${active ? room.color + "65" : room.color + "25"}`,
                    borderRadius: 7,
                    boxShadow: active ? `inset 0 0 50px ${room.color}12` : "none",
                    transition: "all 0.5s ease",
                    // Subtle tile grid overlay
                    backgroundImage: `
                      ${room.floorPattern},
                      repeating-linear-gradient(0deg,  ${room.color}06 0px, ${room.color}06 1px, transparent 1px, transparent 18px),
                      repeating-linear-gradient(90deg, ${room.color}06 0px, ${room.color}06 1px, transparent 1px, transparent 18px)
                    `,
                  }} />

                  {/* ── Front wall (drops forward/down from bottom edge) ── */}
                  <div style={{
                    position: "absolute",
                    bottom: 0, left: 0,
                    width: rw, height: WALL_H,
                    background: `linear-gradient(180deg, ${room.color}30 0%, ${room.wallColor}cc 50%, ${room.wallColor}80 100%)`,
                    border: `1px solid ${room.color}28`,
                    borderTop: `1px solid ${room.color}50`,
                    borderRadius: "0 0 5px 5px",
                    transformOrigin: "top center",
                    transform: "rotateX(-90deg)",
                  }}>
                    {/* Baseboard trim */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: room.color + "20", borderTop: `1px solid ${room.color}30` }} />
                    {/* Wall detail lines (window/panel effect) */}
                    {rw > 100 && (
                      <div style={{ position: "absolute", inset: "8px 16px", borderTop: `1px solid ${room.color}15`, borderBottom: `1px solid ${room.color}15` }} />
                    )}
                  </div>

                  {/* ── Right wall (drops to the right/side) ── */}
                  <div style={{
                    position: "absolute",
                    top: 0, left: rw,
                    width: WALL_H, height: rh,
                    background: `linear-gradient(90deg, ${room.color}22 0%, ${room.wallColor}aa 50%, ${room.wallColor}60 100%)`,
                    border: `1px solid ${room.color}20`,
                    borderLeft: `1px solid ${room.color}40`,
                    borderRadius: "0 5px 5px 0",
                    transformOrigin: "left center",
                    transform: "rotateY(90deg)",
                  }}>
                    {/* Baseboard */}
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 6, background: room.color + "18", borderLeft: `1px solid ${room.color}25` }} />
                  </div>

                  {/* ── Active glow bottom line ── */}
                  {active && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, transparent, ${room.color}cc, transparent)`,
                      borderRadius: "0 0 7px 7px",
                      boxShadow: `0 0 8px ${room.color}`,
                    }} />
                  )}

                  {/* ── Roof ambient glow ── */}
                  {active && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 7,
                      background: `radial-gradient(ellipse at 50% 0%, ${room.color}18 0%, transparent 60%)`,
                      animation: "iso-glow-pulse 2.5s ease-in-out infinite",
                      pointerEvents: "none",
                    }} />
                  )}

                  {/* ── Particles ── */}
                  {active && <RoomParticles color={room.color} />}

                  {/* ── Room label ── */}
                  <div style={{
                    position: "absolute", top: 6, left: 8,
                    display: "flex", alignItems: "center", gap: 4, zIndex: 5,
                  }}>
                    <span style={{ fontSize: 12 }}>{room.emoji}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: room.color + "cc" }}>
                      {room.label}
                    </span>
                    {activeDirs.length > 0 && (
                      <div style={{
                        background: room.color + "25", border: `1px solid ${room.color}50`,
                        borderRadius: 8, padding: "1px 5px",
                        fontSize: 8, fontWeight: 700, color: room.color,
                      }}>
                        {activeDirs.length} activo{activeDirs.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* ── Furniture ── */}
                  {room.id === "ceo" && (
                    <>
                      <Desk color={room.color} x={rw / 2 - 22} y={rh - 60} />
                      <Plant x={8} y={rh - 28} color={room.color} />
                      <Whiteboard color={room.color} x={rw - 50} y={20} />
                    </>
                  )}
                  {room.id === "mkt" && (
                    <>
                      <Desk color={room.color} x={20} y={rh - 60} />
                      <Desk color={room.color} x={rw / 2 - 20} y={rh - 60} />
                      <Desk color={room.color} x={rw - 65} y={rh - 60} />
                      <Whiteboard color={room.color} x={rw - 50} y={16} w={44} h={32} />
                      <Plant x={rw - 20} y={rh - 28} color={room.color} />
                    </>
                  )}
                  {(room.id === "ads" || room.id === "seo" || room.id === "ops" || room.id === "finanzas") && (
                    <>
                      <Desk color={room.color} x={16} y={rh - 60} />
                      <Desk color={room.color} x={rw - 60} y={rh - 60} flip />
                      <Plant x={rw / 2 - 7} y={10} color={room.color} />
                    </>
                  )}
                  {room.id === "ventas" && (
                    <>
                      <Desk color={room.color} x={rw / 2 - 21} y={rh - 60} />
                      <Desk color={room.color} x={rw / 2 - 21} y={60} />
                      <Whiteboard color={room.color} x={4} y={16} w={rw - 8} h={28} />
                    </>
                  )}
                  {room.id === "terraza" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "28px 8px" }}>
                      <div style={{ fontSize: 28 }}>🌿</div>
                      <div style={{ fontSize: 18, display: "flex", gap: 8 }}>🪴🌱🌸</div>
                      <div style={{ fontSize: 8, color: "#14b8a660", letterSpacing: "0.12em", textTransform: "uppercase" }}>Zona Zen</div>
                    </div>
                  )}

                  {/* ── Director avatars ── */}
                  {room.directors.length > 0 && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      paddingTop: 22,
                      paddingBottom: 30,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                      justifyContent: room.directors.length === 1 ? "center" : "space-around",
                      padding: "26px 8px 32px",
                      gap: 2,
                    }}>
                      {room.directors.map((dirId) => {
                        const d = DIRECTOR_MAP[dirId as keyof typeof DIRECTOR_MAP];
                        if (!d) return null;
                        const dirTasks    = tasks.filter(t => t.engineId === dirId);
                        const completedT  = dirTasks.slice().reverse().find(t => t.status === "completed");
                        const scaleFactor = room.directors.length > 2 ? 0.66 : room.directors.length === 2 ? 0.8 : 0.95;

                        return (
                          <div key={dirId} data-char="1" style={{ position: "relative", zIndex: 5 }}>
                            <HumanAvatar
                              director={d}
                              tasks={dirTasks}
                              isSelected={activeDirectorId === dirId}
                              scale={scaleFactor}
                              onClick={() => {
                                onDirectorSelect(dirId as EngineId);
                                if (completedT && onViewResult) onViewResult(completedT);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Corridor grid lines ── */}
            {[CELL, CELL * 2, CELL * 3, CELL * 4].map((x) => (
              <div key={x} style={{ position: "absolute", left: x - 1, top: 0, width: 2, height: "100%", background: "linear-gradient(180deg, transparent, rgba(79,126,255,0.08), rgba(79,126,255,0.15), rgba(79,126,255,0.08), transparent)", pointerEvents: "none" }} />
            ))}
            {[CELL * 2, CELL * 4].map((y) => (
              <div key={y} style={{ position: "absolute", left: 0, top: y - 1, width: "100%", height: 2, background: "linear-gradient(90deg, transparent, rgba(79,126,255,0.08), rgba(79,126,255,0.15), rgba(79,126,255,0.08), transparent)", pointerEvents: "none" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {[
          { icon: "💎", label: "Trabajando" },
          { icon: "😴", label: "Idle" },
          { icon: "✅", label: "Completado" },
          { icon: "❌", label: "Error" },
        ].map(({ icon, label }) => (
          <div key={label} style={{ fontSize: 9, color: "var(--color-text-dim)", display: "flex", alignItems: "center", gap: 4, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 5, padding: "2px 8px" }}>
            {icon} {label}
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 9, color: "var(--color-text-dim)", alignSelf: "center" }}>
          🖱️ Arrastra · Scroll zoom · Click avatar para seleccionar
        </div>
      </div>
    </div>
  );
}
