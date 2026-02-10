"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { mockProjects } from "@/data/mockProjects";
import { supabase } from "@/lib/supabase";

interface User {
    id: string;
    username: string;
    email: string;
    owned_ids: string[];
    purchased_ids: string[];
    collab_ids: string[];
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (provider: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Check for session on mount
    useEffect(() => {
        const initializeAuth = async () => {
            // Get initial session
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserData(session.user.id, session.user.email || 'unknown');
            }

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    await fetchUserData(session.user.id, session.user.email || 'unknown');
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    router.push("/");
                }
            });

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, []);

    const fetchUserData = async (userId: string, email: string) => {
        setIsLoading(true);
        try {
            // 1. Get Profile
            let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

            // If profile doesn't exist (new user), create it
            if (!profile) {
                console.log("Profile missing, creating new profile for:", userId);
                const baseName = email && email !== 'unknown' ? email.split('@')[0] : 'operative';
                const { data: newProfile, error: createError } = await supabase.from('profiles').insert([{
                    id: userId,
                    // Fix: Append random number to ensure unique username (e.g. test_1234)
                    username: `${baseName}_${Math.floor(1000 + Math.random() * 9000)}`,
                    avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${userId}`, // Random avatar
                    created_at: new Date().toISOString()
                }]).select().single();

                if (createError) {
                    console.error("Error creating profile:", JSON.stringify(createError, null, 2));
                } else {
                    profile = newProfile;
                }
            }

            // 2. Get Owned Projects
            const { data: owned } = await supabase.from('projects').select('id').eq('seller_id', userId);

            // 3. Get All Transactions (Purchases & Collabs)
            const { data: transactions } = await supabase
                .from('transactions')
                .select('project_id, amount, payment_id')
                .eq('buyer_id', userId)
                .eq('status', 'completed');

            const purchasedIds = transactions?.filter(t => t.amount > 0 || t.payment_id?.startsWith('FREE_CLAIM')).map(t => t.project_id) || [];
            const collabIds = transactions?.filter(t => t.payment_id === 'COLLAB_REQUEST').map(t => t.project_id) || [];

            setUser({
                id: userId,
                username: profile?.username || email.split('@')[0], // Fallback to email prefix
                email: email,
                owned_ids: owned?.map(p => p.id) || [],
                purchased_ids: purchasedIds,
                collab_ids: collabIds
            });

        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (provider: string) => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider as any, // Cast to any to accept dynamic string
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error("Login Error:", error);
            setIsLoading(false);
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        setIsLoading(true);
        // Try to sign in
        let { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        // If user doesn't exist, try to sign up (Auto-signup for demo simplicity)
        if (error && error.message.includes("Invalid login credentials")) {
            console.log("Attempting auto-signup for:", email);
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                console.error("Auto-signup failed:", signUpError);
                setIsLoading(false);
                // RETURN THE SIGNUP ERROR so user knows why (e.g. "Password should be at least 6 characters")
                return { error: signUpError };
            }

            // If signup succeeded
            if (signUpData.user) {
                console.log("Auto-signup successful:", signUpData.user.id);
                data = signUpData;
                error = null;
            } else if (!signUpData.user && !signUpData.session) {
                // Sometmes signup works but requires email confirmation (if not disabled)
                return { error: { message: "Account created but verify email is enabled. Please check Supabase settings." } };
            }
        }

        if (error) {
            console.error("Login Error:", error);
            setIsLoading(false);
            return { error };
        }
        console.log("Login Successful! Returning data:", data);
        setIsLoading(false);
        return { data };
    };

    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setIsLoading(false);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, loginWithEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
