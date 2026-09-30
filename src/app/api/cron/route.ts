import { GET as pingGet } from './ping/route';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return pingGet(req);
}
