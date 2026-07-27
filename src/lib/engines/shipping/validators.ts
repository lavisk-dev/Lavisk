import type { CreateShipmentInput } from "./types";
import { ValidationError } from "@/lib/core/errors";

export function validateCreateShipment(input: CreateShipmentInput): void {
  if (!input.orderId) throw new ValidationError("orderId is required");
  if (!input.courier) throw new ValidationError("courier is required");
  if (!input.customerName) throw new ValidationError("customerName is required");
  if (!input.customerPhone) throw new ValidationError("customerPhone is required");
  if (!input.shippingAddress?.line1) throw new ValidationError("shipping address line1 is required");
  if (!input.shippingAddress?.city) throw new ValidationError("shipping address city is required");
  if (!input.shippingAddress?.state) throw new ValidationError("shipping address state is required");
  if (!input.shippingAddress?.postalCode) throw new ValidationError("shipping address postalCode is required");
  if (!input.shippingAddress?.country) throw new ValidationError("shipping address country is required");
  if (!input.items || input.items.length === 0) throw new ValidationError("at least one item is required");
}