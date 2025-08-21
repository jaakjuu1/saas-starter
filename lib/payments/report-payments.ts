import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { User } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { stripe } from './stripe';

// Report tier pricing in cents (EUR)
export const REPORT_PRICING = {
  lite: {
    amount: 2900, // €29.00
    name: 'Lite Report',
    description: 'Basic SEO audit with technical analysis and keyword gap insights'
  },
  pro: {
    amount: 6900, // €69.00
    name: 'Pro Report', 
    description: 'Complete SEO + CRO analysis with competitor benchmarking'
  },
  elite: {
    amount: 14900, // €149.00
    name: 'Elite Report',
    description: 'Pro features + GA4 integration + task export capabilities'
  },
  tasklist_pro: {
    amount: 29900, // €299.00
    name: 'Tasklist Pro',
    description: 'Elite features + detailed project implementation roadmap'
  }
} as const;

export type ReportTier = keyof typeof REPORT_PRICING;

export async function createReportCheckoutSession({
  reportTier,
  domain,
  ga4PropertyId,
  customerEmail
}: {
  reportTier: ReportTier;
  domain: string;
  ga4PropertyId?: string;
  customerEmail?: string;
}) {
  // Allow anonymous checkout - we'll create user after payment

  const pricing = REPORT_PRICING[reportTier];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: pricing.name,
            description: pricing.description,
            metadata: {
              domain,
              ga4PropertyId: ga4PropertyId || '',
              reportTier
            }
          },
          unit_amount: pricing.amount
        },
        quantity: 1
      }
    ],
    mode: 'payment', // One-time payment, not subscription
    success_url: `${process.env.BASE_URL}/api/reports/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/generate?tier=${reportTier}&domain=${encodeURIComponent(domain)}`,
    metadata: {
      domain,
      ga4PropertyId: ga4PropertyId || '',
      reportTier
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_email: customerEmail
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session;
}

export async function validateReportPayment(sessionId: string): Promise<{
  paymentIntentId: string;
  domain: string;
  reportTier: ReportTier;
  ga4PropertyId?: string;
  customerEmail: string;
  customerName?: string;
}> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent']
  });

  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  if (!session.metadata) {
    throw new Error('Missing payment metadata');
  }

  const { domain, reportTier, ga4PropertyId } = session.metadata;
  
  if (!domain || !reportTier) {
    throw new Error('Invalid payment metadata');
  }

  if (!session.customer_details?.email) {
    throw new Error('Customer email is required');
  }

  return {
    paymentIntentId: typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent!.id,
    domain,
    reportTier: reportTier as ReportTier,
    ga4PropertyId: ga4PropertyId || undefined,
    customerEmail: session.customer_details.email,
    customerName: session.customer_details.name || undefined
  };
}

export async function refundReportPayment(paymentIntentId: string, reason: string = 'requested_by_customer') {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason as Stripe.RefundCreateParams.Reason,
      metadata: {
        refunded_at: new Date().toISOString(),
        reason
      }
    });

    return refund;
  } catch (error) {
    console.error('Failed to process refund:', error);
    throw new Error('Refund processing failed');
  }
}

// Generate receipt data for email notifications
export function generateReportReceipt(payment: {
  domain: string;
  reportTier: ReportTier;
  amount: number;
  paymentIntentId: string;
  customerEmail: string;
}) {
  const pricing = REPORT_PRICING[payment.reportTier];
  
  return {
    receiptNumber: `RPT-${payment.paymentIntentId.slice(-8).toUpperCase()}`,
    reportType: pricing.name,
    domain: payment.domain,
    amount: payment.amount / 100, // Convert from cents
    currency: 'EUR',
    paymentDate: new Date().toISOString(),
    customerEmail: payment.customerEmail,
    description: pricing.description
  };
}