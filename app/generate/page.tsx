'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportTier } from '@/lib/payments/report-payments';
import { reportTiers, accentClasses, tierById } from '@/lib/config/site';

function GenerateReportInner() {
  const searchParams = useSearchParams();
  const initialTier = (tierById(searchParams.get('tier') || '')?.id ??
    'pro') as ReportTier;

  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState<ReportTier>(initialTier);
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cleanDomain = (input: string): string => {
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');
    cleaned = cleaned.split('/')[0];
    cleaned = cleaned.split('?')[0].split('#')[0];
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !email) return;

    const cleanedDomain = cleanDomain(domain);
    if (!cleanedDomain || !cleanedDomain.includes('.')) {
      alert('Please enter a valid domain name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/reports/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportTier: selectedTier,
          domain: cleanedDomain,
          ga4PropertyId: ga4PropertyId || undefined,
          customerEmail: email,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selected = tierById(selectedTier)!;
  const selectedAccent = accentClasses[selected.accent];
  const SelectedIcon = selected.icon;

  return (
    <main className="relative min-h-screen bg-gray-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-12">
          <Badge variant="brand" className="mb-4">
            <Sparkles className="size-3.5" />
            Generate in minutes
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Generate your <span className="text-gradient">growth report</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Get AI-powered insights and an actionable task list to grow your
            online presence.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tier selection + form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                1. Choose your report type
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {reportTiers.map((tier) => {
                  const Icon = tier.icon;
                  const accent = accentClasses[tier.accent];
                  const isSelected = selectedTier === tier.id;
                  return (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={cn(
                        'relative rounded-xl border-2 p-4 text-left transition-all',
                        isSelected
                          ? 'border-brand bg-brand/5 ring-1 ring-brand'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2 right-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                          Popular
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white',
                            accent.gradient
                          )}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {tier.name}
                            </h3>
                            <span className="text-lg font-bold text-gray-900">
                              {tier.price}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {tier.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                2. Website details
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    We&apos;ll send your report to this email address.
                  </p>
                </div>

                <div>
                  <Label htmlFor="domain">Website Domain *</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="example.com or https://example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your URL in any format — we&apos;ll clean it up.
                  </p>
                </div>

                {(selectedTier === 'elite' || selectedTier === 'tasklist_pro') && (
                  <div>
                    <Label htmlFor="ga4PropertyId">
                      Google Analytics 4 Property ID (Optional)
                    </Label>
                    <Input
                      id="ga4PropertyId"
                      type="text"
                      placeholder="123456789"
                      value={ga4PropertyId}
                      onChange={(e) => setGa4PropertyId(e.target.value)}
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Add your GA4 Property ID for traffic analysis insights.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-brand hover:bg-brand-600 text-brand-foreground text-base shadow-brand"
                  disabled={isLoading || !domain || !email}
                >
                  {isLoading
                    ? 'Processing…'
                    : `Generate ${selected.name} — ${selected.price}`}
                </Button>
              </form>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-6">
              <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>

              <div className="mt-4 flex items-center gap-3">
                <span
                  className={cn(
                    'grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white',
                    selectedAccent.gradient
                  )}
                >
                  <SelectedIcon className="size-5" />
                </span>
                <div>
                  <div className="font-semibold text-gray-900">
                    {selected.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selected.description}
                  </div>
                </div>
              </div>

              <Badge variant="secondary" className="mt-4">
                <Clock className="size-3.5" />
                {selected.turnaround} turnaround
              </Badge>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Report Generation</span>
                  <span className="font-semibold">{selected.price}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-brand">{selected.price}</span>
                </div>
              </div>

              <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                {[
                  'Secure payment with Stripe',
                  'Report delivered via email',
                  'Live progress tracking',
                  '30-day money-back guarantee',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-5 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                <ShieldCheck className="size-4 shrink-0 text-gray-400" />
                No account needed — we create one automatically after payment.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GenerateReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <GenerateReportInner />
    </Suspense>
  );
}
