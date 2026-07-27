import "server-only";
import { BRAND_NAME, SITE_URL } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";

// ============================================================
// Reusable components
// ============================================================

function header(title: string): string {
  return `
    <div style="background:linear-gradient(160deg,#FF4C82,#FF8FA3);padding:32px 40px;color:#fff">
      <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px">${BRAND_NAME}.</div>
      <div style="margin-top:6px;font-size:15px;opacity:.9">${title}</div>
    </div>`;
}

function footer(): string {
  return `
    <div style="padding:24px 40px;text-align:center;border-top:1px solid #FFDCE6">
      <p style="margin:0 0 8px;font-size:12px;color:#7A5560">
        ${BRAND_NAME} — Wrapped with love.
      </p>
      <p style="margin:0;font-size:11px;color:#B08D98">
        <a href="${SITE_URL}" style="color:#FF4C82;text-decoration:none">Visit our store</a>
      </p>
    </div>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;color:#241016;font-size:14px;border-bottom:1px solid #FFDCE6">
            ${item.name} <span style="color:#7A5560">× ${item.quantity}</span>
          </td>
          <td style="padding:10px 0;text-align:right;color:#241016;font-size:14px;border-bottom:1px solid #FFDCE6">
            ${formatCurrency(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <thead>
        <tr>
          <th style="padding:8px 0;text-align:left;font-size:12px;color:#7A5560;text-transform:uppercase;letter-spacing:0.5px">Item</th>
          <th style="padding:8px 0;text-align:right;font-size:12px;color:#7A5560;text-transform:uppercase;letter-spacing:0.5px">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:16px;padding-top:16px;border-top:2px solid #241016">
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px;color:#241016">
        <span>Total</span>
        <span>${formatCurrency(order.total)}</span>
      </div>
    </div>`;
}

function button(url: string, label: string): string {
  return `
    <div style="text-align:center;margin-top:24px">
      <a href="${url}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:#241016;color:#fff;font-size:15px;font-weight:700;text-decoration:none">
        ${label}
      </a>
    </div>`;
}

function wrapper(title: string, bodyHtml: string): string {
  return `
    <div style="background:#FFF5F7;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
        ${header(title)}
        <div style="padding:32px 40px;color:#241016;font-size:15px;line-height:1.6">
          ${bodyHtml}
        </div>
        ${footer()}
      </div>
    </div>`;
}

// ============================================================
// Customer templates
// ============================================================

export function orderConfirmationEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Your ${BRAND_NAME} order is confirmed — ${order.orderNumber}`,
    html: wrapper(
      `Order confirmed — ${order.orderNumber}`,
      `
        <p>Hi ${order.customerName}, thank you for your order!</p>
        <p style="color:#7A5560">We're wrapping your items with care and will email you once they're on the way.</p>
        ${itemsTable(order)}
        ${button(`${SITE_URL}/order-success?orderId=${order.id}`, "View your order")}
      `
    ),
  };
}

export function paymentSuccessEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Payment received — ${order.orderNumber}`,
    html: wrapper(
      `Payment confirmed — ${order.orderNumber}`,
      `
        <p>Hi ${order.customerName}, your payment of ${formatCurrency(order.total)} was successful.</p>
        <p style="color:#7A5560">Your order is now being prepared.</p>
        ${itemsTable(order)}
      `
    ),
  };
}

export function paymentFailedEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Payment failed — ${order.orderNumber}`,
    html: wrapper(
      `Payment unsuccessful — ${order.orderNumber}`,
      `
        <p>Hi ${order.customerName}, unfortunately your payment could not be processed.</p>
        <p style="color:#7A5560">Please try again or use a different payment method. Your items are still reserved for you.</p>
        ${itemsTable(order)}
        ${button(`${SITE_URL}/checkout?retry=${order.id}`, "Retry payment")}
      `
    ),
  };
}

export function orderDispatchedEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Your ${BRAND_NAME} order is on its way — ${order.orderNumber}`,
    html: wrapper(
      `On its way — ${order.orderNumber}`,
      `
        <p>Hi ${order.customerName}, your order has been dispatched!</p>
        <p style="color:#7A5560">Get ready — your wrapped goodies are heading your way.</p>
        ${itemsTable(order)}
      `
    ),
  };
}

