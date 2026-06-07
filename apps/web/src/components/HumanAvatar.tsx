"use client";

import type { DirectorConfig } from "../lib/engines";
import type { UITask } from "./TasksPanel";

// ─── CSS keyframes ───────────────────────────────────────────────────────────
const STYLE = `
@keyframes sim-idle-body {
  0%,100% { transform: translateY(0) }
  50%     { transform: translateY(-2px) }
}
@keyframes sim-bounce {
  0%,100% { transform: translateY(0) }
  20%     { transform: translateY(-8px) rotate(-3deg) }
  40%     { transform: translateY(-4px) rotate(3deg) }
  60%     { transform: translateY(-6px) rotate(-2deg) }
  80%     { transform: translateY(-2px) rotate(1deg) }
}
@keyframes sim-walk-leg-l {
  0%,100% { transform: rotateX(-22deg) }
  50%     { transform: rotateX(22deg) }
}
@keyframes sim-walk-leg-r {
  0%,100% { transform: rotateX(22deg) }
  50%     { transform: rotateX(-22deg) }
}
@keyframes sim-walk-arm-l {
  0%,100% { transform: rotate(-12deg) }
  50%     { transform: rotate(12deg) }
}
@keyframes sim-walk-arm-r {
  0%,100% { transform: rotate(12deg) }
  50%     { transform: rotate(-12deg) }
}
@keyframes sim-type-arm-l {
  0%,100% { transform: rotate(-30deg) translateY(0px) }
  50%     { transform: rotate(-20deg) translateY(3px) }
}
@keyframes sim-type-arm-r {
  0%,100% { transform: rotate(30deg) translateY(3px) }
  50%     { transform: rotate(20deg) translateY(0px) }
}
@keyframes sim-blink {
  0%,90%,100% { transform: scaleY(1) }
  95%         { transform: scaleY(0.1) }
}
@keyframes sim-plumbob-spin {
  0%   { transform: translateX(-50%) translateY(0px) rotate(0deg); }
  25%  { transform: translateX(-50%) translateY(-3px) rotate(45deg); }
  50%  { transform: translateX(-50%) translateY(-5px) rotate(180deg); }
  75%  { transform: translateX(-50%) translateY(-3px) rotate(225deg); }
  100% { transform: translateX(-50%) translateY(0px) rotate(360deg); }
}
@keyframes sim-plumbob-idle {
  0%,100% { transform: translateX(-50%) translateY(0px) rotate(0deg); opacity: 0.6; }
  50%     { transform: translateX(-50%) translateY(-3px) rotate(180deg); opacity: 0.8; }
}
@keyframes sim-plumbob-done {
  0%,100% { transform: translateX(-50%) translateY(0px) rotate(0deg); filter: hue-rotate(0deg); }
  50%     { transform: translateX(-50%) translateY(-6px) rotate(360deg); filter: hue-rotate(60deg); }
}
@keyframes sim-shadow-pulse {
  0%,100% { opacity: 0.22; transform: scaleX(1); }
  50%     { opacity: 0.12; transform: scaleX(0.75); }
}
@keyframes sim-status-pop {
  0%   { transform: translateX(-50%) scale(0.8); opacity: 0; }
  60%  { transform: translateX(-50%) scale(1.08); opacity: 1; }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}
@keyframes sim-selection-ring {
  0%,100% { box-shadow: 0 0 8px var(--ring-col), 0 0 0 2px var(--ring-col); }
  50%     { box-shadow: 0 0 16px var(--ring-col), 0 0 0 3px var(--ring-col); }
}
`;

let injected = false;
function injectStyle() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const el = document.createElement("style");
  el.textContent = STYLE;
  document.head.appendChild(el);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hashStr(s: string): number {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
}

const SKIN_TONES  = ["#f5cba7", "#e8a87c", "#c68642", "#8d5524", "#f0d9b5", "#d4a574"];
const HAIR_COLORS = ["#2c1810", "#8b4513", "#d4a017", "#1c1c2e", "#6b4423", "#c0392b"];
const EYE_COLORS  = ["#1a0a00", "#1a3050", "#0a2000", "#3d1a00", "#080808"];

type SimState = "idle" | "working" | "completed" | "error";

