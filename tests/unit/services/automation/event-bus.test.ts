import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "@/lib/services/automation/event-bus";
import { EventTypes } from "@/lib/services/automation/event-types";

describe("EventBus", () => {
  beforeEach(() => {
    EventBus.clear();
  });

  it("publishes event to registered handler", async () => {
    const handler = vi.fn();
    EventBus.on(EventTypes.PRODUCT_CREATED, handler);

    await EventBus.publish(EventTypes.PRODUCT_CREATED, {
      entityType: "product",
      entityId: "p1",
      productName: "Test Product",
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.type).toBe(EventTypes.PRODUCT_CREATED);
    expect(event.payload.entityId).toBe("p1");
    expect(event.payload.productName).toBe("Test Product");
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
  });

  it("does not call handler for different event type", async () => {
    const handler = vi.fn();
    EventBus.on(EventTypes.PRODUCT_CREATED, handler);

    await EventBus.publish(EventTypes.ORDER_CREATED, {
      entityType: "order",
      entityId: "o1",
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("calls multiple handlers for same event", async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    EventBus.on(EventTypes.ORDER_PAID, handler1);
    EventBus.on(EventTypes.ORDER_PAID, handler2);

    await EventBus.publish(EventTypes.ORDER_PAID, {
      entityType: "order",
      entityId: "o1",
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("calls global handlers for all events", async () => {
    const globalHandler = vi.fn();
    EventBus.onAny(globalHandler);

    await EventBus.publish(EventTypes.PRODUCT_CREATED, {
      entityType: "product",
      entityId: "p1",
    });
    await EventBus.publish(EventTypes.ORDER_CREATED, {
      entityType: "order",
      entityId: "o1",
    });

    expect(globalHandler).toHaveBeenCalledTimes(2);
  });

  it("supports unsubscribe", async () => {
    const handler = vi.fn();
    const unsubscribe = EventBus.on(EventTypes.PRODUCT_CREATED, handler);
    unsubscribe();

    await EventBus.publish(EventTypes.PRODUCT_CREATED, {
      entityType: "product",
      entityId: "p1",
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("handles async handlers", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    EventBus.on(EventTypes.PRODUCT_CREATED, handler);

    await EventBus.publish(EventTypes.PRODUCT_CREATED, {
      entityType: "product",
      entityId: "p1",
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not throw when handler throws", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Handler error"));
    EventBus.on(EventTypes.PRODUCT_CREATED, handler);

    await expect(
      EventBus.publish(EventTypes.PRODUCT_CREATED, {
        entityType: "product",
        entityId: "p1",
      })
    ).resolves.not.toThrow();
  });

  it("clears all handlers", () => {
    const handler = vi.fn();
    EventBus.on(EventTypes.PRODUCT_CREATED, handler);
    EventBus.onAny(handler);
    EventBus.clear();

    expect(handler).not.toHaveBeenCalled();
  });
});
