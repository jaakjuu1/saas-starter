import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { reports, reportJobs } from '@/lib/db/schema';
import { validateReportPayment, generateReportReceipt, REPORT_PRICING } from '@/lib/payments/report-payments';
import { findOrCreateUserByEmail } from '@/lib/db/queries';
import { addReportJob } from '@/lib/queue/report-queue';
import { setSession } from '@/lib/auth/session';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/generate?error=missing_session', request.url));
  }

  try {
    // Validate the payment with Stripe
    const paymentData = await validateReportPayment(sessionId);

    // Find or create user based on email from Stripe
    const user = await findOrCreateUserByEmail(
      paymentData.customerEmail,
      paymentData.customerName
    );

    // Check if report already exists for this payment
    const existingReport = await db
      .select()
      .from(reports)
      .where(eq(reports.stripePaymentId, paymentData.paymentIntentId))
      .limit(1);

    let reportId: number;

    if (existingReport.length > 0) {
      reportId = existingReport[0].id;
    } else {
      // Create new report record
      const newReport = await db
        .insert(reports)
        .values({
          userId: user.id,
          domain: paymentData.domain,
          reportType: paymentData.reportTier,
          status: 'pending',
          ga4PropertyId: paymentData.ga4PropertyId,
          stripePaymentId: paymentData.paymentIntentId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({ id: reports.id });

      reportId = newReport[0].id;

      // Create initial job record
      const jobId = `report-${reportId}`;
      await db.insert(reportJobs).values({
        reportId,
        jobId,
        status: 'queued',
        progress: 0,
        createdAt: new Date()
      });

      // Queue the report generation job
      await addReportJob({
        reportId,
        domain: paymentData.domain,
        reportTier: paymentData.reportTier,
        ga4PropertyId: paymentData.ga4PropertyId,
        userId: user.id,
        customerEmail: paymentData.customerEmail
      });

      console.log(`Report ${reportId} queued for generation with job ${jobId}`);
    }

    // Generate receipt data for potential email notification
    const receipt = generateReportReceipt({
      domain: paymentData.domain,
      reportTier: paymentData.reportTier,
      amount: REPORT_PRICING[paymentData.reportTier].amount,
      paymentIntentId: paymentData.paymentIntentId,
      customerEmail: paymentData.customerEmail
    });

    console.log('Payment processed successfully:', {
      reportId,
      receipt: receipt.receiptNumber,
      domain: paymentData.domain
    });

    // Automatically log in the user
    await setSession(user);

    // Redirect to report status page
    return NextResponse.redirect(
      new URL(`/reports/${reportId}?success=true`, request.url)
    );

  } catch (error) {
    console.error('Error processing report payment:', error);
    return NextResponse.redirect(
      new URL('/generate?error=payment_failed', request.url)
    );
  }
}