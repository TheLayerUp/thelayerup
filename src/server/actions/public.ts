"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { prisma } from "@/server/db";
import { signIn } from "@/server/auth";
import { contactSchema, customOrderSchema, registerSchema } from "@/lib/validators";
import { RATE_LIMITED, isBot, rateLimit } from "@/server/security/rate-limit";
import { notifyStore, sendCustomerNote, sendPasswordReset } from "@/server/email";
import { emailCopy } from "@/server/email-copy";
import { estimateDelivery } from "@/server/shipping/shiprocket";
import { applyReferral } from "@/server/services/referrals";
import { site } from "@/config/site";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

function formObject(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, typeof v === "string" ? v : ""])
  );
}

export async function subscribeNewsletter(_: FormState, formData: FormData): Promise<FormState> {
  const ok: FormState = { ok: true, message: "You're in! Watch your inbox for new drops." };
  if (isBot(formData)) return ok;
  if (!(await rateLimit("newsletter"))) return { ok: false, message: RATE_LIMITED };
  const parsed = z.email().safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
  );
  if (!parsed.success) return { ok: false, message: "Enter a valid email." };
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data },
    create: { email: parsed.data },
    update: {},
  });
  return ok;
}

export async function submitContact(_: FormState, formData: FormData): Promise<FormState> {
  const ok: FormState = { ok: true, message: "Thanks! We'll get back to you within a day." };
  if (isBot(formData)) return ok;
  const parsed = contactSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (!(await rateLimit("contact"))) return { ok: false, message: RATE_LIMITED };
  const msg = await prisma.contactMessage.create({
    data: { ...parsed.data, phone: parsed.data.phone || null },
  });
  await notifyStore(
    `New message: ${msg.subject}`,
    `${msg.name} <${msg.email}> wrote:\n\n${msg.message}`,
    "/admin/requests"
  );
  return ok;
}

export async function submitCustomOrder(_: FormState, formData: FormData): Promise<FormState> {
  const ok: FormState = { ok: true, message: "Request received! We'll send you a quote within 24 hours." };
  if (isBot(formData)) return ok;
  const parsed = customOrderSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (!(await rateLimit("customOrder"))) return { ok: false, message: RATE_LIMITED };
  const d = parsed.data;
  await prisma.customOrder.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone,
      description: d.description,
      material: d.material || null,
      quantity: d.quantity,
      budget: d.budget || null,
      deadline: d.deadline || null,
      fileUrl: d.fileUrl || null,
      kind: d.kind,
      company: d.company || null,
    },
  });
  await notifyStore(
    `New ${d.kind === "BULK" ? "bulk order" : "custom print"} request from ${d.name}${d.company ? ` (${d.company})` : ""}`,
    `${d.name} (${d.email}, ${d.phone}) — qty ${d.quantity}${d.budget ? `, budget ${d.budget}` : ""}\n\n${d.description}`,
    "/admin/requests"
  );
  return ok;
}

function safeRedirect(target: FormDataEntryValue | null) {
  const s = typeof target === "string" ? target : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/account";
}

export async function registerUser(_: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: false, message: "Something went wrong." };
  const parsed = registerSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (!(await rateLimit("register"))) return { ok: false, message: RATE_LIMITED };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { ok: false, errors: { email: "An account with this email already exists. Try signing in." } };
  }
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      locale: formData.get("lang") === "hi" ? "hi" : "en",
    },
  });

  const ref = String(formData.get("ref") ?? "");
  if (ref) {
    // A bad or unknown code must never block sign-up.
    try {
      const welcome = await applyReferral(user.id, ref);
      if (welcome) {
        const r = site.referral;
        const c = emailCopy(user.locale);
        await sendCustomerNote(
          user.email,
          c.welcomeSubject(r.friendPercent),
          c.welcomeText(r.friendPercent, r.friendMaxDiscount, welcome),
          { label: c.startShopping, path: "/products" }
        );
      }
    } catch (err) {
      console.error("[referral] apply failed", err);
    }
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: safeRedirect(formData.get("callbackUrl")),
  });
  return { ok: true };
}

export async function loginUser(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  // Limit per IP and per account, so one attacker can't spray many accounts
  // and many IPs can't hammer one account.
  if (!(await rateLimit("login")) || !(await rateLimit("login", `acct:${email}`))) {
    return { ok: false, message: RATE_LIMITED };
  }
  try {
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
    return { ok: true };
  } catch (error) {
    // signIn throws a redirect on success, which must propagate.
    if (error instanceof AuthError) {
      return { ok: false, message: "Incorrect email or password." };
    }
    throw error;
  }
}

export async function loginWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeRedirect(formData.get("callbackUrl")) });
}

// ── Password reset ────────────────────────────────────────────────────────

const RESET_TTL_MS = 60 * 60 * 1000;
const resetId = (email: string) => `reset:${email}`;
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  // Same answer whether or not the account exists, so emails can't be enumerated.
  const done: FormState = {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way. It expires in 1 hour.",
  };
  const parsed = z.email().safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
  );
  if (!parsed.success) return { ok: false, message: "Enter a valid email." };
  const email = parsed.data;
  if (!(await rateLimit("passwordReset")) || !(await rateLimit("passwordReset", `acct:${email}`))) {
    return { ok: false, message: RATE_LIMITED };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return done;

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: resetId(email) } }),
    prisma.verificationToken.create({
      data: { identifier: resetId(email), token: sha256(token), expires: new Date(Date.now() + RESET_TTL_MS) },
    }),
  ]);
  const link = `${site.url}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
  await sendPasswordReset(email, link, user?.locale).catch((e) => console.error("[email] reset", e));
  return done;
}

const resetSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  token: z.string().min(20),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { email, token, password } = parsed.data;
  if (!(await rateLimit("passwordReset"))) return { ok: false, message: RATE_LIMITED };

  const record = await prisma.verificationToken.findUnique({ where: { token: sha256(token) } });
  if (!record || record.identifier !== resetId(email) || record.expires < new Date()) {
    return { ok: false, message: "This reset link is invalid or has expired. Please request a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { passwordHash: await bcrypt.hash(password, 12) } }),
    prisma.verificationToken.deleteMany({ where: { identifier: resetId(email) } }),
  ]);

  await signIn("credentials", { email, password, redirectTo: "/account" });
  return { ok: true };
}

export type PincodeResult = { ok: boolean; message: string };

// Printing happens before the parcel is handed to the courier.
const PRINT_DAYS = { min: 2, max: 4 };

/** "Check delivery" on the product page. Uses live Shiprocket ETAs when configured. */
export async function checkPincode(pincode: string): Promise<PincodeResult> {
  if (!/^[1-9]\d{5}$/.test(pincode)) return { ok: false, message: "Enter a valid 6-digit pincode." };
  if (!(await rateLimit("pincode"))) return { ok: false, message: RATE_LIMITED };

  const estimate = await estimateDelivery(pincode);
  if (estimate && !estimate.serviceable) {
    return { ok: false, message: `Couriers don't reach ${pincode} yet. Message us and we'll find a way.` };
  }
  const transit = estimate?.transitDays;
  const range = transit
    ? `${PRINT_DAYS.min + transit}–${PRINT_DAYS.max + transit} days`
    : "3–7 business days after printing";
  return { ok: true, message: `Delivers to ${pincode} in ${range}.` };
}
