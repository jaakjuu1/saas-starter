import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingCards } from '@/components/marketing/pricing-cards';
import { Faq } from '@/components/marketing/faq';
import { reportTiers } from '@/lib/config/site';

const guarantees = [
  '30-day money-back guarantee',
  'Secure payment with Stripe',
  'No account required to start',
];

// Feature comparison matrix derived from each tier's headline features.
const comparisonRows = [
  'Technical SEO audit',
  'Page speed & Core Web Vitals',
  'Competitor benchmarking',
  'Visual UX analysis',
  'GA4 traffic analysis',
  'Implementation roadmap',
  'Task export (CSV / Asana / Notion)',
  'ROI projections',
];

const matrix: Record<string, boolean[]> = {
  // order matches reportTiers: lite, pro, elite, tasklist_pro
  'Technical SEO audit': [true, true, true, true],
  'Page speed & Core Web Vitals': [true, true, true, true],
  'Competitor benchmarking': [false, true, true, true],
  'Visual UX analysis': [false, true, true, true],
  'GA4 traffic analysis': [false, false, true, true],
  'Implementation roadmap': [false, false, true, true],
  'Task export (CSV / Asana / Notion)': [false, false, true, true],
  'ROI projections': [false, false, true, true],
};

export default function PricingPage() {
  return (
    <main>
      {/* Header */}
      <section className="relative overflow-hidden bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-glow" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 text-center">
          <Badge variant="brand" className="mb-4">
            Simple, one-time pricing
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Choose your <span className="text-gradient">growth report</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            AI-powered website analysis with actionable insights, delivered in
            minutes. Pay once — no subscriptions, ever.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {guarantees.map((g) => (
              <span key={g} className="flex items-center gap-2">
                <Check className="size-4 text-emerald-500" />
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <PricingCards />
      </section>

      {/* Comparison table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left font-semibold text-gray-900">
                  Compare features
                </th>
                {reportTiers.map((tier) => (
                  <th
                    key={tier.id}
                    className="px-4 py-4 text-center font-semibold text-gray-900"
                  >
                    {tier.name}
                    <span className="block text-xs font-normal text-gray-500">
                      {tier.price}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparisonRows.map((row) => (
                <tr key={row} className="hover:bg-gray-50/60">
                  <td className="px-6 py-3 text-gray-700">{row}</td>
                  {matrix[row].map((included, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {included ? (
                        <Check className="mx-auto size-4 text-emerald-500" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recommendation banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Not sure which report is right for you?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Start with our Pro Report — it&apos;s our most popular choice and
            includes everything most businesses need to get started.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 rounded-full bg-brand hover:bg-brand-600 text-brand-foreground shadow-brand"
          >
            <Link href="/generate?tier=pro">
              Start with Pro Report — €69
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="size-4" />
            Covered by our 30-day money-back guarantee
          </p>
        </div>
      </section>

      <Faq />
    </main>
  );
}
