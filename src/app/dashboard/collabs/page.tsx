import { redirect } from 'next/navigation';

export default function CollabsRedirect() {
  redirect('/dashboard?tab=collabs');
}
