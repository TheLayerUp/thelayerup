import type { Metadata } from "next";
import Link from "next/link";
import { ReturnStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { updateReturn } from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Returns" };

const OPEN: ReturnStatus[] = ["REQUESTED", "APPROVED", "RECEIVED"];

export default async function ReturnsPage() {
  await requireAdmin();
  const returns = await prisma.returnRequest.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    include: { order: { select: { id: true, orderNumber: true, total: true, shipName: true, paymentMethod: true } } },
  });
  const open = returns.filter((r) => OPEN.includes(r.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Returns &amp; damage reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {open.length} open. Refund online payments from the Razorpay dashboard, then mark them refunded here.
        </p>
      </div>

      {returns.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No return requests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {returns.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {r.reason} ·{" "}
                    <Link href={`/admin/orders/${r.order.id}`} className="text-primary-strong hover:underline">
                      {r.order.orderNumber}
                    </Link>
                  </p>
                  <p className="text-muted-foreground">
                    {r.order.shipName} · {formatPrice(r.order.total)} {r.order.paymentMethod} ·{" "}
                    {formatDate(r.createdAt)}
                  </p>
                </div>
                <Badge variant={OPEN.includes(r.status) ? "default" : "secondary"}>{r.status.toLowerCase()}</Badge>
              </div>
              {r.details && <p className="mt-3 leading-relaxed whitespace-pre-wrap">{r.details}</p>}
              {r.photoUrl && (
                <a
                  href={r.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-primary-strong hover:underline"
                >
                  View photos ↗
                </a>
              )}
              <form
                action={updateReturn}
                className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[180px_1fr_auto]"
              >
                <input type="hidden" name="id" value={r.id} />
                <Select name="status" defaultValue={r.status} className="h-9" aria-label="Status">
                  {Object.values(ReturnStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.toLowerCase()}
                    </option>
                  ))}
                </Select>
                <Textarea
                  name="adminNotes"
                  defaultValue={r.adminNotes ?? ""}
                  placeholder="Note to customer (e.g. reprint ships Friday)"
                  className="min-h-9"
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" name="notify" defaultChecked /> Email
                  </label>
                  <Button size="sm">Save</Button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
