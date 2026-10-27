"use client";

import { useActionState } from "react";
import Link from "next/link";
import Honeypot from "@/components/forms/Honeypot";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  loginUser,
  loginWithGoogle,
  registerUser,
  requestPasswordReset,
  resetPassword,
  type FormState,
} from "@/server/actions/public";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginUser, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary-strong hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" isLoading={pending}>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerUser, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Honeypot />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required error={e.name} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required error={e.email} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          error={e.password}
        />
      </div>
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" isLoading={pending}>
        Create account
      </Button>
    </form>
  );
}

export function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form action={loginWithGoogle}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button type="submit" variant="outline" className="w-full" size="lg">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z"
          />
          <path
            fill="#34A853"
            d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z"
          />
          <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7H2.1a11 11 0 0 0 0 10l3.7-3Z" />
          <path
            fill="#EA4335"
            d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 3C6.7 7.3 9.1 5.4 12 5.4Z"
          />
        </svg>
        Continue with Google
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok)
    return (
      <p className="mt-6 rounded-xl bg-success/10 p-4 text-sm text-success" role="status">
        {state.message}
      </p>
    );
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" isLoading={pending}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          error={state.errors?.password}
        />
      </div>
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" isLoading={pending}>
        Set new password
      </Button>
    </form>
  );
}
