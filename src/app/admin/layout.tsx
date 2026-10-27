import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/server/session";
import Logo from "@/components/layout/Logo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import AdminNav from "@/components/admin/AdminNav";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-surface lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4">
          <Logo />
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>
        <Suspense fallback={<div className="h-12" />}>
          <AdminNav />
        </Suspense>
        <div className="hidden items-center justify-between px-5 py-4 lg:absolute lg:bottom-0 lg:flex lg:w-full">
          <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View store <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <ThemeToggle />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8">
        <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