function getState(tasks: UITask[], id: string): SimState {
  if (tasks.some(t => t.engineId === id && t.status === "in_progress")) return "working";
  const last = tasks.slice().reverse().find(t => t.engineId === id);
  if (!last) return "idle";
  return last.status === "completed" ? "completed" : last.status === "failed" ? "error" : "idle";
}

// ─── Plumbob (The Sims diamond) ───────────────────────────────────────────────
function Plumbob({ color, state }: { color: string; state: SimState }) {
  const plumbColor = state === "error" ? "#ef4444" : state === "completed" ? "#22d97a" : state === "working" ? color : "#888aaa";
  const anim =
    state === "working"  ? "sim-plumbob-spin 3s linear infinite" :
    state === "completed"? "sim-plumbob-done 1.5s ease-in-out 2" :
    "sim-plumbob-idle 3.5s ease-in-out infinite";

  return (
    <div style={{
      position: "absolute",
      top: -28,
      left: "50%",
      width: 14, height: 14,
      animation: anim,
      transformOrigin: "center center",
      pointerEvents: "none",
      zIndex: 20,
      filter: `drop-shadow(0 0 3px ${plumbColor}80)`,
    }}>
      {/* Top diamond half */}
      <div style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: `11px solid ${plumbColor}`, position: "absolute", top: 0, left: 0 }} />
      {/* Bottom diamond half */}
      <div style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `8px solid ${plumbColor}cc`, position: "absolute", top: 10, left: 0 }} />
    </div>
  );
}

