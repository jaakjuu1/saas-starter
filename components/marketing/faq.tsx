'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Section, SectionHeading } from '@/components/marketing/section';
import { faqs } from '@/lib/config/site';
import { cn } from '@/lib/utils';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" className="bg-gray-50/70">
      <SectionHeading
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Everything you need to know before generating your first report."
      />

      <div className="mx-auto mt-12 max-w-3xl divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
                aria-expanded={isOpen}
              >
                <span className="text-base font-medium text-gray-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'size-5 shrink-0 text-gray-400 transition-transform duration-200',
                    isOpen && 'rotate-180 text-brand'
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200 ease-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
