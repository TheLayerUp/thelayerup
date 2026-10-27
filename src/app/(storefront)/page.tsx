import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import ProductGrid from "@/components/catalog/ProductGrid";
import HowItWorks from "@/components/home/HowItWorks";
import CTASection from "@/components/home/CTASection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import { getFeaturedProducts } from "@/server/queries/catalog";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <>
      <HeroSection />
      <CategorySection />
      {featured.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <ProductGrid products={featured} eyebrow="Trending" title="Bestsellers right now" viewAllHref="/products" />
        </div>
      )}
      <HowItWorks />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
