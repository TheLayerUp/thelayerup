import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <Suspense>
        <Reset searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Reset({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { email, token } = await searchParams;
  if (typeof email !== "string" || typeof token !== "string") {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        This link is incomplete.{" "}
        <Link href="/forgot-password" className="font-medium text-primary-strong hover:underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }
  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">for {email}</p>
      <ResetPasswordForm email={email} token={token} />
    </>
  );
}
