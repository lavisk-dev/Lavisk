// ============================================================
// Shared domain types for Lavisk
// ============================================================

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerImage?: string | null;
  thumbnailImage?: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  gradientFrom: string;
  gradientTo: string;
  blobColor: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  story: string;
  price: number;
  compareAtPrice?: number | null;
  tag?: string | null;
  categorySlug: string;
  collectionSlug?: string | null;
  collectionSlugs?: string[];
  gradientFrom: string;
  gradientTo: string;
  images: ProductImage[];
  rating: number;
  reviewCount: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiresAt?: string | null;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  gradientFrom: string;
  gradientTo: string;
  image?: string | null;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "packed"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "returned";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  billingAddress?: Address | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  shipping: number;
  total: number;
  couponCode?: string | null;
  status: OrderStatus;
  paymentProvider: string;
  paymentOrderId?: string | null;
  paymentId?: string | null;
  giftNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTimelineEntry {
  id: string;
  orderId: string;
  status: string;
  previousStatus: string;
  note?: string | null;
  performedBy: string;
  createdAt: string;
}

export interface OrderDetail extends Order {
  timeline: OrderTimelineEntry[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorRole?: string;
  category: string;
  readingMinutes: number;
  coverColorFrom: string;
  coverColorTo: string;
  coverEmoji: string;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  isPublished: boolean;
  publishedAt: string;
  updatedAt: string;
  faq?: { question: string; answer: string }[];
  keywords?: string[];
}

// ============================================================
// Inventory types
// ============================================================

export type InventoryOperation =
  | "added"
  | "removed"
  | "adjusted"
  | "sale"
  | "return"
  | "damaged"
  | "lost"
  | "purchase_received";

export interface InventoryMovement {
  id: string;
  productId: string;
  operation: InventoryOperation;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  reference?: string | null;
  performedBy: string;
  notes?: string | null;
  supplier?: string | null;
  createdAt: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDashboard {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentMovements: InventoryMovement[];
  stockSummary: Array<{
    productId: string;
    productName: string;
    productSlug: string;
    stock: number;
    minStock: number;
    gradientFrom: string;
    gradientTo: string;
  }>;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChangePct: number;
  ordersChangePct: number;
  recentOrders: Order[];
  topProducts: { product: Product; unitsSold: number }[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Payment types
// ============================================================

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string | null;
  rawResponse?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  type: "capture" | "refund" | "partial_refund";
  amount: number;
  status: "success" | "failed" | "pending";
  providerReference?: string | null;
  rawResponse?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaymentWebhook {
  id: string;
  provider: string;
  eventType: string;
  rawBody: string;
  signature: string;
  isValid: boolean;
  isProcessed: boolean;
  error?: string | null;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: "pending" | "success" | "failed";
  providerRefundId?: string | null;
  rawResponse?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Notification types
// ============================================================

export type NotificationChannel = "email" | "sms" | "push" | "slack" | "telegram" | "teams";

export type NotificationStatus = "queued" | "sending" | "sent" | "failed" | "retry";

export type NotificationEvent =
  | "order.created"
  | "payment.success"
  | "payment.failed"
  | "order.dispatched"
  | "order.delivered"
  | "order.cancelled"
  | "order.refunded"
  | "inventory.low_stock"
  | "inventory.out_of_stock";

export type NotificationTemplateType =
  | "order_confirmation"
  | "payment_success"
  | "payment_failed"
  | "order_dispatched"
  | "order_delivered"
  | "refund_processed"
  | "order_cancelled"
  | "admin_new_order"
  | "admin_payment_failed"
  | "admin_low_stock"
  | "admin_out_of_stock"
  | "admin_refund_request"
  | "admin_refund_completed";

export interface NotificationRecipient {
  email: string;
  name?: string;
}

export interface NotificationRecord {
  id: string;
  event: NotificationEvent;
  templateType: NotificationTemplateType;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  subject: string;
  body: string;
  status: NotificationStatus;
  retryCount: number;
  maxRetries: number;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationTemplateType;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationInput {
  event: NotificationEvent;
  templateType: NotificationTemplateType;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Shipping & Fulfillment types
// ============================================================

export type ShipmentStatus =
  | "pending"
  | "label_generated"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "returned"
  | "lost"
  | "damaged"
  | "cancelled";

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber?: string | null;
  courier: string;
  provider: string;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string | null;
  status: ShipmentStatus;
  pickupStatus: string;
  pickupScheduledAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  estimatedDelivery?: string | null;
  labelUrl?: string | null;
  labelFormat?: string | null;
  packingSlipUrl?: string | null;
  invoiceUrl?: string | null;
  qrCode?: string | null;
  barcode?: string | null;
  shippingCost?: number | null;
  isReturn: boolean;
  returnReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  productId: string;
  name: string;
  quantity: number;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: string;
  location?: string | null;
  description?: string | null;
  courierUpdate?: string | null;
  createdAt: string;
}

export interface ShippingLabel {
  id: string;
  shipmentId: string;
  format: string;
  url?: string | null;
  size?: string;
  createdAt: string;
}

export interface PickupRequest {
  id: string;
  shipmentId: string;
  status: string;
  scheduledAt?: string | null;
  pickupAddress?: string | null;
  pickupTime?: string | null;
  cancelledAt?: string | null;
  retryCount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingProviderConfig {
  id: string;
  name: string;
  isActive: boolean;
  apiKey?: string | null;
  apiSecret?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
}