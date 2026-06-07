import type { BaseEvent } from "../types";

export interface TaskCreatedEvent extends BaseEvent {
  type: "task.created";
  payload: {
    taskId: string;
    commandId?: string;
    title: string;
    engineId?: string;
    priority: string;
  };
}

export interface TaskStatusChangedEvent extends BaseEvent {
  type: "task.status_changed";
  payload: {
    taskId: string;
    previousStatus: string;
    newStatus: string;
    agentId?: string;
  };
}

export interface TaskProgressUpdatedEvent extends BaseEvent {
  type: "task.progress_updated";
  payload: {
    taskId: string;
    progress: number;
    agentId?: string;
  };
}

export interface TaskCompletedEvent extends BaseEvent {
  type: "task.completed";
  payload: {
    taskId: string;
    agentId?: string;
    durationMs?: number;
    result?: unknown;
  };
}

export type TaskEvent =
  | TaskCreatedEvent
  | TaskStatusChangedEvent
  | TaskProgressUpdatedEvent
  | TaskCompletedEvent;
