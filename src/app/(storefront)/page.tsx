import HeroSection from "@/components/home/HeroSection";
import Marquee from "@/components/home/Marquee";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import HowItWorks from "@/components/home/HowItWorks";
import CTASection from "@/components/home/CTASection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";
import { getFeaturedProducts } from "@/server/queries/catalog";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <>
      <HeroSection products={featured} />
      {/* Padding gives the tilted ribbon room so its corners aren't clipped. */}
      <div className="overflow-hidden py-6">
        <Marquee />
      </div>
      <CategorySection />
      <FeaturedProducts products={featured} />
      <HowItWorks />
      <CTASection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}
