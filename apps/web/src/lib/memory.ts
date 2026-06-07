import type { EngineId } from "@ac360/types";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  engineId?: EngineId;
  skillId?: string;
}

export interface StoredTask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  engineId: EngineId;
  skillId?: string;
  progress: number;
  createdAt: string;
}

export interface StoredOrder {
  id: string;
  text: string;
  timestamp: string;
  directorId: EngineId;
  directorName: string;
  skillId: string;
  skillName: string;
  skillIcon: string;
}

export interface SessionData {
  version: number;
  messages: StoredMessage[];
  tasks: StoredTask[];
  orders: StoredOrder[];
  activeDirectorId: EngineId | null;
}

const SESSION_KEY = "ac360_session";
const CURRENT_VERSION = 2;

export function saveSession(data: Omit<SessionData, "version">): void {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...data, version: CURRENT_VERSION }),
    );
  } catch {
    // localStorage not available or full
  }
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: SessionData = JSON.parse(raw);
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function exportSession(): void {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const pretty = JSON.stringify(JSON.parse(raw), null, 2);
    const blob = new Blob([pretty], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `ac360_sesion_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}
