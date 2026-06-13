import {
  BarChart3,
  Rocket,
  Search,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ReportTier } from '@/lib/payments/report-payments';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — single source of truth for branding & marketing content.
 * ────────────────────────────────────────────────────────────────────────────
 *  Change anything in this file to re-skin / re-brand the whole app without
 *  touching component code. Colors are driven from CSS variables in
 *  `app/globals.css` (see `--brand`), everything else lives here.
 */

export const siteConfig = {
  name: 'Lumen',
  legalName: 'Lumen Analytics',
  tagline: 'Website Growth Reports Made Simple',
  description:
    'Get comprehensive, AI-powered SEO, CRO and UX analysis for any website in minutes — with prioritized, ready-to-ship tasks that actually move the needle.',
  url: 'https://example.com',
  email: 'hello@example.com',
  social: {
    twitter: 'https://twitter.com',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
} as const;

/** Primary navigation shown in the marketing header. */
export const mainNav: { label: string; href: string }[] = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
];

/** Footer link groups. */
export const footerNav: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Generate Report', href: '/generate' },
      { label: 'Pricing Plans', href: '/pricing' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Features', href: '/#features' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Testimonials', href: '/#testimonials' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Contact', href: `mailto:${siteConfig.email}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refunds' },
    ],
  },
];

/** Headline stats shown across the marketing site. */
export const heroStats: { value: string; label: string }[] = [
  { value: '12k+', label: 'Reports generated' },
  { value: '4.9/5', label: 'Average rating' },
  { value: '< 5 min', label: 'Avg. turnaround' },
  { value: '38%', label: 'Avg. traffic lift' },
];

/** Logos / trust strip (text-based so no asset wrangling needed). */
export const trustedBy: string[] = [
  'Northbeam',
  'Loopio',
  'Brightside',
  'Statix',
  'Forma',
  'Quanta',
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: Search,
    title: 'Technical SEO Audit',
    description:
      'Deep crawl of your site to surface broken links, indexing issues, schema gaps and Core Web Vitals — with fixes ranked by impact.',
  },
  {
    icon: BarChart3,
    title: 'CRO & UX Insights',
    description:
      'Conversion-focused analysis of your funnels, page speed and on-page experience, backed by real screenshots and heuristics.',
  },
  {
    icon: Target,
    title: 'Competitor Benchmarking',
    description:
      'See exactly where rivals outrank you, which keywords they own, and the content gaps you can win this quarter.',
  },
  {
    icon: Zap,
    title: 'Actionable Task Lists',
    description:
      'Every finding becomes a prioritized task with effort and ROI estimates — export straight to CSV, Asana or Notion.',
  },
  {
    icon: Rocket,
    title: 'Strategic Roadmaps',
    description:
      'Elite tiers turn insights into a phased 90-day growth plan with owners, timelines and projected revenue impact.',
  },
  {
    icon: BarChart3,
    title: 'Live Progress Tracking',
    description:
      'Watch your report build in real time with transparent stage-by-stage updates — no black boxes, no waiting in the dark.',
  },
];

export type Step = {
  number: string;
  title: string;
  description: string;
};

export const steps: Step[] = [
  {
    number: '01',
    title: 'Enter your domain',
    description:
      'Drop in any URL and pick the depth of analysis you need. No account or credit card required to start.',
  },
  {
    number: '02',
    title: 'AI runs the analysis',
    description:
      'Our agents crawl, audit and benchmark your site in parallel — SEO, performance, UX and competitors, all at once.',
  },
  {
    number: '03',
    title: 'Get your action plan',
    description:
      'Receive a polished report and a prioritized task list you can hand straight to your team and start shipping.',
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      'We found €40k of quick-win SEO fixes in the first report. It paid for itself a hundred times over in a single afternoon.',
    name: 'Sara Lindqvist',
    role: 'Head of Growth, Northbeam',
    initials: 'SL',
  },
  {
    quote:
      'The task list is the killer feature. My devs went from “where do we even start?” to shipping fixes the same day.',
    name: 'Marcus Hale',
    role: 'CTO, Loopio',
    initials: 'MH',
  },
  {
    quote:
      'Cleaner and faster than the agency audit we paid €5k for last year — and we had it before lunch.',
    name: 'Priya Nair',
    role: 'Founder, Brightside',
    initials: 'PN',
  },
];

