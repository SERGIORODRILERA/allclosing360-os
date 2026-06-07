export type TaskStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  engineId?: string;
  agentId?: string;
  commandId?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}
