import { Section, SectionHeading } from '@/components/marketing/section';
import { features } from '@/lib/config/site';

export function FeatureGrid() {
  return (
    <Section id="features" className="bg-white">
      <SectionHeading
        eyebrow="Everything in one report"
        title="Everything you need to grow your website"
        description="Professional-grade analysis powered by AI agents that crawl, audit and benchmark your site in parallel — then hand you the fixes."
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-gray-900/5"
            >
              <div className="inline-flex size-12 items-center justify-center rounded-xl brand-gradient text-white shadow-brand">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
