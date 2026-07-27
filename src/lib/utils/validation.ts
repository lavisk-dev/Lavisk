import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2, "Please enter a full name"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  line1: z.string().min(3, "Please enter your street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Please enter your city"),
  state: z.string().min(2, "Please enter your state"),
  postalCode: z.string().min(3, "Please enter your postal code"),
  country: z.string().min(2, "Please enter your country"),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Please enter your name"),
  customerEmail: z.string().email("Please enter a valid email"),
  customerPhone: z.string().min(7, "Please enter a valid phone number"),
  shippingAddress: addressSchema,
  items: z.array(cartLineSchema).min(1, "Your cart is empty"),
  couponCode: z.string().optional(),
  giftNote: z.string().max(300).optional(),
});

export const createPaymentOrderSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  couponCode: z.string().optional(),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    shippingAddress: addressSchema,
    giftNote: z.string().max(300).optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(2, "Please add a subject"),
  message: z.string().min(5, "Please write a short message"),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(500),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

export const collectionSchema = z.object({
  name: z.string().min(2, "Collection name is required"),
  slug: z.string().optional(),
  description: z.string().min(2, "Description is required"),
  bannerImage: z.string().nullable().optional(),
  thumbnailImage: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(2),
  story: z.string().optional().default(""),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).nullable().optional(),
  tag: z.string().nullable().optional(),
  categorySlug: z.string().min(1),
  collectionSlug: z.string().nullable().optional(),
  gradientFrom: z.string().default("#FFB6C9"),
  gradientTo: z.string().default("#FF8FA3"),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  images: z
    .array(z.object({ url: z.string().url(), publicId: z.string(), alt: z.string().optional(), isPrimary: z.boolean().optional(), sortOrder: z.number().int().optional() }))
    .default([]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;

// ============================================================
// Inventory schemas
// ============================================================

export const addStockSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(2, "Reason is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  supplier: z.string().optional(),
});

export const removeStockSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(2, "Reason is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const adjustStockSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  newStock: z.number().int().min(0, "Stock cannot be negative"),
  reason: z.string().min(2, "Reason is required"),
  notes: z.string().optional(),
});

export type AddStockInput = z.infer<typeof addStockSchema>;
export type RemoveStockInput = z.infer<typeof removeStockSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;