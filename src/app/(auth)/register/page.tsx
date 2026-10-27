import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton, RegisterForm } from "@/components/auth/AuthForms";
import { googleEnabled } from "@/server/auth";

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
  const { callbackUrl } = await searchParams;
  const cb = typeof callbackUrl === "string" ? callbackUrl : "/account";
  return (
    <>
      <div className="mt-6 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton callbackUrl={cb} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        <RegisterForm callbackUrl={cb} />
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
