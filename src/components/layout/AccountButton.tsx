import Link from "next/link";
import { LayoutDashboard, User } from "lucide-react";
import { getSession } from "@/server/session";
import { buttonVariants } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

export default async function AccountButton() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <User className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Admin dashboard">
          <LayoutDashboard className="h-5 w-5" />
        </Link>
      )}
      <Link
        href="/account"
        aria-label="My account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-strong hover:bg-primary/25"
      >
        {getInitials(session.user.name || session.user.email || "U")}
      </Link>
    </div>
  );
}

export function AccountButtonFallback() {
  return <div className="h-9 w-20 animate-pulse rounded-lg bg-surface-2" />;
}
