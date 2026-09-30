import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';
import { fulfillPurchase } from '@/lib/fulfillment';

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  paymentId: z.string().min(1, 'Payment ID is required.'),
  signature: z.string().min(1, 'Signature is required.'),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from JWT
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    // 2. Validate input payload
    const body = await req.json().catch(() => ({}));
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid parameters.' } },
        { status: 400 }
      );
    }

    const { orderId, paymentId, signature } = parsed.data;

    // 3. Cryptographic Signature Verification with timingSafeEqual
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is missing from environment.');
      return NextResponse.json(
        { error: { code: 'CONFIG_ERROR', message: 'Server payment configuration is incomplete.' } },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(generatedSignature, 'utf-8');
    const providedBuf = Buffer.from(signature, 'utf-8');

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      console.warn('Payment signature verification failed for order:', orderId);
      return NextResponse.json(
        { error: { code: 'INVALID_SIGNATURE', message: 'Payment verification failed: Signature mismatch.' } },
        { status: 400 }
      );
    }

    // 4. Verify that pending transaction belongs to the calling buyer
    const supabaseAdmin = getSupabaseAdmin();
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('buyer_id, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (txError || !tx) {
      return NextResponse.json(
        { error: { code: 'TRANSACTION_NOT_FOUND', message: 'No matching transaction found for this order.' } },
        { status: 404 }
      );
    }

    if (tx.buyer_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Transaction does not match authenticated user account.' } },
        { status: 403 }
      );
    }

    // 5. Delegate to idempotent shared fulfillment function
    const result = await fulfillPurchase(orderId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: result.status === 'already_sold' ? 'ALREADY_SOLD' : 'FULFILLMENT_FAILED',
            message: result.message || 'Payment fulfillment could not be completed.',
          },
          inviteStatus: result.inviteStatus,
          inviteError: result.inviteError,
        },
        { status: result.status === 'already_sold' ? 409 : 500 }
      );
    }

    return NextResponse.json({
      status: result.status,
      inviteStatus: result.inviteStatus,
      inviteError: result.inviteError,
      transactionId: result.transactionId,
      message: result.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unhandled verify-payment exception:', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
