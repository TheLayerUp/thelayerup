import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import type { Order, OrderItem } from "@prisma/client";
import { site } from "@/config/site";
import { formatPrice } from "@/lib/utils";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM || `${site.name} <orders@thelayerup.in>`;

// Without Resend (local dev / CI) emails go to .dev-outbox/outbox.jsonl so you
// — and the E2E tests — can read them. Never used in production.
const OUTBOX = path.join(process.cwd(), ".dev-outbox", "outbox.jsonl");

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.info(`[email:dev] to=${to} subject="${subject}" (set RESEND_API_KEY to send)`);
    if (process.env.NODE_ENV !== "production") {
      await mkdir(path.dirname(OUTBOX), { recursive: true });
      await appendFile(OUTBOX, JSON.stringify({ at: new Date().toISOString(), to, subject, html }) + "\n");
    }
    return;
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message);
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5ece5;font-family:Inter,Arial,sans-serif;color:#1c120c">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:800;margin-bottom:24px">The<span style="color:#fe5a35">LayerUp</span></div>
    <div style="background:#fffaf7;border:1px solid #dcccc0;border-radius:16px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:12px;color:#78604f;margin-top:24px">${escape(site.tagline)}</p>
  </div></body></html>`;
}

export async function sendOrderConfirmation(order: Order & { items: OrderItem[] }) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${escape(i.productName)} × ${i.quantity}</td><td style="text-align:right">${formatPrice(i.priceAtPurchase * i.quantity)}</td></tr>`
    )
    .join("");
  const body = `
    <p>Thanks for your order! We're getting your prints ready.</p>
    <p><strong>Order ${order.orderNumber}</strong></p>
    <table style="width:100%;font-size:14px;border-collapse:collapse">${rows}
      <tr><td style="padding-top:12px;border-top:1px solid #dcccc0">Shipping</td><td style="text-align:right;padding-top:12px;border-top:1px solid #dcccc0">${order.shippingCost ? formatPrice(order.shippingCost) : "Free"}</td></tr>
      ${order.discount ? `<tr><td>Discount</td><td style="text-align:right">−${formatPrice(order.discount)}</td></tr>` : ""}
      <tr><td style="font-weight:700;padding-top:6px">Total</td><td style="text-align:right;font-weight:700">${formatPrice(order.total)}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${site.url}/track?order=${order.orderNumber}" style="background:#fe5a35;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Track your order</a></p>`;
  await send(order.email, `Order confirmed — ${order.orderNumber}`, layout("Order confirmed 🎉", body));
}

export async function sendStatusUpdate(order: Order, headline: string, detail: string) {
  const body = `<p>${escape(detail)}</p>
    <p style="margin-top:20px"><a href="${site.url}/track?order=${order.orderNumber}" style="background:#fe5a35;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Track order ${order.orderNumber}</a></p>`;
  await send(order.email, `${headline} — ${order.orderNumber}`, layout(headline, body));
}

export async function sendPasswordReset(to: string, link: string) {
  if (!resend && process.env.NODE_ENV !== "production") {
    console.info(`[email:dev] password reset link for ${to}: ${link}`);
  }
  const body = `<p>We received a request to reset your password. This link works for 1 hour.</p>
    <p style="margin-top:20px"><a href="${escape(link)}" style="background:#fe5a35;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Choose a new password</a></p>
    <p style="font-size:13px;color:#78604f;margin-top:20px">Didn't ask for this? You can ignore this email — your password won't change.</p>`;
  await send(to, `Reset your ${site.name} password`, layout("Reset your password", body));
}

/** Heads-up to the shop owner (STORE_NOTIFY_EMAIL). Never throws. */
export async function notifyStore(subject: string, text: string, adminPath: string) {
  const to = process.env.STORE_NOTIFY_EMAIL;
  if (!to) return;
  const body = `<p style="white-space:pre-wrap">${escape(text)}</p>
    <p style="margin-top:20px"><a href="${site.url}${adminPath}" style="background:#1c120c;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open in admin</a></p>`;
  await send(to, `[${site.name}] ${subject}`, layout(subject, body)).catch((e) =>
    console.error("[email] store notification failed", e)
  );
}
