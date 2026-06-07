export type CommandStatus = "pending" | "processing" | "completed" | "failed";
export type CommandChannel = "chat" | "voice" | "api" | "scheduled";

export interface Command {
  id: string;
  tenantId: string;
  userId: string;
  text: string;
  channel: CommandChannel;
  status: CommandStatus;
  engineTarget?: string;
  response?: string;
  tasksCreated?: string[];
  processingMs?: number;
  createdAt: string;
  updatedAt: string;
}
