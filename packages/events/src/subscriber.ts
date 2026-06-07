import { getConnection, sc } from "./client";
import type { BaseEvent, EventHandler } from "./types";

export async function subscribe<T extends BaseEvent>(
  subject: string,
  handler: EventHandler<T>,
): Promise<() => Promise<void>> {
  const nc = await getConnection();
  const sub = nc.subscribe(subject);

  void (async () => {
    for await (const msg of sub) {
      try {
        const event = JSON.parse(sc.decode(msg.data)) as T;
        await handler(event);
      } catch (err) {
        console.error(`[events] Handler error on subject "${subject}":`, err);
      }
    }
  })();

  return () => sub.drain();
}
