import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { fulfillPurchase } from '@/lib/fulfillment';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET not configured. Skipping webhook verification.');
      return NextResponse.json({ received: true, warning: 'Webhook secret not set' });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing X-Razorpay-Signature' }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const providedBuf = Buffer.from(signature, 'utf-8');

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Handle payment.captured or order.paid
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;

      if (orderId) {
        console.log(`Processing asynchronous webhook fulfillment for order: ${orderId}`);
        const result = await fulfillPurchase(orderId);
        console.log(`Webhook fulfillment result for ${orderId}:`, result.status);
      }
    }

    return NextResponse.json({ received: true, status: 'processed' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unhandled webhook error:', err);
    // Return 200 to prevent Razorpay retry loops on malformed incoming bodies
    return NextResponse.json({ received: true, error: message }, { status: 200 });
  }
}
