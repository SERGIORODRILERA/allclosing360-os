"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { EngineId } from "@ac360/types";
import type { Message } from "./MessageFeed";
import type { UITask, TaskArtifact } from "./TasksPanel";
import NavRail, { type OSView } from "./NavRail";
import ChatPanel from "./ChatPanel";
import SimsOfficeView from "./SimsOfficeView";
import OpsPanel from "./OpsPanel";
import SkillsMarketplace from "./SkillsMarketplace";
import HistoryPanel from "./HistoryPanel";
import TaskModal from "./TaskModal";
import NotificationCenter, { type Notification, taskToNotification } from "./NotificationCenter";
import ActionTimeline, { type TimelineEvent } from "./ActionTimeline";
import CompanySelector from "./CompanySelector";
import ConnectorsPanel from "./ConnectorsPanel";
import { DIRECTOR_MAP } from "../lib/engines";
import { detectIntent } from "../lib/intent";
import { SKILL_MAP } from "../lib/skills";
import { getSkillResponse } from "../lib/mock-responses";
import { getStepsForSkill, estimateRisk } from "../lib/task-engine";
import { DEFAULT_COMPANY_ID, COMPANY_MAP } from "../lib/companies";
import {
  saveSession,
  loadSession,
  clearSession,
  exportSession,
  type StoredOrder,
} from "../lib/memory";

// ─── type helpers ──────────────────────────────────────────────────────────
function msgToStored(m: Message) { return { ...m, timestamp: m.timestamp.toISOString() }; }
function taskToStored(t: UITask) { return { ...t, createdAt: t.createdAt.toISOString() }; }
function storedToMsg(s: ReturnType<typeof msgToStored>): Message { return { ...s, timestamp: new Date(s.timestamp) } as Message; }
function storedToTask(s: ReturnType<typeof taskToStored>): UITask { return { ...s, createdAt: new Date(s.createdAt) } as UITask; }

// ─── seed data ─────────────────────────────────────────────────────────────
const BOOT_MESSAGES: Message[] = [
  {
    id: "sys-boot",
    role: "system",
    text: "ALLCLOSING360 OS v5.0 — Live AI Office",
    timestamp: new Date(),
  },
  {
    id: "ai-welcome",
    role: "assistant",
    text: "Bienvenido, CEO. Tengo 15 directores IA activos (incluye Director de Producto con GitHub), 35 skills listas y voz de entrada/salida. Escribe o dicta una orden — el sistema asigna director y skill en tiempo real.",
    timestamp: new Date(),
  },
];

// No seed tasks — progress is real, not simulated
const SEED_TASKS: UITask[] = [];