// ─── HumanAvatar ──────────────────────────────────────────────────────────────
export default function HumanAvatar({
  director, tasks, isSelected, onClick, scale = 1,
}: {
  director: DirectorConfig;
  tasks: UITask[];
  isSelected: boolean;
  onClick: () => void;
  scale?: number;
}) {
  if (typeof window !== "undefined") injectStyle();

  const state      = getState(tasks.filter(t => t.engineId === director.id), director.id);
  const col        = director.color;
  const h          = hashStr(director.id);
  const skin       = SKIN_TONES[h % SKIN_TONES.length]!;
  const hair       = HAIR_COLORS[(h >> 3) % HAIR_COLORS.length]!;
  const eye        = EYE_COLORS[(h >> 6) % EYE_COLORS.length]!;
  const activeTask = tasks.find(t => t.engineId === director.id && t.status === "in_progress");

  const S = scale;
  const isWorking   = state === "working";
  const isCompleted = state === "completed";
  const isIdle      = state === "idle";

  // Body animation
  const bodyAnim =
    isCompleted ? `sim-bounce 0.7s ease-in-out 2` :
    isIdle      ? `sim-idle-body 3.2s ease-in-out infinite` :
    undefined;

  // Leg animations
  const legLAnim = isWorking ? "sim-walk-leg-l 0.5s ease-in-out infinite" : undefined;
  const legRAnim = isWorking ? "sim-walk-leg-r 0.5s ease-in-out infinite" : undefined;

  // Arm animations
  const armLAnim = isWorking
    ? "sim-type-arm-l 0.5s ease-in-out infinite"
    : isIdle ? "sim-walk-arm-l 4s ease-in-out infinite" : undefined;
  const armRAnim = isWorking
    ? "sim-type-arm-r 0.5s ease-in-out infinite"
    : isIdle ? "sim-walk-arm-r 4s ease-in-out infinite" : undefined;

  return (
    <div
      onClick={onClick}
      title={`${director.humanName} · ${director.name}`}
      style={{
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 32 * S,
        paddingBottom: 4 * S,
      }}
    >
      {/* ── Plumbob ── */}
      <Plumbob color={col} state={state} />

      {/* ── Status bubble ── */}
      {(isWorking || isCompleted) && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          whiteSpace: "nowrap",
          fontSize: 8 * S,
          fontWeight: 700,
          padding: `${2 * S}px ${8 * S}px`,
          borderRadius: 20 * S,
          background: isCompleted ? "rgba(34,217,122,0.2)" : `${col}22`,
          border: `1px solid ${isCompleted ? "rgba(34,217,122,0.5)" : col + "55"}`,
          color: isCompleted ? "#22d97a" : col,
          boxShadow: `0 2px 10px ${col}20`,
          animation: "sim-status-pop 0.3s ease-out both",
          zIndex: 10,
        }}>
          {isCompleted
            ? "✅ Ver resultado"
            : (activeTask?.currentStep?.slice(0, 20) ?? "Trabajando…")}
        </div>
      )}

      {/* ── Character (preserve-3d wrapper) ── */}
      <div
        style={{
          transformStyle: "preserve-3d",
          animation: bodyAnim,
          transformOrigin: "center bottom",
          filter: isSelected
            ? `drop-shadow(0 0 6px ${col}) drop-shadow(0 0 14px ${col}60)`
            : isWorking
            ? `drop-shadow(0 0 3px ${col}50)`
            : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* ── Hair ── */}
        <div style={{
          width: 22 * S, height: 9 * S,
          background: `linear-gradient(180deg, ${hair} 0%, ${hair}dd 100%)`,
          borderRadius: `${50 * S}% ${50 * S}% ${10 * S}% ${10 * S}%`,
          position: "relative",
          zIndex: 3,
          boxShadow: `0 1px 4px rgba(0,0,0,0.3)`,
        }}>
          {/* Side strands */}
          <div style={{ position: "absolute", left: -4 * S, top: 3 * S, width: 6 * S, height: 14 * S, background: hair, borderRadius: `${2 * S}px 0 ${5 * S}px ${5 * S}px`, zIndex: 2 }} />
          <div style={{ position: "absolute", right: -4 * S, top: 3 * S, width: 6 * S, height: 14 * S, background: hair, borderRadius: `0 ${2 * S}px ${5 * S}px ${5 * S}px`, zIndex: 2 }} />
        </div>

        {/* ── Head ── */}
        <div style={{
          width: 22 * S, height: 24 * S,
          background: `radial-gradient(ellipse at 40% 35%, ${skin}ff 0%, ${skin}e0 100%)`,
          borderRadius: `${4 * S}px ${4 * S}px ${10 * S}px ${10 * S}px`,
          position: "relative",
          boxShadow: `inset -3px -3px 6px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.3)`,
          zIndex: 2,
          marginTop: -2 * S,
        }}>
          {/* Left eye */}
          <div style={{
            position: "absolute", top: 8 * S, left: 4 * S,
            width: 5 * S, height: 5 * S,
            background: "#fff",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "sim-blink 4.5s ease-in-out infinite",
          }}>
            <div style={{ width: 3 * S, height: 3 * S, background: eye, borderRadius: "50%" }} />
          </div>
          {/* Right eye */}
          <div style={{
            position: "absolute", top: 8 * S, right: 4 * S,
            width: 5 * S, height: 5 * S,
            background: "#fff",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "sim-blink 4.5s ease-in-out 0.3s infinite",
          }}>
            <div style={{ width: 3 * S, height: 3 * S, background: eye, borderRadius: "50%" }} />
          </div>
          {/* Nose */}
          <div style={{ position: "absolute", top: 14 * S, left: "50%", transform: "translateX(-50%)", width: 2 * S, height: 3 * S, background: `${skin}80`, borderRadius: "50%" }} />
          {/* Mouth */}
          <div style={{
            position: "absolute", bottom: 4 * S, left: "50%",
            transform: "translateX(-50%)",
            width: 10 * S, height: 4 * S,
            borderBottom: `${1.5 * S}px solid ${isCompleted || isWorking ? "#8b3a00" : "#9a4a1a"}`,
            borderRadius: `0 0 ${6 * S}px ${6 * S}px`,
            opacity: isCompleted ? 1 : 0.7,
          }} />
          {/* Role badge / icon on forehead */}
          <div style={{
            position: "absolute",
            top: 1 * S, left: "50%",
            transform: "translateX(-50%)",
            fontSize: 8 * S,
            lineHeight: 1,
            filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))",
          }}>
            {director.icon}
          </div>
        </div>

        {/* ── Torso + Arms ── */}
        <div style={{ position: "relative", width: 34 * S, height: 26 * S, marginTop: 1 * S }}>
          {/* Left arm */}
          <div style={{
            position: "absolute", left: 0, top: 2 * S,
            width: 8 * S, height: 20 * S,
            background: `linear-gradient(180deg, ${col}ff 0%, ${col}cc 100%)`,
            borderRadius: `${4 * S}px`,
            transformOrigin: "center top",
            animation: armLAnim,
            boxShadow: `inset -2px -2px 4px rgba(0,0,0,0.2)`,
          }}>
            {/* Hand */}
            <div style={{ position: "absolute", bottom: -2 * S, left: 1 * S, width: 6 * S, height: 5 * S, background: skin, borderRadius: `${3 * S}px` }} />
          </div>

          {/* Body */}
          <div style={{
            position: "absolute", left: 9 * S, top: 0,
            width: 16 * S, height: 26 * S,
            background: `linear-gradient(180deg, ${col}ff 0%, ${col}ee 60%, ${col}cc 100%)`,
            borderRadius: `${3 * S}px ${3 * S}px ${5 * S}px ${5 * S}px`,
            boxShadow: `inset -3px -3px 8px rgba(0,0,0,0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Collar */}
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 8 * S, height: 6 * S, background: "rgba(255,255,255,0.12)", borderRadius: `0 0 ${4 * S}px ${4 * S}px` }} />
          </div>

          {/* Right arm */}
          <div style={{
            position: "absolute", right: 0, top: 2 * S,
            width: 8 * S, height: 20 * S,
            background: `linear-gradient(180deg, ${col}ff 0%, ${col}cc 100%)`,
            borderRadius: `${4 * S}px`,
            transformOrigin: "center top",
            animation: armRAnim,
            boxShadow: `inset 2px -2px 4px rgba(0,0,0,0.2)`,
          }}>
            {/* Hand */}
            <div style={{ position: "absolute", bottom: -2 * S, right: 1 * S, width: 6 * S, height: 5 * S, background: skin, borderRadius: `${3 * S}px` }} />
          </div>
        </div>

        {/* ── Legs ── */}
        <div style={{ display: "flex", gap: 3 * S, marginTop: 1 * S }}>
          {/* Left leg */}
          <div style={{
            width: 9 * S, height: 22 * S,
            transformOrigin: "center top",
            animation: legLAnim,
            position: "relative",
          }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #2a2a5a 0%, #1a1a40 100%)", borderRadius: `${3 * S}px ${3 * S}px ${4 * S}px ${4 * S}px`, boxShadow: "inset -1px -2px 4px rgba(0,0,0,0.3)" }} />
            {/* Shoe */}
            <div style={{ position: "absolute", bottom: 0, left: -1 * S, width: 11 * S, height: 4 * S, background: "#111", borderRadius: `${2 * S}px`, boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }} />
          </div>
          {/* Right leg */}
          <div style={{
            width: 9 * S, height: 22 * S,
            transformOrigin: "center top",
            animation: legRAnim,
            position: "relative",
          }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #2a2a5a 0%, #1a1a40 100%)", borderRadius: `${3 * S}px ${3 * S}px ${4 * S}px ${4 * S}px`, boxShadow: "inset 1px -2px 4px rgba(0,0,0,0.3)" }} />
            {/* Shoe */}
            <div style={{ position: "absolute", bottom: 0, left: -1 * S, width: 11 * S, height: 4 * S, background: "#111", borderRadius: `${2 * S}px`, boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }} />
          </div>
        </div>
      </div>

      {/* ── Floor shadow ── */}
      <div style={{
        width: 28 * S, height: 5 * S,
        background: "rgba(0,0,0,0.3)",
        borderRadius: "50%",
        filter: "blur(3px)",
        marginTop: 2 * S,
        animation: isIdle ? "sim-shadow-pulse 3.2s ease-in-out infinite" : undefined,
      }} />

      {/* ── Name label ── */}
      <div style={{
        fontSize: 8 * S, fontWeight: 700,
        color: isWorking ? col : isCompleted ? "#22d97a" : "var(--color-text-muted)",
        marginTop: 2 * S, textAlign: "center",
        maxWidth: 70 * S, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        textShadow: isWorking ? `0 0 8px ${col}80` : "none",
      }}>
        {director.humanName}
      </div>
      <div style={{
        fontSize: 7 * S, color: "var(--color-text-dim)",
        textAlign: "center", maxWidth: 70 * S,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {director.shortName}
      </div>

      {/* ── Selection ring on floor ── */}
      {isSelected && (
        <div style={{
          position: "absolute",
          bottom: 14 * S,
          width: 42 * S, height: 8 * S,
          borderRadius: "50%",
          border: `2px solid ${col}`,
          // @ts-ignore
          "--ring-col": col,
          animation: "sim-selection-ring 1.5s ease-in-out infinite",
          pointerEvents: "none",
        } as React.CSSProperties} />
      )}
    </div>
  );
}
