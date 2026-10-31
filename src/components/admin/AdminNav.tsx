"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Inbox, Tag, BarChart3, Star, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/returns", label: "Returns", icon: Undo2 },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
      {links.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/12 text-primary-strong"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            )}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
