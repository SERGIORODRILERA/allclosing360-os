"use client";

import type { DirectorConfig } from "../lib/engines";
import type { UITask } from "./TasksPanel";

// ─── CSS keyframe animations injected once ────────────────────────────────────
const STYLE = `
@keyframes mc-idle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
@keyframes mc-work-arm-l { 0%,100%{transform:rotateX(0deg)} 50%{transform:rotateX(-55deg)} }
@keyframes mc-work-arm-r { 0%,100%{transform:rotateX(-55deg)} 50%{transform:rotateX(0deg)} }
@keyframes mc-think { 0%,100%{transform:rotateY(0deg)} 50%{transform:rotateY(20deg)} }
@keyframes mc-nod { 0%,100%{transform:rotateX(0deg)} 50%{transform:rotateX(-10deg)} }
@keyframes mc-bounce { 0%,100%{transform:translateY(0) rotateY(0deg)} 25%{transform:translateY(-4px) rotateY(-5deg)} 75%{transform:translateY(-2px) rotateY(5deg)} }
@keyframes mc-screen-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
@keyframes mc-blink { 0%,90%,100%{transform:scaleY(1)} 95%{transform:scaleY(0.1)} }
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected || typeof document === "undefined") return;
  styleInjected = true;
  const el = document.createElement("style");
  el.textContent = STYLE;
  document.head.appendChild(el);
}

// ─── Cube face helper ─────────────────────────────────────────────────────────
function Face({ sz, color, rotate, tx = 0, ty = 0, tz = 0, opacity = 1 }: {
  sz: [number, number]; color: string;
  rotate?: string; tx?: number; ty?: number; tz?: number; opacity?: number;
}) {
  return (
    <div style={{
      position: "absolute",
      left: 0, top: 0,
      width: sz[0], height: sz[1],
      background: color,
      opacity,
      transform: [rotate, tx || ty || tz ? `translate3d(${tx}px,${ty}px,${tz}px)` : ""].filter(Boolean).join(" "),
      backfaceVisibility: "hidden",
      imageRendering: "pixelated",
    }} />
  );
}

// ─── VoxelBox — a rectangular 3D box using CSS preserve-3d ───────────────────
function VoxelBox({ w, h, d, top, front, side, style, children }: {
  w: number; h: number; d: number;
  top: string; front: string; side: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ width: w, height: h, position: "absolute", transformStyle: "preserve-3d", ...style }}>
      {/* Front */}
      <div style={{ position: "absolute", width: w, height: h, background: front, transform: `translateZ(${d / 2}px)`, backfaceVisibility: "hidden" }} />
      {/* Back */}
      <div style={{ position: "absolute", width: w, height: h, background: front, transform: `rotateY(180deg) translateZ(${d / 2}px)`, backfaceVisibility: "hidden" }} />
      {/* Right */}
      <div style={{ position: "absolute", width: d, height: h, left: w, background: side, transformOrigin: "left center", transform: "rotateY(90deg)", backfaceVisibility: "hidden" }} />
      {/* Left */}
      <div style={{ position: "absolute", width: d, height: h, left: -d, background: side, transformOrigin: "right center", transform: "rotateY(-90deg)", backfaceVisibility: "hidden" }} />
      {/* Top */}
      <div style={{ position: "absolute", width: w, height: d, top: -d, background: top, transformOrigin: "bottom center", transform: "rotateX(-90deg)", backfaceVisibility: "hidden" }} />
      {/* Bottom */}
      <div style={{ position: "absolute", width: w, height: d, top: h, background: "#060608", transformOrigin: "top center", transform: "rotateX(90deg)", backfaceVisibility: "hidden" }} />
      {children}
    </div>
  );
}

// ─── Pixel face helper for character texture ──────────────────────────────────
function shade(hex: string, amount: number): string {
  const c = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((c >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((c >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (c & 0xff) + amount));
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ─── State detector ───────────────────────────────────────────────────────────
type McState = "idle" | "working" | "thinking" | "completed" | "error";

function getState(tasks: UITask[], directorId: string): McState {
  const working = tasks.find((t) => t.engineId === directorId && t.status === "in_progress");
  if (working) return "working";
  const recent = tasks.slice().reverse().find((t) => t.engineId === directorId);
  if (!recent) return "idle";
  if (recent.status === "completed") return "completed";
  if (recent.status === "failed") return "error";
  return "idle";
}

// ─── MinecraftCharacter ────────────────────────────────────────────────────────
export default function MinecraftCharacter({
  director, tasks, isSelected, onClick, scale = 1,
}: {
  director: DirectorConfig;
  tasks: UITask[];
  isSelected: boolean;
  onClick: () => void;
  scale?: number;
}) {
  if (typeof window !== "undefined") injectStyle();

  const state = getState(tasks.filter((t) => t.engineId === director.id), director.id);
  const col = director.color;
  const skinTop   = "#f0c8a0";
  const skinFront = "#e8b88a";
  const skinSide  = "#d4a070";
  const clothTop  = shade(col, 20);
  const clothFront = col;
  const clothSide  = shade(col, -30);
  const pantFront = "#2a2a5a";
  const pantSide  = "#1a1a3a";
  const pantTop   = "#3a3a7a";
  const activeTask = tasks.find((t) => t.engineId === director.id && t.status === "in_progress");

  const bodyAnim = state === "idle" ? "mc-idle 2.4s ease-in-out infinite" : state === "completed" ? "mc-bounce 0.6s ease-in-out 2" : undefined;

  return (
    <div
      onClick={onClick}
      title={director.humanName + " · " + director.name}
      style={{
        position: "relative",
        cursor: "pointer",
        transformStyle: "preserve-3d",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ── Status bubble ─── */}
      {(state === "working" || state === "completed" || state === "thinking") && (
        <div style={{
          position: "absolute",
          top: -28 * scale,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontSize: 9 * scale,
          fontWeight: 700,
          padding: `${2 * scale}px ${8 * scale}px`,
          borderRadius: 8 * scale,
          background: state === "completed" ? "rgba(34,217,122,0.15)" : col + "20",
          border: "1px solid " + (state === "completed" ? "rgba(34,217,122,0.4)" : col + "60"),
          color: state === "completed" ? "#22c55e" : col,
          zIndex: 20,
          pointerEvents: "none",
        }}>
          {state === "completed" ? "✅ Ver resultado" :
           state === "thinking" ? "💭 …" :
           (activeTask?.currentStep?.slice(0, 20) ?? "Trabajando…")}
        </div>
      )}

      {/* ── 3D Character ─── */}
      <div style={{
        transformStyle: "preserve-3d",
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
        position: "relative",
        width: 40,
        height: 100,
        animation: bodyAnim,
        filter: isSelected ? "drop-shadow(0 0 6px " + col + ")" : state === "working" ? "drop-shadow(0 0 3px " + col + "88)" : "none",
      }}>
        {/* ──── HEAD ──── */}
        <div style={{
          position: "absolute", left: 8, top: 0,
          transformStyle: "preserve-3d",
          animation: state === "working" ? "mc-nod 0.8s ease-in-out infinite" : state === "thinking" ? "mc-think 1.5s ease-in-out infinite" : "mc-blink 4s ease-in-out infinite",
          transformOrigin: "center bottom",
        }}>
          <VoxelBox w={24} h={24} d={24} top={skinTop} front={skinFront} side={skinSide}>
            {/* Eyes */}
            <div style={{ position: "absolute", width: 6, height: 5, background: "#1a0a00", left: 3, top: 9, zIndex: 5, transform: "translateZ(13px)" }} />
            <div style={{ position: "absolute", width: 6, height: 5, background: "#1a0a00", left: 15, top: 9, zIndex: 5, transform: "translateZ(13px)" }} />
            {/* Mouth */}
            <div style={{ position: "absolute", width: 12, height: 3, background: "#8b4513", left: 6, top: 17, zIndex: 5, transform: "translateZ(13px)", borderRadius: 1 }} />
            {/* Director icon as hat */}
            <div style={{ position: "absolute", left: 0, top: -14, width: 24, height: 14, background: col, transform: "translateZ(12px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, borderRadius: "3px 3px 0 0" }}>
              {director.icon}
            </div>
          </VoxelBox>
        </div>

        {/* ──── BODY ──── */}
        <div style={{ position: "absolute", left: 4, top: 26, transformStyle: "preserve-3d" }}>
          <VoxelBox w={32} h={28} d={16} top={clothTop} front={clothFront} side={clothSide} />
        </div>

        {/* ──── LEFT ARM ──── */}
        <div style={{
          position: "absolute", left: -6, top: 27,
          transformStyle: "preserve-3d",
          transformOrigin: "center top",
          animation: state === "working" ? "mc-work-arm-l 0.45s ease-in-out infinite" : undefined,
        }}>
          <VoxelBox w={10} h={28} d={10} top={skinTop} front={skinFront} side={skinSide} />
        </div>

        {/* ──── RIGHT ARM ──── */}
        <div style={{
          position: "absolute", left: 36, top: 27,
          transformStyle: "preserve-3d",
          transformOrigin: "center top",
          animation: state === "working" ? "mc-work-arm-r 0.45s ease-in-out infinite" : undefined,
        }}>
          <VoxelBox w={10} h={28} d={10} top={skinTop} front={skinFront} side={skinSide} />
        </div>

        {/* ──── LEFT LEG ──── */}
        <div style={{ position: "absolute", left: 5, top: 54, transformStyle: "preserve-3d" }}>
          <VoxelBox w={13} h={32} d={13} top={pantTop} front={pantFront} side={pantSide} />
        </div>

        {/* ──── RIGHT LEG ──── */}
        <div style={{ position: "absolute", left: 22, top: 54, transformStyle: "preserve-3d" }}>
          <VoxelBox w={13} h={32} d={13} top={pantTop} front={pantFront} side={pantSide} />
        </div>
      </div>

      {/* ── Laptop / desk item ─── */}
      {state !== "idle" && (
        <div style={{
          marginTop: 4,
          width: 36 * scale,
          height: 4 * scale,
          background: "#1a1a2e",
          border: "1px solid " + col + "50",
          borderRadius: 2,
          boxShadow: state === "working" ? "0 0 8px " + col + "60" : "none",
          animation: state === "working" ? "mc-screen-pulse 0.8s ease-in-out infinite" : undefined,
          fontSize: 7 * scale,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: col,
          fontWeight: 700,
          overflow: "hidden",
        }}>
          {state === "completed" && <span style={{ color: "#22c55e" }}>✓</span>}
        </div>
      )}

      {/* Name */}
      <div style={{
        fontSize: 8 * scale, fontWeight: 700,
        color: state === "working" ? col : "var(--color-text-muted)",
        marginTop: 2 * scale, textAlign: "center",
        maxWidth: 60 * scale, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {director.humanName}
      </div>
      <div style={{ fontSize: 7 * scale, color: "var(--color-text-dim)", textAlign: "center", maxWidth: 60 * scale, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {director.shortName}
      </div>

      {/* Selection shadow */}
      {isSelected && (
        <div style={{
          position: "absolute",
          bottom: 30 * scale,
          width: 50 * scale,
          height: 8 * scale,
          borderRadius: "50%",
          background: col + "50",
          boxShadow: "0 0 10px " + col,
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}
