import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { archiveProduct } from "@/server/actions/admin";
import { PLACEHOLDER_IMAGE } from "@/server/queries/catalog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function AdminProducts() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { name: true } },
      images: { take: 1, orderBy: { displayOrder: "asc" } },
      _count: { select: { orderItems: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-right">Stock</th>
              <th className="p-4 text-right">Sold</th>
              <th className="p-4">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                <td className="p-4">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 font-medium hover:text-primary-strong"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      <Image
                        src={p.images[0]?.url ?? PLACEHOLDER_IMAGE}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                    {p.name}
                  </Link>
                </td>
                <td className="p-4 text-muted-foreground">{p.category.name}</td>
                <td className="p-4 text-right tabular-nums">{formatPrice(p.price)}</td>
                <td
                  className={`p-4 text-right font-medium tabular-nums ${p.stock <= 0 ? "text-destructive" : p.stock <= p.lowStockAt ? "text-warning" : ""}`}
                >
                  {p.stock}
                </td>
                <td className="p-4 text-right text-muted-foreground tabular-nums">{p._count.orderItems}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {p.isActive ? <Badge variant="success">Live</Badge> : <Badge variant="secondary">Archived</Badge>}
                    {p.isFeatured && <Badge variant="soft">Featured</Badge>}
                  </div>
                </td>
                <td className="p-4 text-right">
                  {p.isActive && (
                    <form action={archiveProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button variant="ghost" size="sm">
                        Archive
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
