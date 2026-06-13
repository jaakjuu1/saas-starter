import { Section, SectionHeading } from '@/components/marketing/section';
import { steps } from '@/lib/config/site';

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-gray-50/70">
      <SectionHeading
        eyebrow="How it works"
        title="From URL to action plan in three steps"
        description="No setup, no onboarding calls. Paste a domain and let the agents do the heavy lifting."
      />

      <div className="relative mt-16 grid gap-10 md:grid-cols-3">
        {/* Connecting line */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent md:block"
          aria-hidden
        />
        {steps.map((step) => (
          <div key={step.number} className="relative text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-brand/20 bg-white text-lg font-bold text-brand shadow-sm">
              {step.number}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-gray-900">
              {step.title}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
