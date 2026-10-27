import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export const PLACEHOLDER_IMAGE = "/images/placeholder-product.svg";
const NEW_FOR_DAYS = 30;

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  material: true,
  isFeatured: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true }, orderBy: { displayOrder: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  material: string | null;
  image: string;
  category: string;
  isNew: boolean;
};

function toCard(p: CardRow, now: number): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    material: p.material,
    image: p.images[0]?.url ?? PLACEHOLDER_IMAGE,
    category: p.category.name,
    isNew: now - p.createdAt.getTime() < NEW_FOR_DAYS * 86_400_000,
  };
}

export type CatalogSort = "featured" | "newest" | "price-asc" | "price-desc";

export type CatalogQuery = {
  category?: string;
  q?: string;
  material?: string;
  sort?: CatalogSort;
  inStock?: boolean;
};

const orderByFor: Record<CatalogSort, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
};

export async function getCatalog(query: CatalogQuery) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query.category && { category: { slug: query.category } }),
    ...(query.material && { material: { equals: query.material, mode: "insensitive" } }),
    ...(query.inStock && { stock: { gt: 0 } }),
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { category: { name: { contains: query.q, mode: "insensitive" } } },
      ],
    }),
  };

  const rows = await prisma.product.findMany({
    where,
    select: cardSelect,
    orderBy: orderByFor[query.sort ?? "featured"],
  });
  const now = Date.now();
  return rows.map((r) => toCard(r, now));
}

export async function getFeaturedProducts(limit = 8) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const now = Date.now();
  return rows.map((r) => toCard(r, now));
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const sameCategory = await prisma.product.findMany({
    where: { isActive: true, categoryId, id: { not: productId } },
    select: cardSelect,
    take: limit,
  });
  let rows = sameCategory;
  if (rows.length < limit) {
    const filler = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: [productId, ...rows.map((r) => r.id)] },
      },
      select: cardSelect,
      orderBy: { isFeatured: "desc" },
      take: limit - rows.length,
    });
    rows = [...rows, ...filler];
  }
  const now = Date.now();
  return rows.map((r) => toCard(r, now));
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { displayOrder: "asc" } },
      reviews: {
        where: { isPublished: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!product) return null;

  const ratingAgg = await prisma.review.aggregate({
    where: { productId: product.id, isPublished: true },
    _avg: { rating: true },
    _count: true,
  });

  return {
    ...product,
    imageUrls: product.images.length ? product.images.map((i) => i.url) : [PLACEHOLDER_IMAGE],
    rating: ratingAgg._avg.rating ?? 0,
    reviewCount: ratingAgg._count,
  };
}

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag("categories", "products");

  return prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
}

export async function getMaterials() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const rows = await prisma.product.findMany({
    where: { isActive: true, material: { not: null } },
    distinct: ["material"],
    select: { material: true },
    orderBy: { material: "asc" },
  });
  return rows.map((r) => r.material!).filter(Boolean);
}

export async function getAllProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });
  return rows;
}

/** Real, published 4★+ reviews with a comment — powers the homepage social proof. */
export async function getHighlightReviews(limit = 3) {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews", "products");

  return prisma.review.findMany({
    where: { isPublished: true, rating: { gte: 4 }, comment: { not: null } },
    orderBy: [{ isVerifiedPurchase: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      isVerifiedPurchase: true,
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
  });
}
