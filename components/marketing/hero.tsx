import Link from 'next/link';
import { ArrowRight, Sparkles, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { siteConfig, heroStats } from '@/lib/config/site';

const scoreBars = [
  { label: 'SEO Score', value: 85, color: 'bg-emerald-500' },
  { label: 'Page Speed', value: 72, color: 'bg-amber-500' },
  { label: 'CRO Score', value: 78, color: 'bg-brand' },
  { label: 'Accessibility', value: 91, color: 'bg-violet-500' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute inset-0 bg-glow" aria-hidden />
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand/20 blur-3xl" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
          {/* Copy */}
          <div className="lg:col-span-6 animate-fade-up">
            <Badge variant="brand" className="mb-5">
              <Sparkles className="size-3.5" />
              AI-powered growth reports
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Website Growth
              <span className="block text-gradient">Reports Made Simple</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
              {siteConfig.description}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <Button
                asChild
                size="lg"
                className="text-base rounded-full bg-brand hover:bg-brand-600 text-brand-foreground shadow-brand h-12 px-7"
              >
                <Link href="/generate">
                  Generate Report Now
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base rounded-full h-12 px-7"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {['SL', 'MH', 'PN', 'JK'].map((i) => (
                  <span
                    key={i}
                    className="grid size-7 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-brand to-amber-400 text-[10px] font-semibold text-white"
                  >
                    {i}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-900">4.9/5</span>
                from 1,200+ teams
              </span>
            </div>
          </div>

          {/* Report preview card */}
          <div className="mt-14 lg:mt-0 lg:col-span-6">
            <div className="relative mx-auto max-w-lg animate-float">
              <div className="absolute -inset-3 rounded-3xl brand-gradient opacity-20 blur-2xl" aria-hidden />
              <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-900/10">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                  <span className="size-3 rounded-full bg-red-400" />
                  <span className="size-3 rounded-full bg-amber-400" />
                  <span className="size-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-sm text-gray-400">
                    {siteConfig.url.replace('https://', '')}/report/acme.com
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Overall Growth Score</div>
                    <div className="text-3xl font-bold text-gray-900">81/100</div>
                  </div>
                  <Badge variant="success">
                    <TrendingUp className="size-3.5" />
                    +12 this month
                  </Badge>
                </div>

                <div className="mt-6 space-y-4">
                  {scoreBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-gray-600">{bar.label}</span>
                        <span className="font-semibold text-gray-900">{bar.value}/100</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${bar.color}`}
                          style={{ width: `${bar.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Top quick win
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    Compress 14 hero images → est. +0.8s LCP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
          {heroStats.map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-6 text-center">
              <div className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
