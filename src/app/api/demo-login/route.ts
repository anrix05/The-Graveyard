import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  if (!isDemo) {
    return NextResponse.json({ error: 'Demo mode is not enabled.' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  if (role !== 'buyer' && role !== 'seller') {
    return NextResponse.json({ error: 'Role must be "buyer" or "seller".' }, { status: 400 });
  }

  const email =
    role === 'seller'
      ? process.env.DEMO_SELLER_EMAIL || 'seller@graveyard.dev'
      : process.env.DEMO_BUYER_EMAIL || 'buyer@graveyard.dev';

  const password =
    role === 'seller'
      ? process.env.DEMO_SELLER_PASSWORD || 'DemoPass123!@#'
      : process.env.DEMO_BUYER_PASSWORD || 'DemoPass123!@#';

  return NextResponse.json({
    email,
    password,
    role,
  });
}
