'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup } from '@/components/ui/radio-group';
import { Check, Zap, BarChart3, Target, Rocket } from 'lucide-react';
import { REPORT_PRICING, ReportTier } from '@/lib/payments/report-payments';

const reportTiers = [
  {
    id: 'lite' as ReportTier,
    name: 'Lite Report',
    price: '€29',
    description: 'Perfect for quick SEO insights',
    icon: Zap,
    features: [
      'Technical SEO audit',
      'Page speed analysis',
      'Basic keyword gap analysis',
      'PDF report delivery'
    ],
    color: 'bg-blue-500',
    popular: false
  },
  {
    id: 'pro' as ReportTier,
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
    color: 'bg-purple-500',
    popular: true
  },
  {
    id: 'elite' as ReportTier,
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
    color: 'bg-orange-500',
    popular: false
  },
  {
    id: 'tasklist_pro' as ReportTier,
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
    color: 'bg-green-500',
    popular: false
  }
];

export default function GenerateReportPage() {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState<ReportTier>('pro');
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to clean and normalize domain input
  const cleanDomain = (input: string): string => {
    let cleaned = input.trim();
    
    // Remove common protocols
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Remove trailing slash and path
    cleaned = cleaned.split('/')[0];
    
    // Remove any query parameters or hash
    cleaned = cleaned.split('?')[0].split('#')[0];
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain || !email) return;

    const cleanedDomain = cleanDomain(domain);
    
    // Basic domain validation
    if (!cleanedDomain || !cleanedDomain.includes('.')) {
      alert('Please enter a valid domain name');
      return;
    }

    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/reports/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportTier: selectedTier,
          domain: cleanedDomain,
          ga4PropertyId: ga4PropertyId || undefined,
          customerEmail: email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTierData = reportTiers.find(tier => tier.id === selectedTier)!;

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Your Website Growth Report
          </h1>
          <p className="text-xl text-gray-600">
            Get AI-powered insights and actionable tasks to grow your online presence
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Report Tier Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Report Type</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {reportTiers.map((tier) => {
                  const Icon = tier.icon;
                  return (
                    <div
                      key={tier.id}
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        selectedTier === tier.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      {tier.popular && (
                        <div className="absolute -top-2 left-4 bg-orange-500 text-white px-2 py-1 text-xs font-medium rounded">
                          Most Popular
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${tier.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                            <span className="text-2xl font-bold text-gray-900">{tier.price}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{tier.description}</p>
                          
                          <ul className="space-y-1">
                            {tier.features.map((feature) => (
                              <li key={feature} className="flex items-center text-sm text-gray-600">
                                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain Input Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Website Details</h2>
              
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
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    We'll send your report to this email address
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
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your website URL in any format - we'll clean it up
                  </p>
                </div>

                {(selectedTier === 'elite' || selectedTier === 'tasklist_pro') && (
                  <div>
                    <Label htmlFor="ga4PropertyId">Google Analytics 4 Property ID (Optional)</Label>
                    <Input
                      id="ga4PropertyId"
                      type="text"
                      placeholder="123456789"
                      value={ga4PropertyId}
                      onChange={(e) => setGa4PropertyId(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Add your GA4 Property ID for traffic analysis insights
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg"
                  disabled={isLoading || !domain || !email}
                >
                  {isLoading ? 'Processing...' : `Generate ${selectedTierData.name} - ${selectedTierData.price}`}
                </Button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${selectedTierData.color} text-white`}>
                    <selectedTierData.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selectedTierData.name}</div>
                    <div className="text-sm text-gray-600">{selectedTierData.description}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Report Generation</span>
                    <span className="font-semibold">{selectedTierData.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-500">{selectedTierData.price}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-500 pt-4 border-t">
                  <p className="mb-2">✓ Secure payment with Stripe</p>
                  <p className="mb-2">✓ Report delivered via email</p>
                  <p className="mb-2">✓ Generated in under 5 minutes</p>
                  <p>✓ 30-day money-back guarantee</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}