"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle, Smartphone, CreditCard, ShieldCheck } from "lucide-react";
import CyberButton from "./ui/CyberButton";
import { Project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, project, onSuccess }: PaymentModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [step, setStep] = useState<"method" | "processing" | "success" | "failed">("method");
    const [method, setMethod] = useState<"upi" | "card">("upi");
    const [errorMessage, setErrorMessage] = useState("");
    const [upiId, setUpiId] = useState("");
    const [githubUsername, setGithubUsername] = useState("");

    const loadScript = (src: string) => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!user) {
            showToast("AUTHENTICATION_REQUIRED: Please login to purchase.", "warning");
            return;
        }

        if (!githubUsername.trim()) {
            showToast("MISSING_DATA: GitHub Username required for repository access.", "error");
            return;
        }

        setStep("processing");

        try {
            // 0. Get Session Token for secure API call
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            // 1. Create Order (Server-side price verification)
            // Updated: Sending projectId instead of amount
            const orderRes = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: project.id, currency: "INR" })
            });

            const orderData = await orderRes.json();
            if (orderData.error) throw new Error(orderData.error);

            // 2. Load Razorpay Script
            const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!res) {
                showToast("NETWORK_ERROR: Payment gateway unavailable.", "error");
                setStep("method");
                return;
            }

            // 3. Open Razorpay
            // Use key from env
            const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
            if (!razorpayKey) {
                showToast("CONFIG_ERROR: Razorpay Key ID Missing.", "error");
                setStep("method");
                return;
            }

            const options = {
                key: razorpayKey,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "The Graveyard",
                description: `Acquisition: ${project.title}`,
                order_id: orderData.id,
                handler: async function (response: any) {
                    // 4. Verify Payment on Success
                    try {
                        const verifyRes = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}` // Send Token
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                project_id: project.id,
                                amount: project.price,
                                github_username: githubUsername // Send the user input
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.error) throw new Error(verifyData.error);

                        setStep("success");
                        setTimeout(() => {
                            onSuccess();
                            onClose();
                        }, 2000);

                    } catch (verifyError: any) {
                        console.error("Verification Error:", verifyError);
                        setErrorMessage("Payment successful but verification failed: " + verifyError.message);
                        setStep("failed");
                    }
                },
                prefill: {
                    name: user.username,
                    email: user.email,
                    contact: (user as any).phone_number || ""
                },
                theme: {
                    color: "#39ff14"
                },
                modal: {
                    ondismiss: function () {
                        setErrorMessage("Transaction cancelled by user.");
                        setStep("failed");
                    }
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

            paymentObject.on('payment.failed', function (response: any) {
                setErrorMessage(response.error.description || "Payment Failed");
                setStep("failed");
            });

        } catch (err: any) {
            console.error("Payment Error:", err);
            setErrorMessage(err.message || "Initialization Failed");
            setStep("failed");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-cyber-black/90 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-md bg-cyber-dark border border-cyber-neon/50 p-1 cyber-clip shadow-[0_0_50px_rgba(57,255,20,0.1)]"
                    >
                        {/* Decorative Corner */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyber-neon" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyber-neon" />

                        <div className="bg-cyber-black p-6 space-y-6 cyber-clip-inner">

                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                                        SECURE_CHECKOUT
                                    </h2>
                                    <p className="text-xs font-mono text-cyber-muted">
                                        Completing acquisition for: <span className="text-cyber-neon">{project.title}</span>
                                    </p>
                                </div>
                                <button onClick={onClose} className="text-cyber-muted hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content based on Step */}
                            {step === "method" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setMethod("upi")}
                                            className={`p-4 border ${method === 'upi' ? 'border-cyber-neon bg-cyber-neon/10' : 'border-cyber-gray/30 hover:border-cyber-gray'} transition-all text-center flex flex-col items-center gap-2`}
                                        >
                                            <Smartphone className={`w-6 h-6 ${method === 'upi' ? 'text-cyber-neon' : 'text-cyber-muted'}`} />
                                            <span className={`text-xs font-mono font-bold uppercase ${method === 'upi' ? 'text-white' : 'text-cyber-muted'}`}>UPI / QR</span>
                                        </button>
                                        <button
                                            onClick={() => setMethod("card")}
                                            className={`p-4 border ${method === 'card' ? 'border-cyber-neon bg-cyber-neon/10' : 'border-cyber-gray/30 hover:border-cyber-gray'} transition-all text-center flex flex-col items-center gap-2`}
                                        >
                                            <CreditCard className={`w-6 h-6 ${method === 'card' ? 'text-cyber-neon' : 'text-cyber-muted'}`} />
                                            <span className={`text-xs font-mono font-bold uppercase ${method === 'card' ? 'text-white' : 'text-cyber-muted'}`}>Credit Card</span>
                                        </button>
                                    </div>

                                    {method === 'upi' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono text-cyber-muted uppercase">GitHub Username (For Repo Access)</label>
                                                <input
                                                    type="text"
                                                    placeholder="your-github-handle"
                                                    className="w-full bg-cyber-dark border border-cyber-gray/30 p-3 text-white font-mono focus:border-cyber-neon outline-none"
                                                    value={githubUsername}
                                                    onChange={(e) => setGithubUsername(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono text-cyber-muted uppercase">Enter UPI ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="username@upi"
                                                    className="w-full bg-cyber-dark border border-cyber-gray/30 p-3 text-white font-mono focus:border-cyber-neon outline-none"
                                                    value={upiId}
                                                    onChange={(e) => setUpiId(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {method === 'card' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono text-cyber-muted uppercase">GitHub Username (For Repo Access)</label>
                                                <input
                                                    type="text"
                                                    placeholder="your-github-handle"
                                                    className="w-full bg-cyber-dark border border-cyber-gray/30 p-3 text-white font-mono focus:border-cyber-neon outline-none"
                                                    value={githubUsername}
                                                    onChange={(e) => setGithubUsername(e.target.value)}
                                                />
                                            </div>
                                            <div className="p-4 bg-cyber-dark/50 border border-cyber-gray/20 text-center text-xs text-cyber-muted font-mono">
                                                Mock Card: 4242 4242 4242 4242
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t border-cyber-gray/20">
                                        <div className="text-right">
                                            <div className="text-xs text-cyber-muted uppercase">Total</div>
                                            <div className="text-2xl font-display font-bold text-white">₹{project.price}</div>
                                        </div>
                                        <CyberButton onClick={handlePayment} className="bg-cyber-neon text-cyber-black hover:shadow-glow-neon">
                                            CONFIRM & PAY
                                        </CyberButton>
                                    </div>
                                </div>
                            )}

                            {step === "processing" && (
                                <div className="text-center py-12 space-y-4">
                                    <div className="w-16 h-16 border-4 border-cyber-gray border-t-cyber-neon rounded-full animate-spin mx-auto" />
                                    <p className="text-cyber-neon font-mono animate-pulse">PROCESSING_TRANSACTION...</p>
                                    <div className="text-xs text-cyber-muted font-mono">
                                        Verifying funds via secure gateway...
                                    </div>
                                </div>
                            )}

                            {step === "failed" && (
                                <div className="text-center py-8 space-y-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-16 h-16 bg-cyber-red/20 rounded-full flex items-center justify-center mx-auto text-cyber-red"
                                    >
                                        <X className="w-8 h-8" />
                                    </motion.div>
                                    <h3 className="text-xl font-display font-bold text-white">TRANSACTION_FAILED</h3>
                                    <p className="text-cyber-red font-mono text-xs px-4 border border-cyber-red/20 py-2 bg-cyber-red/5">
                                        {errorMessage || "Unknown error occurred."}
                                    </p>
                                    <CyberButton onClick={() => setStep("method")} className="bg-cyber-gray text-white hover:bg-white hover:text-black w-full">
                                        RETRY_OPERATION
                                    </CyberButton>
                                </div>
                            )}

                            {step === "success" && (
                                <div className="text-center py-8 space-y-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-16 h-16 bg-cyber-neon rounded-full flex items-center justify-center mx-auto text-cyber-black"
                                    >
                                        <CheckCircle className="w-10 h-10" />
                                    </motion.div>
                                    <h3 className="text-2xl font-display font-bold text-white">PAYMENT SUCCESSFUL</h3>
                                    <p className="text-cyber-muted text-sm font-mono">
                                        You now have access to the source code.
                                    </p>
                                </div>
                            )}

                            {/* Footer Security Badge */}
                            <div className="flex items-center justify-center gap-2 text-[10px] text-cyber-gray font-mono pt-4 border-t border-cyber-gray/10">
                                <Lock className="w-3 h-3" />
                                256-BIT ENCRYPTION ACTIVE
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
