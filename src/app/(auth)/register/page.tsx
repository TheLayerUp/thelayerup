import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton, RegisterForm } from "@/components/auth/AuthForms";
import { googleEnabled } from "@/server/auth";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Faster checkout, order history and tracking.</p>
      <Suspense>
        <Forms searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Forms({ searchParams }: Pick<PageProps<"/register">, "searchParams">) {
  const { callbackUrl, ref } = await searchParams;
  const cb = typeof callbackUrl === "string" ? callbackUrl : "/account";
  const referral = typeof ref === "string" ? ref.slice(0, 20) : undefined;
  return (
    <>
      {referral && (
        <p className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary-strong">
          🎁 A friend invited you. Sign up with email to get {site.referral.friendPercent}% off your first order.
        </p>
      )}
      <div className="mt-6 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton callbackUrl={cb} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        <RegisterForm callbackUrl={cb} referral={referral} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(cb)}`}
          className="font-medium text-primary-strong hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
