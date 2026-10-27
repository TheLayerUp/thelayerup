import { CustomOrderStatus } from "@prisma/client";
import { ExternalLink, Mail } from "lucide-react";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { toggleMessageRead, updateCustomOrder } from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Requests" };

const STATUS_LABEL: Record<CustomOrderStatus, string> = {
  NEW: "New",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  IN_PRODUCTION: "In production",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export default async function AdminRequests() {
  await requireAdmin();
  const [custom, messages] = await Promise.all([
    prisma.customOrder.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 }),
    prisma.contactMessage.findMany({ orderBy: [{ isRead: "asc" }, { createdAt: "desc" }], take: 100 }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold">Custom print requests</h1>
        {custom.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {custom.map((r) => (
              <article key={r.id} className="rounded-3xl border border-border bg-surface p-5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-muted-foreground">
                      {r.email} · {r.phone}
                    </p>
                  </div>
                  <Badge variant={r.status === "NEW" ? "default" : "secondary"}>{STATUS_LABEL[r.status]}</Badge>
                </div>
                <p className="mt-3 leading-relaxed whitespace-pre-wrap">{r.description}</p>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <div>
                    Qty: <span className="text-foreground">{r.quantity}</span>
                  </div>
                  {r.material && (
                    <div>
                      Material: <span className="text-foreground">{r.material}</span>
                    </div>
                  )}
                  {r.budget && (
                    <div>
                      Budget: <span className="text-foreground">{r.budget}</span>
                    </div>
                  )}
                  {r.deadline && (
                    <div>
                      Needed by: <span className="text-foreground">{r.deadline}</span>
                    </div>
                  )}
                  <div>Received {formatDate(r.createdAt)}</div>
                </dl>
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 inline-flex items-center gap-1 font-medium text-primary-strong"
                  >
                    Open attached file <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <form
                  action={updateCustomOrder}
                  className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-[1fr_120px_auto]"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <Select name="status" defaultValue={r.status} className="h-9">
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                  <Input
                    name="quotedPrice"
                    type="number"
                    min={1}
                    placeholder="Quote ₹"
                    defaultValue={r.quotedPrice ?? ""}
                    className="h-9"
                  />
                  <Button size="sm" className="h-9">
                    Save
                  </Button>
                  <Input
                    name="adminNotes"
                    placeholder="Internal notes"
                    defaultValue={r.adminNotes ?? ""}
                    className="h-9 sm:col-span-3"
                  />
                </form>
                <a
                  href={`mailto:${r.email}?subject=${encodeURIComponent("Your custom print quote — TheLayerUp")}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" /> Reply by email
                </a>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold">Contact messages</h2>
        {messages.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-3xl border border-border bg-surface">
            {messages.map((m) => (
              <li key={m.id} className={`p-5 text-sm ${m.isRead ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-muted-foreground">
                      {m.name} ·{" "}
                      <a href={`mailto:${m.email}`} className="text-primary-strong">
                        {m.email}
                      </a>
                      {m.phone && ` · ${m.phone}`} · {formatDate(m.createdAt)}
                    </p>
                  </div>
                  <form action={toggleMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <Button variant="ghost" size="sm">
                      {m.isRead ? "Mark unread" : "Mark read"}
                    </Button>
                  </form>
                </div>
                <p className="mt-2 leading-relaxed whitespace-pre-wrap">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
