import "server-only";
import { ProductService } from "@/lib/services/product.service";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE } from "@/lib/constants";

export interface CartLineInput {
  productId: string;
  quantity: number;
}

export interface PricedCartLine {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  lineTotal: number;
  inStock: boolean;
  availableStock: number;
}

export interface PricedCart {
  lines: PricedCartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  hasIssues: boolean;
}

/**
 * Re-prices a cart against the current database state. Never trust
 * prices sent from the client — this is the source of truth used by
 * the checkout and payment order-creation routes.
 */
export const CartService = {
  async price(items: CartLineInput[]): Promise<PricedCart> {
    const lines: PricedCartLine[] = [];

    for (const item of items) {
      const product = await ProductService.getById(item.productId);
      if (!product) continue;

      const quantity = Math.max(1, Math.min(item.quantity, 20));
      const inStock = product.stock >= quantity;

      lines.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity,
        lineTotal: Math.round(product.price * quantity * 100) / 100,
        inStock,
        availableStock: product.stock,
      });
    }

    const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
    const hasIssues = lines.some((l) => !l.inStock) || lines.length !== items.length;

    return {
      lines,
      subtotal,
      shipping,
      total: Math.round((subtotal + shipping) * 100) / 100,
      hasIssues,
    };
  },
};
