'use client';

import React, { useState } from 'react';
import { X, Users, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Project } from '@/types/project';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { track } from '@/lib/analytics';
import { toast } from 'sonner';

interface CollabRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  projectId?: string;
  projectTitle?: string;
  collabTerms?: string | null;
  onSuccess?: () => void;
}

export const CollabRequestModal: React.FC<CollabRequestModalProps> = ({
  isOpen,
  onClose,
  project,
  projectId,
  projectTitle,
  collabTerms,
  onSuccess,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const effectiveProjectId = project?.id || projectId || '';
  const effectiveProjectTitle = project?.title || projectTitle || '';
  const effectiveCollabTerms = project?.collab_terms || collabTerms;
  const [pitch, setPitch] = useState('');
  const [background, setBackground] = useState('');
  const [contact, setContact] = useState(user?.email || '');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Lock body scroll when open
  React.useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const minPitchLength = 50;
  const charsRemaining = minPitchLength - pitch.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Authentication required to submit collaboration pitch.');
      return;
    }

    if (pitch.length < minPitchLength) {
      setErrorMsg(`Your pitch is too short. Please provide at least ${minPitchLength} characters.`);
      return;
    }

    if (!contact.trim()) {
      setErrorMsg('Contact information is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired.');

      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId: effectiveProjectId,
          pitch,
          background: background.trim() || undefined,
          contact: contact.trim(),
          portfolioUrl: portfolioUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit pitch.');
      }

      track('collab_applied', { project_id: effectiveProjectId });
      setIsSuccess(true);
      toast.success('Collaboration pitch submitted!');
      onSuccess?.();
      setTimeout(() => {
        router.push(`/collab/sent?project=${effectiveProjectId}`);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-t-[24px] sm:rounded-[24px] bg-surface border border-line shadow-2xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col safe-pb overflow-hidden" 
        data-lenis-prevent
      >
        {/* Grab handle on mobile */}
        <div className="sm:hidden w-12 h-1.5 bg-line rounded-full mx-auto my-2.5 shrink-0" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between bg-surface-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-accent shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-semibold text-white">
                Apply to collaborate
              </h2>
              <p className="font-mono text-xs text-muted truncate max-w-[220px] sm:max-w-[280px]">
                {effectiveProjectTitle} {effectiveCollabTerms ? `(${effectiveCollabTerms})` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted hover:text-white transition-colors shrink-0" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto overscroll-contain flex-1">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-accent mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">Proposal dispatched</h3>
                <p className="font-sans text-sm text-muted mt-2 max-w-sm mx-auto leading-relaxed">
                  Your collaboration proposal has been sent to the owner. When accepted, you will receive an in-app transmission notification to begin co-building.
                </p>
              </div>
                  <Button variant="primary" mode="collab" size="sm" onClick={onClose}>
                    Acknowledge
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="p-3 bg-[#ff2a2a]/10 border border-[#ff2a2a]/30 rounded text-xs font-sans text-[#ff2a2a] flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Pitch Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <label className="text-[#ededed]">
                        Your Value Pitch <span className="text-[#ff2a2a]">*</span>
                      </label>
                      <span className={charsRemaining > 0 ? 'text-[#fbbf24]' : 'text-[#39ff14]'}>
                        {pitch.length} / {minPitchLength} chars min
                      </span>
                    </div>
                    <Textarea
                      rows={4}
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                      placeholder="Explain what skills you bring, what feature you want to tackle, and how you plan to finish or commercialize this project..."
                      error={Boolean(pitch && charsRemaining > 0)}
                    />
                  </div>

                  {/* Background / Skills */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs text-[#ededed] block">
                      Background & Relevant Experience (Optional)
                    </label>
                    <Input
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      placeholder="e.g. 4 yrs full-stack TS, built SaaS x, backend specialist"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Contact Info */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-xs text-[#ededed] block">
                        Contact Info (Email / Discord / Telegram) <span className="text-[#ff2a2a]">*</span>
                      </label>
                      <Input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="you@domain.com or @handle"
                      />
                    </div>

                    {/* Portfolio / GitHub Link */}
                    <div className="space-y-1.5">
                      <label className="font-mono text-xs text-[#ededed] block">
                        Portfolio or GitHub URL
                      </label>
                      <Input
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#2d2d2d]">
                    <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      mode="collab"
                      size="md"
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={charsRemaining > 0}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Submit Pitch
                    </Button>
                  </div>
                </form>
              )}
            </div>
      </div>
    </div>
  );
};

export default CollabRequestModal;
