export type InteractionType = 'buy' | 'adopt' | 'collab';

export type CauseOfDeath =
  | 'lost_interest'
  | 'no_time'
  | 'pivoted'
  | 'ran_out_of_funding'
  | 'tech_outdated'
  | 'cofounder_left'
  | 'scope_creep'
  | 'other';

export const CAUSE_OF_DEATH_LABELS: Partial<Record<CauseOfDeath, string>> = {
  lost_interest: 'Lost interest',
  no_time: 'No time',
  pivoted: 'Pivoted',
  ran_out_of_funding: 'Ran out of funding',
  tech_outdated: 'Tech outdated',
  cofounder_left: 'Co-founder left',
  scope_creep: 'Scope creep',
};

export interface Profile {
  id: string;
  username: string | null;
  github_url: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  reputation_score?: number;
  contact_info?: string | null;
  phone_number?: string | null;
  upi_id?: string | null;
  created_at?: string;
}

export interface ProjectAsset {
  project_id: string;
  file_path?: string | null;
  github_repo_id?: string | null;
  github_repo_full_name?: string | null;
  is_private_repo?: boolean;
  file_size_bytes?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CollabRole {
  role: string;
  commitment: string;
  description: string;
}

export interface Project {
  id: string;
  seller_id: string;
  title: string;
  tagline?: string | null;
  description: string | null;
  tech_stack: string[];
  interaction_type: InteractionType;
  price_paise: number;
  cover_url?: string | null;
  demo_url?: string | null;
  license?: string | null;
  collab_terms?: string | null;
  cause_of_death?: CauseOfDeath | null;
  abandoned_on?: string | null;
  last_commit_at?: string | null;
  epitaph?: string | null;
  revived_at?: string | null;
  has_archive: boolean;
  has_repo: boolean;
  is_sold: boolean;
  is_archived?: boolean;
  is_collab_filled?: boolean;
  views: number;
  completion_percent?: number | null;
  lines_of_code?: number | null;
  features?: string[];
  todo_items?: string[];
  setup_notes?: string | null;
  screenshots?: string[];
  file_tree?: string[] | null;
  collab_roles?: CollabRole[] | null;
  is_featured?: boolean;
  featured_rank?: number | null;
  seed_key?: string | null;
  created_at: string;
  updated_at?: string;
  seller?: Profile;
  assets?: ProjectAsset;
}

export interface MarketplaceStats {
  live_total: number;
  for_sale: number;
  free_forks: number;
  open_collabs: number;
  resurrected: number;
  operatives: number;
}

export interface FeedCounts {
  all: number;
  buy: number;
  adopt: number;
  collab: number;
}

export interface MarketplaceFeedResponse {
  projects: Project[];
  counts: FeedCounts;
}

export interface TechIcon {
  name: string;
  icon: string;
}

export const CANONICAL_TECHS = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Node.js',
  'TailwindCSS',
  'Supabase',
  'PostgreSQL',
  'Docker',
  'Vue',
  'Svelte',
  'FastAPI',
] as const;

export const TECH_ICONS: Record<string, string> = {
  React: 'Atom',
  'Next.js': 'Layers',
  TypeScript: 'FileCode',
  JavaScript: 'FileCode2',
  Python: 'FileCode',
  Go: 'Zap',
  Rust: 'Cog',
  'Node.js': 'Server',
  TailwindCSS: 'Layout',
  Supabase: 'Database',
  PostgreSQL: 'Database',
  Docker: 'Container',
  Vue: 'Code2',
  Svelte: 'Flame',
  FastAPI: 'Zap',
};