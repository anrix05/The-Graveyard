
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Shield, MessageSquare } from 'lucide-react';
import { Profile } from '@/types/project';

interface OperativeCardProps {
    partner: {
        id: string; // Transaction ID
        project_id: string; // Ensure this is available
        buyer: Profile;
        project: {
            title: string;
        };
        metadata?: {
            contact?: string;
            specialization?: string;
        };
    };
    index?: number;
}

const OperativeCard = ({ partner, index = 0 }: OperativeCardProps) => {
    return (
        <Link href={`/project/${partner.project_id}`} className="block h-full">
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                }}
                whileHover={{ scale: 1.02 }}
                className="group relative h-full cyber-clip bg-cyber-dark glow-border transition-all duration-300 hover:glow-border-blue flex flex-col"
            >
                {/* Warning Strip Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="warning-strip bg-cyber-dark text-cyber-muted">
                        OPERATIVE // {partner.buyer.username?.slice(0, 8).toUpperCase() || "UNKNOWN"}
                    </div>
                    {/* Status on top right matching CyberCard layout */}
                    <div className="px-3 py-1 text-xs font-mono uppercase text-cyber-muted">
                        ACTIVE
                    </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-4 flex flex-col flex-1">
                    {/* Operative Name as Title */}
                    <h3 className="font-display text-xl font-semibold text-white leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        <User className="w-5 h-5 opacity-70" />
                        {partner.buyer.username || "UNKNOWN_USER"}
                    </h3>

                    {/* Description Area: Project & Specialization */}
                    <div className="space-y-3 flex-1">
                        {/* Project Context */}
                        <div className="text-sm font-mono text-cyber-muted border-l-2 border-blue-500/30 pl-3">
                            <span className="text-[10px] uppercase tracking-widest text-cyber-gray block mb-0.5">ASSIGNED TO PROJECT</span>
                            <span className="text-white line-clamp-1">{partner.project?.title}</span>
                        </div>

                        {/* Specialization */}
                        {partner.metadata?.specialization && (
                            <div className="text-sm text-cyber-muted pt-2">
                                <span className="text-[10px] uppercase tracking-widest text-cyber-gray block mb-1">SPECIALIZATION</span>
                                <p className="line-clamp-2 text-xs">{partner.metadata.specialization}</p>
                            </div>
                        )}
                    </div>

                    {/* Contact Info (Footer - Matches Collaborator View Exactly) */}
                    <div className="mt-auto pt-4 border-t border-cyber-gray flex items-center justify-between gap-4">
                        {/* Status Left: Blue Dot + PARTNER */}
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-sm font-mono text-blue-400 font-bold tracking-wider">PARTNER</span>
                        </div>

                        {/* Action Right: Open Workspace Button + Contact Info below */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="cyber-clip-sm flex items-center gap-2 px-4 py-2.5 bg-cyber-dark border border-blue-500 text-blue-400 font-display font-semibold text-sm uppercase tracking-wide hover:bg-blue-500 hover:text-white transition-all duration-200">
                                <span className="mr-1">→</span>
                                OPEN WORKSPACE
                            </div>
                            {partner.metadata?.contact && (
                                <div className="text-[10px] font-mono text-cyber-muted text-right max-w-[150px] break-words">
                                    <span className="text-cyber-gray block text-[9px] uppercase tracking-widest">SECURE_COMMS:</span>
                                    {partner.metadata.contact}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
                </div>
            </motion.article>
        </Link>
    );
};

export default OperativeCard;
