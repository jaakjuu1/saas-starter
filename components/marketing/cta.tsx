import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="w-full py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl brand-gradient px-6 py-16 text-center shadow-brand sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to grow your website?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Join thousands of teams using AI-powered insights to climb the
              rankings and convert more visitors. Your first report is minutes away.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-8 text-base text-gray-900 hover:bg-white/90"
              >
                <Link href="/generate">
                  Start Your Analysis
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/40 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/pricing">Compare Plans</Link>
              </Button>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/80">
              <ShieldCheck className="size-4" />
              30-day money-back guarantee · No account required to start
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
