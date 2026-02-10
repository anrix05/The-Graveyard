"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldAlert, Terminal, Lock, Scale } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-cyber-black text-foreground flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-4xl">
                {/* Hero Section */}
                <div className="mb-12 border-b border-cyber-gray/30 pb-8">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-wider">
                        <span className="text-cyber-red mr-4">§</span>
                        TERMS_OF_SERVICE
                    </h1>
                    <p className="text-cyber-muted font-mono text-lg">
                        Effective Date: 2026-01-01 // Protocol v1.0
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-12 font-mono text-sm md:text-base text-cyber-muted leading-relaxed">

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-cyber-neon" />
                            1. SYSTEM ACCESS
                        </h2>
                        <p>
                            By accessing or using "The Graveyard" (the "Platform"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                        </p>
                        <div className="bg-cyber-dark/30 border-l-2 border-cyber-neon p-4">
                            <p className="text-cyber-neon italic">
                                "The code is dead. Long live the code."
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-cyber-red" />
                            2. USER RESPONSIBILITIES
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 marker:text-cyber-red">
                            <li>You are responsible for safeguarding the password that you use to access the Service.</li>
                            <li>You agree not to disclose your password to any third party.</li>
                            <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                            <li>Do not upload malicious code, viruses, or any software intended to damage or disrupt the Platform.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <Scale className="w-5 h-5 text-blue-400" />
                            3. INTELLECTUAL PROPERTY
                        </h2>
                        <p>
                            <strong>For Sellers:</strong> You retain ownership of any code you upload. By listing it, you grant The Graveyard a license to display, host, and facilitate the transfer of the code to Buyers.
                        </p>
                        <p>
                            <strong>For Buyers:</strong> Purchasing a project grants you a non-exclusive (unless otherwise specified), perpetual license to use, modify, and distribute the code for your own purposes.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold flex items-center gap-2">
                            <Lock className="w-5 h-5 text-yellow-500" />
                            4. DISCLAIMER OF WARRANTIES
                        </h2>
                        <p>
                            The Platform is provided on an "AS IS" and "AS AVAILABLE" basis. The Graveyard makes no warranties, whether express or implied, regarding the quality, accuracy, or reliability of any code listed on the Platform.
                        </p>
                        <p className="uppercase text-xs tracking-widest text-cyber-red/80 margin-top-2">
                            ** USE AT YOUR OWN RISK. WE DO NOT VET CODE QUALITY. **
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl text-white font-display font-bold">
                            5. TERMINATION
                        </h2>
                        <p>
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-cyber-gray/30 text-center text-xs font-mono text-cyber-gray">
                    END_OF_FILE
                </div>

            </main>
            <Footer />
        </div>
    );
}
