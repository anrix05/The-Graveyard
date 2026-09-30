import { Project, Profile } from './project';

export type TransactionKind = 'buy' | 'adopt';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type InviteStatus = 'not_applicable' | 'pending' | 'sent' | 'failed';

export interface Transaction {
  id: string;
  project_id: string;
  buyer_id: string;
  amount: number; // in paise
  kind: TransactionKind;
  status: TransactionStatus;
  payment_id: string;
  razorpay_order_id?: string | null;
  expires_at?: string | null;
  invite_status: InviteStatus;
  invite_error?: string | null;
  github_username?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  project?: Project;
  buyer?: Profile;
  seller?: Profile;
}
