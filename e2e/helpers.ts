import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export const ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@thelayerup.local",
  password: process.env.SEED_ADMIN_PASSWORD ?? "admin12345",
};

/** A realistic test mobile — Razorpay rejects obvious dummies like 9876543210. */
export const TEST_PHONE = "9840123456";

export function uniqueEmail(tag: string) {
  return `e2e+${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@thelayerup.local`;
}

export function randomPassword() {
  return `Pw-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export async function register(page: Page, opts: { name?: string; email: string; password: string; next?: string }) {
  await page.goto(`/register${opts.next ? `?callbackUrl=${encodeURIComponent(opts.next)}` : ""}`);
  await page.getByLabel("Name").fill(opts.name ?? "E2E Customer");
  await page.getByLabel("Email").fill(opts.email);
  await page.getByLabel("Password").fill(opts.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/register"));
}

export async function login(page: Page, email: string, password: string, next = "/account") {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function fillAddress(page: Page) {
  await page.getByLabel("Mobile number").fill(TEST_PHONE);
  await page.getByLabel("Flat, house no., building, street").fill("12 Test Street, Anna Nagar");
  await page.getByLabel("Pincode").fill("600040");
  await page.getByLabel("City").fill("Chennai");
  await page.getByLabel("State").selectOption("Tamil Nadu");
}

/**
 * Pays for the order on the checkout page, whichever payment mode the server is in:
 * - local test-payment mode (no Razorpay keys), or
 * - real Razorpay TEST checkout → Netbanking → simulated bank "Success".
 * Returns the order number from the success page.
 */
export async function pay(page: Page): Promise<string> {
  const testMode = await page.getByText("Test payment mode.").isVisible();
  if (testMode) {
    await page.getByRole("button", { name: "Place test order" }).click();
  } else {
    await page.getByRole("button", { name: /^Pay ₹/ }).click();
    const rzp = page.frameLocator("iframe.razorpay-checkout-frame");
    await rzp.getByText("Netbanking", { exact: true }).first().click();
    const bankPage = page.context().waitForEvent("page");
    await rzp
      .getByText(/Bank of Baroda - Retail Banking|Punjab National Bank - Retail Banking/)
      .first()
      .click();
    const bank = await bankPage;
    await bank.getByRole("button", { name: /^success$/i }).click();
  }
  await page.waitForURL(/\/checkout\/success\?order=/, { timeout: 90_000 });
  const orderNumber = new URL(page.url()).searchParams.get("order")!;
  expect(orderNumber).toMatch(/^TLU-[A-Z0-9]{6}$/);
  return orderNumber;
}

type OutboxMail = { at: string; to: string; subject: string; html: string };

/** Latest email to `to` from the dev outbox (written when RESEND_API_KEY is unset). */
export async function latestEmail(to: string, subjectIncludes: string, timeoutMs = 15_000): Promise<OutboxMail> {
  const file = path.join(process.cwd(), ".dev-outbox", "outbox.jsonl");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(file)) {
      const mails = readFileSync(file, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l) as OutboxMail)
        .filter((m) => m.to === to && m.subject.includes(subjectIncludes));
      if (mails.length) return mails.at(-1)!;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No "${subjectIncludes}" email for ${to} in .dev-outbox (is RESEND_API_KEY unset?)`);
}

/** Clears rate-limit counters (all E2E traffic comes from one IP). */
export async function resetRateLimits() {
  const prisma = new PrismaClient();
  try {
    await prisma.rateLimit.deleteMany({});
  } finally {
    await prisma.$disconnect();
  }
}
