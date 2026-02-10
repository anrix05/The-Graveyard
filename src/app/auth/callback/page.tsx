"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // The Supabase client handles the session exchange automatically 
        // when it detects values in the URL hash/query.
        // We just need to wait for the session to be established.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                router.push('/dashboard');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-cyber-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-cyber-neon">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="font-mono text-sm tracking-widest">AUTHENTICATING...</p>
            </div>
        </div>
    );
}
