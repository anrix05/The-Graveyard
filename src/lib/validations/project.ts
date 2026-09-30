import { z } from 'zod';

export const collabRoleSchema = z.object({
  role: z.string().min(1, 'Role title is required.').max(60, 'Role title too long.'),
  commitment: z.string().min(1, 'Commitment is required.').max(40, 'Commitment too long.'),
  description: z.string().min(1, 'Role description is required.').max(300, 'Description too long.'),
});

export const projectPublishSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.').max(100, 'Title is too long.'),
  tagline: z.string().max(120, 'Tagline cannot exceed 120 characters.').optional().nullable(),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  tech_stack: z.array(z.string()).min(1, 'Select at least one technology.'),
  interaction_type: z.enum(['buy', 'adopt', 'collab']),
  price_paise: z.number().int().min(0, 'Price cannot be negative.'),
  cover_url: z.string().url().optional().nullable(),
  demo_url: z.string().url().optional().nullable().or(z.literal('')),
  license: z.string().optional().nullable(),
  collab_terms: z.string().optional().nullable(),
  cause_of_death: z.enum([
    'lost_interest',
    'no_time',
    'pivoted',
    'ran_out_of_funding',
    'tech_outdated',
    'cofounder_left',
    'scope_creep',
    'other',
  ]).optional().nullable(),
  abandoned_on: z.string().optional().nullable(),
  epitaph: z.string().max(140, 'Epitaph cannot exceed 140 characters.').optional().nullable(),
  completion_percent: z.number().int().min(0).max(100).optional().nullable(),
  lines_of_code: z.number().int().min(0).optional().nullable(),
  features: z.array(z.string().max(150)).max(10).optional().default([]),
  todo_items: z.array(z.string().max(150)).max(10).optional().default([]),
  setup_notes: z.string().max(10000).optional().nullable(),
  screenshots: z.array(z.string().url()).max(6).optional().default([]),
  file_tree: z.array(z.string()).max(300).optional().nullable(),
  collab_roles: z.array(collabRoleSchema).max(4).optional().nullable(),
});