// ─── AppShell ──────────────────────────────────────────────────────────────
export default function CommandCenter() {
  const [activeView, setActiveView] = useState<OSView>("office");
  const [messages, setMessages] = useState<Message[]>(BOOT_MESSAGES);
  const [tasks, setTasks] = useState<UITask[]>(SEED_TASKS);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [activeDirectorId, setActiveDirectorId] = useState<EngineId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UITask | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    { id: "sys-boot", type: "system", title: "ALLCLOSING360 OS v5 iniciado", detail: "15 directores IA · 35 skills · oficina 3D · voz · GitHub", timestamp: new Date() },
  ]);
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const sessionLoaded = useRef(false);
  // track which task IDs have already fired notifications
  const notifiedTasks = useRef<Set<string>>(new Set());

  // ── Load session from localStorage on first mount ──
  useEffect(() => {
    if (sessionLoaded.current) return;
    sessionLoaded.current = true;
    const saved = loadSession();
    if (!saved) return;
    if (saved.messages.length > 0) setMessages(saved.messages.map(storedToMsg));
    if (saved.tasks.length > 0) setTasks(saved.tasks.map(storedToTask));
    if (saved.orders.length > 0) setOrders(saved.orders);
    if (saved.activeDirectorId) setActiveDirectorId(saved.activeDirectorId as EngineId);
  }, []);

  // ── Persist to localStorage on every change ──
  useEffect(() => {
    if (!sessionLoaded.current) return;
    saveSession({
      messages: messages.filter((m) => !m.isTyping).map(msgToStored),
      tasks: tasks.map(taskToStored),
      orders,
      activeDirectorId: activeDirectorId,
    });
  }, [messages, tasks, orders, activeDirectorId]);

  // ── Timeline helper ──
  const pushEvent = useCallback((ev: Omit<TimelineEvent, "id" | "timestamp">) => {
    setTimelineEvents((prev) => [
      ...prev,
      { ...ev, id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date() },
    ]);
  }, []);

  // ── Watch completed tasks for notifications ──
  useEffect(() => {
    for (const t of tasks) {
      if (t.status === "completed" && !notifiedTasks.current.has(t.id)) {
        notifiedTasks.current.add(t.id);
        setNotifications((n) => [...n, taskToNotification(t)]);
      }
    }
  }, [tasks]);

  // ── View result handler ──
  const handleViewResult = useCallback((taskId: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (task) setSelectedTask(task);
      return prev;
    });
  }, []);

  // ── Main command handler — uses /api/task (Manus-like, streaming SSE) ──
  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return;

      const { directorId, skillId } = detectIntent(text);
      const director = DIRECTOR_MAP[directorId];
      const skill = SKILL_MAP[skillId];
      const thinkingId = `thinking-${Date.now()}`;
      const taskId = `task-${Date.now()}`;
      const company = COMPANY_MAP[companyId];

      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", text: text.trim(), timestamp: new Date() },
        { id: thinkingId, role: "assistant", text: "", timestamp: new Date(), isTyping: true },
      ]);

      setIsProcessing(true);
      setActiveDirectorId(directorId);

      const steps = getStepsForSkill(skillId);

      const optimisticTask: UITask = {
        id: taskId,
        title: text.trim().slice(0, 60) + (text.length > 60 ? "…" : ""),
        status: "in_progress",
        engineId: directorId,
        skillId,
        skillName: skill.name,
        progress: 5,
        createdAt: new Date(),
        order: text.trim(),
        riskLevel: estimateRisk(skillId),
        currentStep: steps[0] ?? "Iniciando…",
      };
      setTasks((prev) => [optimisticTask, ...prev]);
      pushEvent({ type: "task_start", directorId, title: optimisticTask.title, detail: skill.name, skillName: skill.name });

      try {
        const res = await fetch("/api/task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            skillId,
            directorId,
            companyName: company?.name ?? "AllClosing360",
            taskId,
          }),
        });

        if (!res.ok || !res.body) throw new Error(`API error ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // SSE parse loop
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const chunk of parts) {
            const lines = chunk.split("\n");
            let event = "";
            let data = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) event = line.slice(7).trim();
              if (line.startsWith("data: ")) data = line.slice(6).trim();
            }
            if (!data) continue;

            let parsed: Record<string, unknown>;
            try { parsed = JSON.parse(data); } catch { continue; }

            if (event === "step") {
              const stepLabel = parsed.label as string;
              const stepIdx = parsed.index as number;
              const pct = Math.min(10 + stepIdx * 25, 85);
              setTasks((prev) => prev.map((t) =>
                t.id === taskId ? { ...t, progress: pct, currentStep: stepLabel } : t
              ));
              pushEvent({ type: "task_step", directorId, title: stepLabel, skillName: skill.name });
            } else if (event === "artifact") {
              // Artifact created — update step label
              const atype = parsed.type as string;
              const label = atype === "html" ? "🌐 Página HTML generada" : atype === "code" ? "💻 Código generado" : "📄 Documento creado";
              setTasks((prev) => prev.map((t) =>
                t.id === taskId ? { ...t, progress: 88, currentStep: label } : t
              ));
            } else if (event === "complete") {
              const d = parsed as {
                chatResponse: string; taskTitle: string; taskResult: string;
                artifact?: TaskArtifact; model?: string;
                inputTokens?: number; outputTokens?: number;
                prUrl?: string; prNumber?: number;
              };

              const isSonnet = (d.model ?? "").includes("sonnet");
              const priceIn  = isSonnet ? 3 : 0.8;
              const priceOut = isSonnet ? 15 : 4;
              const realCost = Math.round(
                (((d.inputTokens ?? 0) / 1_000_000) * priceIn +
                 ((d.outputTokens ?? 0) / 1_000_000) * priceOut) * 10000
              ) / 10000;
              const realTok = (d.inputTokens ?? 0) + (d.outputTokens ?? 0);

              pushEvent({ type: "task_complete", directorId, title: d.taskTitle || optimisticTask.title, skillName: skill.name });

              setTasks((prev) => prev.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      title: d.taskTitle || t.title,
                      status: "completed",
                      progress: 100,
                      currentStep: `✓ ${realTok > 0 ? realTok.toLocaleString() + " tokens · $" + realCost.toFixed(4) : "Completado"}`,
                      result: d.taskResult,
                      artifact: d.artifact,
                      estimatedTokens: realTok || t.estimatedTokens,
                      estimatedCostUSD: realCost || t.estimatedCostUSD,
                      prUrl: d.prUrl,
                      prNumber: d.prNumber,
                    }
                  : t
              ));

              // Replace thinking bubble with real response
              setMessages((prev) =>
                prev
                  .filter((m) => m.id !== thinkingId)
                  .concat({
                    id: `ai-${Date.now()}`,
                    role: "assistant",
                    text: d.chatResponse || director.humanName + " ha completado la tarea.",
                    timestamp: new Date(),
                    engineId: directorId,
                    skillId,
                    skillName: skill.name,
                  }),
              );
            } else if (event === "error") {
              pushEvent({ type: "task_error", directorId, title: "Error en tarea", detail: (parsed.message as string) ?? undefined, skillName: skill.name });
              throw new Error((parsed.message as string) ?? "Error en tarea");
            }
          }
        }
      } catch (err) {
        console.warn("[CommandCenter] Streaming failed, using mock fallback:", err);
        const mock = getSkillResponse(skillId);
        const fallbackResult = "[Error al conectar con la IA — revisa la configuración de ANTHROPIC_API_KEY]";

        pushEvent({ type: "task_error", directorId, title: "Error en tarea", detail: String(err), skillName: skill.name });

        setTasks((prev) => prev.map((t) =>
          t.id === taskId
            ? { ...t, title: mock.taskTitle || t.title, status: "failed", progress: 0, currentStep: "Error al procesar", result: fallbackResult }
            : t
        ));

        setMessages((prev) =>
          prev
            .filter((m) => m.id !== thinkingId)
            .concat({
              id: `ai-${Date.now()}`,
              role: "assistant",
              text: mock.text,
              timestamp: new Date(),
              engineId: directorId,
              skillId,
              skillName: skill.name,
            }),
        );
      }

      const newOrder: StoredOrder = {
        id: `order-${Date.now()}`,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        directorId,
        directorName: director.name,
        skillId,
        skillName: skill.name,
        skillIcon: skill.icon,
      };
      setOrders((prev) => [...prev, newOrder]);

      setIsProcessing(false);
    },
    [isProcessing, companyId, pushEvent],
  );

  // ── Memory actions ──
  function handleClear() {
    if (!confirm("¿Borrar toda la memoria de la sesión? Esta acción no se puede deshacer.")) return;
    clearSession();
    setMessages(BOOT_MESSAGES);
    setTasks(SEED_TASKS);
    setOrders([]);
    setActiveDirectorId(null);
    setNotifications([]);
    notifiedTasks.current.clear();
  }

  function handleExport() {
    exportSession();
  }

  function handleDismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const processingCount = tasks.filter((t) => t.status === "in_progress").length;

  const VIEW_LABEL: Record<OSView, string> = {
    office:     "Oficina Virtual",
    ops:        "Centro de Operaciones",
    skills:     "Skills Marketplace",
    memory:     "Memoria del Sistema",
    connectors: "Conectores e Integraciones",
  };

  return (
    <div className="os-shell">
      {/* Left nav rail */}
      <NavRail
        activeView={activeView}
        onViewChange={setActiveView}
        processingCount={processingCount}
      />

      {/* Center — changes based on view */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* View-level header */}
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CompanySelector selectedId={companyId} onSelect={setCompanyId} />
            <div style={{ width: 1, height: 20, background: "var(--color-border)", flexShrink: 0 }} />
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--color-text-dim)",
                textTransform: "uppercase",
              }}
            >
              {VIEW_LABEL[activeView]}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isProcessing && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-warning)",
                  background: "rgba(251,191,36,0.1)",
                  border: "1px solid rgba(251,191,36,0.2)",
                  borderRadius: 5,
                  padding: "3px 9px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div className="status-dot-active" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-warning)" }} />
                Procesando orden…
              </div>
            )}
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-dim)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)" }}
                className="status-dot-active"
              />
              {processingCount} activa{processingCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* View content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeView === "office" && (
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <SimsOfficeView
                  tasks={tasks}
                  activeDirectorId={activeDirectorId}
                  onDirectorSelect={setActiveDirectorId}
                  onViewResult={(task) => setSelectedTask(task)}
                />
              </div>
              <ActionTimeline events={timelineEvents} />
            </div>
          )}
          {activeView === "ops" && (
            <OpsPanel tasks={tasks} orders={orders} activeDirectorId={activeDirectorId} />
          )}
          {activeView === "skills" && (
            <SkillsMarketplace orders={orders} />
          )}
          {activeView === "memory" && (
            <HistoryPanel
              messages={messages}
              tasks={tasks}
              orders={orders}
              onClear={handleClear}
              onExport={handleExport}
            />
          )}
          {activeView === "connectors" && <ConnectorsPanel />}
        </div>
      </main>

      {/* Right — Chat panel (always visible) */}
      <ChatPanel
        messages={messages}
        tasks={tasks}
        activeDirectorId={activeDirectorId}
        isProcessing={isProcessing}
        onSubmit={handleSubmit}
        onClear={handleClear}
        onExport={handleExport}
        onViewResult={(task) => setSelectedTask(task)}
      />

      {/* Task result modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onRedo={(task) => {
            if (task.order) handleSubmit(task.order);
          }}
        />
      )}

      {/* Toast notifications */}
      <NotificationCenter
        notifications={notifications}
        onDismiss={handleDismissNotification}
        onViewResult={handleViewResult}
      />
    </div>
  );
}
