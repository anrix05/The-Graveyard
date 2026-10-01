'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Upload,
  Trash2,
  Lock,
  Globe,
  MessageCircle,
  Smartphone,
  CreditCard,
  AlertTriangle,
  Check,
  LogOut,
  RefreshCw,
  Shield,
  Github,
  Mail,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { Profile } from '@/types/project';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getDisplayHandle, getRawUsername } from '@/lib/user';
import { compressImage } from '@/lib/image-compression';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

interface SettingsTabProps {
  userProfile: Profile | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function SettingsTab({ userProfile, isLoading, onRefresh }: SettingsTabProps) {
  const router = useRouter();
  const { user, logout, refreshUserData } = useAuth();

  // Form State
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [contactHandle, setContactHandle] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Initial State for dirty tracking
  const [initialState, setInitialState] = useState<{
    username: string;
    bio: string;
    contactHandle: string;
    websiteUrl: string;
    upiId: string;
    phoneNumber: string;
    avatarUrl: string | null;
  } | null>(null);

  // Uniqueness check state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  // Image upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Populate form with current userProfile
  useEffect(() => {
    if (!userProfile && !user) return;
    const u = getRawUsername(userProfile?.username || user?.username || '');
    const b = userProfile?.bio || '';
    const c = userProfile?.contact_info || '';
    const w = userProfile?.github_url || '';
    const upi = userProfile?.upi_id || '';
    const phone = userProfile?.phone_number || '';
    const av = userProfile?.avatar_url || null;

    setUsername(u);
    setBio(b);
    setContactHandle(c);
    setWebsiteUrl(w);
    setUpiId(upi);
    setPhoneNumber(phone);
    setAvatarUrl(av);

    setInitialState({
      username: u,
      bio: b,
      contactHandle: c,
      websiteUrl: w,
      upiId: upi,
      phoneNumber: phone,
      avatarUrl: av,
    });
  }, [userProfile, user]);

  // Dirty check
  const isDirty = Boolean(
    initialState &&
      (username !== initialState.username ||
        bio !== initialState.bio ||
        contactHandle !== initialState.contactHandle ||
        websiteUrl !== initialState.websiteUrl ||
        upiId !== initialState.upiId ||
        phoneNumber !== initialState.phoneNumber ||
        avatarUrl !== initialState.avatarUrl)
  );

  // beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Debounced username validation & uniqueness check (400ms)
  useEffect(() => {
    if (!initialState) return;
    const clean = username.trim().toLowerCase();

    if (!clean) {
      setUsernameError('Username is required.');
      setIsUsernameAvailable(null);
      return;
    }

    if (clean.length < 3 || clean.length > 24) {
      setUsernameError('Username must be between 3 and 24 characters.');
      setIsUsernameAvailable(null);
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(clean)) {
      setUsernameError('Only lowercase letters, numbers, underscores and dots are allowed.');
      setIsUsernameAvailable(null);
      return;
    }

    // If unchanged from original, it's valid
    if (clean === initialState.username.toLowerCase()) {
      setUsernameError(null);
      setIsUsernameAvailable(true);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', clean)
          .maybeSingle();

        if (error) throw error;
        if (data && data.id !== user?.id) {
          setUsernameError('This username is already taken.');
          setIsUsernameAvailable(false);
        } else {
          setUsernameError(null);
          setIsUsernameAvailable(true);
        }
      } catch {
        // Ignore check failure
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, initialState, user?.id]);

  // Avatar upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const result = await compressImage(file, { isAvatar: true });
      const compressed = result.file;
      const ext = compressed.type.split('/')[1] || 'webp';
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(path, compressed, { upsert: true });

      if (uploadError) {
        // Fallback to local data URL if bucket doesn't exist
        const reader = new FileReader();
        reader.onload = () => {
          setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(compressed);
        toast.info('Avatar set locally.');
      } else {
        const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(path);
        setAvatarUrl(urlData.publicUrl);
        toast.success('Avatar uploaded.');
      }
    } catch {
      toast.error('Failed to process avatar image.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Discard changes
  const handleDiscard = () => {
    if (!initialState) return;
    setUsername(initialState.username);
    setBio(initialState.bio);
    setContactHandle(initialState.contactHandle);
    setWebsiteUrl(initialState.websiteUrl);
    setUpiId(initialState.upiId);
    setPhoneNumber(initialState.phoneNumber);
    setAvatarUrl(initialState.avatarUrl);
    setUsernameError(null);
    toast.info('Changes discarded.');
  };

  // Save changes
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setIsSaving(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const { error } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          bio: bio.trim() || null,
          contact_info: contactHandle.trim() || null,
          github_url: websiteUrl.trim() || null,
          upi_id: upiId.trim() || null,
          phone_number: phoneNumber.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated.');
      await refreshUserData();
      onRefresh();

      setInitialState({
        username: cleanUsername,
        bio: bio.trim(),
        contactHandle: contactHandle.trim(),
        websiteUrl: websiteUrl.trim(),
        upiId: upiId.trim(),
        phoneNumber: phoneNumber.trim(),
        avatarUrl,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Sign out everywhere
  const handleSignOutEverywhere = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Signed out from all devices.');
      logout();
    } catch {
      toast.error('Sign out failed.');
    }
  };

  // Clear saved drafts
  const handleClearSavedDrafts = () => {
    try {
      localStorage.removeItem('graveyard_submit_draft_v2');
      localStorage.removeItem('graveyard_cookie_consent_v1');
      sessionStorage.clear();
      toast.success('Saved drafts and local caches cleared.');
    } catch {
      toast.error('Failed to clear local data.');
    }
  };

  // Delete account confirmation
  const handleDeleteAccount = async () => {
    if (!user) return;
    const currentClean = getRawUsername(userProfile?.username || user?.username || '');

    setIsDeletingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmationUsername: currentClean }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Deletion failed');

      toast.success('Your account has been deleted and anonymized.');
      setIsDeleteDialogOpen(false);
      logout();
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      toast.error(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-surface-2 rounded-lg" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 h-96 bg-surface rounded-card border border-line" />
          <div className="h-96 bg-surface rounded-card border border-line" />
        </div>
      </div>
    );
  }

  const currentCleanHandle = getDisplayHandle(username || userProfile?.username || user?.username);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Row */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          Settings
        </h1>
        <p className="font-sans text-sm text-muted mt-1.5">
          How you appear to other people on The Graveyard.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: Form Sections (xl:col-span-2) */}
        <div className="xl:col-span-2 space-y-6">
          <form onSubmit={handleSaveChanges} className="space-y-6">
            {/* Section 1: Profile */}
            <div className="p-6 bg-surface rounded-card border border-line space-y-5">
              <h2 className="font-display text-base font-semibold text-white">Profile</h2>

              {/* Avatar Field */}
              <div className="space-y-2">
                <label className="font-sans text-xs font-medium text-white block">Avatar</label>
                <div className="flex items-center gap-4">
                  <Avatar src={avatarUrl} username={username} size={64} />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-line bg-surface-2 hover:bg-white/5 text-xs font-sans text-white transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? 'Uploading...' : 'Upload image'}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-[#ff5555] hover:bg-[#ff2a2a]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted font-sans">
                  JPEG, PNG, or WebP. Automatically compressed.
                </p>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs font-medium text-white block">Username</label>
                  {isCheckingUsername && (
                    <span className="text-[10px] text-muted flex items-center gap-1 font-sans">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
                    </span>
                  )}
                  {!isCheckingUsername && isUsernameAvailable === true && (
                    <span className="text-[10px] text-[#39ff14] flex items-center gap-1 font-sans">
                      <Check className="w-3 h-3" /> Available
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs text-muted">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    maxLength={24}
                    className={`w-full pl-8 pr-3 py-2 bg-surface-2 border rounded-xl text-sm font-sans text-white placeholder:text-muted focus:outline-none ${
                      usernameError
                        ? 'border-[#ff2a2a] focus:border-[#ff2a2a]'
                        : 'border-line focus:border-white/30'
                    }`}
                    required
                  />
                </div>
                {usernameError ? (
                  <p className="text-[11px] text-[#ff5555] font-sans">{usernameError}</p>
                ) : (
                  <p className="text-[11px] text-muted font-sans">
                    Your public handle. Changing it updates it everywhere.
                  </p>
                )}
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs font-medium text-white block">Bio</label>
                  <span className="text-[10px] text-muted font-mono">{bio.length} / 160</span>
                </div>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  placeholder="Tell people what you build..."
                  className="w-full p-3 bg-surface-2 border border-line rounded-xl text-sm font-sans text-white placeholder:text-muted focus:outline-none focus:border-white/30 resize-none"
                />
              </div>
            </div>

            {/* Section 2: Contact */}
            <div className="p-6 bg-surface rounded-card border border-line space-y-5">
              <h2 className="font-display text-base font-semibold text-white">Contact & Links</h2>

              {/* Contact Handle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs font-medium text-white block">
                    Contact handle
                  </label>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted">
                    Public
                  </span>
                </div>
                <input
                  type="text"
                  value={contactHandle}
                  onChange={(e) => setContactHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-sm font-sans text-white placeholder:text-muted focus:outline-none focus:border-white/30"
                />
                <p className="text-[11px] text-muted font-sans">
                  Discord or Telegram. Shown on your public profile.
                </p>
              </div>

              {/* Website or Portfolio URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs font-medium text-white block">
                    Website or portfolio URL
                  </label>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted">
                    Public
                  </span>
                </div>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-sm font-sans text-white placeholder:text-muted focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Section 3: Payouts (Demo) */}
            <div className="p-6 bg-surface rounded-card border border-line space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-white">Payouts (demo)</h2>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted">
                  Private
                </span>
              </div>

              <div className="p-3 bg-surface-2 rounded-xl text-xs font-sans text-muted leading-relaxed">
                Demo only. No payouts happen in test mode. Only you can see these parameters.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-sans text-xs font-medium text-white block">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-sm font-sans text-white placeholder:text-muted focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-sans text-xs font-medium text-white block">Phone number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-sm font-sans text-white placeholder:text-muted focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Account & Auth */}
            <div className="p-6 bg-surface rounded-card border border-line space-y-5">
              <h2 className="font-display text-base font-semibold text-white">Account</h2>

              <div className="space-y-2">
                <label className="font-sans text-xs font-medium text-white block">Email address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-surface-2/60 border border-line/60 rounded-xl text-sm font-sans text-muted cursor-not-allowed"
                />
                <p className="text-[11px] text-muted font-sans">
                  Managed through authentication provider.
                </p>
              </div>

              {/* Connected Methods */}
              <div className="space-y-2 pt-2">
                <span className="font-sans text-xs font-medium text-white block">
                  Connected sign-in methods
                </span>
                <div className="p-3 bg-surface-2 rounded-xl flex items-center justify-between text-xs font-sans text-muted">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-white" />
                    <span className="text-white">Email Authentication</span>
                  </div>
                  <span className="text-[#39ff14]">Active</span>
                </div>
              </div>
            </div>
          </form>

          {/* Section 5: Sessions & Device Data */}
          <div className="p-6 bg-surface rounded-card border border-line space-y-4">
            <h2 className="font-display text-base font-semibold text-white">Sessions</h2>
            <p className="font-sans text-xs text-muted">
              Manage your active sign-in sessions across devices.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl border border-line bg-surface-2 hover:bg-white/5 font-sans font-medium text-xs text-white transition-colors"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={handleSignOutEverywhere}
                className="px-4 py-2 rounded-xl border border-line bg-surface-2 hover:bg-white/5 font-sans font-medium text-xs text-white transition-colors"
              >
                Sign out everywhere
              </button>
            </div>
          </div>

          {/* Section 6: Data on this device */}
          <div className="p-6 bg-surface rounded-card border border-line space-y-3">
            <h2 className="font-display text-base font-semibold text-white">Data on this device</h2>
            <p className="font-sans text-xs text-muted">
              Clears wizard drafts, dismissed banners, and consent preferences stored locally on this browser.
            </p>
            <button
              type="button"
              onClick={handleClearSavedDrafts}
              className="px-4 py-2 rounded-xl border border-line bg-surface-2 hover:bg-white/5 font-sans font-medium text-xs text-white transition-colors"
            >
              Clear saved drafts
            </button>
          </div>

          {/* Section 7: Danger Zone */}
          <div className="p-6 bg-surface rounded-card border border-[#ff2a2a]/30 space-y-3">
            <span className="font-mono text-xs uppercase text-[#ff5555] font-semibold block">
              Danger zone
            </span>
            <p className="font-sans text-xs text-muted">
              Permanently delete and anonymize your developer account. All active listings will be archived. Transactions and access for previous buyers remain intact.
            </p>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="px-4 py-2 rounded-xl border border-[#ff2a2a]/40 bg-[#ff2a2a]/10 hover:bg-[#ff2a2a]/20 font-sans font-semibold text-xs text-[#ff5555] transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Profile Preview Card (>= xl) */}
        <div className="hidden xl:block sticky top-[calc(var(--topbar-h)+24px)] space-y-4">
          <div className="p-6 bg-surface rounded-card border border-line space-y-5">
            <span className="font-mono text-[10px] tracking-wider uppercase text-muted/70 block">
              Public profile preview
            </span>

            <div className="flex items-center gap-3.5">
              <Avatar src={avatarUrl} username={username} size={54} />
              <div className="min-w-0">
                <span className="font-display font-bold text-base text-white block truncate">
                  {currentCleanHandle}
                </span>
                <span className="text-xs text-muted block truncate">
                  {user?.email || 'Authenticated'}
                </span>
              </div>
            </div>

            {bio ? (
              <p className="font-sans text-xs text-fg/80 leading-relaxed bg-surface-2 p-3 rounded-xl">
                {bio}
              </p>
            ) : (
              <p className="font-sans text-xs text-muted/60 italic bg-surface-2/40 p-3 rounded-xl">
                No bio provided yet.
              </p>
            )}

            <div className="space-y-2 pt-1 border-t border-line text-xs font-sans">
              <div className="flex items-center justify-between text-muted">
                <span>Contact:</span>
                <span className="text-white font-medium">{contactHandle || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Website:</span>
                <span className="text-white font-medium truncate max-w-[140px]">
                  {websiteUrl ? websiteUrl.replace(/^https?:\/\//, '') : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Unsaved-Changes Bar */}
      {isDirty && (
        <div
          role="region"
          aria-live="polite"
          className="fixed bottom-0 inset-x-0 lg:left-[264px] z-50 p-4 bg-surface/95 backdrop-blur-md border-t border-line flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-200 shadow-2xl"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            <span className="font-sans text-xs sm:text-sm text-white font-medium">
              You have unsaved changes
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg border border-line bg-surface-2 hover:bg-white/5 text-xs font-sans text-muted hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => handleSaveChanges()}
              disabled={isSaving || Boolean(usernameError)}
              className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs font-sans hover:bg-neutral-200 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Permanently delete account?"
        description="This action cannot be undone. All your active listings will be archived. Your username will be anonymized, and you will not be able to sign in again."
        confirmText={isDeletingAccount ? 'Deleting...' : 'Delete my account'}
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeletingAccount}
        requireMatchText={getRawUsername(userProfile?.username || user?.username || '')}
        onConfirm={handleDeleteAccount}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
