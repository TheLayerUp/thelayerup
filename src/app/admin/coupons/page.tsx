import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { toggleCoupon } from "@/server/actions/admin";
import CouponForm from "@/components/admin/CouponForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Coupons" };

export default async function AdminCoupons() {
  await requireAdmin();
  const coupons = await prisma.coupon.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] });
  const now = new Date();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Coupons</h1>
      <CouponForm />
      <div className="overflow-x-auto rounded-3xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Min order</th>
              <th className="p-4">Used</th>
              <th className="p-4">Expires</th>
              <th className="p-4">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => {
              const expired = c.expiresAt && c.expiresAt < now;
              const exhausted = c.usageLimit !== null && c.usedCount >= c.usageLimit;
              return (
                <tr key={c.id}>
                  <td className="p-4 font-mono font-semibold">{c.code}</td>
                  <td className="p-4">
                    {c.type === "PERCENTAGE" ? `${c.value}%` : formatPrice(c.value)}
                    {c.maxDiscount !== null && (
                      <span className="text-muted-foreground"> (max {formatPrice(c.maxDiscount)})</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{c.minOrderValue ? formatPrice(c.minOrderValue) : "—"}</td>
                  <td className="p-4 tabular-nums">
                    {c.usedCount}
                    {c.usageLimit !== null && ` / ${c.usageLimit}`}
                  </td>
                  <td className="p-4 text-muted-foreground">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                  <td className="p-4">
                    {!c.isActive ? (
                      <Badge variant="secondary">Disabled</Badge>
                    ) : expired ? (
                      <Badge variant="warning">Expired</Badge>
                    ) : exhausted ? (
                      <Badge variant="warning">Used up</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <form action={toggleCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="ghost" size="sm">
                        {c.isActive ? "Disable" : "Enable"}
                      </Button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
