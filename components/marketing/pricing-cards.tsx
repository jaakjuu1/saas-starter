import Link from 'next/link';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { reportTiers, accentClasses } from '@/lib/config/site';

export function PricingCards({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch',
        className
      )}
    >
      {reportTiers.map((tier) => {
        const Icon = tier.icon;
        const accent = accentClasses[tier.accent];
        return (
          <div
            key={tier.id}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5',
              tier.popular
                ? 'border-transparent ring-2 ring-brand shadow-brand'
                : 'border-gray-200'
            )}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow-sm">
                Most Popular
              </span>
            )}

            <div
              className={cn(
                'inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                accent.gradient
              )}
            >
              <Icon className="size-6" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-gray-900">{tier.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{tier.description}</p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900">
                {tier.price}
              </span>
              <span className="text-sm text-gray-500">one-time</span>
            </div>

            <Badge variant="secondary" className="mt-3">
              <Clock className="size-3.5" />
              {tier.turnaround} turnaround
            </Badge>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className={cn('mt-0.5 size-4 shrink-0', accent.text)} />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className={cn(
                'mt-6 w-full rounded-full',
                tier.popular
                  ? 'bg-brand hover:bg-brand-600 text-brand-foreground'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              )}
            >
              <Link href={`/generate?tier=${tier.id}`}>
                Get {tier.name}
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
