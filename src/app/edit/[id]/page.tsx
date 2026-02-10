"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Upload, AlertTriangle, Check, Save } from "lucide-react";
import CyberButton from "@/components/ui/CyberButton";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";

const TECH_STACKS = [
    "react", "typescript", "javascript", "nodejs", "python", "rust", "go", "nextjs", "vue", "svelte"
];

const LISTING_TYPES = [
    {
        id: "adopt",
        title: "ADOPT",
        subtitle: "Free to fork",
        description: "Give your code a second life."
    },
    {
        id: "buy",
        title: "SELL",
        subtitle: "Set a price",
        description: "Get paid for your hard work."
    },
    {
        id: "collab",
        title: "COLLAB",
        subtitle: "Find a partner",
        description: "Team up to finish the job."
    }
];

export default function EditProjectPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [repoLink, setRepoLink] = useState("");
    const [selectedTech, setSelectedTech] = useState<string[]>([]);
    const [listingType, setListingType] = useState<string>("adopt");

    const [customTech, setCustomTech] = useState("");
    const [availableTechs, setAvailableTechs] = useState(TECH_STACKS);

    // Fetch Project Data
    useEffect(() => {
        const fetchProject = async () => {
            if (!id || !user) return; // Wait for user

            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Project not found");

                // Verify Ownership
                if (data.seller_id !== user.id) {
                    showToast("ACCESS_DENIED: Unauthorized access attempt detected.", "error");
                    router.push('/dashboard');
                    return;
                }

                // Pre-fill form
                setTitle(data.title);
                setDescription(data.description || "");
                setPrice(data.price || 0);
                setSelectedTech(data.tech_stack || []);
                setListingType(data.interaction_type);
                setRepoLink(data.repo_link || "");

                // Add existing techs to available if not present
                const existingTechs = data.tech_stack || [];
                const newAvailable = [...new Set([...TECH_STACKS, ...existingTechs])];
                setAvailableTechs(newAvailable);

            } catch (err: any) {
                console.error("Error fetching project:", err);
                showToast("LOAD_ERROR: " + err.message, "error");
                router.push('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchProject();
        }
    }, [id, user, router]);


    const toggleTech = (tech: string) => {
        if (selectedTech.includes(tech)) {
            setSelectedTech(selectedTech.filter(t => t !== tech));
        } else {
            setSelectedTech([...selectedTech, tech]);
        }
    };

    const addCustomTech = () => {
        if (!customTech.trim()) return;
        const tech = customTech.trim().toLowerCase();
        if (!availableTechs.includes(tech)) {
            setAvailableTechs([...availableTechs, tech]);
        }
        if (!selectedTech.includes(tech)) {
            setSelectedTech([...selectedTech, tech]);
        }
        setCustomTech("");
    };

    const handleUpdate = async () => {
        if (!user) return;
        if (!selectedTech.length) {
            showToast("VALIDATION_ERROR: No Tech Stack detected.", "error");
            return;
        }
        if (!title || !description) {
            showToast("VALIDATION_ERROR: Title and Description are required.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            console.log("Starting Update...");

            let fileUrl = undefined; // Undefined means "don't update" in Supabase update if we skip it? Actually need to be careful.
            // Better to construct update object.

            // 1. Upload File to Supabase Storage (Only if NEW file exists)
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                console.log("Uploading new file to:", fileName);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('project-files')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;
                console.log("Upload Success:", uploadData);
                fileUrl = uploadData.path;
            }

            // 2. Update Project Record
            const updates: any = {
                title,
                description,
                tech_stack: selectedTech,
                interaction_type: listingType,
                price: listingType === 'buy' ? price : 0,
                repo_link: repoLink
            };

            if (fileUrl) {
                updates.file_url = fileUrl;
            }

            const { error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id);

            if (error) {
                console.error("Database Update Error:", error);
                throw error;
            }

            console.log("Update Success!");
            showToast("PROJECT_UPDATED: Artifact metadata synchronized.", "success");
            router.push(`/project/${id}`);

        } catch (err: any) {
            console.error("Update Error:", err);
            showToast("SYSTEM_ERROR: " + (err.message || "Update Failed"), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cyber-black text-foreground flex items-center justify-center">
                <div className="text-cyber-neon font-mono animate-pulse">DECRYPTING_PROJECT_DATA...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cyber-black text-foreground">
            <Header />
            <div className="pt-12 pb-24 px-4 md:px-8">
                <div className="container mx-auto max-w-4xl">

                    {/* Header Section */}
                    <div className="mb-12">
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wider">
                            <span className="text-cyber-neon mr-4">✎</span>
                            EDIT PROJECT
                        </h1>
                        <p className="text-cyber-muted font-mono text-lg max-w-2xl leading-relaxed">
                            Update artifact metadata. Changes are propagated immediately to the network.
                        </p>
                    </div>

                    {/* Main Form Container */}
                    <div className="relative border border-cyber-gray/50 bg-cyber-dark/30 p-1 md:p-1 cyber-clip-lg">
                        {/* Decorative Corner */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyber-neon" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyber-neon" />

                        <div className="bg-cyber-black/80 backdrop-blur-sm p-6 md:p-10 space-y-10 cyber-clip-lg-inner">

                            {/* Project Title */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Project Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 font-mono text-lg focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Description</label>
                                <textarea
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 font-mono text-sm focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray resize-none"
                                />
                            </div>

                            {/* Tech Stack */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Tech Stack</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 bg-cyber-dark/50 border border-cyber-gray/30 text-white p-3 font-mono text-sm focus:outline-none focus:border-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                        placeholder="Add technology..."
                                        value={customTech}
                                        onChange={(e) => setCustomTech(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addCustomTech()}
                                    />
                                    <button
                                        className="bg-cyber-gray/20 hover:bg-cyber-gray/40 border border-cyber-gray/30 text-cyber-muted hover:text-white px-4 transition-colors"
                                        onClick={addCustomTech}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {availableTechs.map(tech => (
                                        <button
                                            key={tech}
                                            onClick={() => toggleTech(tech)}
                                            className={cn(
                                                "px-3 py-1.5 font-mono text-xs border transition-all uppercase flex items-center gap-2",
                                                selectedTech.includes(tech)
                                                    ? "bg-cyber-neon/10 border-cyber-neon text-cyber-neon"
                                                    : "bg-cyber-dark border-cyber-gray/30 text-cyber-muted hover:border-cyber-gray hover:text-white"
                                            )}
                                        >
                                            <span>{tech}</span>
                                            {selectedTech.includes(tech) && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Listing Type */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Listing Type</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {LISTING_TYPES.map(type => (
                                        <div
                                            key={type.id}
                                            onClick={() => setListingType(type.id)}
                                            className={cn(
                                                "cursor-pointer border p-6 transition-all relative overflow-hidden group",
                                                listingType === type.id
                                                    ? "bg-cyber-dark border-cyber-neon"
                                                    : "bg-cyber-dark/30 border-cyber-gray/30 hover:border-cyber-gray hover:bg-cyber-dark/50"
                                            )}
                                        >
                                            <div className="relative z-10">
                                                <h3 className={cn(
                                                    "font-display font-bold text-lg mb-1 uppercase tracking-wide",
                                                    listingType === type.id ? "text-white" : "text-cyber-muted group-hover:text-white"
                                                )}>
                                                    {type.title}
                                                </h3>
                                                <p className={cn(
                                                    "font-mono text-xs",
                                                    listingType === type.id ? "text-cyber-neon" : "text-cyber-muted"
                                                )}>
                                                    {type.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Price Field (Conditional) */}
                            {listingType === 'buy' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Price (INR)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <span className="text-cyber-neon font-mono text-lg">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 pl-10 font-mono text-lg focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Project Files (Zip Upload) */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">
                                    Update Source Files (.zip, .rar) <span className="text-cyber-gray ml-2 normal-case">(Leave empty to keep existing)</span>
                                </label>
                                <div className="relative border-2 border-dashed border-cyber-gray/30 hover:border-cyber-neon/50 bg-cyber-dark/30 transition-all group rounded-lg p-8 text-center cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".zip,.rar,.7z"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-cyber-dark border border-cyber-gray/30 flex items-center justify-center group-hover:border-cyber-neon/50 transition-colors">
                                            {file ? (
                                                <Check className="w-8 h-8 text-cyber-neon" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-cyber-muted group-hover:text-cyber-neon" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-mono text-sm text-white">
                                                {file ? file.name : "Upload new archive to replace current file"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Repository Link */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">
                                    Repository Link
                                </label>
                                <input
                                    type="text"
                                    value={repoLink}
                                    onChange={(e) => setRepoLink(e.target.value)}
                                    className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 font-mono text-sm focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                    placeholder="https://github.com/..."
                                />
                            </div>

                            {/* Submit Button */}
                            <CyberButton
                                onClick={handleUpdate}
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                                className="w-full h-16 bg-cyber-neon hover:bg-cyber-neon/80 text-cyber-black font-display font-bold text-lg tracking-widest uppercase cyber-clip-sm"
                            >
                                <Save className="w-5 h-5 mr-3" />
                                {isSubmitting ? "OVERWRITING..." : "SAVE CHANGES"}
                            </CyberButton>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
