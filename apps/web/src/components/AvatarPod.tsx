"use client";

import type { DirectorConfig } from "../lib/engines";

export type AgentState = "idle" | "thinking" | "working" | "completed" | "error";

interface AvatarPodProps {
  director: DirectorConfig;
  activeTasks: number;
  completedTasks: number;
  isSelected: boolean;
  isCEO?: boolean;
  onClick: () => void;
}

function AgentSVG({
  color,
  initials,
  state,
}: {
  color: string;
  initials: string;
  state: AgentState;
}) {
  const isWorking = state === "working";
  const isThinking = state === "thinking";
  const isCompleted = state === "completed";
  const isError = state === "error";

  const screenColor = isWorking ? color : "#0a0a14";
  const screenBorder = isWorking ? color : "#252535";
  const screenGlow = isWorking
    ? `0 0 8px ${color}60, 0 0 2px ${color}`
    : "none";

  return (
    <svg
      viewBox="0 0 80 110"
      width="80"
      height="110"
      style={{ display: "block", overflow: "visible" }}
    >
      {/* ── desk body ── */}
      <rect x="6" y="78" width="68" height="20" rx="3" fill="#10101a" stroke="#1e1e2e" strokeWidth="1" />

      {/* ── desk surface ── */}
      <rect
        x="4"
        y="72"
        width="72"
        height="7"
        rx="3"
        fill={isWorking ? "#14142a" : "#0f0f1a"}
        stroke={isWorking ? color + "40" : "#1c1c2e"}
        strokeWidth="1"
        style={{ filter: isWorking ? `drop-shadow(0 0 6px ${color}30)` : "none" }}
      />

      {/* ── laptop base ── */}
      <rect x="20" y="60" width="40" height="13" rx="2" fill="#1a1a2a" stroke="#252535" strokeWidth="1" />

      {/* ── laptop hinge ── */}
      <rect x="18" y="57" width="44" height="4" rx="2" fill="#141420" />

      {/* ── laptop screen ── */}
      <rect
        x="16"
        y="34"
        width="48"
        height="26"
        rx="3"
        fill={screenColor}
        stroke={screenBorder}
        strokeWidth={isWorking ? 1.5 : 1}
        style={{ filter: isWorking ? `drop-shadow(${screenGlow})` : "none" }}
      />

      {/* screen content when working */}
      {isWorking && (
        <>
          <rect x="20" y="38" width="18" height="2.5" rx="1" fill={color} opacity="0.8" />
          <rect x="20" y="43" width="36" height="1.5" rx="0.5" fill="white" opacity="0.25" />
          <rect x="20" y="46.5" width="30" height="1.5" rx="0.5" fill="white" opacity="0.2" />
          <rect x="20" y="50" width="20" height="1.5" rx="0.5" fill="white" opacity="0.15" />
          <rect x="40" y="50" width="12" height="1.5" rx="0.5" fill={color} opacity="0.5" />
          {/* cursor blink */}
          <rect x="20" y="55" width="8" height="2" rx="0.5" fill={color} opacity="0.9">
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1s" repeatCount="indefinite" />
          </rect>
        </>
      )}

      {/* thinking — dots on screen */}
      {isThinking && (
        <>
          <circle cx="32" cy="47" r="3" fill="#3a3a5a">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0s" repeatCount="indefinite" />
          </circle>
          <circle cx="40" cy="47" r="3" fill="#3a3a5a">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.33s" repeatCount="indefinite" />
          </circle>
          <circle cx="48" cy="47" r="3" fill="#3a3a5a">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.66s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* ── keyboard ── */}
      <rect x="22" y="62" width="36" height="7" rx="1" fill="#0f0f1c" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={24 + i * 7} y="63.5" width="5" height="4" rx="0.5" fill="#1a1a28" />
      ))}

      {/* ── torso ── */}
      <rect
        x="27"
        y="21"
        width="26"
        height="15"
        rx="6"
        fill={`${color}20`}
        stroke={`${color}45`}
        strokeWidth="1.5"
      />

      {/* ── head ── */}
      <circle
        cx="40"
        cy="13"
        r="11"
        fill={`${color}15`}
        stroke={color}
        strokeWidth="2"
        style={
          isWorking
            ? { filter: `drop-shadow(0 0 4px ${color}60)` }
            : undefined
        }
      />

      {/* ── eyes ── */}
      <circle cx="36" cy="11" r="2.2" fill="#1a1a2a" />
      <circle cx="44" cy="11" r="2.2" fill="#1a1a2a" />
      {/* pupils / shine */}
      <circle cx="37" cy="10.3" r="0.9" fill="white" opacity="0.8" />
      <circle cx="45" cy="10.3" r="0.9" fill="white" opacity="0.8" />

      {/* ── eyebrows - thinking ── */}
      {isThinking && (
        <>
          <path d="M33.5 8 Q36 6.5 38.5 8" stroke="#1a1a2a" strokeWidth="1.2" fill="none" />
          <path d="M41.5 8 Q44 6.5 46.5 8" stroke="#1a1a2a" strokeWidth="1.2" fill="none" />
        </>
      )}

      {/* ── mouth ── */}
      {isWorking && (
        <path d="M36 16.5 Q40 18.5 44 16.5" stroke="#1a1a2a" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="d" values="M36 16.5 Q40 18.5 44 16.5;M36 17 Q40 15 44 17;M36 16.5 Q40 18.5 44 16.5" dur="0.5s" repeatCount="indefinite" />
        </path>
      )}
      {isThinking && <path d="M37 16.5 Q40 16.5 43 16.5" stroke="#1a1a2a" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
      {isCompleted && <path d="M35.5 15.5 Q40 19.5 44.5 15.5" stroke="#1a1a2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
      {isError && <path d="M36 18 Q40 15 44 18" stroke="#1a1a2a" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
      {!isWorking && !isThinking && !isCompleted && !isError && (
        <path d="M37 16 Q40 17.5 43 16" stroke="#1a1a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      )}

      {/* ── initials (subtle) ── */}
      <text x="40" y="14" textAnchor="middle" fontSize="7" fontWeight="700" fill={color} opacity="0.25" fontFamily="system-ui">
        {initials}
      </text>

      {/* ── thought bubble (thinking) ── */}
      {isThinking && (
        <>
          <circle cx="53" cy="5" r="1.5" fill="#2a2a3e" stroke="#3a3a50" strokeWidth="0.5" />
          <circle cx="57" cy="2" r="2.5" fill="#2a2a3e" stroke="#3a3a50" strokeWidth="0.5" />
          <circle cx="63" cy="-1" r="4" fill="#2a2a3e" stroke="#3a3a50" strokeWidth="0.5" />
          <text x="63" y="0.5" textAnchor="middle" fontSize="5" fill="#8888aa">?</text>
        </>
      )}

      {/* ── completion badge ── */}
      {isCompleted && (
        <g transform="translate(55, -2)">
          <circle r="7.5" fill={color} />
          <path d="M-3.5 0 L-0.5 3.5 L4.5 -3" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {/* ── error badge ── */}
      {isError && (
        <g transform="translate(55, -2)">
          <circle r="7.5" fill="var(--color-error, #f56565)" />
          <text x="0" y="2.5" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">!</text>
        </g>
      )}

      {/* ── status light ── */}
      <circle cx="40" cy="105" r="3.5" fill={
        isWorking ? color
          : isCompleted ? "#22d97a"
          : isError ? "#f56565"
          : isThinking ? "#fbbf24"
          : "#3a3a5a"
      }>
        {(isWorking || isThinking) && (
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
        )}
      </circle>
    </svg>
  );
}

export default function AvatarPod({
  director,
  activeTasks,
  completedTasks,
  isSelected,
  isCEO,
  onClick,
}: AvatarPodProps) {
  const isWorking = activeTasks > 0;
  const isCompleted = activeTasks === 0 && completedTasks > 0;
  const state: AgentState = isWorking
    ? activeTasks > 1
      ? "working"
      : "working"
    : isCompleted
    ? "completed"
    : "idle";

  const statusLabel = isWorking
    ? `${activeTasks} tarea${activeTasks > 1 ? "s" : ""} activa${activeTasks > 1 ? "s" : ""}`
    : isCompleted
    ? `${completedTasks} completada${completedTasks > 1 ? "s" : ""}`
    : "Disponible";

  return (
    <div
      className={`director-pod${isWorking ? " working" : ""}${isSelected ? " selected" : ""}`}
      onClick={onClick}
      style={
        {
          "--pod-color": director.color,
          "--pod-glow": `${director.color}35`,
          "--pod-bg": `${director.color}06`,
          gridColumn: isCEO ? "span 2" : undefined,
          padding: "14px 12px 10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
        } as React.CSSProperties
      }
    >
      {/* SVG Avatar */}
      <div
        style={{
          position: "relative",
          width: 80,
          height: 110,
          animation: isWorking ? "pod-person-breathe 3s ease-in-out infinite" : undefined,
        }}
      >
        <AgentSVG color={director.color} initials={director.initials} state={state} />
      </div>

      {/* Name + Role */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <div
          style={{
            fontSize: isCEO ? 13 : 11,
            fontWeight: 600,
            color: isWorking ? director.color : "var(--color-text)",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {director.humanName}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--color-text-dim)",
            marginTop: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {director.shortName}
        </div>
        <div
          style={{
            fontSize: 9,
            marginTop: 4,
            color: isWorking
              ? director.color
              : isCompleted
              ? "var(--color-success)"
              : "var(--color-text-dim)",
            fontWeight: isWorking ? 600 : 400,
          }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
}
