import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Heart, LogOut, MapPin, Package, Trash2 } from "lucide-react";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";
import { signOutAction, deleteAddress, makeDefaultAddress } from "@/server/actions/account";
import { StatusBadge } from "@/components/orders/OrderView";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/utils";
import ReferralCard from "@/components/account/ReferralCard";
import PushToggle from "@/components/account/PushToggle";
import { ensureReferralCode } from "@/server/services/referrals";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  const user = await requireUser("/account");
  const [orders, addresses, referralCode, referred] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id, status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
      take: 50,
    }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    ensureReferralCode(user.id),
    prisma.user.count({ where: { referredById: user.id } }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</h1>
          <p className="mt-1 text-muted-foreground">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <Button variant="outline" size="sm">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </form>
      </div>

      <Link
        href="/account/wishlist"
        className="mt-8 flex items-center justify-between rounded-3xl border border-border bg-surface p-5 hover:border-primary"
      >
        <span className="flex items-center gap-3 font-semibold">
          <Heart className="h-5 w-5 text-primary" /> Wishlist
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>

      <div className="mt-4">
        <PushToggle />
      </div>

      <ReferralCard
        code={referralCode}
        link={`${site.url}/register?ref=${referralCode}`}
        friendPercent={site.referral.friendPercent}
        reward={formatPrice(site.referral.referrerFlat)}
        joined={referred}
      />

      <section id="orders" className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Package className="h-5 w-5 text-primary" /> Orders
        </h2>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No orders yet.</p>
            <Link href="/products" className={buttonVariants({ className: "mt-4" })}>
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-surface-2"
                >
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(o.createdAt)} · {o._count.items} item{o._count.items === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={o.status} />
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="addresses" className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <MapPin className="h-5 w-5 text-primary" /> Saved addresses
        </h2>
        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Addresses you save at checkout will show up here.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-3xl border border-border bg-surface p-5 text-sm">
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{a.fullName}</p>
                  {a.isDefault && <Badge variant="soft">Default</Badge>}
                </div>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {a.line1}
                  {a.line2 && `, ${a.line2}`}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                  <br />
                  {a.phone}
                </p>
                <div className="mt-4 flex gap-2">
                  {!a.isDefault && (
                    <form action={makeDefaultAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <Button variant="ghost" size="sm">
                        Make default
                      </Button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