export function orderDeliveredEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Delivered — ${order.orderNumber}`,
    html: wrapper(
      `Delivered — ${order.orderNumber}`,
      `
        <p>Hi ${order.customerName}, your order has been delivered!</p>
        <p style="color:#7A5560">We hope you love everything. If anything isn't perfect, just reply to this email.</p>
        ${itemsTable(order)}
      `
    ),
  };
}

export function refundProcessedEmail(order: Order, amount: number): { subject: string; html: string } {
  return {
    subject: `Refund processed — ${order.orderNumber}`,
    html: wrapper(
      `Refund processed — ${order.orderNumber}`,
      `
        <p>Hi ${order.customerName}, we've processed your refund of ${formatCurrency(amount)}.</p>
        <p style="color:#7A5560">The amount should appear in your account within 5-7 business days.</p>
        ${itemsTable(order)}
      `
    ),
  };
}

export function orderCancelledEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Order cancelled — ${order.orderNumber}`,
    html: wrapper(
      `Cancelled — ${order.orderNumber}`,
      `
        <p>Hi ${order.customerName}, your order has been cancelled as requested.</p>
        <p style="color:#7A5560">If you have any questions, please reach out to our support team.</p>
        ${itemsTable(order)}
      `
    ),
  };
}

// ============================================================
// Admin templates
// ============================================================

export function adminNewOrderEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `New order: ${order.orderNumber} — ${formatCurrency(order.total)}`,
    html: wrapper(
      `New order received`,
      `
        <p><strong>${order.customerName}</strong> (${order.customerEmail}) just placed an order.</p>
        ${itemsTable(order)}
        <p style="margin-top:16px;padding:12px;background:#FFF5F7;border-radius:12px;font-size:13px;color:#7A5560">
          Phone: ${order.customerPhone}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state}
        </p>
      `
    ),
  };
}

export function adminPaymentFailedEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Payment failed — ${order.orderNumber}`,
    html: wrapper(
      `Payment failed — Attention required`,
      `
        <p>Payment for order <strong>${order.orderNumber}</strong> by ${order.customerName} (${order.customerEmail}) has failed.</p>
        ${itemsTable(order)}
      `
    ),
  };
}

export function adminLowStockEmail(productName: string, stock: number): { subject: string; html: string } {
  return {
    subject: `Low stock alert: ${productName}`,
    html: wrapper(
      `Low stock alert`,
      `
        <p><strong>${productName}</strong> is running low — only <strong>${stock}</strong> units remaining.</p>
        ${button(`${SITE_URL}/admin/inventory`, "View inventory")}
      `
    ),
  };
}

export function adminOutOfStockEmail(productName: string): { subject: string; html: string } {
  return {
    subject: `Out of stock: ${productName}`,
    html: wrapper(
      `Out of stock`,
      `
        <p><strong>${productName}</strong> is now out of stock.</p>
        ${button(`${SITE_URL}/admin/inventory`, "View inventory")}
      `
    ),
  };
}

export function adminRefundRequestEmail(order: Order, reason: string): { subject: string; html: string } {
  return {
    subject: `Refund requested — ${order.orderNumber}`,
    html: wrapper(
      `Refund request`,
      `
        <p>Refund requested for order <strong>${order.orderNumber}</strong> by ${order.customerName}.</p>
        <p style="padding:12px;background:#FFF5F7;border-radius:12px;font-size:13px">
          Reason: ${reason}
        </p>
        ${itemsTable(order)}
      `
    ),
  };
}

export function adminRefundCompletedEmail(order: Order): { subject: string; html: string } {
  return {
    subject: `Refund completed — ${order.orderNumber}`,
    html: wrapper(
      `Refund completed`,
      `
        <p>Refund for order <strong>${order.orderNumber}</strong> (${order.customerName}) has been processed.</p>
        ${itemsTable(order)}
      `
    ),
  };
}

// ============================================================
// Template router
// ============================================================

export type EmailTemplateResult = { subject: string; html: string };

export function buildEmailTemplate(
  templateType: string,
  order?: Order,
  vars?: Record<string, string | number | boolean | undefined>
): EmailTemplateResult | null {
  switch (templateType) {
    case "order_confirmation":
      return order ? orderConfirmationEmail(order) : null;
    case "payment_success":
      return order ? paymentSuccessEmail(order) : null;
    case "payment_failed":
      return order ? paymentFailedEmail(order) : null;
    case "order_dispatched":
      return order ? orderDispatchedEmail(order) : null;
    case "order_delivered":
      return order ? orderDeliveredEmail(order) : null;
    case "refund_processed":
      return order && vars?.refundAmount ? refundProcessedEmail(order, Number(vars.refundAmount)) : null;
    case "order_cancelled":
      return order ? orderCancelledEmail(order) : null;
    case "admin_new_order":
      return order ? adminNewOrderEmail(order) : null;
    case "admin_payment_failed":
      return order ? adminPaymentFailedEmail(order) : null;
    case "admin_low_stock":
      return vars?.productName ? adminLowStockEmail(String(vars.productName), Number(vars.stock ?? 0)) : null;
    case "admin_out_of_stock":
      return vars?.productName ? adminOutOfStockEmail(String(vars.productName)) : null;
    case "admin_refund_request":
      return order ? adminRefundRequestEmail(order, String(vars?.refundReason ?? "")) : null;
    case "admin_refund_completed":
      return order ? adminRefundCompletedEmail(order) : null;
    default:
      return null;
  }
}