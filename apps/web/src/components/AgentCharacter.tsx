"use client";

import { type DirectorConfig as Director } from "../lib/engines";
import type { UITask } from "./TasksPanel";

type AgentState = "idle" | "working" | "thinking" | "completed" | "error" | "waiting";

interface AgentCharacterProps {
  director: Director;
  tasks: UITask[];
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
  compact?: boolean;
}

function getAgentState(tasks: UITask[]): AgentState {
  const active = tasks.find((t) => t.status === "in_progress");
  if (active) return "working";
  const last = tasks.slice().reverse().find((t) => t.engineId !== undefined);
  if (!last) return "idle";
  if (last.status === "completed") return "completed";
  if (last.status === "failed") return "error";
  return "idle";
}

export default function AgentCharacter({
  director, tasks, isSelected, onClick, style, compact = false,
}: AgentCharacterProps) {
  const state = getAgentState(tasks.filter((t) => t.engineId === director.id));
  const col = director.color;
  const size = compact ? 70 : 100;
  const activeTask = tasks.find((t) => t.engineId === director.id && t.status === "in_progress");
  const completedTask = tasks.slice().reverse().find((t) => t.engineId === director.id && t.status === "completed");

  return (
    <div
      onClick={onClick}
      title={director.humanName + " — " + director.name}
      style={{
        position: "relative",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...style,
      }}
    >
      {/* Status bubble above character */}
      {state === "working" && (
        <div style={{
          position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
          background: col + "20", border: "1px solid " + col + "60",
          borderRadius: 10, padding: "2px 8px",
          fontSize: 9, fontWeight: 600, color: col, whiteSpace: "nowrap",
          animation: "msg-fade-in 0.3s ease-out",
          zIndex: 10,
        }}>
          <span className="status-dot-active" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: col, marginRight: 4, verticalAlign: "middle" }} />
          {activeTask?.currentStep?.slice(0, 22) ?? "Trabajando…"}
        </div>
      )}
      {state === "completed" && (
        <div style={{
          position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
          background: "rgba(34,217,122,0.15)", border: "1px solid rgba(34,217,122,0.4)",
          borderRadius: 10, padding: "2px 8px",
          fontSize: 9, fontWeight: 700, color: "#22c55e", whiteSpace: "nowrap",
          zIndex: 10,
        }}>
          ✅ Ver resultado
        </div>
      )}
      {state === "thinking" && (
        <div style={{
          position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
          background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
          borderRadius: 10, padding: "2px 8px", display: "flex", gap: 3, alignItems: "center",
          zIndex: 10,
        }}>
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      )}

      {/* SVG Character */}
      <svg
        width={size}
        height={size * 1.4}
        viewBox="0 0 100 140"
        style={{
          filter: isSelected ? "drop-shadow(0 0 8px " + col + ")" : state === "working" ? "drop-shadow(0 0 5px " + col + "80)" : "none",
          animation: state === "idle" ? "pod-person-breathe 3s ease-in-out infinite" : undefined,
        }}
      >
        {/* ── Desk ── */}
        <rect x="10" y="98" width="80" height="8" rx="2" fill={col + "30"} stroke={col + "50"} strokeWidth="1"/>
        <rect x="20" y="106" width="5" height="20" rx="1" fill={col + "40"}/>
        <rect x="75" y="106" width="5" height="20" rx="1" fill={col + "40"}/>

        {/* ── Laptop/screen ── */}
        <rect x="30" y="82" width="40" height="26" rx="2" fill="#1a1a2e" stroke={col + "60"} strokeWidth="1"/>
        {/* Screen content — animated when working */}
        {state === "working" ? (
          <>
            <rect x="33" y="85" width="20" height="2" rx="1" fill={col + "80"}>
              <animate attributeName="width" values="8;24;16;24" dur="1.2s" repeatCount="indefinite"/>
            </rect>
            <rect x="33" y="89" width="28" height="2" rx="1" fill={col + "50"}/>
            <rect x="33" y="93" width="16" height="2" rx="1" fill={col + "40"}>
              <animate attributeName="width" values="16;26;12;26" dur="0.9s" repeatCount="indefinite"/>
            </rect>
            <rect x="33" y="97" width="22" height="2" rx="1" fill={col + "30"}/>
            {/* Screen glow */}
            <rect x="30" y="82" width="40" height="26" rx="2" fill={col + "08"}>
              <animate attributeName="fillOpacity" values="0.05;0.15;0.05" dur="2s" repeatCount="indefinite"/>
            </rect>
          </>
        ) : state === "completed" ? (
          <>
            <text x="50" y="98" textAnchor="middle" fontSize="14" fill="#22c55e">✓</text>
          </>
        ) : (
          <>
            <rect x="33" y="87" width="28" height="2" rx="1" fill={col + "40"}/>
            <rect x="33" y="91" width="20" height="2" rx="1" fill={col + "30"}/>
            <rect x="33" y="95" width="24" height="2" rx="1" fill={col + "25"}/>
          </>
        )}

        {/* ── Chair ── */}
        <rect x="28" y="118" width="44" height="6" rx="3" fill={col + "35"} stroke={col + "50"} strokeWidth="1"/>
        <rect x="46" y="124" width="8" height="12" rx="2" fill={col + "30"}/>
        <rect x="34" y="133" width="32" height="4" rx="2" fill={col + "25"}/>

        {/* ── Body ── */}
        <rect
          x="35" y="60" width="30" height="26" rx="8"
          fill={col + "25"} stroke={col + "50"} strokeWidth="1.5"
        >
          {state === "working" && (
            <animate attributeName="y" values="60;59;60" dur="0.6s" repeatCount="indefinite"/>
          )}
        </rect>
        {/* Shirt accent */}
        <rect x="41" y="68" width="18" height="3" rx="1" fill={col + "50"}/>

        {/* ── Arms ── */}
        {state === "working" ? (
          <>
            {/* Left arm typing */}
            <line x1="37" y1="70" x2="30" y2="86" stroke={col + "60"} strokeWidth="4" strokeLinecap="round">
              <animate attributeName="x2" values="30;32;28;32" dur="0.5s" repeatCount="indefinite"/>
              <animate attributeName="y2" values="86;84;86;84" dur="0.5s" repeatCount="indefinite"/>
            </line>
            {/* Right arm typing */}
            <line x1="63" y1="70" x2="70" y2="86" stroke={col + "60"} strokeWidth="4" strokeLinecap="round">
              <animate attributeName="x2" values="70;68;72;68" dur="0.5s" repeatCount="indefinite" begin="0.25s"/>
              <animate attributeName="y2" values="86;84;86;84" dur="0.5s" repeatCount="indefinite" begin="0.25s"/>
            </line>
          </>
        ) : (
          <>
            <line x1="37" y1="70" x2="30" y2="84" stroke={col + "50"} strokeWidth="4" strokeLinecap="round"/>
            <line x1="63" y1="70" x2="70" y2="84" stroke={col + "50"} strokeWidth="4" strokeLinecap="round"/>
          </>
        )}

        {/* ── Head ── */}
        <ellipse
          cx="50" cy="46" rx="16" ry="17"
          fill={col + "20"} stroke={col + "70"} strokeWidth="1.5"
        >
          {state === "idle" && (
            <animate attributeName="ry" values="17;16.5;17" dur="3s" repeatCount="indefinite"/>
          )}
          {state === "working" && (
            <animate attributeName="cy" values="46;45;46" dur="0.6s" repeatCount="indefinite"/>
          )}
        </ellipse>

        {/* Face */}
        <circle cx="44" cy="44" r="2" fill={col + "80"}/>
        <circle cx="56" cy="44" r="2" fill={col + "80"}/>
        {/* Mouth */}
        {state === "completed" ? (
          <path d="M44 52 Q50 57 56 52" stroke={col} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        ) : state === "error" ? (
          <path d="M44 54 Q50 50 56 54" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        ) : (
          <line x1="45" y1="52" x2="55" y2="52" stroke={col + "60"} strokeWidth="1.5" strokeLinecap="round"/>
        )}

        {/* Hair / icon on head */}
        <text x="50" y="36" textAnchor="middle" fontSize="11" style={{ userSelect: "none" }}>
          {director.icon}
        </text>

        {/* Progress bar (floating above desk when working) */}
        {state === "working" && activeTask && (
          <g>
            <rect x="20" y="74" width="60" height="4" rx="2" fill="#1a1a2e" opacity="0.6"/>
            <rect x="20" y="74" width={60 * activeTask.progress / 100} height="4" rx="2" fill={col + "cc"}/>
          </g>
        )}

        {/* Selected ring */}
        {isSelected && (
          <ellipse cx="50" cy="137" rx="32" ry="4" fill={col + "30"} stroke={col + "60"} strokeWidth="1"/>
        )}
      </svg>

      {/* Name label */}
      <div style={{
        fontSize: compact ? 8 : 9,
        fontWeight: 600,
        color: state === "working" ? col : "var(--color-text-muted)",
        textAlign: "center",
        marginTop: -4,
        lineHeight: 1.2,
        maxWidth: size + 10,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {director.humanName}
      </div>
      <div style={{
        fontSize: compact ? 7 : 8,
        color: "var(--color-text-dim)",
        textAlign: "center",
        maxWidth: size + 10,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {director.shortName}
      </div>
    </div>
  );
}

export type { AgentState };
