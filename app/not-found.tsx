import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative flex items-center justify-center min-h-[100dvh] bg-grid">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-glow" aria-hidden />
      <div className="relative max-w-md space-y-6 p-4 text-center">
        <div className="flex justify-center">
          <span className="grid size-14 place-items-center rounded-2xl brand-gradient text-white shadow-brand">
            <Sparkles className="size-7" />
          </span>
        </div>
        <p className="text-7xl font-extrabold tracking-tight text-gray-900">404</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Page not found
        </h1>
        <p className="text-base text-gray-500">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            asChild
            className="rounded-full bg-brand hover:bg-brand-600 text-brand-foreground"
          >
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/generate">Generate a Report</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
