import { create } from "zustand";
import type { EngineId } from "@ac360/types";
import type { UITask } from "../components/TasksPanel";

export type { UITask };

// ─── Message ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  engineId?: EngineId;
  skillId?: string;
  skillName?: string;
}

// ─── Timeline event ───────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  type: "task_start" | "task_step" | "task_complete" | "task_error" | "system";
  directorId: EngineId;
  title: string;
  detail?: string;
  skillName?: string;
  timestamp: Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface StoreNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  body?: string;
  taskId?: string;
  timestamp: Date;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface OfficeStore {
  tasks: UITask[];
  messages: ChatMessage[];
  events: TimelineEvent[];
  activeDirectorId: EngineId | null;
  isProcessing: boolean;

  addTask: (task: UITask) => void;
  updateTask: (id: string, updates: Partial<UITask>) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  pushEvent: (ev: Omit<TimelineEvent, "id" | "timestamp">) => void;
  setActiveDirector: (id: EngineId | null) => void;
  setProcessing: (v: boolean) => void;
}

export const useOfficeStore = create<OfficeStore>((set) => ({
  tasks: [],
  messages: [],
  events: [],
  activeDirectorId: null,
  isProcessing: false,

  addTask: (task) =>
    set((s) => ({ tasks: [task, ...s.tasks] })),

  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

  pushEvent: (ev) =>
    set((s) => ({
      events: [
        ...s.events.slice(-199),
        { ...ev, id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date() },
      ],
    })),

  setActiveDirector: (id) => set({ activeDirectorId: id }),
  setProcessing: (v) => set({ isProcessing: v }),
}));
