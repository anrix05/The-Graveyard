export type InteractionType = 'adopt' | 'buy' | 'collab';

export interface Profile {
  id: string;
  username: string | null;
  github_url: string | null;
  reputation_score: number;
  contact_info?: string | null;
  phone_number?: string | null;
  upi_id?: string | null;
}

export interface Project {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  interaction_type: InteractionType;
  price: number;
  repo_link: string | null;
  github_repo_id?: string | null;
  github_repo_full_name?: string | null;
  is_private_repo?: boolean;
  file_url?: string | null;
  is_sold: boolean;
  is_archived?: boolean;
  is_collab_filled?: boolean;
  created_at: string;
  views?: number;
  seller?: Profile;
}

export interface TechIcon {
  name: string;
  icon: string;
  color: string;
}

export const TECH_ICONS: Record<string, TechIcon> = {
  react: { name: 'React', icon: 'atom', color: '#61DAFB' },
  typescript: { name: 'TypeScript', icon: 'file-code', color: '#3178C6' },
  javascript: { name: 'JavaScript', icon: 'file-code-2', color: '#F7DF1E' },
  nodejs: { name: 'Node.js', icon: 'server', color: '#339933' },
  python: { name: 'Python', icon: 'code', color: '#3776AB' },
  rust: { name: 'Rust', icon: 'cog', color: '#CE412B' },
  go: { name: 'Go', icon: 'code-2', color: '#00ADD8' },
  nextjs: { name: 'Next.js', icon: 'layout', color: '#FFFFFF' },
  tailwind: { name: 'Tailwind', icon: 'wind', color: '#06B6D4' },
  supabase: { name: 'Supabase', icon: 'database', color: '#3ECF8E' },
  prisma: { name: 'Prisma', icon: 'database', color: '#2D3748' },
  graphql: { name: 'GraphQL', icon: 'git-branch', color: '#E10098' },
  docker: { name: 'Docker', icon: 'container', color: '#2496ED' },
  aws: { name: 'AWS', icon: 'cloud', color: '#FF9900' },
  firebase: { name: 'Firebase', icon: 'flame', color: '#FFCA28' },
};