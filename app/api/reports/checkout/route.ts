import { NextRequest, NextResponse } from 'next/server';
import { createReportCheckoutSession, ReportTier } from '@/lib/payments/report-payments';
import { z } from 'zod';

const checkoutSchema = z.object({
  reportTier: z.enum(['lite', 'pro', 'elite', 'tasklist_pro']),
  domain: z.string().min(1, 'Domain is required'),
  ga4PropertyId: z.string().optional(),
  customerEmail: z.string().email('Valid email is required').optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportTier, domain, ga4PropertyId, customerEmail } = checkoutSchema.parse(body);

    // Clean domain input
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    // Create Stripe checkout session
    const session = await createReportCheckoutSession({
      reportTier: reportTier as ReportTier,
      domain: cleanDomain,
      ga4PropertyId,
      customerEmail
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}