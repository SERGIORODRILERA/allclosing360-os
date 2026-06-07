"use client";

import { useEffect, useRef, useState } from "react";
import type { UITask } from "./TasksPanel";
import { DIRECTOR_MAP } from "../lib/engines";
import { SKILL_MAP } from "../lib/skills";

interface TaskModalProps {
  task: UITask;
  onClose: () => void;
  onRedo?: (task: UITask) => void;
}

type Tab = "preview" | "content";

export default function TaskModal({ task, onClose, onRedo }: TaskModalProps) {
  const director = DIRECTOR_MAP[task.engineId];
  const skill = task.skillId ? SKILL_MAP[task.skillId as keyof typeof SKILL_MAP] : null;
  const [tab, setTab] = useState<Tab>(task.artifact?.type === "html" ? "preview" : "content");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function copyContent() {
    const text = task.artifact?.content ?? task.result ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadArtifact() {
    if (!task.artifact) return;
    const a = document.createElement("a");
    a.href = task.artifact.url;
    a.download = task.artifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportText() {
    const text = task.artifact?.content ?? task.result ?? "";
    const blob = new Blob([
      "ALLCLOSING360 OS — RESULTADO\n" + "─".repeat(40) + "\n" +
      "Tarea: " + task.title + "\n" +
      "Director: " + (director?.name ?? "") + "\n" +
      "Skill: " + (task.skillName ?? "") + "\n" +
      "Fecha: " + new Date(task.createdAt).toLocaleString("es") + "\n\n" +
      text
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ac360_resultado_" + task.id + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const hasArtifact = !!task.artifact;
  const isHTML = task.artifact?.type === "html";
  const isCode = task.artifact?.type === "code";
  const displayContent = task.artifact?.content ?? task.result ?? "Resultado no disponible.";

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(4,4,8,0.88)",
        backdropFilter: "blur(10px)",
        zIndex: 1000, display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: 24, animation: "fade-in 0.2s ease-out",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isHTML ? 900 : 760,
          maxHeight: "90vh",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(0,0,0,0.7), 0 0 1px " + (director?.color ?? "var(--color-accent)") + "40",
          animation: "slide-down 0.25s ease-out",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 14, flexShrink: 0,
            background: "linear-gradient(135deg, " + (director?.color ?? "var(--color-accent)") + "10, transparent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: (director?.color ?? "#666") + "20",
                border: "1.5px solid " + (director?.color ?? "#666") + "40",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}
            >
              {director?.icon ?? "🤖"}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.3 }}>
                {task.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, color: director?.color ?? "var(--color-accent)", background: (director?.color ?? "#666") + "15", border: "1px solid " + (director?.color ?? "#666") + "25", borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>
                  {director?.icon} {director?.name}
                </span>
                {skill && (
                  <span style={{ fontSize: 9, color: "var(--color-text-muted)", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "1px 7px" }}>
                    {skill.icon} {skill.name}
                  </span>
                )}
                {hasArtifact && (
                  <span style={{ fontSize: 9, color: isHTML ? "#60a5fa" : isCode ? "#34d399" : "#a78bfa", background: isHTML ? "rgba(96,165,250,0.12)" : isCode ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)", border: "1px solid " + (isHTML ? "rgba(96,165,250,0.25)" : isCode ? "rgba(52,211,153,0.25)" : "rgba(167,139,250,0.25)"), borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>
                    {isHTML ? "🌐 HTML" : isCode ? "💻 CÓDIGO" : "📄 DOC"} — {task.artifact!.filename}
                  </span>
                )}
                <span style={{ fontSize: 9, color: "var(--color-success)", background: "var(--color-success-glow)", border: "1px solid rgba(34,217,122,0.2)", borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>
                  ✅ COMPLETADO
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 7, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 13, flexShrink: 0 }}
          >✕</button>
        </div>

        {/* ── Meta bar ────────────────────────────────────────────────── */}
        <div style={{ padding: "7px 20px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", gap: 16, flexShrink: 0, background: "var(--color-surface-2)", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: "Tokens", value: task.estimatedTokens ? "~" + task.estimatedTokens.toLocaleString() : "—" },
              { label: "Coste", value: task.estimatedCostUSD ? "$" + task.estimatedCostUSD : "—" },
              { label: "Riesgo", value: task.riskLevel === "low" ? "Bajo" : task.riskLevel === "medium" ? "Medio" : task.riskLevel ? "Alto" : "—" },
              { label: "Creada", value: new Date(task.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", fontWeight: 500, marginTop: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Tab switcher (only when there's an artifact + content) */}
          {hasArtifact && (
            <div style={{ display: "flex", gap: 3 }}>
              {isHTML && (
                <button
                  onClick={() => setTab("preview")}
                  style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, fontWeight: 600, background: tab === "preview" ? "var(--color-accent)" : "var(--color-surface-3)", border: "1px solid " + (tab === "preview" ? "transparent" : "var(--color-border)"), color: tab === "preview" ? "#fff" : "var(--color-text-muted)" }}
                >
                  🌐 Vista previa
                </button>
              )}
              <button
                onClick={() => setTab("content")}
                style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, fontWeight: 600, background: tab === "content" ? "var(--color-accent)" : "var(--color-surface-3)", border: "1px solid " + (tab === "content" ? "transparent" : "var(--color-border)"), color: tab === "content" ? "#fff" : "var(--color-text-muted)" }}
              >
                {isCode ? "💻 Código" : "📄 Contenido"}
              </button>
            </div>
          )}
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* Original order */}
          {task.order && (
            <div style={{ padding: "10px 20px 0", flexShrink: 0 }}>
              <div style={{ padding: "8px 12px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 7, fontSize: 11, color: "var(--color-text-muted)" }}>
                <span style={{ color: "var(--color-text-dim)", marginRight: 6 }}>Orden original:</span>
                {task.order}
              </div>
            </div>
          )}

          {/* HTML iframe preview */}
          {isHTML && tab === "preview" && (
            <div style={{ flex: 1, overflow: "hidden", padding: "12px 20px" }}>
              <div style={{ height: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <iframe
                  ref={iframeRef}
                  src={task.artifact!.url}
                  style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                  title="Vista previa HTML"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}

          {/* Code block */}
          {isCode && tab === "content" && (
            <div style={{ flex: 1, overflow: "auto", padding: "12px 20px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}>
                  <span style={{ fontSize: 9, color: "var(--color-text-dim)", background: "var(--color-surface-4)", padding: "2px 8px", borderRadius: 5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {task.artifact!.language}
                  </span>
                </div>
                <pre
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                    fontSize: 12,
                    lineHeight: 1.65,
                    color: "#e2e8f0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    background: "#0d1117",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    padding: "36px 16px 16px",
                    margin: 0,
                  }}
                >
                  {displayContent}
                </pre>
              </div>
            </div>
          )}

          {/* Document / text result */}
          {(!isHTML || tab === "content") && !isCode && (
            <div style={{ flex: 1, overflow: "auto", padding: "12px 20px" }}>
              <pre
                style={{
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  lineHeight: 1.7,
                  color: "var(--color-text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: "16px 18px",
                  margin: 0,
                }}
              >
                {displayContent}
              </pre>
            </div>
          )}

          {/* If isCode and tab is content */}
          {isCode && tab === "preview" && null}
        </div>

        {/* ── Action bar ──────────────────────────────────────────────── */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 7, flexWrap: "wrap", flexShrink: 0, background: "var(--color-surface)" }}>
          <button
            onClick={copyContent}
            style={{ fontSize: 11, padding: "8px 14px", borderRadius: 8, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", flex: 1, fontWeight: 500 }}
          >
            {copied ? "✅ Copiado" : "📋 Copiar"}
          </button>

          {hasArtifact ? (
            <button
              onClick={downloadArtifact}
              style={{ fontSize: 11, padding: "8px 14px", borderRadius: 8, background: isHTML ? "rgba(96,165,250,0.12)" : isCode ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)", border: "1px solid " + (isHTML ? "rgba(96,165,250,0.3)" : isCode ? "rgba(52,211,153,0.3)" : "rgba(167,139,250,0.3)"), color: isHTML ? "#60a5fa" : isCode ? "#34d399" : "#a78bfa", flex: 1, fontWeight: 600 }}
            >
              ⬇️ Descargar {isHTML ? ".html" : isCode ? "." + (task.artifact!.language?.slice(0, 2) ?? "js") : ".md"}
            </button>
          ) : (
            <button
              onClick={exportText}
              style={{ fontSize: 11, padding: "8px 14px", borderRadius: 8, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", flex: 1 }}
            >
              ⬇️ Exportar
            </button>
          )}

          {hasArtifact && isHTML && (
            <button
              onClick={() => window.open(task.artifact!.url, "_blank")}
              style={{ fontSize: 11, padding: "8px 14px", borderRadius: 8, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa", flex: 1, fontWeight: 500 }}
            >
              🔗 Abrir
            </button>
          )}

          {onRedo && (
            <button
              onClick={() => { onClose(); onRedo(task); }}
              style={{ fontSize: 11, padding: "8px 14px", borderRadius: 8, background: "var(--color-surface-2)", border: "1px solid rgba(251,191,36,0.3)", color: "var(--color-warning)", flex: 1 }}
            >
              🔄 Rehacer
            </button>
          )}

          <button
            onClick={onClose}
            style={{ fontSize: 11, padding: "8px 18px", borderRadius: 8, background: (director?.color ?? "var(--color-accent)") + "20", border: "1px solid " + (director?.color ?? "var(--color-accent)") + "35", color: director?.color ?? "var(--color-accent)", fontWeight: 600, flex: 1 }}
          >
            ✅ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
