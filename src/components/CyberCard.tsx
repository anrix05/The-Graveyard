'use client';

import React from 'react';
import ProjectCard from './ProjectCard';
import { Project } from '@/types/project';

interface CyberCardProps {
  project: Project;
  index?: number;
  isOwner?: boolean;
  isPurchased?: boolean;
  isCollaborator?: boolean;
  onDelete?: (id: string) => void;
}

export const CyberCard: React.FC<CyberCardProps> = ({ project, isOwner }) => {
  return <ProjectCard project={project} isOwner={isOwner} />;
};

export default CyberCard;