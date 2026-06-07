"use client";

import { useState, useRef, useEffect } from "react";
import type { EngineId } from "@ac360/types";
import { DIRECTORS, DIRECTOR_MAP } from "../lib/engines";
import type { UITask } from "./TasksPanel";
import MinecraftCharacter from "./MinecraftCharacter";

interface Props {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
  onViewResult?: (task: UITask) => void;
}

// ─── Room definitions with grid positions ────────────────────────────────────
interface Room {
  id: string;
  label: string;
  color: string;
  col: number; row: number; cols: number; rows: number;
  directors: EngineId[];
  emoji: string;
  floorColor: string;
}

const ROOMS: Room[] = [
  { id: "ceo",      label: "Suite Ejecutiva CEO",  color: "#f59e0b", floorColor: "#1a1500", emoji: "👑", col: 0, row: 0, cols: 2, rows: 2, directors: ["ceo_advisor"] },
  { id: "mkt",      label: "Marketing & Contenido", color: "#ec4899", floorColor: "#1a0012", emoji: "📣", col: 2, row: 0, cols: 3, rows: 2, directors: ["director_marketing","director_contenido","director_embudos"] },
  { id: "ads",      label: "Sala de Ads",           color: "#6366f1", floorColor: "#0a0a1a", emoji: "📊", col: 0, row: 2, cols: 2, rows: 2, directors: ["director_meta_ads","director_google_ads"] },
  { id: "seo",      label: "SEO / SEM",             color: "#22c55e", floorColor: "#001408", emoji: "🔍", col: 2, row: 2, cols: 2, rows: 2, directors: ["director_seo","director_sem"] },
  { id: "ventas",   label: "Ventas & CRM",          color: "#3b82f6", floorColor: "#000a1a", emoji: "💼", col: 4, row: 0, cols: 1, rows: 4, directors: ["director_comercial","director_crm_ghl"] },
  { id: "ops",      label: "Operaciones",           color: "#8b5cf6", floorColor: "#0a0012", emoji: "⚙️", col: 0, row: 4, cols: 2, rows: 2, directors: ["director_operaciones","director_automatizaciones"] },
  { id: "finanzas", label: "Finanzas & IA Calls",   color: "#10b981", floorColor: "#001410", emoji: "💰", col: 2, row: 4, cols: 2, rows: 2, directors: ["director_financiero","director_llamadas_ia"] },
  { id: "terraza",  label: "Terraza",               color: "#14b8a6", floorColor: "#001a18", emoji: "🌿", col: 4, row: 4, cols: 1, rows: 2, directors: [] },
];

const CELL = 180; // px per grid cell

