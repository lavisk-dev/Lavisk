import "server-only";
import { Resend } from "resend";
import { isEnvConfigured, formatCurrency } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/constants";
import type { Order } from "@/lib/types";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <orders@example.com>`;
const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

export const isResendConfigured = isEnvConfigured(apiKey);

function getClient(): Resend | null {
  if (!isResendConfigured) return null;
  return new Resend(apiKey);
}

function itemsRows(order: Order): string {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#241016;font-size:14px">${item.name} × ${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;color:#241016;font-size:14px">${formatCurrency(
            item.price * item.quantity
          )}</td>
        </tr>`
    )
    .join("");
}

function baseTemplate(title: string, bodyHtml: string): string {
  return `
  <div style="background:#FFF5F7;padding:32px;font-family:'Helvetica Neue',Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden">
      <div style="background:linear-gradient(160deg,#FF4C82,#FF8FA3);padding:28px 32px;color:#fff">
        <div style="font-size:22px;font-weight:800">${BRAND_NAME}.</div>
        <div style="margin-top:4px;font-size:15px;opacity:.9">${title}</div>
      </div>
      <div style="padding:28px 32px">${bodyHtml}</div>
    </div>
  </div>`;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  const client = getClient();
  if (!client) return;

  const html = baseTemplate(
    `Order confirmed — ${order.orderNumber}`,
    `
      <p style="font-size:15px;color:#241016">Hi ${order.customerName}, thank you for your order! Here's your summary:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">${itemsRows(order)}</table>
      <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid #FFDCE6;font-weight:700;font-size:16px;color:#241016">
        <span>Total</span><span>${formatCurrency(order.total)}</span>
      </div>
      <p style="margin-top:24px;font-size:13px;color:#7A5560">We'll email you again once it ships. Wrapped with love, ${BRAND_NAME}.</p>
    `
  );

  await client.emails.send({
    from: fromEmail,
    to: order.customerEmail,
    subject: `Your ${BRAND_NAME} order is confirmed — ${order.orderNumber}`,
    html,
  });
}

export async function sendAdminOrderNotification(order: Order): Promise<void> {
  const client = getClient();
  if (!client || !adminEmail) return;

  const html = baseTemplate(
    `New order — ${order.orderNumber}`,
    `
      <p style="font-size:15px;color:#241016">${order.customerName} (${order.customerEmail}) just placed an order.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">${itemsRows(order)}</table>
      <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid #FFDCE6;font-weight:700;font-size:16px;color:#241016">
        <span>Total</span><span>${formatCurrency(order.total)}</span>
      </div>
    `
  );

  await client.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `New order: ${order.orderNumber} — ${formatCurrency(order.total)}`,
    html,
  });
}

export async function sendContactAcknowledgement(to: string, name: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  const html = baseTemplate(
    "We got your message",
    `<p style="font-size:15px;color:#241016">Hi ${name}, thanks for reaching out — our team will get back to you within one business day.</p>`
  );

  await client.emails.send({
    from: fromEmail,
    to,
    subject: `We received your message — ${BRAND_NAME}`,
    html,
  });
}
