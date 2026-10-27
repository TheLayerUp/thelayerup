import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton, LoginForm } from "@/components/auth/AuthForms";
import { googleEnabled } from "@/server/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to check out and track your orders.</p>
      <Suspense>
        <Forms searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Forms({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { callbackUrl, error } = await searchParams;
  const cb = typeof callbackUrl === "string" ? callbackUrl : "/account";
  const errorMessage =
    error === "OAuthAccountNotLinked"
      ? "This email already has a password account. Sign in with your password instead."
      : error
        ? "Sign-in failed. Please try again."
        : null;
  return (
    <>
      {errorMessage && (
        <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {errorMessage}
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
        <LoginForm callbackUrl={cb} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(cb)}`}
          className="font-medium text-primary-strong hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
