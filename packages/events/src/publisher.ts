import { getConnection, sc } from "./client";
import type { BaseEvent } from "./types";

export async function publish<T extends BaseEvent>(
  subject: string,
  event: T,
): Promise<void> {
  const nc = await getConnection();
  nc.publish(subject, sc.encode(JSON.stringify(event)));
}

export function makeSubject(
  domain: string,
  entity: string,
  action: string,
): string {
  return `${domain}.${entity}.${action}`;
}
