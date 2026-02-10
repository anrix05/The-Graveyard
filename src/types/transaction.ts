import { Project, Profile } from './project';

export interface Transaction {
    id: string;
    project_id: string;
    buyer_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    payment_id: string;
    created_at: string;
    project?: Project;
    buyer?: Profile;
    seller?: Profile;
    github_username?: string;
    metadata?: any; // JSONB column
}
