import { Hero } from '@/components/marketing/hero';
import { LogoCloud } from '@/components/marketing/logo-cloud';
import { FeatureGrid } from '@/components/marketing/feature-grid';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { PricingPreview } from '@/components/marketing/pricing-preview';
import { Testimonials } from '@/components/marketing/testimonials';
import { Faq } from '@/components/marketing/faq';
import { CtaSection } from '@/components/marketing/cta';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <LogoCloud />
      <FeatureGrid />
      <HowItWorks />
      <PricingPreview />
      <Testimonials />
      <Faq />
      <CtaSection />
    </main>
  );
}
