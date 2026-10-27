"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveProduct } from "@/server/actions/admin";
import type { FormState } from "@/server/actions/public";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  features: string;
  price: number | "";
  compareAtPrice: number | "";
  stock: number | "";
  material: string;
  color: string;
  dimensions: string;
  weightGrams: number | "";
  categoryId: string;
  imageUrls: string;
  isActive: boolean;
  isFeatured: boolean;
};

export default function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <section className="grid gap-5 rounded-3xl border border-border bg-surface p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={initial.name} required error={e.name} />
        </div>
        <div>
          <Label htmlFor="slug">URL slug</Label>
          <Input id="slug" name="slug" defaultValue={initial.slug} placeholder="auto from name" error={e.slug} />
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" defaultValue={initial.categoryId} required error={e.categoryId}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={initial.description}
            required
            className="min-h-28"
            error={e.description}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="features">Highlights (one per line)</Label>
          <Textarea id="features" name="features" defaultValue={initial.features} className="min-h-24" />
        </div>
      </section>

      <section className="grid gap-5 rounded-3xl border border-border bg-surface p-6 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={1}
            step={1}
            defaultValue={initial.price}
            required
            error={e.price}
          />
        </div>
        <div>
          <Label htmlFor="compareAtPrice">Compare-at price (₹)</Label>
          <Input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            min={1}
            step={1}
            defaultValue={initial.compareAtPrice}
            error={e.compareAtPrice}
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            defaultValue={initial.stock}
            required
            error={e.stock}
          />
        </div>
        <div>
          <Label htmlFor="material">Material</Label>
          <Input id="material" name="material" defaultValue={initial.material} placeholder="PLA, PETG, Resin…" />
        </div>
        <div>
          <Label htmlFor="color">Colour</Label>
          <Input id="color" name="color" defaultValue={initial.color} />
        </div>
        <div>
          <Label htmlFor="weightGrams">Weight (g)</Label>
          <Input
            id="weightGrams"
            name="weightGrams"
            type="number"
            min={1}
            defaultValue={initial.weightGrams}
            error={e.weightGrams}
          />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="dimensions">Dimensions</Label>
          <Input id="dimensions" name="dimensions" defaultValue={initial.dimensions} placeholder="15 × 15 × 25 cm" />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6">
        <Label htmlFor="imageUrls">Image URLs (one per line, first is the cover)</Label>
        <Textarea
          id="imageUrls"
          name="imageUrls"
          defaultValue={initial.imageUrls}
          className="min-h-24 font-mono text-xs"
          placeholder="https://res.cloudinary.com/…"
          error={e.imageUrls}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Paste Cloudinary or other hosted image links, or paths under /public. Direct uploads are on the roadmap.
        </p>
        <div className="mt-5 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="accent-primary" /> Live
            on store
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} className="accent-primary" />{" "}
            Featured on homepage
          </label>
        </div>
      </section>

      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" size="lg" isLoading={pending}>
          {initial.id ? "Save changes" : "Create product"}
        </Button>
        <Link href="/admin/products" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
