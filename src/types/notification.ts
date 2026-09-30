export type NotificationType =
  | 'sale'
  | 'claim'
  | 'collab_pitch'
  | 'pitch_accepted'
  | 'pitch_rejected'
  | 'new_message'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}
