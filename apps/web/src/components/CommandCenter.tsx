"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { EngineId } from "@ac360/types";
import type { Message } from "./MessageFeed";
import type { UITask, TaskArtifact } from "./TasksPanel";
import NavRail, { type OSView } from "./NavRail";
import ChatPanel from "./ChatPanel";
import IsometricOffice from "./IsometricOffice";
import OpsPanel from "./OpsPanel";
import SkillsMarketplace from "./SkillsMarketplace";
import HistoryPanel from "./HistoryPanel";
import TaskModal from "./TaskModal";
import NotificationCenter, { type Notification, taskToNotification } from "./NotificationCenter";
import CompanySelector from "./CompanySelector";
import ConnectorsPanel from "./ConnectorsPanel";
import { DIRECTOR_MAP } from "../lib/engines";
import { detectIntent } from "../lib/intent";
import { SKILL_MAP } from "../lib/skills";
import { getSkillResponse } from "../lib/mock-responses";
import { getStepsForSkill, estimateTokens, estimateCost, estimateRisk, generateResult } from "../lib/task-engine";
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
    text: "ALLCLOSING360 OS v4.0 — Live AI Office iniciado",
    timestamp: new Date(),
  },
  {
    id: "ai-welcome",
    role: "assistant",
    text: "Bienvenido, CEO. Tengo 14 directores IA activos, 35 skills listas y 20 conectores disponibles. Escribe o dicta una orden y el sistema asignará automáticamente al director y skill óptimos.",
    timestamp: new Date(),
  },
];

const SEED_TASKS: UITask[] = [
  {
    id: "seed-1",
    title: "Optimizando mix de ofertas activas",
    status: "in_progress",
    engineId: "director_comercial",
    skillId: "crear_oferta_irresistible",
    skillName: "Crear oferta irresistible",
    progress: 67,
    createdAt: new Date(),
    estimatedTokens: 2400,
    estimatedCostUSD: 0.048,
    riskLevel: "low",
    currentStep: "Analizando mercado objetivo",
  },
  {
    id: "seed-2",
    title: "Análisis de conversión landing Q4",
    status: "in_progress",
    engineId: "director_embudos",
    skillId: "crear_landing",
    skillName: "Crear landing page",
    progress: 34,
    createdAt: new Date(),
    estimatedTokens: 3200,
    estimatedCostUSD: 0.064,
    riskLevel: "medium",
    currentStep: "Estructurando copy persuasivo",
  },
  {
    id: "seed-3",
    title: "Reporte ejecutivo semanal completado",
    status: "completed",
    engineId: "ceo_advisor",
    skillId: "crear_reporte_ejecutivo",
    skillName: "Crear reporte ejecutivo",
    progress: 100,
    createdAt: new Date(),
    estimatedTokens: 1800,
    estimatedCostUSD: 0.036,
    riskLevel: "low",
    result: generateResult("crear_reporte_ejecutivo"),
  },
];

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

  // ── Auto-advance task progress + notifications ──
  useEffect(() => {
    const id = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.status !== "in_progress") return t;
          const next = Math.min(t.progress + Math.floor(Math.random() * 4 + 1), 100);
          const steps = getStepsForSkill(t.skillId ?? "");
          const stepIdx = Math.floor((next / 100) * (steps.length - 1));
          const currentStep = steps[stepIdx] ?? steps[0] ?? "Procesando…";

          if (next >= 100) {
            const result = t.result ?? generateResult(t.skillId ?? "");
            // fire notification (deferred so we don't setState inside setState loop)
            if (!notifiedTasks.current.has(t.id)) {
              notifiedTasks.current.add(t.id);
              setTimeout(() => {
                setTasks((cur) => {
                  const completed = cur.find((x) => x.id === t.id);
                  if (completed) {
                    setNotifications((n) => [...n, taskToNotification(completed)]);
                  }
                  return cur;
                });
              }, 200);
            }
            return { ...t, progress: 100, status: "completed", currentStep: "Completado", result };
          }
          return { ...t, progress: next, currentStep };
        }),
      );
    }, 3500);
    return () => clearInterval(id);
  }, []);

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

      const estimatedTok = estimateTokens(skillId);
      const steps = getStepsForSkill(skillId);

      // Optimistic task — shows immediately with progress
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
        estimatedTokens: estimatedTok,
        estimatedCostUSD: estimateCost(estimatedTok),
        riskLevel: estimateRisk(skillId),
        currentStep: steps[0] ?? "Iniciando…",
      };
      setTasks((prev) => [optimisticTask, ...prev]);

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
              };

              const isSonnet = (d.model ?? "").includes("sonnet");
              const pricePerM = isSonnet ? 15 : 4;
              const realCost = Math.round(((d.outputTokens ?? 0) / 1_000_000) * pricePerM * 10000) / 10000;
              const realTok = (d.inputTokens ?? 0) + (d.outputTokens ?? 0);

              // Finalize task
              setTasks((prev) => prev.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      title: d.taskTitle || t.title,
                      status: "completed",
                      progress: 100,
                      currentStep: "Completado",
                      result: d.taskResult,
                      artifact: d.artifact,
                      estimatedTokens: realTok || t.estimatedTokens,
                      estimatedCostUSD: realCost || t.estimatedCostUSD,
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
              throw new Error((parsed.message as string) ?? "Error en tarea");
            }
          }
        }
      } catch (err) {
        console.warn("[CommandCenter] Streaming failed, using mock fallback:", err);
        const mock = getSkillResponse(skillId);
        const taskResult = generateResult(skillId);

        setTasks((prev) => prev.map((t) =>
          t.id === taskId
            ? { ...t, title: mock.taskTitle || t.title, status: "completed", progress: 100, currentStep: "Completado", result: taskResult }
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
    [isProcessing, companyId],
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
            <IsometricOffice
              tasks={tasks}
              activeDirectorId={activeDirectorId}
              onDirectorSelect={setActiveDirectorId}
              onViewResult={(task) => setSelectedTask(task)}
            />
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
