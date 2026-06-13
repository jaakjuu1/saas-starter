import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/marketing/section';
import { PricingCards } from '@/components/marketing/pricing-cards';

export function PricingPreview() {
  return (
    <Section id="pricing" className="bg-white">
      <SectionHeading
        eyebrow="Simple, one-time pricing"
        title="Pick the depth that fits your goals"
        description="No subscriptions, no surprises. Pay once per report and own the results forever."
      />
      <div className="mt-14">
        <PricingCards />
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-600"
        >
          Compare all plans in detail
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Section>
  );
}
