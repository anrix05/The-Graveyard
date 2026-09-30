import { Profile } from './project';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  project_id?: string | null;
  thread_key: string;
  content: string;
  is_read: boolean;
  deleted_by_sender?: boolean;
  deleted_by_receiver?: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface ChatThread {
  thread_key: string;
  other_user: Profile;
  project_id?: string | null;
  project_title?: string | null;
  last_message: Message;
  unread_count: number;
}
