import Link from 'next/link'; // <--- Added this
import { motion } from 'framer-motion';
import { GitFork, IndianRupee, Users, Eye } from 'lucide-react';
import { Project, InteractionType } from '@/types/project';
import TechBadge from './TechBadge';

interface CyberCardProps {
  project: Project;
  index?: number;
  isOwner?: boolean;
  isPurchased?: boolean;
  isCollaborator?: boolean;
  onDelete?: (id: string) => void;
}

const interactionConfig: Record<InteractionType, {
  label: string;
  buttonText: string;
  icon: React.ReactNode;
  className: string;
}> = {
  buy: {
    label: 'FOR SALE',
    buttonText: 'Purchase',
    icon: <IndianRupee className="w-4 h-4" />,
    className: 'bg-cyber-neon text-cyber-black hover:shadow-glow-neon',
  },
  adopt: {
    label: 'FREE FORK',
    buttonText: 'Claim',
    icon: <GitFork className="w-4 h-4" />,
    className: 'bg-cyber-gray text-foreground hover:bg-cyber-muted border border-cyber-gray',
  },
  collab: {
    label: 'SEEKING PARTNER',
    buttonText: 'Request Access',
    icon: <Users className="w-4 h-4" />,
    className: 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  },
};

const CyberCard = ({ project, index = 0, isOwner = false, isPurchased = false, isCollaborator = false, onDelete }: CyberCardProps) => {
  /* 
   * Safety Check: interaction_type might be missing or invalid if:
   * 1. Data is malformed (e.g. rendering a Transaction as a Project)
   * 2. DB has null values
   */
  const config = interactionConfig[project.interaction_type] || {
    label: 'UNKNOWN',
    buttonText: 'View',
    icon: null,
    className: 'bg-gray-500'
  };

  const projectId = project.id?.slice(0, 8).toUpperCase() || "UNKNOWN";

  // Wrap the whole card in a Link to the details page
  return (
    <Link href={`/project/${project.id}`} className="block h-full">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        whileHover={{ scale: 1.02 }}
        className="group relative h-full cyber-clip bg-cyber-dark glow-border transition-all duration-300 md:hover:glow-border-red flex flex-col"
      >
        {/* Warning Strip Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="warning-strip">
            WARNING // {projectId}
          </div>

          <div className={`px-3 py-1 text-xs font-mono uppercase ${project.is_sold ? 'text-cyber-red font-bold'
            : project.is_archived ? 'text-cyber-muted'
              : project.is_collab_filled ? 'text-blue-400 font-bold'
                : project.interaction_type === 'collab' ? 'text-blue-400'
                  : 'text-cyber-muted'
            }`}>
            {project.is_sold ? 'SOLD OUT'
              : project.is_archived ? 'ARCHIVED'
                : project.is_collab_filled ? 'PARTNERED'
                  : config.label}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 md:p-5 space-y-4 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-display text-xl font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-cyber-red transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-cyber-muted leading-relaxed line-clamp-3 flex-1">
              {project.description}
            </p>
          )}

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 pt-2">
            {project.tech_stack.slice(0, 5).map((tech) => (
              <TechBadge key={tech} tech={tech} />
            ))}
            {project.tech_stack.length > 5 && (
              <span className="px-2 py-1 text-xs font-mono text-cyber-muted bg-cyber-black border border-cyber-gray">
                +{project.tech_stack.length - 5}
              </span>
            )}
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-4 border-t border-cyber-gray mt-auto">
            {isOwner ? (
              // Owner View
              <div className="w-full flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />
                    <span className="text-sm font-mono text-cyber-red font-bold tracking-wider">MINE</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyber-muted" title="Total Views">
                    <Eye className="w-3 h-3" />
                    <span className="text-xs font-mono">{project.views || 0}</span>
                  </div>
                </div>

                {/* Still showing Edit/Delete because that's useful, but styled minimally */}
                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1 text-[10px] font-mono uppercase bg-cyber-dark border border-cyber-gray hover:border-white hover:text-white transition-colors cyber-clip-sm">
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(project.id);
                      }}
                      className="px-3 py-1 text-[10px] font-mono uppercase bg-cyber-dark border border-red-900 text-red-700 hover:bg-red-900/20 hover:border-red-500 hover:text-red-500 transition-colors cyber-clip-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ) : isCollaborator ? (
              // Collaborator View (Joined by user)
              <div className="w-full flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-mono text-blue-400 font-bold tracking-wider">PARTNER</span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="cyber-clip-sm flex items-center gap-2 px-4 py-2.5 bg-cyber-dark border border-blue-500 text-blue-400 font-display font-semibold text-sm uppercase tracking-wide hover:bg-blue-500 hover:text-white transition-all duration-200">
                    <span className="mr-1">→</span>
                    OPEN WORKSPACE
                  </div>
                  {project.seller?.contact_info && (
                    <div className="text-[10px] font-mono text-cyber-muted text-right max-w-[150px] break-words">
                      <span className="text-cyber-gray block text-[9px] uppercase tracking-widest">SECURE_COMMS:</span>
                      {project.seller.contact_info}
                    </div>
                  )}
                </div>
              </div>
            ) : isPurchased ? (
              // Purchased / Owned View (Bought by user)
              <div className="w-full flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${project.interaction_type === 'adopt' ? 'bg-cyber-gray' : 'bg-cyber-neon'} animate-pulse`} />
                  <span className={`text-sm font-mono ${project.interaction_type === 'adopt' ? 'text-cyber-muted' : 'text-cyber-neon'} font-bold tracking-wider`}>
                    {project.interaction_type === 'adopt' ? 'CLAIMED' : 'OWNED'}
                  </span>
                </div>

                <div className={`cyber-clip-sm flex items-center gap-2 px-4 py-2.5 bg-cyber-dark border ${project.interaction_type === 'adopt' ? 'border-cyber-gray text-cyber-muted hover:bg-cyber-gray hover:text-cyber-black' : 'border-cyber-neon text-cyber-neon hover:bg-cyber-neon hover:text-cyber-dark'} font-display font-semibold text-sm uppercase tracking-wide transition-all duration-200`}>
                  <span className="mr-1">↓</span>
                  ACCESS
                </div>
              </div>
            ) : (
              // Buyer / Visitor View
              <>
                {/* Price */}
                <div className="flex items-baseline gap-1">
                  {project.interaction_type === 'buy' ? (
                    <>
                      <span className="text-2xl font-display font-bold text-cyber-neon">
                        ₹{project.price.toFixed(0)}
                      </span>
                      <span className="text-xs text-cyber-muted">.00</span>
                    </>
                  ) : project.interaction_type === 'adopt' ? (
                    <span className="text-lg font-display font-semibold text-foreground">
                      FREE
                    </span>
                  ) : (
                    <span className="text-lg font-display font-semibold text-blue-400">
                      Equity Share
                    </span>
                  )}
                </div>

                {/* Action Button Visual (It's inside a Link so it's decorative) */}
                <div
                  className={`cyber-clip-sm flex items-center gap-2 px-4 py-2.5 font-display font-semibold text-sm uppercase tracking-wide transition-all duration-200 ${config.className}`}
                >

                  {project.is_collab_filled ? (
                    <>
                      <Users className="w-4 h-4" />
                      COLLABED
                    </>
                  ) : (
                    <>
                      {config.icon}
                      {config.buttonText}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hover Glow Effect (Desktop only) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-b from-cyber-red/5 to-transparent" />
        </div>
      </motion.article>
    </Link >
  );
};

export default CyberCard;