export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: 'How long does a report take to generate?',
    answer:
      'Most reports are ready in under five minutes. Deeper Elite and Tasklist Pro reports can take up to ten minutes because they run additional competitor and market analysis.',
  },
  {
    question: 'Do I need an account to get a report?',
    answer:
      'No. You can generate and pay for a report anonymously — we create your account automatically after checkout so you can come back and view it any time.',
  },
  {
    question: 'What do I actually receive?',
    answer:
      'An interactive on-site report plus a prioritized task list. Higher tiers add competitor benchmarking, GA4 traffic analysis, exports to Asana/Notion/CSV and a phased implementation roadmap.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Payments are processed securely through Stripe and we never store your card details. Your site data is only used to generate your report.',
  },
  {
    question: 'What if I’m not happy with my report?',
    answer:
      'Every report is covered by a 30-day money-back guarantee. If it didn’t help, email us and we’ll refund you — no hoops.',
  },
];

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  REPORT TIERS — shared metadata used by pricing, generate & report pages.
 * ────────────────────────────────────────────────────────────────────────────
 */
export type TierAccent = 'blue' | 'violet' | 'orange' | 'emerald';

export type ReportTierMeta = {
  id: ReportTier;
  name: string;
  price: string;
  priceValue: number;
  description: string;
  icon: LucideIcon;
  accent: TierAccent;
  popular: boolean;
  features: string[];
  /** Friendly turnaround estimate. */
  turnaround: string;
};

export const reportTiers: ReportTierMeta[] = [
  {
    id: 'lite',
    name: 'Lite Report',
    price: '€29',
    priceValue: 29,
    description: 'Perfect for quick SEO insights',
    icon: Zap,
    accent: 'blue',
    popular: false,
    turnaround: '~3 min',
    features: [
      'Technical SEO audit',
      'Page speed analysis',
      'Basic keyword gap analysis',
      '3–5 prioritized quick wins',
      'Mobile responsiveness check',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Report',
    price: '€69',
    priceValue: 69,
    description: 'Comprehensive growth analysis',
    icon: BarChart3,
    accent: 'violet',
    popular: true,
    turnaround: '~6 min',
    features: [
      'Everything in Lite',
      'Competitor analysis',
      'Visual UX analysis',
      'CRO recommendations',
      '8–12 strategic recommendations',
    ],
  },
  {
    id: 'elite',
    name: 'Elite Report',
    price: '€149',
    priceValue: 149,
    description: 'Advanced insights with integrations',
    icon: Target,
    accent: 'orange',
    popular: false,
    turnaround: '~12 min',
    features: [
      'Everything in Pro',
      'Market positioning analysis',
      'GA4 traffic analysis',
      'Implementation roadmap',
      'ROI projections & business case',
    ],
  },
  {
    id: 'tasklist_pro',
    name: 'Tasklist Pro',
    price: '€299',
    priceValue: 299,
    description: 'Complete implementation roadmap',
    icon: Rocket,
    accent: 'emerald',
    popular: false,
    turnaround: '~10 min',
    features: [
      'Everything in Elite',
      '20+ prioritized actionable tasks',
      'ROI calculation per task',
      'Export to Asana / Notion / CSV',
      'Resource planning & timelines',
    ],
  },
];

export const tierById = (id: string): ReportTierMeta | undefined =>
  reportTiers.find((t) => t.id === id);

/** Tailwind class fragments per accent so cards stay consistent everywhere. */
export const accentClasses: Record<
  TierAccent,
  { text: string; bg: string; softBg: string; ring: string; gradient: string }
> = {
  blue: {
    text: 'text-blue-600',
    bg: 'bg-blue-500',
    softBg: 'bg-blue-50',
    ring: 'ring-blue-500',
    gradient: 'from-blue-500 to-cyan-400',
  },
  violet: {
    text: 'text-violet-600',
    bg: 'bg-violet-500',
    softBg: 'bg-violet-50',
    ring: 'ring-violet-500',
    gradient: 'from-violet-500 to-fuchsia-400',
  },
  orange: {
    text: 'text-orange-600',
    bg: 'bg-orange-500',
    softBg: 'bg-orange-50',
    ring: 'ring-orange-500',
    gradient: 'from-orange-500 to-amber-400',
  },
  emerald: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-500',
    softBg: 'bg-emerald-50',
    ring: 'ring-emerald-500',
    gradient: 'from-emerald-500 to-teal-400',
  },
};
