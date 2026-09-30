'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ModeBadge } from '@/components/ui/badge';
import TechBadge from '@/components/TechBadge';
import { CANONICAL_TECHS, Project, CauseOfDeath, CAUSE_OF_DEATH_LABELS } from '@/types/project';
import { formatINR } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState<CauseOfDeath>('other');
  const [abandonedOn, setAbandonedOn] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [collabTerms, setCollabTerms] = useState('');
  const [isCollabFilled, setIsCollabFilled] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !user) return;

    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (error || !data) throw new Error('Project not found');

        if (data.seller_id !== user.id) {
          toast.error('You do not have permission to modify this codebase.');
          router.push('/dashboard');
          return;
        }

        const raw = data as any;
        let pricePaise = 0;
        if (raw.price_paise !== undefined && raw.price_paise !== null) {
          pricePaise = Number(raw.price_paise);
        } else if (raw.price !== undefined && raw.price !== null) {
          pricePaise = Math.round(Number(raw.price) * 100);
        }
        setProject({
          ...raw,
          price_paise: pricePaise,
        } as Project);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCauseOfDeath((data.cause_of_death as CauseOfDeath) || 'other');
        setAbandonedOn(data.abandoned_on || '');
        setEpitaph(data.epitaph || '');
        setDemoUrl(data.demo_url || '');
        setTechStack(data.tech_stack || []);
        setCollabTerms(data.collab_terms || '');
        setIsCollabFilled(Boolean(data.is_collab_filled));
        setIsArchived(Boolean(data.is_archived));
        setCoverPreview(data.cover_url || null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading project';
        toast.error(msg);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user?.id, router]);

  const toggleTech = (tech: string) => {
    if (techStack.includes(tech)) {
      setTechStack(techStack.filter((t) => t !== tech));
    } else {
      setTechStack([...techStack, tech]);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Cover must be under 2MB.');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving updates to codebase...');

    try {
      let finalCoverUrl = project.cover_url;

      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop() || 'png';
        const coverPath = `${user.id}/${Date.now()}_cover.${coverExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('project-covers')
          .upload(coverPath, coverFile, { upsert: true });

        if (!uploadErr) {
          const { data: publicUrl } = supabase.storage
            .from('project-covers')
            .getPublicUrl(coverPath);
          finalCoverUrl = publicUrl.publicUrl;
        }
      }

      // Update allowed columns only
      let { error: updateErr } = await supabase
        .from('projects')
        .update({
          title: title.trim(),
          description: description.trim(),
          cause_of_death: causeOfDeath,
          abandoned_on: abandonedOn || null,
          epitaph: epitaph.trim() || null,
          demo_url: demoUrl.trim() || null,
          tech_stack: techStack,
          cover_url: finalCoverUrl,
          collab_terms: project.interaction_type === 'collab' ? collabTerms : null,
          is_collab_filled: isCollabFilled,
          is_archived: isArchived,
        })
        .eq('id', project.id)
        .eq('seller_id', user.id);

      if (updateErr && updateErr.message && updateErr.message.includes('column') && updateErr.message.includes('does not exist')) {
        const fallbackRes = await supabase
          .from('projects')
          .update({
            title: title.trim(),
            description: description.trim(),
            tech_stack: techStack,
            is_collab_filled: isCollabFilled,
            is_archived: isArchived,
          })
          .eq('id', project.id)
          .eq('seller_id', user.id);
        updateErr = fallbackRes.error;
      }

      if (updateErr) throw updateErr;

      toast.success('Codebase parameters updated successfully!', { id: toastId });
      router.push(`/project/${project.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 font-mono text-xs text-muted text-center">
          Loading codebase parameters...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard?tab=listings"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to console</span>
          </Link>
          {project && <ModeBadge mode={project.interaction_type} />}
        </div>

        <div className="bg-surface rounded-card border border-line p-6 sm:p-10 shadow-xl">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="border-b border-line pb-4 flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold text-white">Edit codebase</h1>
                <p className="font-sans text-xs text-muted mt-0.5">Pricing, type, and ownership are immutable</p>
              </div>
            </div>

            {/* Read-Only Stats Info */}
            <div className="p-4 bg-surface-2 rounded-xl border border-line grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-muted block">Mode:</span>
                <span className="text-white capitalize font-medium">{project?.interaction_type}</span>
              </div>
              <div>
                <span className="text-muted block">Price:</span>
                <span className="text-white">
                  {project?.interaction_type === 'buy'
                    ? formatINR(project.price_paise, { showFreeForZero: false })
                    : 'Free'}
                </span>
              </div>
              <div>
                <span className="text-muted block">Status:</span>
                <span className="text-[#39ff14]">{project?.is_sold ? 'Sold' : 'Available'}</span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="font-sans text-sm font-medium text-white block">Project title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {/* Tombstone fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">Cause of death</label>
                <select
                  value={causeOfDeath}
                  onChange={(e) => setCauseOfDeath(e.target.value as CauseOfDeath)}
                  className="w-full h-11 px-3.5 bg-surface-2 border border-line rounded-input font-sans text-sm text-white"
                >
                  {Object.entries(CAUSE_OF_DEATH_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">Abandoned on</label>
                <Input
                  type="date"
                  value={abandonedOn}
                  onChange={(e) => setAbandonedOn(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Epitaph */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-sans text-sm font-medium text-white block">Epitaph (one-liner)</label>
                <span className="font-mono text-xs text-muted">{epitaph.length}/140</span>
              </div>
              <Input
                value={epitaph}
                maxLength={140}
                onChange={(e) => setEpitaph(e.target.value)}
                placeholder="e.g. Shipped the auth, forgot the product."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="font-sans text-sm font-medium text-white block">Description</label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            {/* Cover Upload */}
            <div className="space-y-2">
              <label className="font-sans text-sm font-medium text-white block">Cover image</label>
              <div className="flex gap-4 items-center">
                {coverPreview && (
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-line shrink-0">
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative border border-line bg-surface-2 p-3 rounded-input cursor-pointer flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className="font-sans text-xs text-muted block text-center">
                    Click to replace cover image (Max 2MB)
                  </span>
                </div>
              </div>
            </div>

            {/* Demo URL */}
            <div className="space-y-2">
              <label className="font-sans text-sm font-medium text-white block">Live demo URL</label>
              <Input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://..." />
            </div>

            {/* Tech Stack Chips */}
            <div className="space-y-2">
              <label className="font-sans text-sm font-medium text-white block">Tech stack</label>
              <div className="flex flex-wrap gap-2">
                {CANONICAL_TECHS.map((tech) => {
                  const isSelected = techStack.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border capitalize transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-white text-black font-semibold border-white'
                          : 'bg-surface-2 text-muted border-line'
                      }`}
                    >
                      <span>{tech}</span>
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collab Options if Collab */}
            {project?.interaction_type === 'collab' && (
              <div className="p-4 bg-surface-2 rounded-card border border-line space-y-3">
                <div className="space-y-2">
                  <label className="font-sans text-sm font-medium text-white block">Collaboration terms</label>
                  <Input value={collabTerms} onChange={(e) => setCollabTerms(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    checked={isCollabFilled}
                    onChange={(e) => setIsCollabFilled(e.target.checked)}
                    id="collabFilled"
                    className="w-4 h-4 accent-[#60a5fa] cursor-pointer"
                  />
                  <label htmlFor="collabFilled" className="font-sans text-xs text-white cursor-pointer">
                    Mark partner position as filled
                  </label>
                </div>
              </div>
            )}

            {/* Archive Toggle */}
            <div className="p-4 bg-surface-2 rounded-card border border-line flex items-center justify-between">
              <div>
                <span className="font-sans text-sm font-medium text-white block">
                  Archive listing
                </span>
                <span className="font-sans text-xs text-muted">
                  Hides project from the main public feed
                </span>
              </div>
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="w-4 h-4 accent-[#ff2a2a] cursor-pointer"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-line flex items-center justify-between">
              <Link href={`/project/${project?.id}`}>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                mode="brand"
                size="md"
                type="submit"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
