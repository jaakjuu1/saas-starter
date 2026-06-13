import { Star } from 'lucide-react';
import { Section, SectionHeading } from '@/components/marketing/section';
import { testimonials } from '@/lib/config/site';

export function Testimonials() {
  return (
    <Section id="testimonials" className="bg-white">
      <SectionHeading
        eyebrow="Loved by growth teams"
        title="Results that speak for themselves"
        description="Thousands of founders, marketers and agencies use our reports to find their next win."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-gray-900/5"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-gray-700">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
              <span className="grid size-10 place-items-center rounded-full brand-gradient text-sm font-semibold text-white">
                {t.initials}
              </span>
              <span>
                <span className="block text-sm font-semibold text-gray-900">
                  {t.name}
                </span>
                <span className="block text-xs text-gray-500">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
