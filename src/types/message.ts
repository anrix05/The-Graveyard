export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    project_id?: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface ChatUser {
    id: string;
    username: string;
    avatar_url?: string;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
}
