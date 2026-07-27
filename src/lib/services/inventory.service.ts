import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockProducts } from "@/lib/data/mock-data";
import type { Product, InventoryMovement, InventoryOperation, InventoryDashboard, InventoryAlert } from "@/lib/types";
import { EventBus, EventTypes, type InventoryUpdatedPayload } from "@/lib/services/automation";

// ============================================================
// In-memory mock stores (used when Supabase is not configured)
// ============================================================

const mockMovements: InventoryMovement[] = [];
const MOCK_LOW_STOCK_THRESHOLD = 5;

const mockAlerts: InventoryAlert[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRowToMovement(row: Record<string, unknown>): InventoryMovement {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    operation: row.operation as InventoryOperation,
    quantity: row.quantity as number,
    stockBefore: row.stock_before as number,
    stockAfter: row.stock_after as number,
    reason: row.reason as string,
    reference: (row.reference as string) ?? null,
    performedBy: row.performed_by as string,
    notes: (row.notes as string) ?? null,
    supplier: (row.supplier as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ============================================================
// Product helpers
// ============================================================

async function getProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    return mockProducts.find((p) => p.id === id) ?? null;
  }
  const supabase = await createClient();
  if (!supabase) return mockProducts.find((p) => p.id === id) ?? null;
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return data as unknown as Product | null;
}

async function updateProductStock(productId: string, newStock: number): Promise<void> {
  const admin = createAdminClient();
  if (isSupabaseAdminConfigured && admin) {
    await admin.from("products").update({ stock: newStock }).eq("id", productId);
  } else {
    const product = mockProducts.find((p) => p.id === productId);
    if (product) product.stock = newStock;
  }
}

// ============================================================
// Movement helpers
// ============================================================

async function insertMovement(
  productId: string,
  operation: InventoryOperation,
  quantity: number,
  stockBefore: number,
  stockAfter: number,
  reason: string,
  performedBy: string,
  options?: {
    reference?: string | null;
    notes?: string | null;
    supplier?: string | null;
  }
): Promise<InventoryMovement> {
  const movement: InventoryMovement = {
    id: generateId("im"),
    productId,
    operation,
    quantity,
    stockBefore,
    stockAfter,
    reason,
    reference: options?.reference ?? null,
    performedBy,
    notes: options?.notes ?? null,
    supplier: options?.supplier ?? null,
    createdAt: new Date().toISOString(),
  };

  const admin = createAdminClient();
  if (isSupabaseAdminConfigured && admin) {
    const { error } = await admin.from("inventory_movements").insert({
      id: movement.id,
      product_id: movement.productId,
      operation: movement.operation,
      quantity: movement.quantity,
      stock_before: movement.stockBefore,
      stock_after: movement.stockAfter,
      reason: movement.reason,
      reference: movement.reference,
      performed_by: movement.performedBy,
      notes: movement.notes,
      supplier: movement.supplier,
      created_at: movement.createdAt,
    });
    if (error) throw new Error(`Failed to insert movement: ${error.message}`);
  } else {
    mockMovements.unshift(movement);
  }

  return movement;
}

async function getMovementsForProduct(productId: string, limit = 50, offset = 0): Promise<InventoryMovement[]> {
  const admin = createAdminClient();
  if (isSupabaseAdminConfigured && admin) {
    const { data } = await admin
      .from("inventory_movements")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data) return data.map(mapRowToMovement);
  }
  return mockMovements
    .filter((m) => m.productId === productId)
    .slice(offset, offset + limit);
}

// ============================================================
// Alert helpers
// ============================================================

async function getAlertForProduct(productId: string): Promise<InventoryAlert | null> {
  const admin = createAdminClient();
  if (isSupabaseAdminConfigured && admin) {
    const { data } = await admin
      .from("inventory_alerts")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();
    if (data) {
      return {
        id: data.id as string,
        productId: data.product_id as string,
        minStock: data.min_stock as number,
        isActive: data.is_active as boolean,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      };
    }
  }
  return mockAlerts.find((a) => a.productId === productId) ?? null;
}

function getDefaultMinStock(): number {
  return MOCK_LOW_STOCK_THRESHOLD;
}

// ============================================================
// Event publishing helpers
// ============================================================

function publishInventoryUpdated(
  productId: string,
  operation: string,
  quantity: number,
  stockBefore: number,
  stockAfter: number,
  reason: string,
  performedBy: string
): void {
  const payload: InventoryUpdatedPayload = {
    entityType: "product",
    entityId: productId,
    operation,
    quantity,
    stockBefore,
    stockAfter,
    reason,
    performedBy,
  };
  EventBus.publish(EventTypes.INVENTORY_UPDATED, payload);

  const alert = mockAlerts.find((a) => a.productId === productId);
  const minStock = alert?.minStock ?? getDefaultMinStock();

  if (stockAfter <= minStock && stockAfter > 0) {
    EventBus.publish(EventTypes.INVENTORY_LOW_STOCK, {
      entityType: "product",
      entityId: productId,
      previousStock: stockBefore,
      newStock: stockAfter,
      quantity,
    });
  }

  if (stockAfter === 0) {
    EventBus.publish(EventTypes.INVENTORY_OUT_OF_STOCK, {
      entityType: "product",
      entityId: productId,
      previousStock: stockBefore,
      newStock: stockAfter,
      quantity,
    });
  }
}

// ============================================================
// InventoryService
// ============================================================

