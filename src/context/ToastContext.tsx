"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-cyber-neon" />,
        error: <XCircle className="w-5 h-5 text-cyber-red" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
    };

    const bgColors = {
        success: "bg-cyber-neon/10 border-cyber-neon/30",
        error: "bg-cyber-red/10 border-cyber-red/30",
        warning: "bg-yellow-500/10 border-yellow-500/30",
        info: "bg-blue-500/10 border-blue-500/30",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 min-w-[300px] max-w-md rounded-lg border backdrop-blur-md shadow-lg cyber-clip-sm",
                bgColors[toast.type]
            )}
        >
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-mono text-white leading-tight">{toast.message}</p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors text-cyber-muted hover:text-white"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
