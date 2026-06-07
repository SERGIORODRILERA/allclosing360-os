export type AgentStatus = "idle" | "running" | "paused" | "error" | "offline";
export type AgentType = "orchestrator" | "executor" | "monitor" | "analyzer";

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  engineId?: string;
  tasksCompleted: number;
  tasksActive: number;
  lastHeartbeat?: string;
  createdAt: string;
  updatedAt: string;
  config?: Record<string, unknown>;
}
