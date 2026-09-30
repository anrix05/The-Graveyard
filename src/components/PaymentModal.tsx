'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { Project } from '@/types/project';
import { formatINR } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess?: () => void;
}

type CheckoutStep =
  | 'summary'
  | 'creating_order'
  | 'awaiting_payment'
  | 'verifying'
  | 'success'
  | 'on_hold'
  | 'failed';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<CheckoutStep>('summary');
  const [githubUsername, setGithubUsername] = useState('');
  const [isValidatingUser, setIsValidatingUser] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedChip, setCopiedChip] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<string>('not_applicable');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isRetryingInvite, setIsRetryingInvite] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Auto-detect GitHub username if authenticated via GitHub
  useEffect(() => {
    if (user?.username && !user.username.includes('_') && !githubUsername) {
      setGithubUsername(user.username);
    }
  }, [user, githubUsername]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChip(label);
    toast.success(`Copied test ${label}`);
    setTimeout(() => setCopiedChip(null), 2000);
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleStartPayment = async () => {
    if (!user) {
      toast.error('Authentication required to purchase.');
      return;
    }

    if (project.has_repo) {
      if (!githubUsername.trim()) {
        setGithubError('GitHub username is required for repository collaborator access.');
        return;
      }

      setIsValidatingUser(true);
      setGithubError(null);

      // Verify username exists
      try {
        const checkRes = await fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername.trim())}`);
        if (checkRes.status === 404) {
          setGithubError(`GitHub user "${githubUsername.trim()}" not found.`);
          setIsValidatingUser(false);
          return;
        }
      } catch (err) {
        console.warn('GitHub public check failed:', err);
      } finally {
        setIsValidatingUser(false);
      }
    }

    setStep('creating_order');
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please sign in again.');

      // 1. Create order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          githubUsername: githubUsername.trim() || undefined,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        if (orderData.error?.code === 'PROJECT_ON_HOLD') {
          setStep('on_hold');
          return;
        }
        throw new Error(orderData.error?.message || 'Failed to initialize order.');
      }

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load payment gateway. Please check your connection.');
      }

      setStep('awaiting_payment');

      // 3. Launch Razorpay modal
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'The Graveyard',
        description: `Codebase: ${project.title}`,
        order_id: orderData.orderId,
        modal: {
          ondismiss: () => {
            if (step === 'awaiting_payment') {
              setStep('summary');
              toast.info('Checkout cancelled.');
            }
          },
        },
        prefill: {
          email: user.email,
          name: user.username,
        },
        theme: {
          color: '#39ff14',
          backdrop_color: 'rgba(10, 10, 10, 0.85)',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStep('verifying');
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error?.message || 'Payment signature verification failed.');
            }

            setInviteStatus(verifyData.inviteStatus || 'not_applicable');
            setInviteError(verifyData.inviteError || null);
            setTransactionId(verifyData.transactionId || null);
            setStep('success');
            toast.success('Purchase confirmed! Asset access unlocked.');
            onSuccess?.();
          } catch (verifyErr: unknown) {
            const msg = verifyErr instanceof Error ? verifyErr.message : 'Verification failed';
            setErrorMessage(msg);
            setStep('failed');
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', (failRes: any) => {
        setErrorMessage(failRes.error?.description || 'Payment failed.');
        setStep('failed');
      });
      razorpayInstance.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout encountered an error';
      setErrorMessage(msg);
      setStep('failed');
    }
  };

  const handleRetryInvite = async () => {
    if (!transactionId) return;
    setIsRetryingInvite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/retry-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInviteStatus('sent');
        setInviteError(null);
        toast.success('GitHub invite dispatched successfully!');
      } else {
        setInviteError(data.error?.message || 'Invite retry failed.');
        toast.error(data.error?.message || 'Failed to dispatch invite.');
      }
    } catch (e) {
      toast.error('Network error retrying invite.');
    } finally {
      setIsRetryingInvite(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/secure-download?projectId=${project.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('Download initialized.');
      } else {
        toast.error(data.error?.message || 'Failed to fetch download link.');
      }
    } catch (e) {
      toast.error('Download error.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-[24px] bg-surface border border-line shadow-2xl overflow-hidden flex flex-col" data-lenis-prevent>
        {/* Top Bar: Slim TEST MODE pill */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/10 border border-amber/30 text-amber text-xs font-mono font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TEST MODE: Zero real money charged</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted hover:text-white transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Helper Chips */}
        <div className="bg-surface-2 px-6 py-3 border-b border-line flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-muted">Test data:</span>
          <button
            type="button"
            onClick={() => copyToClipboard('4111 1111 1111 1111', 'Card')}
            className="px-2.5 py-1 rounded-full bg-surface border border-line hover:border-white/30 text-fg flex items-center gap-1.5 transition-colors"
          >
            <CreditCard className="w-3 h-3 text-neon-green" />
            <span>Card: 4111...1111</span>
            {copiedChip === 'Card' ? <Check className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3 opacity-60" />}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard('success@razorpay', 'UPI')}
            className="px-2.5 py-1 rounded-full bg-surface border border-line hover:border-white/30 text-fg flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3 h-3 text-blue-accent" />
            <span>UPI: success@razorpay</span>
            {copiedChip === 'UPI' ? <Check className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3 opacity-60" />}
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-7">
              {step === 'summary' && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">{project.title}</h2>
                      <p className="font-sans text-xs text-[#9ca3af] mt-1">Exclusive repository transfer</p>
                    </div>
                    <div className="font-mono text-2xl font-bold text-[#39ff14] shrink-0">
                      {formatINR(project.price_paise, { showFreeForZero: false })}
                    </div>
                  </div>

                  {/* What you get checklist */}
                  <div className="bg-[#181818] border border-line p-4 rounded-xl space-y-2">
                    <span className="font-mono text-xs uppercase text-[#9ca3af] tracking-wider block">What you unlock:</span>
                    <ul className="space-y-1.5 font-sans text-xs text-[#ededed]">
                      {project.has_archive && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#39ff14] shrink-0" />
                          <span>Direct source code archive (.zip) download rights</span>
                        </li>
                      )}
                      {project.has_repo && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#39ff14] shrink-0" />
                          <span>GitHub repository collaborator invitation</span>
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#39ff14] shrink-0" />
                        <span>Exclusive ownership: Project marked Sold and removed from sale</span>
                      </li>
                    </ul>
                  </div>

                  {/* GitHub username field if repo exists */}
                  {project.has_repo && (
                    <div className="space-y-1.5">
                      <label className="font-mono text-xs text-[#ededed] block">
                        Your GitHub Username <span className="text-[#ff2a2a]">*</span>
                      </label>
                      <Input
                        value={githubUsername}
                        onChange={(e) => {
                          setGithubUsername(e.target.value);
                          setGithubError(null);
                        }}
                        placeholder="e.g. octocat"
                        error={Boolean(githubError)}
                      />
                      {githubError && (
                        <p className="font-mono text-xs text-[#ff2a2a] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{githubError}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#2d2d2d]">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      mode="buy"
                      size="md"
                      onClick={handleStartPayment}
                      isLoading={isValidatingUser}
                    >
                      Proceed to Payment ({formatINR(project.price_paise, { showFreeForZero: false })})
                    </Button>
                  </div>
                </div>
              )}

              {(step === 'creating_order' || step === 'awaiting_payment' || step === 'verifying') && (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-[#39ff14]/30 bg-[#39ff14]/10 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-[#39ff14] animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-white">
                      {step === 'creating_order' && 'Initializing Payment Gateway...'}
                      {step === 'awaiting_payment' && 'Awaiting Razorpay Settlement...'}
                      {step === 'verifying' && 'Verifying Cryptographic Signature...'}
                    </h3>
                    <p className="font-sans text-xs text-[#9ca3af] mt-1">
                      Complete the test payment dialog. Do not close this window.
                    </p>
                  </div>
                </div>
              )}

              {step === 'on_hold' && (
                <div className="py-6 text-center flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24]">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">Project On Hold</h3>
                    <p className="font-sans text-sm text-[#9ca3af] mt-1 max-w-sm">
                      Another operative is currently completing checkout for this project. If their session expires without settlement, it will become available again.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={onClose}>
                    Return to Marketplace
                  </Button>
                </div>
              )}

              {step === 'failed' && (
                <div className="py-6 text-center flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#ff2a2a]/10 border border-[#ff2a2a]/30 flex items-center justify-center text-[#ff2a2a]">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">Payment Unsuccessful</h3>
                    <p className="font-sans text-sm text-[#ff2a2a] mt-1 max-w-sm">{errorMessage}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      Dismiss
                    </Button>
                    <Button variant="primary" mode="brand" size="sm" onClick={() => setStep('summary')}>
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="space-y-5 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/40 flex items-center justify-center text-[#39ff14] mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-white">Acquisition Verified</h3>
                    <p className="font-sans text-sm text-[#9ca3af] mt-1">
                      You are now the exclusive owner of <strong className="text-white">{project.title}</strong>.
                    </p>
                  </div>

                  {/* Delivery Status Card */}
                  <div className="bg-[#181818] border border-line p-4 rounded-xl text-left space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#9ca3af]">GitHub Repository Invite:</span>
                      {inviteStatus === 'sent' && (
                        <span className="text-[#39ff14] font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Sent
                        </span>
                      )}
                      {inviteStatus === 'failed' && (
                        <span className="text-[#ff2a2a] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                      {inviteStatus === 'not_applicable' && (
                        <span className="text-[#9ca3af]">No private repo linked</span>
                      )}
                    </div>

                    {inviteStatus === 'failed' && (
                      <div className="p-2 bg-[#ff2a2a]/10 border border-[#ff2a2a]/30 rounded text-xs font-sans text-[#ff2a2a] flex items-start justify-between gap-2">
                        <span>Payment confirmed! Repo invite failed ({inviteError || 'PAT permissions'}). Direct download still works.</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRetryInvite}
                          isLoading={isRetryingInvite}
                          className="shrink-0 text-xs py-1"
                        >
                          Retry Invite
                        </Button>
                      </div>
                    )}

                    {project.has_archive && (
                      <div className="pt-2 border-t border-[#2d2d2d] flex items-center justify-between">
                        <span className="text-xs font-mono text-[#9ca3af]">Source Code Archive:</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleDownload}
                          isLoading={downloading}
                          leftIcon={<Download className="w-3.5 h-3.5 text-[#39ff14]" />}
                        >
                          Download ZIP
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-3">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      Close
                    </Button>
                    <Link href="/dashboard?tab=vault" onClick={onClose}>
                      <Button variant="primary" mode="buy" size="sm">
                        View in Vault
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
      </div>
    </div>
  );
};

export default PaymentModal;
