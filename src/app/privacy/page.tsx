"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, Eye, Server, UserCheck, Shield } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-cyber-black text-foreground flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-4xl">
                {/* Hero Section */}
                <div className="mb-12 border-b border-cyber-gray/30 pb-8">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wider">
                        <span className="text-cyber-red mr-4">Ø</span>
                        PRIVACY_POLICY
                    </h1>
                    <p className="text-cyber-muted font-mono text-lg">
                        Last Updated: 2026-01-01 // Security Level: HIGH
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-12 font-mono text-sm md:text-base text-cyber-muted leading-relaxed">

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <Eye className="w-5 h-5 text-cyber-neon" />
                            1. DATA COLLECTION PROTOCOLS
                        </h2>
                        <p>
                            We collect only the minimum data required to operate the Platform ("The Graveyard"). This includes:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-cyber-neon">
                            <li><strong>Identity Data:</strong> GitHub username, email address, profile avatar.</li>
                            <li><strong>Transaction Data:</strong> Purchase history, payment IDs (via Razorpay). We do NOT store credit card numbers.</li>
                            <li><strong>Usage Data:</strong> Basic analytics (views, clicks) to improve system performance.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <Server className="w-5 h-5 text-blue-400" />
                            2. DATA STORAGE & SECURITY
                        </h2>
                        <p>
                            All data is encrypted at rest and in transit. We use Supabase (PostgreSQL) with Row Level Security (RLS) to ensure that your data is accessible only by you and authorized system processes.
                        </p>
                        <div className="bg-cyber-dark/30 border border-cyber-gray p-4 rounded cyber-clip-sm">
                            <code className="text-xs text-cyber-neon">
                                ENCRYPTION_ALGORITHM: AES-256-GCM<br />
                                RLS_STATUS: ACTIVE
                            </code>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-yellow-500" />
                            3. THIRD-PARTY OPERATIVES
                        </h2>
                        <p>
                            We may share limited data with trusted third-party services solely for the purpose of operating the Platform:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-yellow-500">
                            <li><strong>Supabase:</strong> Database and Authentication services.</li>
                            <li><strong>Razorpay:</strong> Payment processing.</li>
                            <li><strong>GitHub:</strong> Authentication and repository access management.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-cyber-red" />
                            4. YOUR RIGHTS
                        </h2>
                        <p>
                            You have the right to access, update, or delete your personal data at any time. You can manage your profile settings directly via the Dashboard or contact us to request full data deletion.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold">
                            5. COOKIES
                        </h2>
                        <p>
                            We use essential cookies to maintain your login session. No tracking pixels or invasive ad-tech scripts are deployed on this sector.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-cyber-gray/30 text-center text-xs font-mono text-cyber-gray">
                    END_OF_TRANSMISSION
                </div>

            </main>
            <Footer />
        </div>
    );
}
