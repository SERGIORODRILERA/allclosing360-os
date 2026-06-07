import type { BaseEvent } from "../types";

export interface CommandCreatedEvent extends BaseEvent {
  type: "command.created";
  payload: {
    commandId: string;
    userId: string;
    text: string;
    channel: string;
    engineTarget?: string;
  };
}

export interface CommandProcessedEvent extends BaseEvent {
  type: "command.processed";
  payload: {
    commandId: string;
    status: "completed" | "failed";
    processingMs: number;
    tasksCreated: string[];
  };
}

export type CommandEvent = CommandCreatedEvent | CommandProcessedEvent;
