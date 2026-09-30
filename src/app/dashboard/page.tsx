'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Shield,
  DollarSign,
  Users,
  MessageSquare,
  Settings,
  PlusCircle,
  ExternalLink,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ModeBadge, StatusBadge } from '@/components/ui/badge';
import Avatar from '@/components/ui/Avatar';
import CoverArt from '@/components/CoverArt';
import ChatInterface from '@/components/ChatInterface';
import { Project, Profile } from '@/types/project';
import { Transaction } from '@/types/transaction';
import { CollabRequest } from '@/types/collab';
import { formatINR } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type DashboardTab = 'overview' | 'listings' | 'vault' | 'sales' | 'collabs' | 'messages' | 'settings';

const TABS: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'My Listings', icon: Layers },
  { id: 'vault', label: 'Vault', icon: Shield },
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'collabs', label: 'Collabs', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const tabParam = (searchParams.get('tab') as DashboardTab) || 'overview';
  const recipientParam = searchParams.get('recipient');
  const [activeTab, setActiveTab] = useState<DashboardTab>(tabParam);

  // Data states
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [vaultTransactions, setVaultTransactions] = useState<Transaction[]>([]);
  const [salesTransactions, setSalesTransactions] = useState<Transaction[]>([]);
  const [receivedPitches, setReceivedPitches] = useState<CollabRequest[]>([]);
  const [myPitches, setMyPitches] = useState<CollabRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings form
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsContact, setSettingsContact] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const switchTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

  // Initial Data Fetch
  useEffect(() => {
    if (!user) return;

    const fetchAllDashboardData = async () => {
      setIsLoading(true);
      try {
        // 1. My projects
        const { data: projs } = await supabase
          .from('projects')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (projs) {
          const normalized: Project[] = (projs as any[]).map((p) => {
            let pricePaise = 0;
            if (p.price_paise !== undefined && p.price_paise !== null) {
              pricePaise = Number(p.price_paise);
            } else if (p.price !== undefined && p.price !== null) {
              pricePaise = Math.round(Number(p.price) * 100);
            }
            return {
              ...p,
              price_paise: pricePaise,
              cause_of_death: p.cause_of_death || 'other',
              abandoned_on: p.abandoned_on || null,
              last_commit_at: p.last_commit_at || null,
              epitaph: p.epitaph || null,
              revived_at: p.revived_at || null,
            };
          });
          setMyProjects(normalized);
        }

        // 2. Vault: transactions where user is buyer
        const { data: vault } = await supabase
          .from('transactions')
          .select(`
            *,
            project:projects(*)
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (vault) setVaultTransactions(vault as Transaction[]);

        // 3. Sales: transactions where user is seller
        const { data: sales } = await supabase
          .from('transactions')
          .select(`
            *,
            project:projects(*),
            buyer:profiles!buyer_id(*)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (sales) setSalesTransactions(sales as Transaction[]);

        // 4. Pitches received on my collab projects
        const { data: recPitches } = await supabase
          .from('collab_requests')
          .select(`
            *,
            project:projects(*),
            applicant:profiles!applicant_id(*)
          `)
          .in('project_id', (projs || []).filter((p) => p.interaction_type === 'collab').map((p) => p.id))
          .order('created_at', { ascending: false });

        if (recPitches) setReceivedPitches(recPitches as CollabRequest[]);

        // 5. My pitches to other projects
        const { data: sentPitches } = await supabase
          .from('collab_requests')
          .select(`
            *,
            project:projects(*)
          `)
          .eq('applicant_id', user.id)
          .order('created_at', { ascending: false });

        if (sentPitches) setMyPitches(sentPitches as CollabRequest[]);

        // 6. User profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (prof) {
          setSettingsUsername(prof.username || '');
          setSettingsBio(prof.bio || '');
          setSettingsContact(prof.contact_info || '');
        }
      } catch (err) {
        console.error('Dashboard data load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [user]);

  // Delete project
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;

      toast.success(`"${projectToDelete.title}" deleted.`);
      setMyProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Collab Position Filled
  const handleToggleCollabFilled = async (project: Project) => {
    const newFilledState = !project.is_collab_filled;
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          is_collab_filled: newFilledState,
          revived_at: newFilledState ? new Date().toISOString() : null,
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(newFilledState ? 'Position marked as filled.' : 'Position reopened.');
      setMyProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, is_collab_filled: newFilledState } : p))
      );
    } catch {
      toast.error('Failed to update project status.');
    }
  };

  // Accept / Reject Collab Pitch
  const handleCollabAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/collab', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(action === 'accept' ? 'Pitch accepted! Message channel opened.' : 'Pitch rejected.');
        setReceivedPitches((prev) =>
          prev.map((p) => (p.id === requestId ? { ...p, status: action === 'accept' ? 'accepted' : 'rejected' } : p))
        );
      } else {
        toast.error(data.error?.message || 'Action failed.');
      }
    } catch {
      toast.error('Network error updating pitch.');
    }
  };

  // Withdraw Collab Application
  const handleWithdrawPitch = async (requestId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/collab', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ requestId, action: 'withdraw' }),
      });

      if (res.ok) {
        toast.success('Pitch withdrawn.');
        setMyPitches((prev) =>
          prev.map((p) => (p.id === requestId ? { ...p, status: 'withdrawn' } : p))
        );
      }
    } catch {
      toast.error('Could not withdraw application.');
    }
  };

  // Retry GitHub Invite
  const handleRetryInvite = async (transactionId: string) => {
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
        toast.success('Invite dispatched successfully!');
        setVaultTransactions((prev) =>
          prev.map((t) => (t.id === transactionId ? { ...t, invite_status: 'sent', invite_error: null } : t))
        );
      } else {
        toast.error(data.error?.message || 'Invite retry failed.');
      }
    } catch {
      toast.error('Network error retrying invite.');
    }
  };

  // Secure Download from Vault
  const handleVaultDownload = async (projectId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/secure-download?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('Download initialized.');
      } else {
        toast.error(data.error?.message || 'Download token failed.');
      }
    } catch {
      toast.error('Download error.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: settingsUsername.trim().toLowerCase(),
          bio: settingsBio.trim() || null,
          contact_info: settingsContact.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile parameters updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Compute Overview Metrics
  const totalEarningsPaise = salesTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const activeListingsCount = myProjects.filter((p) => !p.is_sold && !p.is_collab_filled && !p.is_archived).length;
  const totalSalesCount = salesTransactions.length;
  const totalClaimsCount = vaultTransactions.filter((t) => t.kind === 'adopt').length;
  const openPitchesCount = receivedPitches.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col pb-20 md:pb-0">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col md:flex-row gap-8">
        {/* DESKTOP LEFT SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 gap-6">
          <div className="p-5 bg-surface rounded-card border border-line space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#ff2a2a] block">
              Operative console
            </span>
            <div className="flex items-center gap-3">
              <Avatar username={user?.username} size={36} />
              <div className="min-w-0">
                <span className="font-sans font-semibold text-sm text-white block truncate">
                  @{user?.username || 'operative'}
                </span>
                <span className="font-mono text-xs text-[#39ff14] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" />
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links with soft pills */}
          <nav className="flex flex-col gap-1 p-2 bg-surface rounded-card border border-line">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-left font-sans text-sm ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-muted hover:text-white hover:bg-surface-2'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-muted'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <Link href="/submit" className="w-full">
            <Button variant="primary" mode="brand" size="md" fullWidth leftIcon={<PlusCircle className="w-4 h-4" />}>
              List dead project
            </Button>
          </Link>
        </aside>

        {/* MAIN CONSOLE PANE */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Console overview</h1>
                  <p className="font-sans text-xs text-muted mt-1">Activity metrics across your listed codebases</p>
                </div>
                <Link href="/submit">
                  <Button variant="primary" mode="brand" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    New listing
                  </Button>
                </Link>
              </div>

              {/* StatCards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Earnings (Demo)"
                  value={formatINR(totalEarningsPaise, { showFreeForZero: false })}
                  subtitle="Razorpay test settlement"
                  accent="buy"
                  icon={<DollarSign className="w-4 h-4" />}
                />
                <StatCard
                  label="Active listings"
                  value={activeListingsCount}
                  subtitle="Live on marketplace"
                  accent="neutral"
                  icon={<Layers className="w-4 h-4" />}
                />
                <StatCard
                  label="Completed sales"
                  value={totalSalesCount}
                  subtitle="Exclusive code purchases"
                  accent="buy"
                  icon={<CheckCircle className="w-4 h-4 text-[#39ff14]" />}
                />
                <StatCard
                  label="Vault claims"
                  value={totalClaimsCount}
                  subtitle="Free forks & acquisitions"
                  accent="adopt"
                  icon={<Shield className="w-4 h-4 text-[#fbbf24]" />}
                />
                <StatCard
                  label="Open pitches"
                  value={openPitchesCount}
                  subtitle="Incoming partner proposals"
                  accent="collab"
                  icon={<Users className="w-4 h-4 text-[#60a5fa]" />}
                />
                <StatCard
                  label="Security status"
                  value="Active"
                  subtitle="RLS & token encryption"
                  accent="neutral"
                />
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Recent Sales / Transactions */}
                <div className="p-5 bg-surface rounded-card border border-line space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <span className="font-sans text-sm font-semibold text-white">Recent settlements</span>
                    <button onClick={() => switchTab('sales')} className="text-xs font-mono text-[#39ff14] hover:underline">
                      View all
                    </button>
                  </div>

                  {salesTransactions.length === 0 ? (
                    <p className="text-xs text-muted py-6 text-center">No sales completed yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {salesTransactions.slice(0, 4).map((tx) => (
                        <div key={tx.id} className="p-3 bg-surface-2 rounded-xl flex items-center justify-between text-xs font-mono">
                          <div className="truncate max-w-[180px]">
                            <span className="text-white block truncate">{tx.project?.title}</span>
                            <span className="text-muted text-[11px]">Buyer: @{tx.buyer?.username || 'user'}</span>
                          </div>
                          <span className="text-[#39ff14] font-medium">{formatINR(tx.amount, { showFreeForZero: false })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Collaboration Pitches */}
                <div className="p-5 bg-surface rounded-card border border-line space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <span className="font-sans text-sm font-semibold text-white">Incoming pitches</span>
                    <button onClick={() => switchTab('collabs')} className="text-xs font-mono text-[#60a5fa] hover:underline">
                      View all
                    </button>
                  </div>

                  {receivedPitches.filter((p) => p.status === 'pending').length === 0 ? (
                    <p className="text-xs text-muted py-6 text-center">No pending collaboration pitches.</p>
                  ) : (
                    <div className="space-y-2">
                      {receivedPitches
                        .filter((p) => p.status === 'pending')
                        .slice(0, 3)
                        .map((p) => (
                          <div key={p.id} className="p-3 bg-surface-2 rounded-xl space-y-2 text-xs font-mono">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium truncate max-w-[150px]">
                                @{p.applicant?.username || 'operative'}
                              </span>
                              <span className="text-[11px] text-muted">on {p.project?.title}</span>
                            </div>
                            <p className="font-sans text-xs text-fg/80 line-clamp-1">{p.pitch}</p>
                            <div className="flex gap-3 pt-1">
                              <button
                                onClick={() => handleCollabAction(p.id, 'accept')}
                                className="text-xs font-mono text-[#39ff14] hover:underline"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleCollabAction(p.id, 'reject')}
                                className="text-xs font-mono text-[#ff2a2a] hover:underline"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY LISTINGS */}
          {activeTab === 'listings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">My listings</h1>
                  <p className="font-sans text-xs text-muted mt-1">Manage, update, and monitor your published codebases</p>
                </div>
                <Link href="/submit">
                  <Button variant="primary" mode="brand" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    List project
                  </Button>
                </Link>
              </div>

              {myProjects.length === 0 ? (
                <EmptyState
                  title="No codebases listed"
                  description="You have not released any repositories to The Graveyard yet. Monetize dead projects or seek a collaborator today."
                  actionLabel="Publish first project"
                  onAction={() => router.push('/submit')}
                />
              ) : (
                <div className="border border-line bg-surface rounded-card overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-surface-2/60 border-b border-line uppercase text-muted">
                      <tr>
                        <th className="py-3.5 px-4 font-normal">Codebase</th>
                        <th className="py-3.5 px-4 font-normal">Mode</th>
                        <th className="py-3.5 px-4 font-normal">Status</th>
                        <th className="py-3.5 px-4 font-normal">Views</th>
                        <th className="py-3.5 px-4 font-normal">Created</th>
                        <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {myProjects.map((p) => {
                        let statusElement: React.ReactNode = <StatusBadge status="live" label="Live" />;
                        if (p.interaction_type === 'buy') {
                          statusElement = p.is_sold ? (
                            <StatusBadge status="sold" label="Sold" />
                          ) : (
                            <StatusBadge status="live" label="For sale" />
                          );
                        } else if (p.interaction_type === 'adopt') {
                          statusElement = <StatusBadge status="claimed" label="Live" />;
                        } else if (p.interaction_type === 'collab') {
                          statusElement = p.is_collab_filled ? (
                            <StatusBadge status="filled" label="Filled" />
                          ) : (
                            <StatusBadge status="live" label="Open" />
                          );
                        }

                        return (
                          <tr key={p.id} className="hover:bg-surface-2/40 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <div className="w-12 h-8 rounded-lg overflow-hidden bg-surface-2 shrink-0 border border-line">
                                {p.cover_url ? (
                                  <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <CoverArt title={p.title} mode={p.interaction_type} className="w-full h-full" />
                                )}
                              </div>
                              <div className="truncate max-w-[180px] sm:max-w-[220px]">
                                <Link href={`/project/${p.id}`} className="font-sans font-medium text-sm text-white hover:underline block truncate">
                                  {p.title}
                                </Link>
                                <span className="text-[11px] text-muted">
                                  {p.interaction_type === 'buy'
                                    ? formatINR(p.price_paise, { showFreeForZero: false })
                                    : p.interaction_type === 'adopt'
                                    ? 'Free'
                                    : p.collab_terms || 'Collab'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <ModeBadge mode={p.interaction_type} />
                            </td>
                            <td className="py-3 px-4">{statusElement}</td>
                            <td className="py-3 px-4 text-muted">
                              <span>{p.views || 0}</span>
                            </td>
                            <td className="py-3 px-4 text-muted">
                              {new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/project/${p.id}`}>
                                  <button className="p-1.5 hover:text-white text-muted" title="View details">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </Link>
                                <Link href={`/edit/${p.id}`}>
                                  <button className="p-1.5 hover:text-[#39ff14] text-muted" title="Edit codebase">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </Link>
                                {p.interaction_type === 'collab' && (
                                  <button
                                    onClick={() => handleToggleCollabFilled(p)}
                                    className="p-1.5 hover:text-[#60a5fa] text-muted"
                                    title={p.is_collab_filled ? 'Reopen position' : 'Mark filled'}
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setProjectToDelete(p)}
                                  className="p-1.5 hover:text-[#ff2a2a] text-muted"
                                  title="Delete listing"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Digital vault</h1>
                <p className="font-sans text-xs text-muted mt-1">
                  All acquired repositories, download archives, and GitHub collaborator permissions
                </p>
              </div>

              {vaultTransactions.length === 0 ? (
                <EmptyState
                  title="Vault is empty"
                  description="You have not purchased or claimed any codebases yet. Browse the graveyard to scavenge working software."
                  actionLabel="Explore projects"
                  onAction={() => router.push('/')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vaultTransactions.map((tx) => (
                    <div key={tx.id} className="p-6 bg-surface rounded-card border border-line space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-mono text-[10px] text-[#39ff14] px-2 py-0.5 bg-[#39ff14]/10 rounded-full uppercase">
                              {tx.kind === 'buy' ? 'Purchased' : 'Claimed'}
                            </span>
                            <span className="font-mono text-xs text-muted">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <Link href={`/project/${tx.project_id}`} className="font-display font-semibold text-lg text-white hover:underline block truncate max-w-[240px]">
                            {tx.project?.title || 'Codebase'}
                          </Link>
                        </div>
                        <span className="font-mono text-sm font-semibold text-white">
                          {tx.kind === 'buy' ? formatINR(tx.amount, { showFreeForZero: false }) : 'Free claim'}
                        </span>
                      </div>

                      {/* Delivery Status & Actions */}
                      <div className="p-3.5 bg-surface-2 rounded-xl space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-muted">GitHub invite:</span>
                          <span className="flex items-center gap-1 font-medium">
                            {tx.invite_status === 'sent' && (
                              <span className="text-[#39ff14] flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Sent
                              </span>
                            )}
                            {tx.invite_status === 'failed' && (
                              <span className="text-[#ff2a2a] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Failed
                              </span>
                            )}
                            {tx.invite_status === 'pending' && <span className="text-[#fbbf24]">Pending</span>}
                            {tx.invite_status === 'not_applicable' && <span className="text-muted">N/A</span>}
                          </span>
                        </div>

                        {tx.invite_status === 'failed' && (
                          <div className="pt-2 border-t border-line flex items-center justify-between">
                            <span className="text-[11px] text-[#ff2a2a] truncate max-w-[200px]">
                              {tx.invite_error || 'Permission error'}
                            </span>
                            <button
                              onClick={() => handleRetryInvite(tx.id)}
                              className="text-[11px] font-mono text-[#39ff14] hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Download & Access CTAs */}
                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          variant="primary"
                          mode="buy"
                          size="sm"
                          fullWidth
                          onClick={() => handleVaultDownload(tx.project_id)}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          Download ZIP
                        </Button>
                        <Link href={`/project/${tx.project_id}`} className="shrink-0">
                          <Button variant="ghost" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SALES */}
          {activeTab === 'sales' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Sales & settlements</h1>
                <p className="font-sans text-xs text-muted mt-1">Transactions executed for your listed codebases</p>
              </div>

              {salesTransactions.length === 0 ? (
                <EmptyState
                  title="No sales logged"
                  description="When an operative acquires one of your projects, the verified order and payment telemetry will be logged here."
                />
              ) : (
                <div className="border border-line bg-surface rounded-card overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-surface-2/60 border-b border-line uppercase text-muted">
                      <tr>
                        <th className="py-3.5 px-4 font-normal">Project</th>
                        <th className="py-3.5 px-4 font-normal">Buyer</th>
                        <th className="py-3.5 px-4 font-normal">Amount</th>
                        <th className="py-3.5 px-4 font-normal">Date</th>
                        <th className="py-3.5 px-4 font-normal">Status</th>
                        <th className="py-3.5 px-4 font-normal">GitHub Invite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {salesTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-surface-2/40">
                          <td className="py-3.5 px-4 font-medium text-white">
                            <Link href={`/project/${tx.project_id}`} className="hover:underline">
                              {tx.project?.title}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-white">@{tx.buyer?.username || 'operative'}</td>
                          <td className="py-3.5 px-4 text-[#39ff14] font-medium">
                            {formatINR(tx.amount, { showFreeForZero: false })}
                          </td>
                          <td className="py-3.5 px-4 text-muted">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status="live" label="Completed" />
                          </td>
                          <td className="py-3.5 px-4">
                            {tx.invite_status === 'sent' && (
                              <span className="text-[#39ff14] flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Sent
                              </span>
                            )}
                            {tx.invite_status === 'failed' && (
                              <span className="text-[#ff2a2a] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Failed
                              </span>
                            )}
                            {tx.invite_status === 'not_applicable' && <span className="text-muted">N/A</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COLLABS */}
          {activeTab === 'collabs' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Section 1: Received Pitches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">Received pitches</h2>
                    <p className="font-sans text-xs text-muted mt-0.5">Operatives applying to co-build your listed projects</p>
                  </div>
                  <span className="font-mono text-xs text-[#60a5fa]">{receivedPitches.length} total</span>
                </div>

                {receivedPitches.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center bg-surface rounded-card border border-line">
                    No partner pitches received yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {receivedPitches.map((p) => (
                      <div key={p.id} className="p-5 bg-surface rounded-card border border-line space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={p.applicant?.avatar_url} username={p.applicant?.username} size={36} />
                            <div>
                              <span className="font-sans font-semibold text-sm text-white block">
                                @{p.applicant?.username}
                              </span>
                              <span className="font-mono text-xs text-muted">
                                Applied for: <strong className="text-white">{p.project?.title}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {p.status === 'pending' && <StatusBadge status="pending" label="Pending" />}
                            {p.status === 'accepted' && <StatusBadge status="live" label="Accepted" />}
                            {p.status === 'rejected' && <StatusBadge status="failed" label="Rejected" />}
                            {p.status === 'withdrawn' && <StatusBadge status="archived" label="Withdrawn" />}
                          </div>
                        </div>

                        {/* Pitch Box */}
                        <div className="p-3.5 bg-surface-2 rounded-xl font-sans text-xs sm:text-sm text-fg/90 whitespace-pre-wrap leading-relaxed">
                          {p.pitch}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted">
                          <div>
                            <span>Contact: </span>
                            <span className="text-white">{p.contact}</span>
                            {p.portfolio_url && (
                              <a
                                href={p.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#60a5fa] hover:underline ml-3 inline-flex items-center gap-1"
                              >
                                <span>Portfolio</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {p.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCollabAction(p.id, 'reject')}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="primary"
                                mode="collab"
                                size="sm"
                                onClick={() => handleCollabAction(p.id, 'accept')}
                              >
                                Accept & open thread
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: My Applications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">My applications</h2>
                    <p className="font-sans text-xs text-muted mt-0.5">Pitches you submitted to other owners</p>
                  </div>
                  <span className="font-mono text-xs text-muted">{myPitches.length} total</span>
                </div>

                {myPitches.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center bg-surface rounded-card border border-line">
                    You have not submitted any collaboration proposals.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myPitches.map((p) => (
                      <div key={p.id} className="p-5 bg-surface rounded-card border border-line space-y-2">
                        <div className="flex items-center justify-between">
                          <Link href={`/project/${p.project_id}`} className="font-sans font-semibold text-sm text-white hover:underline">
                            {p.project?.title}
                          </Link>
                          <div className="flex items-center gap-2">
                            {p.status === 'pending' && <StatusBadge status="pending" label="Pending" />}
                            {p.status === 'accepted' && <StatusBadge status="live" label="Accepted" />}
                            {p.status === 'rejected' && <StatusBadge status="failed" label="Rejected" />}
                            {p.status === 'withdrawn' && <StatusBadge status="archived" label="Withdrawn" />}
                          </div>
                        </div>
                        <p className="font-sans text-xs text-muted line-clamp-2">{p.pitch}</p>
                        {p.status === 'pending' && (
                          <div className="pt-2 text-right">
                            <button
                              onClick={() => handleWithdrawPitch(p.id)}
                              className="text-xs font-mono text-[#ff2a2a] hover:underline"
                            >
                              Withdraw application
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Messages</h1>
                <p className="font-sans text-xs text-muted mt-1">Peer-to-peer collaborator transmissions</p>
              </div>
              <ChatInterface initialRecipientId={recipientParam} />
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-xl animate-in fade-in duration-200">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Settings</h1>
                <p className="font-sans text-xs text-muted mt-1">Public profile and developer identification</p>
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 bg-surface rounded-card border border-line space-y-5">
                <div className="space-y-2">
                  <label className="font-sans text-sm font-medium text-white block">Developer handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">@</span>
                    <Input
                      value={settingsUsername}
                      onChange={(e) => setSettingsUsername(e.target.value)}
                      className="pl-8"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-sans text-sm font-medium text-white block">Bio / Specialization</label>
                  <Textarea
                    rows={3}
                    value={settingsBio}
                    onChange={(e) => setSettingsBio(e.target.value)}
                    placeholder="Describe your engineering focus..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-sans text-sm font-medium text-white block">Public contact handle (Discord/Telegram)</label>
                  <Input
                    value={settingsContact}
                    onChange={(e) => setSettingsContact(e.target.value)}
                    placeholder="@operative_dev"
                  />
                </div>

                <div className="pt-2">
                  <Button variant="primary" mode="brand" size="md" type="submit" isLoading={isSavingSettings}>
                    Save parameters
                  </Button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="p-6 bg-surface-2/60 rounded-card border border-[#ff2a2a]/30 space-y-3">
                <span className="font-mono text-xs uppercase text-[#ff2a2a] font-semibold block">Danger zone</span>
                <p className="font-sans text-xs text-muted">
                  Session termination or local test credential clearing.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    toast.success('Local test caches cleared.');
                  }}
                >
                  Clear local test state
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-header bg-bg/95 border-t border-line px-2 py-2 flex items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
                isActive ? 'text-white' : 'text-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-normal">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      {projectToDelete && (
        <ConfirmDialog
          isOpen={Boolean(projectToDelete)}
          title={`Delete "${projectToDelete.title}"?`}
          description="This action will permanently remove the project from the marketplace index. This operation cannot be reversed."
          requireMatchText={projectToDelete.title}
          confirmText="Delete codebase"
          isDanger={true}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setProjectToDelete(null)}
        />
      )}

      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <DashboardContent />
    </Suspense>
  );
}
