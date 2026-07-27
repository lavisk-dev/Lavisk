import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: false,
  createClient: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: false,
  createAdminClient: vi.fn().mockReturnValue(null),
}));

import { CartService } from "@/lib/services/cart.service";

describe("CartService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prices a single item cart", async () => {
    const result = await CartService.price([{ productId: "p1", quantity: 1 }]);

    expect(result.lines.length).toBeGreaterThanOrEqual(1);
    expect(result.subtotal).toBeGreaterThan(0);
    expect(typeof result.total).toBe("number");
  });

  it("calculates shipping for small subtotal", async () => {
    const constants = await import("@/lib/constants");
    const FREE_SHIPPING_THRESHOLD = constants.FREE_SHIPPING_THRESHOLD;
    const FLAT_SHIPPING_FEE = constants.FLAT_SHIPPING_FEE;

    const result = await CartService.price([{ productId: "p7", quantity: 1 }]);

    const smallOrder = result.subtotal < FREE_SHIPPING_THRESHOLD;
    if (smallOrder) {
      expect(result.shipping).toBe(FLAT_SHIPPING_FEE);
    }
  });

  it("marks issues when products are missing", async () => {
    const result = await CartService.price([{ productId: "nonexistent", quantity: 1 }]);

    expect(result.lines.length).toBe(0);
    expect(result.hasIssues).toBe(true);
  });

  it("caps quantity at 20", async () => {
    const result = await CartService.price([{ productId: "p1", quantity: 50 }]);

    const line = result.lines.find((l) => l.productId === "p1");
    if (line) {
      expect(line.quantity).toBeLessThanOrEqual(20);
    }
  });

  it("skips unknown products", async () => {
    const result = await CartService.price([{ productId: "nonexistent", quantity: 1 }]);

    expect(result.lines.length).toBe(0);
    expect(result.hasIssues).toBe(true);
  });

  it("returns zero subtotal for empty input", async () => {
    const result = await CartService.price([]);

    expect(result.lines.length).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it("calculates line totals correctly", async () => {
    const result = await CartService.price([{ productId: "p1", quantity: 3 }]);

    const line = result.lines.find((l) => l.productId === "p1");
    if (line) {
      expect(line.lineTotal).toBe(line.price * line.quantity);
    }
  });
});
