import { Profile, Project } from './project';

export type CollabRequestStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface CollabRequest {
  id: string;
  project_id: string;
  applicant_id: string;
  pitch: string;
  background?: string | null;
  contact: string;
  portfolio_url?: string | null;
  status: CollabRequestStatus;
  created_at: string;
  updated_at: string;
  project?: Project;
  applicant?: Profile;
}