export const InventoryService = {
  async getDashboard(): Promise<InventoryDashboard> {
    const admin = createAdminClient();
    let products: Product[] = [];

    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin.from("products").select("*").eq("is_active", true);
      if (data) products = data as unknown as Product[];
    } else {
      products = mockProducts.filter((p) => p.isActive);
    }

    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    let lowStockCount = 0;
    const stockSummary = await Promise.all(
      products.slice(0, 100).map(async (product) => {
        const alert = await getAlertForProduct(product.id);
        const minStock = alert?.minStock ?? getDefaultMinStock();
        if (product.stock > 0 && product.stock <= minStock) lowStockCount++;
        return {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          stock: product.stock,
          minStock,
          gradientFrom: product.gradientFrom,
          gradientTo: product.gradientTo,
        };
      })
    );

    let recentMovements: InventoryMovement[] = [];
    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin
        .from("inventory_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) recentMovements = data.map(mapRowToMovement);
    } else {
      recentMovements = mockMovements.slice(0, 10);
    }

    return {
      totalProducts: products.length,
      totalStock,
      lowStockCount,
      outOfStockCount,
      recentMovements,
      stockSummary,
    };
  },

  async getMovements(filters?: {
    productId?: string;
    operation?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ movements: InventoryMovement[]; total: number }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const admin = createAdminClient();
    if (isSupabaseAdminConfigured && admin) {
      let query = admin.from("inventory_movements").select("*", { count: "exact" });
      if (filters?.productId) query = query.eq("product_id", filters.productId);
      if (filters?.operation) query = query.eq("operation", filters.operation);
      const { data, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      return {
        movements: data ? data.map(mapRowToMovement) : [],
        total: count ?? 0,
      };
    }

    let filtered = [...mockMovements];
    if (filters?.productId) filtered = filtered.filter((m) => m.productId === filters.productId);
    if (filters?.operation) filtered = filtered.filter((m) => m.operation === filters.operation);
    return {
      movements: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
    };
  },

  async addStock(
    productId: string,
    quantity: number,
    reason: string,
    performedBy: string,
    options?: {
      reference?: string | null;
      notes?: string | null;
      supplier?: string | null;
    }
  ): Promise<InventoryMovement> {
    const product = await getProduct(productId);
    if (!product) throw new Error("Product not found");

    const stockBefore = product.stock;
    const stockAfter = stockBefore + quantity;
    const operation: InventoryOperation = options?.supplier ? "purchase_received" : "added";

    await updateProductStock(productId, stockAfter);

    const movement = await insertMovement(
      productId,
      operation,
      quantity,
      stockBefore,
      stockAfter,
      reason,
      performedBy,
      {
        reference: options?.reference,
        notes: options?.notes,
        supplier: options?.supplier,
      }
    );

    publishInventoryUpdated(productId, operation, quantity, stockBefore, stockAfter, reason, performedBy);

    return movement;
  },

  async removeStock(
    productId: string,
    quantity: number,
    reason: string,
    performedBy: string,
    options?: {
      reference?: string | null;
      notes?: string | null;
    }
  ): Promise<InventoryMovement> {
    const product = await getProduct(productId);
    if (!product) throw new Error("Product not found");

    const stockBefore = product.stock;
    const stockAfter = Math.max(0, stockBefore - quantity);

    if (stockAfter === stockBefore && quantity > 0) {
      throw new Error("Insufficient stock: product is already at 0");
    }

    await updateProductStock(productId, stockAfter);

    const operation: InventoryOperation = "removed";
    const movement = await insertMovement(
      productId,
      operation,
      quantity,
      stockBefore,
      stockAfter,
      reason,
      performedBy,
      {
        reference: options?.reference,
        notes: options?.notes,
      }
    );

    publishInventoryUpdated(productId, operation, quantity, stockBefore, stockAfter, reason, performedBy);

    return movement;
  },

  async adjustStock(
    productId: string,
    newStock: number,
    reason: string,
    performedBy: string,
    options?: {
      notes?: string | null;
    }
  ): Promise<InventoryMovement> {
    const product = await getProduct(productId);
    if (!product) throw new Error("Product not found");

    const stockBefore = product.stock;
    const stockAfter = Math.max(0, newStock);
    const delta = stockAfter - stockBefore;

    if (delta === 0) throw new Error("No adjustment needed: stock is already at the target value");

    await updateProductStock(productId, stockAfter);

    const movement = await insertMovement(
      productId,
      "adjusted",
      delta,
      stockBefore,
      stockAfter,
      reason,
      performedBy,
      {
        notes: options?.notes,
      }
    );

    publishInventoryUpdated(productId, "adjusted", delta, stockBefore, stockAfter, reason, performedBy);

    return movement;
  },

  async getLowStock(): Promise<
    Array<{
      product: Product;
      currentStock: number;
      minStock: number;
    }>
  > {
    const admin = createAdminClient();
    let products: Product[] = [];

    if (isSupabaseAdminConfigured && admin) {
      const { data } = await admin.from("products").select("*").eq("is_active", true);
      if (data) products = data as unknown as Product[];
    } else {
      products = mockProducts.filter((p) => p.isActive);
    }

    const result: Array<{ product: Product; currentStock: number; minStock: number }> = [];

    for (const product of products) {
      const alert = await getAlertForProduct(product.id);
      const minStock = alert?.minStock ?? getDefaultMinStock();
      if (product.stock <= minStock && product.stock >= 0) {
        result.push({ product, currentStock: product.stock, minStock });
      }
    }

    result.sort((a, b) => a.currentStock - b.currentStock);
    return result;
  },

  async getProductInventory(
    productId: string
  ): Promise<{
    product: Product | null;
    recentMovements: InventoryMovement[];
    alert: InventoryAlert | null;
  }> {
    const product = await getProduct(productId);
    const recentMovements = await getMovementsForProduct(productId, 20);
    const alert = await getAlertForProduct(productId);
    return { product, recentMovements, alert };
  },
};