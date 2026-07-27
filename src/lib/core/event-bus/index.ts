export type EventHandler<E = DomainEvent> = (event: E) => void | Promise<void>;

export interface DomainEvent {
  id: string;
  type: string;
  version: number;
  timestamp: string;
  correlationId?: string;
  causationId?: string;
  source: string;
  actor?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface PublishOptions {
  correlationId?: string;
  causationId?: string;
  actor?: string;
  source?: string;
}

export interface Subscription {
  eventType: string;
  handler: EventHandler;
  unsubscribe: () => void;
}

type HandlerEntry = { handler: EventHandler; async: boolean };

const handlers = new Map<string, Set<HandlerEntry>>();
const globalHandlers = new Set<HandlerEntry>();
let idCounter = 0;

function generateEventId(): string {
  idCounter += 1;
  return `evt_${Date.now()}_${idCounter}`;
}

const DEFAULT_SOURCE = "lavisk";

export const CoreEventBus = {
  on(eventType: string, handler: EventHandler, async = false): () => void {
    if (!handlers.has(eventType)) {
      handlers.set(eventType, new Set());
    }
    const entry: HandlerEntry = { handler, async };
    handlers.get(eventType)!.add(entry);
    return () => {
      handlers.get(eventType)?.delete(entry);
    };
  },

  onAny(handler: EventHandler): () => void {
    const entry: HandlerEntry = { handler, async: false };
    globalHandlers.add(entry);
    return () => {
      globalHandlers.delete(entry);
    };
  },

  off(eventType: string, handler: EventHandler): void {
    const set = handlers.get(eventType);
    if (!set) return;
    for (const entry of set) {
      if (entry.handler === handler) {
        set.delete(entry);
        break;
      }
    }
  },

  async publish(
    type: string,
    payload: Record<string, unknown>,
    options?: PublishOptions
  ): Promise<void> {
    const event: DomainEvent = {
      id: generateEventId(),
      type,
      version: 1,
      timestamp: new Date().toISOString(),
      correlationId: options?.correlationId,
      causationId: options?.causationId,
      source: options?.source ?? DEFAULT_SOURCE,
      actor: options?.actor,
      payload,
      metadata: {},
    };

    const promises: Promise<void>[] = [];
    const syncCalls: (() => void | Promise<void>)[] = [];

    const eventHandlers = handlers.get(type);
    if (eventHandlers) {
      for (const entry of eventHandlers) {
        if (entry.async) {
          promises.push(Promise.resolve(entry.handler(event)));
        } else {
          syncCalls.push(() => entry.handler(event));
        }
      }
    }

    for (const entry of globalHandlers) {
      if (entry.async) {
        promises.push(Promise.resolve(entry.handler(event)));
      } else {
        syncCalls.push(() => entry.handler(event));
      }
    }

    for (const call of syncCalls) {
      try {
        await Promise.resolve(call());
      } catch {
        // Isolated error — one handler failure doesn't crash others
      }
    }

    if (promises.length > 0) {
      Promise.allSettled(promises).catch(() => {});
    }
  },

  clear(): void {
    handlers.clear();
    globalHandlers.clear();
  },

  getHandlerCount(): number {
    let count = 0;
    for (const set of handlers.values()) {
      count += set.size;
    }
    return count + globalHandlers.size;
  },
};