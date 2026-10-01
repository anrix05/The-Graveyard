'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardShell from '@/components/console/DashboardShell';
import OverviewTab from '@/components/console/OverviewTab';
import ListingsTab from '@/components/console/ListingsTab';
import VaultTab from '@/components/console/VaultTab';
import SalesTab from '@/components/console/SalesTab';
import CollabsTab from '@/components/console/CollabsTab';
import MessagesTab from '@/components/console/MessagesTab';
import SettingsTab from '@/components/console/SettingsTab';
import { ConsoleTab } from '@/components/console/types';
import { Project, Profile } from '@/types/project';
import { Transaction } from '@/types/transaction';
import { CollabRequest } from '@/types/collab';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();

  const tabParam = (searchParams.get('tab') as ConsoleTab) || 'overview';
  const recipientParam = searchParams.get('recipient') || searchParams.get('to');
  const [activeTab, setActiveTab] = useState<ConsoleTab>(tabParam);

  // Data states
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [vaultTransactions, setVaultTransactions] = useState<Transaction[]>([]);
  const [salesTransactions, setSalesTransactions] = useState<Transaction[]>([]);
  const [receivedPitches, setReceivedPitches] = useState<CollabRequest[]>([]);
  const [myPitches, setMyPitches] = useState<CollabRequest[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // If recipient param exists on load, switch to messages
  useEffect(() => {
    if (recipientParam && activeTab !== 'messages') {
      setActiveTab('messages');
    }
  }, [recipientParam]);

  const switchTab = useCallback(
    (tab: ConsoleTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Redirect to login if unauthenticated once auth loads
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login?next=/dashboard');
    }
  }, [user, isAuthLoading, router]);

  // Initial Data Fetch
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile as Profile);
      }

      // 2. Fetch User's Listings
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (!projectsError && projects) {
        setMyProjects(projects as Project[]);
      }

      // 3. Fetch Vault Transactions (Purchased or Adopted by user)
      const { data: vault, error: vaultError } = await supabase
        .from('transactions')
        .select('*, project:projects(*)')
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!vaultError && vault) {
        setVaultTransactions(vault as Transaction[]);
      }

      // 4. Fetch Sales Transactions (Executed on user's projects)
      if (projects && projects.length > 0) {
        const projectIds = projects.map((p) => p.id);
        const { data: sales, error: salesError } = await supabase
          .from('transactions')
          .select('*, project:projects(*), buyer:profiles!buyer_id(*)')
          .in('project_id', projectIds)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (!salesError && sales) {
          setSalesTransactions(sales as Transaction[]);
        }

        // 5. Fetch Received Collab Pitches
        const { data: pitches, error: pitchesError } = await supabase
          .from('collab_requests')
          .select('*, project:projects(*), applicant:profiles!applicant_id(*)')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        if (!pitchesError && pitches) {
          setReceivedPitches(pitches as CollabRequest[]);
        }
      }

      // 6. Fetch Sent Collab Pitches (User applied to other projects)
      const { data: sentPitches, error: sentError } = await supabase
        .from('collab_requests')
        .select('*, project:projects(*)')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (!sentError && sentPitches) {
        setMyPitches(sentPitches as CollabRequest[]);
      }

      // 7. Fetch unread messages count
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (typeof count === 'number') {
        setUnreadMessagesCount(count);
      }
    } catch (e) {
      console.error('Error fetching console data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription for incoming messages count
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`console-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          setUnreadMessagesCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const pendingPitchesCount = receivedPitches.filter((p) => p.status === 'pending').length;

  return (
    <DashboardShell
      activeTab={activeTab}
      onTabChange={switchTab}
      unreadMessagesCount={unreadMessagesCount}
      pendingPitchesCount={pendingPitchesCount}
    >
      {activeTab === 'overview' && (
        <OverviewTab
          userProfile={userProfile}
          myProjects={myProjects}
          salesTransactions={salesTransactions}
          vaultTransactions={vaultTransactions}
          receivedPitches={receivedPitches}
          unreadMessagesCount={unreadMessagesCount}
          isLoading={isLoading}
          onTabChange={switchTab}
        />
      )}

      {activeTab === 'listings' && (
        <ListingsTab
          projects={myProjects}
          isLoading={isLoading}
          onRefresh={fetchData}
        />
      )}

      {activeTab === 'vault' && (
        <VaultTab
          transactions={vaultTransactions}
          isLoading={isLoading}
          onRefresh={fetchData}
        />
      )}

      {activeTab === 'sales' && (
        <SalesTab
          transactions={salesTransactions}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'collabs' && (
        <CollabsTab
          receivedPitches={receivedPitches}
          myPitches={myPitches}
          isLoading={isLoading}
          onRefresh={fetchData}
          onOpenMessage={(recipientId) => {
            switchTab('messages');
            router.replace(`/dashboard?tab=messages&recipient=${recipientId}`, { scroll: false });
          }}
        />
      )}

      {activeTab === 'messages' && (
        <MessagesTab
          initialRecipientId={recipientParam}
          onUnreadChange={setUnreadMessagesCount}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          userProfile={userProfile}
          isLoading={isLoading}
          onRefresh={fetchData}
        />
      )}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <DashboardContent />
    </Suspense>
  );
}
