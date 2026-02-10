"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, AlertTriangle, Check } from "lucide-react";
import CyberButton from "@/components/ui/CyberButton";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
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

export default function SubmitProjectPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Form State
    const [selectedTech, setSelectedTech] = useState<string[]>([]);
    const [listingType, setListingType] = useState<string>("adopt");
    const [customTech, setCustomTech] = useState("");
    const [availableTechs, setAvailableTechs] = useState(TECH_STACKS);

    // ... existing helper functions ...
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

    const handleSubmit = async () => {
        if (!user) {
            showToast("ACCESS_DENIED: Authentication required for submission.", "warning");
            return;
        }
        if (!selectedTech.length) {
            showToast("VALIDATION_ERROR: No Tech Stack detected.", "error");
            return;
        }

        setIsSubmitting(true);

        // Get form values
        const titleInput = document.getElementById("project-title") as HTMLInputElement;
        const descInput = document.getElementById("project-desc") as HTMLTextAreaElement;
        const priceInput = document.getElementById("project-price") as HTMLInputElement;

        const repoInput = document.getElementById("project-repo") as HTMLInputElement;

        const title = titleInput?.value;
        const description = descInput?.value;
        const price = listingType === 'buy' ? parseFloat(priceInput?.value || '0') : 0;
        const repoLink = repoInput?.value || null;

        if (!title || !description) {
            showToast("VALIDATION_ERROR: Title and Description are required.", "error");
            setIsSubmitting(false);
            return;
        }

        // Enforce File OR Repo Link
        if (!file && !repoLink) {
            showToast("SUBMISSION_REJECTED: Provide either Source File (.zip) OR Repository Link.", "error");
            setIsSubmitting(false);
            return;
        }

        try {
            console.log("Starting Submission...");

            let fileUrl = null;

            // 1. Upload File to Supabase Storage (Only if file exists)
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                console.log("Uploading file to:", fileName);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('project-files')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error("Storage Upload Error:", uploadError);
                    throw uploadError;
                }

                console.log("Upload Success:", uploadData);
                fileUrl = uploadData.path;
            }

            // 2. Parse GitHub URL
            let githubRepoFullName = null;
            let isPrivateRepo = true;

            if (repoLink) {
                // Remove trailing slash
                const cleanLink = repoLink.replace(/\/$/, "");
                const match = cleanLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
                if (match) {
                    githubRepoFullName = `${match[1]}/${match[2]}`.replace('.git', '');
                }

                const privateCheckbox = document.getElementById("is-private-repo") as HTMLInputElement;
                isPrivateRepo = privateCheckbox?.checked ?? true;
            }

            // 3. Insert Project Record
            console.log("Inserting Project Record...");
            const { error } = await supabase.from('projects').insert({
                seller_id: user.id,
                title,
                description,
                tech_stack: selectedTech,
                interaction_type: listingType,
                price,
                file_url: fileUrl,
                repo_link: repoLink,
                github_repo_full_name: githubRepoFullName,
                is_private_repo: isPrivateRepo,
                is_sold: false
            });

            if (error) {
                console.error("Database Insert Error:", error);
                throw error;
            }

            console.log("Insert Success!");
            showToast("SUBMISSION_ACCEPTED: Project indexed successfully.", "success");
            router.push("/dashboard");

        } catch (err: any) {
            console.error("Submission Error:", err);
            showToast("SYSTEM_ERROR: " + (err.message || "Upload Failed"), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-cyber-black text-foreground">
            <Header />
            <div className="pt-12 pb-24 px-4 md:px-8">
                <div className="container mx-auto max-w-4xl">

                    {/* Header Section */}
                    <div className="mb-12">
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wider">
                            <span className="text-cyber-red mr-4">&gt;_</span>
                            SUBMIT PROJECT
                        </h1>
                        <p className="text-cyber-muted font-mono text-lg max-w-2xl leading-relaxed">
                            List your abandoned code for adoption, sale, or collaboration. All submissions are
                            reviewed before appearing in the graveyard.
                        </p>
                    </div>

                    {/* Main Form Container - Angled Borders */}
                    <div className="relative border border-cyber-gray/50 bg-cyber-dark/30 p-1 md:p-1 cyber-clip-lg">
                        {/* Decorative Corner */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyber-red" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyber-red" />

                        <div className="bg-cyber-black/80 backdrop-blur-sm p-6 md:p-10 space-y-10 cyber-clip-lg-inner">

                            {/* Project Title */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Project Title</label>
                                <input
                                    id="project-title"
                                    type="text"
                                    className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 font-mono text-lg focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                    placeholder="e.g., Unfinished SaaS Dashboard"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Description</label>
                                <textarea
                                    id="project-desc"
                                    rows={5}
                                    className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 font-mono text-sm focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray resize-none"
                                    placeholder="Describe what the project does, why it was abandoned, and what's working..."
                                />
                            </div>

                            {/* Tech Stack */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">Tech Stack</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 bg-cyber-dark/50 border border-cyber-gray/30 text-white p-3 font-mono text-sm focus:outline-none focus:border-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                        placeholder="Type technology name..."
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
                                            <span>+ {tech}</span>
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
                                            {listingType === type.id && (
                                                <div className="absolute top-0 right-0 p-2">
                                                    <div className="w-2 h-2 bg-cyber-neon rounded-full shadow-[0_0_10px_rgba(57,255,20,0.8)]" />
                                                </div>
                                            )}
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
                                            id="project-price"
                                            type="number"
                                            className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 pl-10 font-mono text-lg focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Project Files (Zip Upload) */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">
                                    Project Files (.zip, .rar, .7z) <span className="text-cyber-neon ml-2 normal-case">* (REQUIRED: File OR Repo Link)</span>
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
                                                {file ? file.name : "Drop your project archive here"}
                                            </p>
                                            <p className="font-mono text-xs text-cyber-muted">
                                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Click to browse files"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Repository Link */}
                            <div className="space-y-4">
                                <label className="text-xs font-mono text-cyber-muted uppercase tracking-wider block">
                                    Repository Link <span className="text-cyber-neon ml-2 normal-case">* (REQUIRED: File OR Repo Link)</span>
                                </label>
                                <input
                                    id="project-repo"
                                    type="text"
                                    className="w-full bg-cyber-dark/50 border border-cyber-gray/30 text-white p-4 font-mono text-sm focus:outline-none focus:border-cyber-neon/50 focus:ring-1 focus:ring-cyber-neon/50 transition-all placeholder:text-cyber-gray"
                                    placeholder="https://github.com/username/repo"
                                />
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is-private-repo"
                                        className="w-4 h-4 bg-cyber-dark border border-cyber-gray/30 rounded focus:ring-cyber-neon text-cyber-neon"
                                        defaultChecked={true}
                                    />
                                    <label htmlFor="is-private-repo" className="text-sm font-mono text-cyber-muted cursor-pointer select-none">
                                        Private Repository (Buyers will be invited automatically)
                                    </label>
                                </div>
                                <p className="text-[10px] text-cyber-gray/60 italic">
                                    * We recommend using a private repository for "For Sale" items to prevent unauthorized access.
                                </p>
                            </div>

                            {/* Warning Box */}
                            <div className="bg-cyber-red/5 border border-cyber-red/20 p-4 flex gap-4 items-start">
                                <AlertTriangle className="w-5 h-5 text-cyber-red shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-cyber-red text-sm mb-1 uppercase tracking-wide">Warning: Submissions are reviewed for quality</h4>
                                    <p className="text-cyber-muted text-xs font-mono leading-relaxed">
                                        Projects must have substantive code. Empty or spam submissions will be rejected.
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <CyberButton
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                                className="w-full h-16 bg-cyber-red hover:bg-red-600 text-white font-display font-bold text-lg tracking-widest uppercase cyber-clip-sm"
                            >
                                <Upload className="w-5 h-5 mr-3" />
                                {isSubmitting ? "TRANSMITTING DATA..." : "Submit To Graveyard"}
                            </CyberButton>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
