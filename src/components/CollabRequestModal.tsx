"use client";

import { useState } from "react";
import { X, Send, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CyberButton from "./ui/CyberButton";

interface CollabRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (contact: string, specialization: string) => Promise<void>;
    projectTitle: string;
}

export default function CollabRequestModal({ isOpen, onClose, onSubmit, projectTitle }: CollabRequestModalProps) {
    const [contact, setContact] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact.trim() || !specialization.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(contact, specialization);
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-cyber-black border border-cyber-neon/30 cyber-clip relative"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-cyber-gray/30 bg-cyber-dark/50">
                        <div>
                            <h2 className="text-xl font-display font-bold text-white tracking-wider">
                                ACCESS_REQUEST
                            </h2>
                            <p className="text-xs text-cyber-neon font-mono mt-1">
                                TARGET: {projectTitle}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-cyber-muted hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-cyber-muted font-mono text-xs uppercase tracking-widest mb-2">
                                Contact Frequency (Email/Discord/Phone)
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-4 h-4 text-cyber-gray" />
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="e.g. user#1234 or email@domain.com"
                                    className="w-full bg-cyber-dark border border-cyber-gray text-white pl-10 pr-4 py-3 focus:border-cyber-neon focus:outline-none font-mono text-sm transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-cyber-muted font-mono text-xs uppercase tracking-widest mb-2">
                                Specialization / Protocols
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-cyber-gray" />
                                <textarea
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    placeholder="Describe your skills and why you want to join..."
                                    className="w-full bg-cyber-dark border border-cyber-gray text-white pl-10 pr-4 py-3 h-32 resize-none focus:border-cyber-neon focus:outline-none font-mono text-sm transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 border border-cyber-gray/30 text-cyber-muted font-mono hover:bg-cyber-gray/10 transition-colors uppercase text-sm"
                            >
                                Cancel
                            </button>
                            <CyberButton
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-cyber-neon text-cyber-black font-bold"
                            >
                                {isSubmitting ? (
                                    "TRANSMITTING..."
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        SEND_REQUEST
                                    </>
                                )}
                            </CyberButton>
                        </div>
                    </form>

                    {/* Decorative Corner */}
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-neon" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
