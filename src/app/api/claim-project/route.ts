import { POST as claimPost } from '../claim/route';

export async function POST(req: Request) {
  return claimPost(req);
}
