'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';
import { Input } from './input';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  requireMatchText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requireMatchText,
  isDanger = false,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedText('');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatchValid = !requireMatchText || typedText.trim() === requireMatchText.trim();

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-surface rounded-t-[24px] sm:rounded-modal border border-line p-5 sm:p-6 shadow-2xl flex flex-col gap-4 safe-pb" 
        data-lenis-prevent
      >
        {/* Grab handle on mobile */}
        <div className="sm:hidden w-12 h-1 bg-line rounded-full mx-auto -mt-1 mb-1 shrink-0" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                isDanger ? 'border-[#ff2a2a]/30 bg-[#ff2a2a]/10 text-[#ff2a2a]' : 'border-line bg-surface-2 text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-display font-semibold text-base sm:text-lg text-white truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-muted hover:text-white transition-colors p-1.5 shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-sans text-sm text-muted leading-relaxed break-anywhere">{description}</p>

        {requireMatchText && (
          <div className="space-y-2 mt-1">
            <p className="font-mono text-xs text-muted">
              Type <span className="text-[#ff2a2a] font-semibold">{requireMatchText}</span> to confirm:
            </p>
            <Input
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requireMatchText}
              autoFocus
              disabled={isLoading}
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-2 pt-4 border-t border-line">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={!isMatchValid || isLoading}
            isLoading={isLoading}
            className="w-full sm:w-auto justify-center"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
