"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, ArrowLeft, Mail, Skull } from 'lucide-react';
import Button from '@/components/ui/CyberButton';
import { Input } from '@/components/ui/input'; // Assuming standard shadcn/custom input exists or I will style it manually

// Mock Google Icon
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.107-2.187 2.76-5.453 2.76-7.84 0-.787-.067-1.453-.187-1.92h-12.24z" />
    </svg>
);

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
    const { login, loginWithEmail } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (provider: string) => {
        setIsLoading(provider);
        try {
            await login(provider);
        } catch (error: any) {
            showToast("LOGIN_ERROR: " + error.message, "error");
        }
        setIsLoading(null);
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading('email');
        const { error } = await loginWithEmail(email, password);
        setIsLoading(null);

        if (error) {
            console.error("Login Handler - Error:", error);
            showToast("ACCESS_DENIED: Credential verification failed. " + error.message, "error");
        } else {
            console.log("Login Handler - Success! Redirecting...");
            // LOGIN SUCCESS
            showToast("ACCESS_GRANTED: Welcome back, Operative.", "success");
            window.location.href = "/"; // Redirect to Browse/Home page
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-black text-foreground relative overflow-hidden p-4">

            {/* Background Grid - Subtle */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Link back to home */}
            <Link href="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-cyber-muted hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="font-mono text-sm">Back to Graveyard</span>
            </Link>

            <div className="w-full max-w-md relative z-10 space-y-8">

                {/* Terminal Block */}
                <div className="w-full border border-cyber-gray bg-cyber-black overflow-hidden cyber-clip-sm">
                    {/* Red Terminal Header */}
                    <div className="bg-cyber-red px-4 py-2 flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyber-black/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-cyber-black/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-cyber-black/40" />
                        </div>
                        <span className="font-mono text-xs font-bold text-white uppercase tracking-widest opacity-90">Security Terminal V2.0</span>
                    </div>
                    {/* Terminal Content */}
                    <div className="p-6 font-mono text-sm space-y-2 text-cyber-muted bg-cyber-dark/50 min-h-[100px] border-t border-cyber-red/20">
                        <p className="flex items-center gap-2">
                            <span className="text-cyber-muted">&gt;</span>
                            <span className="text-cyber-neon font-bold tracking-wide">INITIALIZING AUTH SEQUENCE...</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-cyber-muted">&gt;</span>
                            <span className="text-white">Awaiting credentials</span>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="bg-cyber-red w-2 h-4 block"
                            />
                        </p>
                    </div>
                </div>

                {/* Centered Graphic & Title */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <Skull className="w-16 h-16 text-cyber-red" />
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-wide">
                        Access The Graveyard
                    </h1>
                </div>

                {/* Social Buttons */}
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        className="w-full h-14 border border-cyber-gray bg-transparent hover:bg-cyber-gray/10 text-white font-mono uppercase tracking-wider cyber-clip-sm group justify-center text-sm"
                        onClick={() => handleLogin('github')}
                        isLoading={isLoading === 'github'}
                    >
                        <Github className="w-5 h-5 mr-3" />
                        Continue with GitHub
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full h-14 border border-cyber-gray bg-transparent hover:bg-cyber-gray/10 text-white font-mono uppercase tracking-wider cyber-clip-sm group justify-center text-sm"
                        onClick={() => handleLogin('google')}
                        isLoading={isLoading === 'google'}
                    >
                        <GoogleIcon className="w-5 h-5 mr-3" />
                        Continue with Google
                    </Button>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-cyber-gray/30" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                        <span className="bg-cyber-black px-4 text-cyber-muted">Or</span>
                    </div>
                </div>

                {/* Email Form */}
                <form className="space-y-5" onSubmit={handleEmailLogin}>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider pl-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-cyber-dark/30 border border-cyber-gray/50 text-white p-4 font-mono text-sm focus:outline-none focus:border-cyber-red/50 focus:ring-1 focus:ring-cyber-red/50 transition-all placeholder:text-cyber-muted/30"
                            placeholder="ghost@graveyard.dev"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider pl-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-cyber-dark/30 border border-cyber-gray/50 text-white p-4 font-mono text-sm focus:outline-none focus:border-cyber-red/50 focus:ring-1 focus:ring-cyber-red/50 transition-all placeholder:text-cyber-muted/30"
                            placeholder="••••••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading === 'email'}
                        disabled={isLoading !== null}
                        className="w-full bg-cyber-red hover:bg-red-600 text-white font-bold h-14 cyber-clip-sm tracking-widest uppercase text-sm"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Access Terminal
                    </Button>
                </form>

                {/* Footer Actions */}
                <div className="text-center space-y-2 pt-2">
                    <p className="text-xs font-mono text-cyber-muted">
                        New operative? <Link href="#" className="text-cyber-red hover:text-white transition-colors ml-1">Request Access</Link>
                    </p>
                    <p className="text-xs font-mono text-cyber-muted hover:text-white transition-colors cursor-pointer">
                        Forgot credentials?
                    </p>
                </div>

            </div>
        </div>
    );
}
