import type { EventType, EventPayload, DomainEvent as OldDomainEvent } from "./event-types";
import { CoreEventBus, type DomainEvent } from "@/lib/core/event-bus";

type EventHandler = (event: OldDomainEvent) => void | Promise<void>;

export const EventBus = {
  on(eventType: EventType, handler: EventHandler): () => void {
    const wrapper = async (event: DomainEvent) => {
      const oldEvent: OldDomainEvent = {
        type: event.type as EventType,
        payload: event.payload as EventPayload,
        timestamp: event.timestamp,
        id: event.id,
        version: event.version,
      };
      await handler(oldEvent);
    };
    return CoreEventBus.on(eventType, wrapper);
  },

  onAny(handler: EventHandler): () => void {
    const wrapper = async (event: DomainEvent) => {
      const oldEvent: OldDomainEvent = {
        type: event.type as EventType,
        payload: event.payload as EventPayload,
        timestamp: event.timestamp,
        id: event.id,
        version: event.version,
      };
      await handler(oldEvent);
    };
    return CoreEventBus.onAny(wrapper);
  },

  off(eventType: EventType, handler: EventHandler): void {
    CoreEventBus.off(eventType, handler as unknown as (event: DomainEvent) => void | Promise<void>);
  },

  async publish(type: EventType, payload: EventPayload): Promise<void> {
    await CoreEventBus.publish(type, payload as Record<string, unknown>);
  },

  clear(): void {
    CoreEventBus.clear();
  },
};