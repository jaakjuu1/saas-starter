import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Zap, BarChart3, Target, Rocket } from 'lucide-react';
import Link from 'next/link';
import { REPORT_PRICING } from '@/lib/payments/report-payments';

const reportTiers = [
  {
    id: 'lite',
    name: 'Lite Report',
    price: '€29',
    description: 'Perfect for quick SEO insights',
    icon: Zap,
    features: [
      'Technical SEO audit',
      'Page speed analysis',
      'Basic keyword gap analysis',
      'PDF report delivery',
      'Delivered in 5 minutes'
    ],
    color: 'border-blue-500',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro Report',
    price: '€69',
    description: 'Comprehensive growth analysis',
    icon: BarChart3,
    features: [
      'Everything in Lite',
      'Competitor analysis',
      'CRO recommendations',
      'Content strategy insights',
      'Priority task list'
    ],
    color: 'border-purple-500',
    popular: true
  },
  {
    id: 'elite',
    name: 'Elite Report',
    price: '€149',
    description: 'Advanced insights with integrations',
    icon: Target,
    features: [
      'Everything in Pro',
      'GA4 traffic analysis',
      'Advanced competitor tracking',
      'Task export (CSV/Asana/Notion)',
      'Performance benchmarking'
    ],
    color: 'border-orange-500',
    popular: false
  },
  {
    id: 'tasklist_pro',
    name: 'Tasklist Pro',
    price: '€299',
    description: 'Complete implementation roadmap',
    icon: Rocket,
    features: [
      'Everything in Elite',
      'Detailed project roadmap',
      'Implementation timeline',
      'ROI projections',
      'Strategy consultation call'
    ],
    color: 'border-green-500',
    popular: false
  }
];

export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Growth Report
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered website analysis with actionable insights delivered in minutes
        </p>
        <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            30-day money-back guarantee
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            Secure payment with Stripe
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            Report delivered via email
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.id}
              className={`relative bg-white rounded-lg border-2 ${tier.color} p-6 ${
                tier.popular ? 'ring-2 ring-purple-500 ring-offset-2' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  tier.id === 'lite' ? 'bg-blue-100 text-blue-600' :
                  tier.id === 'pro' ? 'bg-purple-100 text-purple-600' :
                  tier.id === 'elite' ? 'bg-orange-100 text-orange-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {tier.price}
                  <span className="text-lg font-normal text-gray-600 block">one-time</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={`/generate?tier=${tier.id}`} className="block">
                <Button
                  className={`w-full ${
                    tier.popular
                      ? 'bg-purple-500 hover:bg-purple-600'
                      : 'bg-gray-900 hover:bg-gray-800'
                  } text-white`}
                >
                  Get {tier.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Not sure which report is right for you?
          </h2>
          <p className="text-gray-600 mb-6">
            Start with our Pro Report - it's our most popular choice and includes everything 
            most businesses need to get started with website growth.
          </p>
          <Link href="/generate?tier=pro">
            <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white">
              Start with Pro Report - €69
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
