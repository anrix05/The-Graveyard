import Razorpay from 'razorpay';

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay Environment Variables (NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET)');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Lazy/safe export for existing imports
let _razorpayInstance: Razorpay | null = null;
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    if (!_razorpayInstance) {
      _razorpayInstance = getRazorpayClient();
    }
    return (_razorpayInstance as unknown as Record<string, unknown>)[prop as string];
  },
});