// ─── Floating particles in active rooms ─────────────────────────────────────
function RoomParticles({ color }: { color: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 3, height: 3,
          borderRadius: "50%",
          background: color,
          left: 15 + i * 22 + "%",
          bottom: 10,
          opacity: 0.7,
          animation: `mc-particle-float ${1.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── IsometricOffice — main component ────────────────────────────────────────
export default function IsometricOffice({ tasks, activeDirectorId, onDirectorSelect, onViewResult }: Props) {
  const [dragging, setDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 30, y: -20 });
  const [hovered, setHovered] = useState<string | null>(null);
  const dragStart = useRef<{ mx: number; my: number; rx: number; ry: number } | null>(null);
  const totalActive = tasks.filter((t) => t.status === "in_progress").length;

  // Add particle CSS once
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("mc-office-style")) return;
    const el = document.createElement("style");
    el.id = "mc-office-style";
    el.textContent = `
      @keyframes mc-particle-float {
        0%,100%{transform:translateY(0) scale(1);opacity:0.7}
        50%{transform:translateY(-20px) scale(0.5);opacity:0}
      }
      @keyframes mc-floor-pulse {
        0%,100%{opacity:0.4} 50%{opacity:0.8}
      }
    `;
    document.head.appendChild(el);
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-char]")) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, rx: rotation.x, ry: rotation.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setRotation({
      x: Math.max(10, Math.min(70, dragStart.current.rx - dy * 0.4)),
      y: dragStart.current.ry + dx * 0.4,
    });
  }
  function onMouseUp() { setDragging(false); dragStart.current = null; }

  function getRoomActive(room: Room) {
    return tasks.some((t) => room.directors.includes(t.engineId as EngineId) && t.status === "in_progress");
  }

  const totalW = CELL * 5;
  const totalH = CELL * 6;

  return (
    <div
      className="office-floor"
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, overflow: "hidden", position: "relative", zIndex: 1 }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 2 }}>
            Vista 3D · Arrastrar para rotar
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.1 }}>
            ALLCLOSING360 HQ
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
            {DIRECTORS.length} directores · {totalActive} tarea{totalActive !== 1 ? "s" : ""} activa{totalActive !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setRotation({ x: 30, y: -20 })}
            style={{ fontSize: 10, padding: "5px 10px", borderRadius: 6, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >⊙ Reset vista</button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 6 }}>
            <div className="status-dot-active" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)" }} />
            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>Online</span>
          </div>
        </div>
      </div>

      {/* ── 3D Scene ── */}
      <div
        style={{ flex: 1, overflow: "hidden", cursor: dragging ? "grabbing" : "grab", display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div style={{ perspective: "1200px", perspectiveOrigin: "50% 30%" }}>
          <div style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: "preserve-3d",
            transition: dragging ? "none" : "transform 0.15s ease-out",
            width: totalW,
            height: totalH,
            position: "relative",
          }}>

            {/* ── Base floor ── */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at center, #0d0d18 0%, #060608 100%)",
              backgroundImage: "repeating-linear-gradient(0deg, #1a1a2e 0px, #1a1a2e 1px, transparent 1px, transparent " + (CELL/3) + "px), repeating-linear-gradient(90deg, #1a1a2e 0px, #1a1a2e 1px, transparent 1px, transparent " + (CELL/3) + "px)",
              borderRadius: 8,
              boxShadow: "0 20px 80px rgba(0,0,0,0.9)",
              transformStyle: "preserve-3d",
            }}>
              {/* Floor depth */}
              <div style={{ position: "absolute", inset: 0, background: "#030305", transform: "translateZ(-12px)", borderRadius: 8 }} />
              {/* Floor side edges */}
              <div style={{ position: "absolute", width: totalW, height: 12, bottom: -12, left: 0, background: "#0a0a12", transformOrigin: "top", transform: "rotateX(-90deg)", borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
            </div>

            {/* ── Rooms ── */}
            {ROOMS.map((room) => {
              const x = room.col * CELL;
              const y = room.row * CELL;
              const w = room.cols * CELL - 6;
              const h = room.rows * CELL - 6;
              const isActive = getRoomActive(room);
              const isHov = hovered === room.id;

              return (
                <div
                  key={room.id}
                  onMouseEnter={() => setHovered(room.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: "absolute",
                    left: x + 3,
                    top: y + 3,
                    width: w,
                    height: h,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Floor tile */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: isActive
                      ? `radial-gradient(ellipse at center, ${room.color}18 0%, ${room.floorColor} 100%)`
                      : room.floorColor,
                    border: "1.5px solid " + (isActive ? room.color + "60" : room.color + "28"),
                    borderRadius: 8,
                    boxShadow: isActive ? `inset 0 0 30px ${room.color}15, 0 0 20px ${room.color}20` : "none",
                    transition: "all 0.4s ease",
                  }} />

                  {/* 3D walls */}
                  {/* Left wall */}
                  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 28, background: "linear-gradient(180deg, " + room.color + "20 0%, transparent 100%)", transformOrigin: "top", transform: "rotateX(-90deg)", borderRadius: "8px 8px 0 0" }} />
                  {/* Right wall */}
                  <div style={{ position: "absolute", right: 0, top: 0, width: 8, height: h, background: room.color + "15", transformOrigin: "left center", transform: "rotateY(90deg) translateZ(4px)", borderRadius: "0 8px 8px 0" }} />

                  {/* Room label */}
                  <div style={{
                    position: "absolute",
                    top: 6,
                    left: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    zIndex: 5,
                  }}>
                    <span style={{ fontSize: 12 }}>{room.emoji}</span>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: room.color + "cc",
                    }}>
                      {room.label}
                    </span>
                    {isActive && (
                      <div className="status-dot-active" style={{ width: 5, height: 5, borderRadius: "50%", background: room.color }} />
                    )}
                  </div>

                  {/* Glow line at bottom */}
                  {isActive && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, " + room.color + "80, transparent)", borderRadius: "0 0 8px 8px" }} />
                  )}

                  {/* Active particles */}
                  {isActive && <RoomParticles color={room.color} />}

                  {/* Decorative: Terraza */}
                  {room.id === "terraza" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "24px 8px", paddingTop: 28 }}>
                      <div style={{ fontSize: 24 }}>🌿</div>
                      <div style={{ fontSize: 18, display: "flex", gap: 6 }}>🪴🌱</div>
                      <div style={{ fontSize: 8, color: "#14b8a660" }}>Zona zen</div>
                    </div>
                  )}

                  {/* Directors */}
                  {room.directors.length > 0 && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      paddingTop: 26,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                      justifyContent: room.directors.length === 1 ? "center" : "space-around",
                      padding: "28px 10px 6px",
                      gap: 4,
                    }}>
                      {room.directors.map((dirId) => {
                        const d = DIRECTOR_MAP[dirId as keyof typeof DIRECTOR_MAP];
                        if (!d) return null;
                        const dirTasks = tasks.filter((t) => t.engineId === dirId);
                        const completedTask = dirTasks.slice().reverse().find((t) => t.status === "completed");
                        const scaleFactor = room.directors.length > 2 ? 0.7 : room.directors.length === 2 ? 0.85 : 1;

                        return (
                          <div key={dirId} data-char="1" style={{ position: "relative", zIndex: 5 }}>
                            <MinecraftCharacter
                              director={d}
                              tasks={dirTasks}
                              isSelected={activeDirectorId === dirId}
                              scale={scaleFactor}
                              onClick={() => {
                                onDirectorSelect(dirId as EngineId);
                                if (completedTask && onViewResult) onViewResult(completedTask);
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

            {/* ── Corridor lights ── */}
            {[CELL, CELL * 2, CELL * 3, CELL * 4].map((x) => (
              <div key={x} style={{
                position: "absolute",
                left: x - 1,
                top: 0,
                width: 2,
                height: "100%",
                background: "linear-gradient(180deg, transparent, rgba(79,126,255,0.08), rgba(79,126,255,0.12), rgba(79,126,255,0.08), transparent)",
                pointerEvents: "none",
              }} />
            ))}
            {[CELL * 2, CELL * 4].map((y) => (
              <div key={y} style={{
                position: "absolute",
                left: 0,
                top: y - 1,
                width: "100%",
                height: 2,
                background: "linear-gradient(90deg, transparent, rgba(79,126,255,0.08), rgba(79,126,255,0.12), rgba(79,126,255,0.08), transparent)",
                pointerEvents: "none",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {[
          { icon: "🟢", label: "Trabajando" },
          { icon: "⬜", label: "Idle" },
          { icon: "✅", label: "Completado" },
          { icon: "🔴", label: "Error" },
        ].map(({ icon, label }) => (
          <div key={label} style={{ fontSize: 9, color: "var(--color-text-dim)", display: "flex", alignItems: "center", gap: 4, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 5, padding: "2px 8px" }}>
            {icon} {label}
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 9, color: "var(--color-text-dim)", alignSelf: "center" }}>
          🖱️ Arrastra para girar · Click personaje para seleccionar
        </div>
      </div>
    </div>
  );
}
