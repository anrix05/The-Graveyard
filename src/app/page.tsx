"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterBar from "@/components/FilterBar";
import CyberCard from "@/components/CyberCard";
import { mockProjects } from "@/data/mockProjects";
import { InteractionType, Project } from "@/types/project";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const Home = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<InteractionType | 'all'>('all');

    const { user } = useAuth();

    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Projects from Supabase
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            try {
                // Fetch projects sorted by newest first
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('is_sold', false)
                    .eq('is_archived', false)
                    // .eq('is_collab_filled', false) // Optionally filter at DB level, but client side is fine for small scale
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProjects(data || []);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // Filter Logic (Client-side for now, can be moved to DB query later for optimization)
    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (project.tech_stack && project.tech_stack.some((tech: string) => tech.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesFilter = activeFilter === 'all' || project.interaction_type === activeFilter;

        // Hide projects the user already has a relationship with (Owned/Purchased/Collab)
        let isHidden = false;
        if (user) {
            const userRelatedIds = [
                ...(user.owned_ids || []),
                ...(user.purchased_ids || []),
                ...(user.collab_ids || [])
            ];

            // Hide purchased items, BUT KEEP 'adopt' (Free) items visible so they show as "CLAIMED"
            if ((user.purchased_ids || []).includes(project.id)) {
                if (project.interaction_type !== 'adopt') {
                    isHidden = true;
                }
            }

            // Hide own projects? usually marketplaces allow you to see your own but maybe "manage" them. 
            // For now, let's HIDE them from the "Buy" feed as per request (to avoid duplicates from dashboard)
            /* TEMPORARILY DISABLED SO YOU CAN SEE YOUR UPLOAD
            if (userRelatedIds.includes(project.id) || project.seller_id === user.id) {
                isHidden = true;
            }
            */
        }

        // Hide filled collaborations from the feed
        if (project.is_collab_filled) {
            isHidden = true;
        }

        return matchesSearch && matchesFilter && !isHidden;
    });

    // Calculate Dynamic Stats
    const stats = {
        forSale: projects.filter(p => p.interaction_type === 'buy' && !p.is_sold).length,
        freeForks: projects.filter(p => p.interaction_type === 'adopt').length,
        seekingCollabs: projects.filter(p => p.interaction_type === 'collab' && !p.is_collab_filled).length,
        total: projects.length
    };

    return (
        <div className="min-h-screen bg-cyber-black text-foreground selection:bg-cyber-red selection:text-white">
            <Header />

            <main className="container mx-auto px-4 py-8 md:py-12 space-y-8">
                {/* Hero Section */}
                <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-4xl mx-auto pt-10 pb-6">
                    {/* Radial Glow Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] radial-glow-red pointer-events-none -z-10" />

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-black/80 border border-cyber-gray/30 rounded-none cyber-clip-sm backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-cyber-red animate-pulse-glow" />
                        <span className="font-mono text-xs md:text-sm text-cyber-red tracking-widest uppercase">
                            SYSTEM ONLINE <span className="text-cyber-muted mx-2">//</span> {stats.total} DEAD PROJECTS INDEXED
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="font-display text-4xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                        Where Code Goes to <span className="text-cyber-red">Get</span><br />
                        <span className="text-cyber-red">Resurrected</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-cyber-muted text-lg md:text-xl font-mono max-w-2xl leading-relaxed">
                        A marketplace for abandoned projects. Adopt free repos, buy premium codebases, or find collaborators to finish what was started.
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 pt-4 border-t border-cyber-gray/20 w-full md:w-fit">
                        <div className="text-center group cursor-default">
                            <div className="font-display text-4xl font-bold text-cyber-neon group-hover:text-cyber-neon/80 transition-colors">
                                {/* Removed currency symbol for count clarity, or reuse if style demands it but represent COUNT */}
                                {stats.forSale}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-cyber-muted mt-2 group-hover:text-cyber-gray transition-colors">
                                For Sale
                            </div>
                        </div>

                        <div className="text-center group cursor-default">
                            <div className="font-display text-4xl font-bold text-white group-hover:text-white/80 transition-colors">
                                <span className="text-sm align-top opacity-50 mr-1">git</span>{stats.freeForks}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-cyber-muted mt-2 group-hover:text-cyber-gray transition-colors">
                                Free Forks
                            </div>
                        </div>

                        <div className="text-center group cursor-default">
                            <div className="font-display text-4xl font-bold text-blue-400 group-hover:text-blue-400/80 transition-colors">
                                <span className="text-xl align-middle mr-1">💀</span>{stats.seekingCollabs}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-cyber-muted mt-2 group-hover:text-cyber-gray transition-colors">
                                Seeking Collabs
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-cyber-black/95 backdrop-blur py-4 border-b border-cyber-gray/30 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-lg md:border-none">
                    <FilterBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        activeFilter={activeFilter}
                        setActiveFilter={setActiveFilter}
                    />
                </div>

                {/* Projects Grid */}
                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project, index) => (
                            <CyberCard
                                key={project.id}
                                project={project}
                                index={index}
                                isOwner={user?.id === project.seller_id}
                                isPurchased={(user?.purchased_ids || []).includes(project.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-cyber-gray rounded-lg">
                        <p className="font-display tracking-widest text-cyber-muted text-xl">NO_SIGNALS_DETECTED</p>
                        <p className="font-mono text-sm text-cyber-gray mt-2">Try adjusting your sensors (filters).</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Home;
