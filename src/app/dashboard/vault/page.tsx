import { redirect } from 'next/navigation';

export default function VaultRedirect() {
  redirect('/dashboard?tab=vault');
}
