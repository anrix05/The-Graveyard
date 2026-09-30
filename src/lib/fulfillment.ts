import { getSupabaseAdmin } from './supabase';
import { getRazorpayClient } from './razorpay';
import { inviteCollaborator } from './github';

export interface FulfillmentResult {
  success: boolean;
  status: 'completed' | 'already_processed' | 'already_sold' | 'failed';
  inviteStatus: 'not_applicable' | 'pending' | 'sent' | 'failed';
  inviteError?: string | null;
  message?: string;
  transactionId?: string;
}

/**
 * Idempotently fulfills a purchase by Razorpay order ID.
 * Shared by both the payment verification endpoint and the asynchronous webhook handler.
 */
export async function fulfillPurchase(orderId: string): Promise<FulfillmentResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const razorpay = getRazorpayClient();

  // 1. Load transaction by razorpay_order_id
  const { data: tx, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('*, project:projects(*)')
    .eq('razorpay_order_id', orderId)
    .maybeSingle();

  if (txError || !tx) {
    console.error(`Fulfillment error: Transaction for order ${orderId} not found:`, txError);
    return {
      success: false,
      status: 'failed',
      inviteStatus: 'not_applicable',
      message: 'Transaction record for this order was not found.',
    };
  }

  // If already completed, return stored state idempotently
  if (tx.status === 'completed') {
    return {
      success: true,
      status: 'already_processed',
      inviteStatus: tx.invite_status || 'not_applicable',
      inviteError: tx.invite_error,
      transactionId: tx.id,
      message: 'Transaction was already completed.',
    };
  }

  // 2. Fetch Razorpay order to verify status and amount
  let razorpayOrder: any;
  try {
    razorpayOrder = await razorpay.orders.fetch(orderId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown Razorpay error';
    console.error(`Failed to fetch Razorpay order ${orderId}:`, err);
    return {
      success: false,
      status: 'failed',
      inviteStatus: 'not_applicable',
      message: `Failed to verify with payment gateway: ${msg}`,
    };
  }

  if (!razorpayOrder) {
    return {
      success: false,
      status: 'failed',
      inviteStatus: 'not_applicable',
      message: 'Payment order could not be retrieved.',
    };
  }

  // Verify project and amount match
  const project = tx.project;
  if (!project) {
    return {
      success: false,
      status: 'failed',
      inviteStatus: 'not_applicable',
      message: 'Associated project record missing.',
    };
  }

  if (razorpayOrder.amount !== project.price_paise) {
    console.error(`Price mismatch: Order ${razorpayOrder.amount} vs Project ${project.price_paise}`);
    return {
      success: false,
      status: 'failed',
      inviteStatus: 'not_applicable',
      message: 'Payment amount mismatch detected.',
    };
  }

  // Fetch payments for this order to find the captured payment ID
  let paymentId = tx.payment_id;
  try {
    const payments = await razorpay.orders.fetchPayments(orderId);
    const capturedPayment = payments.items?.find((p: any) => p.status === 'captured') || payments.items?.[0];
    if (capturedPayment?.id) {
      paymentId = capturedPayment.id;
    }
  } catch (err) {
    console.warn(`Could not fetch payments list for order ${orderId}:`, err);
  }

  // 3. Complete transaction in DB
  const { error: updateError } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'completed',
      payment_id: paymentId || `RPAY_${orderId}`,
    })
    .eq('id', tx.id);

  if (updateError) {
    console.error('Failed to complete transaction in DB:', updateError);

    // If duplicate buy completed index rejected the update
    if (updateError.code === '23505' || updateError.message?.includes('unique_completed_buy_purchase')) {
      console.warn(`Project ${project.id} was already purchased by someone else. Initiating refund in test mode.`);

      // Update status to refunded
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('id', tx.id);

      // Attempt test refund via Razorpay if paymentId exists
      if (paymentId) {
        try {
          await razorpay.payments.refund(paymentId, {
            amount: project.price_paise,
            notes: { reason: 'Race condition: project already purchased by another user.' },
          });
        } catch (refundErr) {
          console.error('Razorpay test refund error:', refundErr);
        }
      }

      return {
        success: false,
        status: 'already_sold',
        inviteStatus: 'not_applicable',
        message: 'This project was just purchased by another buyer. Payment will be refunded.',
      };
    }

    return {
      success: false,
      status: 'failed',
      inviteStatus: 'not_applicable',
      message: updateError.message || 'Database update failed.',
    };
  }

  // Mark project sold
  await supabaseAdmin
    .from('projects')
    .update({ is_sold: true })
    .eq('id', project.id);

  // 4. Check if project has GitHub repo and attempt collaborator invitation
  let inviteStatus: 'not_applicable' | 'pending' | 'sent' | 'failed' = 'not_applicable';
  let inviteError: string | null = null;

  // Retrieve delivery asset details for repository
  const { data: asset } = await supabaseAdmin
    .from('project_assets')
    .select('github_repo_full_name, is_private_repo')
    .eq('project_id', project.id)
    .maybeSingle();

  if (asset?.github_repo_full_name && tx.github_username) {
    inviteStatus = 'pending';
    const inviteRes = await inviteCollaborator(
      asset.github_repo_full_name,
      tx.github_username,
      'pull'
    );

    if (inviteRes.success) {
      inviteStatus = 'sent';
      inviteError = null;
    } else {
      inviteStatus = 'failed';
      inviteError = inviteRes.message;
    }

    // Save invite status to transaction
    await supabaseAdmin
      .from('transactions')
      .update({
        invite_status: inviteStatus,
        invite_error: inviteError,
      })
      .eq('id', tx.id);
  }

  // 5. Create notifications for seller and buyer
  try {
    // Seller notification
    await supabaseAdmin.from('notifications').insert({
      user_id: project.seller_id,
      type: 'sale',
      title: 'Project Sold!',
      body: `Your project "${project.title}" has been purchased.`,
      link: `/dashboard?tab=sales`,
    });

    // Buyer notification
    await supabaseAdmin.from('notifications').insert({
      user_id: tx.buyer_id,
      type: 'sale',
      title: 'Purchase Confirmed!',
      body: `You now own "${project.title}". Check your Vault for delivery assets.`,
      link: `/dashboard?tab=vault`,
    });
  } catch (notifErr) {
    console.warn('Failed to insert notifications:', notifErr);
  }

  return {
    success: true,
    status: 'completed',
    inviteStatus,
    inviteError,
    transactionId: tx.id,
    message: 'Purchase completed successfully.',
  };
}
