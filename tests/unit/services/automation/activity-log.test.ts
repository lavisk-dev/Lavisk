import { describe, it, expect, beforeEach } from "vitest";
import { ActivityLog } from "@/lib/services/automation/activity-log";

describe("ActivityLog", () => {
  beforeEach(async () => {
    const entries = await ActivityLog.list(1000);
    for (const entry of entries) {
      // clear by re-initializing - ActivityLog uses in-memory store when Supabase isn't configured
    }
  });

  it("logs an activity entry", async () => {
    await ActivityLog.log({
      event: "product.created",
      entityType: "product",
      entityId: "p1",
      action: "Create product",
      actor: "admin",
      result: "success",
    });

    const entries = await ActivityLog.list();
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].event).toBe("product.created");
    expect(entries[0].entityId).toBe("p1");
  });

  it("includes metadata in log entry", async () => {
    await ActivityLog.log({
      event: "order.paid",
      entityType: "order",
      entityId: "o1",
      action: "Process payment",
      actor: "system",
      result: "success",
      metadata: { amount: 100, currency: "INR" },
    });

    const entries = await ActivityLog.listByEntity("order", "o1");
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].metadata).toEqual({ amount: 100, currency: "INR" });
  });

  it("logs failure entries", async () => {
    await ActivityLog.log({
      event: "inventory.decremented",
      entityType: "product",
      entityId: "p1",
      action: "Decrement stock",
      actor: "system",
      result: "failure",
      error: "Insufficient stock",
    });

    const entries = await ActivityLog.list(10);
    const failure = entries.find((e) => e.result === "failure");
    expect(failure).toBeDefined();
    expect(failure!.error).toBe("Insufficient stock");
  });

  it("filters by entity type and id", async () => {
    await ActivityLog.log({
      event: "product.created",
      entityType: "product",
      entityId: "p_specific",
      action: "Create",
      actor: "admin",
      result: "success",
    });
    await ActivityLog.log({
      event: "order.created",
      entityType: "order",
      entityId: "o_specific",
      action: "Create",
      actor: "system",
      result: "success",
    });

    const productEntries = await ActivityLog.listByEntity("product", "p_specific");
    expect(productEntries.length).toBeGreaterThanOrEqual(1);
    expect(productEntries.every((e) => e.entityType === "product")).toBe(true);
    expect(productEntries.every((e) => e.entityId === "p_specific")).toBe(true);
  });
});
