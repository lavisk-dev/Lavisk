# API Reference

## Response Format

All API responses follow the same shape:

```typescript
// Success
{ "success": true, "data": T }

// Error
{ "success": false, "error": "message" }
```

## Storefront API

### Products

#### GET /api/products
List products with filters.

Query parameters:
- `category` — filter by category slug
- `search` — full-text search on name
- `featured` — boolean string
- `trending` — boolean string
- `minPrice` — minimum price
- `maxPrice` — maximum price
- `sort` — `newest` | `price-asc` | `price-desc` | `rating`
- `page` — page number (default: 1)
- `pageSize` — items per page (default: 24)

#### GET /api/products/[slug]
Get a single product by slug.

#### GET /api/products/id?id={id}
Get a single product by ID.

### Categories

#### GET /api/categories
List all categories.

### Cart

#### POST /api/cart
Price cart items server-side.

Body:
```json
{ "items": [{ "productId": "string", "quantity": number }] }
```

### Orders

#### GET /api/orders?orderNumber={orderNumber}
Look up an order by its order number.

#### POST /api/orders
Create an order directly (admin or COD use).

Body: CheckoutInput schema (full checkout data)

### Coupons

#### POST /api/coupons/validate
Validate a coupon code.

Body:
```json
{ "code": "WELCOME10", "subtotal": 649 }
```

### Reviews

#### GET /api/reviews?productId={productId}
Get approved reviews for a product.

#### POST /api/reviews
Submit a new review.

Body:
```json
{
  "productId": "string",
  "customerName": "string",
  "rating": 1-5,
  "comment": "string (max 500)"
}
```

### Contact

#### POST /api/contact
Submit a contact form.

Body:
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

### Payment

#### POST /api/payment/create-order
Create a payment order + pending internal order.

Body: CreatePaymentOrderInput

#### POST /api/payment/verify
Verify payment after checkout completion.

Body:
```json
{
  "orderId": "string",
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "razorpaySignature": "string"
}
```

### Webhooks

#### POST /api/webhooks/razorpay
Razorpay webhook handler for async payment notifications.

## Admin API

All admin endpoints require admin session cookie.

### POST /api/admin/auth
Admin login.

Body:
```json
{ "username": "string", "password": "string" }
```

### GET /api/admin/dashboard
Get dashboard statistics (revenue, orders, top products, etc.).

### GET /api/admin/products
List all products (including inactive).

### POST /api/admin/products
Create a product.

Body: ProductInput schema

### PUT /api/admin/products?id={id}
Update a product.

### DELETE /api/admin/products?id={id}
Delete a product.

### GET /api/admin/orders
List all orders with pagination and status filter.

Query params: `status`, `page`, `pageSize`

### GET /api/admin/orders/[id]
Get order detail with timeline.

### PUT /api/admin/orders/[id]
Update order status.

Body:
```json
{ "status": "dispatched" }
```

### PATCH /api/admin/orders/status
Update order status with note.

Body:
```json
{
  "orderId": "o_1234",
  "status": "dispatched",
  "note": "Handed to BlueDart, tracking: BD-9876"
}
```

### POST /api/admin/orders/cancel
Cancel an order and restore inventory.

Body:
```json
{
  "orderId": "o_1234",
  "reason": "Customer requested cancellation"
}
```

### POST /api/admin/orders/refund
Refund a cancelled order.

Body:
```json
{
  "orderId": "o_1234",
  "reason": "Processing refund"
}
```

### GET /api/admin/orders/timeline
Get timeline entries for an order.

Query params: `orderId`

### GET /api/admin/categories
List all categories.

### POST /api/admin/categories
Create a category.

### PUT /api/admin/categories?id={id}
Update a category.

### DELETE /api/admin/categories?id={id}
Delete a category.

### GET /api/admin/coupons
List all coupons.

### POST /api/admin/coupons
Create a coupon.

### PUT /api/admin/coupons?id={id}
Update a coupon.

### DELETE /api/admin/coupons?id={id}
Delete a coupon.

### GET /api/admin/banners
List all banners.

### POST /api/admin/banners
Create a banner.

### PUT /api/admin/banners?id={id}
Update a banner.

### DELETE /api/admin/banners?id={id}
Delete a banner.

### GET /api/admin/reviews
List all reviews (for moderation).

### PUT /api/admin/reviews?id={id}
Approve or reject a review.

### GET /api/admin/customers
List all customers.

### POST /api/admin/upload
Upload an image to Cloudinary.

Body: FormData with `file` field

## Inventory API

All inventory endpoints require admin session cookie.

### GET /api/admin/inventory
Get inventory dashboard data (total products, stock summary, low stock count, recent movements).

### GET /api/admin/inventory/movements
List all inventory movements (paginated).

Query params: `productId`, `operation`, `page`, `pageSize`

### POST /api/admin/inventory/add-stock
Add stock to a product.

Body:
```json
{
  "productId": "p1",
  "quantity": 10,
  "reason": "Purchase received",
  "reference": "PO-001",
  "notes": "...",
  "supplier": "ABC Corp"
}
```

### POST /api/admin/inventory/remove-stock
Remove stock from a product.

Body:
```json
{
  "productId": "p1",
  "quantity": 5,
  "reason": "Damaged in warehouse",
  "notes": "..."
}
```

### POST /api/admin/inventory/adjust-stock
Set stock to an exact quantity.

Body:
```json
{
  "productId": "p1",
  "newStock": 25,
  "reason": "Physical count adjustment",
  "notes": "..."
}
```

### GET /api/admin/inventory/low-stock
Returns products with stock at or below their alert threshold.

### GET /api/admin/inventory/product/[productId]
Returns inventory details and movement history for a specific product.
