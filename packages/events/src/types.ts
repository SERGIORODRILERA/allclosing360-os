export interface BaseEvent {
  type: string;
  tenantId: string;
  timestamp: string;
  payload: unknown;
}

export type EventHandler<T extends BaseEvent = BaseEvent> = (
  event: T,
) => Promise<void>;
