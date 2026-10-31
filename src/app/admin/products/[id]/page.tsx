import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product" };

// Handles both /admin/products/new and /admin/products/<id>.
export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true },
  });

  let initial: ProductFormValues = {
    name: "",
    slug: "",
    description: "",
    nameHi: "",
    descriptionHi: "",
    features: "",
    price: "",
    compareAtPrice: "",
    stock: 0,
    material: "",
    color: "",
    dimensions: "",
    weightGrams: "",
    categoryId: "",
    imageUrls: "",
    modelUrl: "",
    isActive: true,
    isFeatured: false,
  };

  if (id !== "new") {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { displayOrder: "asc" } } },
    });
    if (!p) notFound();
    initial = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      nameHi: p.nameHi ?? "",
      descriptionHi: p.descriptionHi ?? "",
      features: p.features.join("\n"),
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? "",
      stock: p.stock,
      material: p.material ?? "",
      color: p.color ?? "",
      dimensions: p.dimensions ?? "",
      weightGrams: p.weightGrams ?? "",
      categoryId: p.categoryId,
      imageUrls: p.images.map((i) => i.url).join("\n"),
      modelUrl: p.modelUrl ?? "",
      isActive: p.isActive,
      isFeatured: p.isFeatured,
    };
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold">{initial.id ? `Edit ${initial.name}` : "New product"}</h1>
      <ProductForm initial={initial} categories={categories} />
    </div>
  );
}
