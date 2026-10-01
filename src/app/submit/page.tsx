'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Check,
  AlertTriangle,
  FileArchive,
  Github,
  DollarSign,
  Sparkles,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sliders,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Stepper, { StepItem } from '@/components/ui/Stepper';
import TechBadge from '@/components/TechBadge';
import CoverArt from '@/components/CoverArt';
import Avatar from '@/components/ui/Avatar';
import { ModeBadge } from '@/components/ui/badge';
import { projectPublishSchema } from '@/lib/validations/project';
import {
  CANONICAL_TECHS,
  InteractionType,
  CauseOfDeath,
  CAUSE_OF_DEATH_LABELS,
} from '@/types/project';
import { formatINR, toPaise } from '@/lib/format';
import { formatEpitaph } from '@/lib/epitaph';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { compressImage } from '@/lib/image-compression';
import { toast } from 'sonner';

const STEPS: StepItem[] = [
  { id: 1, label: 'Tombstone & Basics' },
  { id: 2, label: 'Type & Pricing' },
  { id: 3, label: 'Delivery Assets' },
  { id: 4, label: 'Review & Publish' },
];

const COLLAB_TERMS_OPTIONS = [
  'Equity Split',
  'Revenue Share',
  'Paid Contract',
  'Co-founder Match',
  'Open to Discussion',
];

const LICENSE_OPTIONS = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Proprietary', 'Unlicense'];

export default function SubmitWizardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedProjectId, setPublishedProjectId] = useState<string | null>(null);

  // Form Fields - Step 1
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState<CauseOfDeath>('lost_interest');
  const [abandonedOn, setAbandonedOn] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [techStack, setTechStack] = useState<string[]>(['react', 'typescript']);
  const [customTechInput, setCustomTechInput] = useState('');

  // Step 1: Optional Details (Recommended)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [completionPercent, setCompletionPercent] = useState<number>(80);
  const [linesOfCode, setLinesOfCode] = useState<string>('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [todoItems, setTodoItems] = useState<string[]>([]);
  const [todoInput, setTodoInput] = useState('');
  const [setupNotes, setSetupNotes] = useState('');
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  // Step 2: Collab Roles
  const [collabRoles, setCollabRoles] = useState<Array<{ role: string; commitment: string; description: string }>>([]);

  // Step 3: File Tree & Exclusions
  const [fileTree, setFileTree] = useState<string[]>([]);
  const [includedTreePaths, setIncludedTreePaths] = useState<Set<string>>(new Set());

  // Step 2
  const [interactionType, setInteractionType] = useState<InteractionType>('buy');
  const [priceRupees, setPriceRupees] = useState<number>(1499);
  const [collabTerms, setCollabTerms] = useState('Equity Split');
  const [roleWanted, setRoleWanted] = useState('');
  const [license, setLicense] = useState('MIT');

  // Step 3: Delivery Assets
  const [deliveryMethod, setDeliveryMethod] = useState<'archive' | 'github'>('archive');
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [githubRepoInput, setGithubRepoInput] = useState('');
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [isRepoValidating, setIsRepoValidating] = useState(false);
  const [repoValidatedInfo, setRepoValidatedInfo] = useState<{ id?: string; isPrivate?: boolean; lastCommitAt?: string } | null>(null);
  const [repoValidationError, setRepoValidationError] = useState<string | null>(null);

  // Errors per step
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Draft autosave to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('graveyard_submit_draft_v2');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.causeOfDeath) setCauseOfDeath(d.causeOfDeath);
        if (d.abandonedOn) setAbandonedOn(d.abandonedOn);
        if (d.epitaph) setEpitaph(d.epitaph);
        if (d.demoUrl) setDemoUrl(d.demoUrl);
        if (d.techStack) setTechStack(d.techStack);
        if (d.interactionType) setInteractionType(d.interactionType);
        if (d.priceRupees) setPriceRupees(d.priceRupees);
        if (d.collabTerms) setCollabTerms(d.collabTerms);
        if (d.roleWanted) setRoleWanted(d.roleWanted);
        if (d.license) setLicense(d.license);
        if (d.deliveryMethod) setDeliveryMethod(d.deliveryMethod);
        if (d.githubRepoInput) setGithubRepoInput(d.githubRepoInput);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    try {
      const draft = {
        title,
        description,
        causeOfDeath,
        abandonedOn,
        epitaph,
        demoUrl,
        techStack,
        interactionType,
        priceRupees,
        collabTerms,
        roleWanted,
        license,
        deliveryMethod,
        githubRepoInput,
      };
      localStorage.setItem('graveyard_submit_draft_v2', JSON.stringify(draft));
    } catch {
      // Ignore
    }
  }, [
    title,
    description,
    causeOfDeath,
    abandonedOn,
    epitaph,
    demoUrl,
    techStack,
    interactionType,
    priceRupees,
    collabTerms,
    roleWanted,
    license,
    deliveryMethod,
    githubRepoInput,
  ]);

  // Handle Cover File selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Cover image must be 2 MB or smaller.');
      return;
    }

    setCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
  };

  // Toggle tech stack chip
  const toggleTech = (tech: string) => {
    if (techStack.includes(tech)) {
      setTechStack(techStack.filter((t) => t !== tech));
    } else {
      setTechStack([...techStack, tech]);
    }
  };

  const handleAddCustomTech = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!customTechInput.trim()) return;
    const clean = customTechInput.trim().toLowerCase();
    if (!techStack.includes(clean)) {
      setTechStack([...techStack, clean]);
    }
    setCustomTechInput('');
  };

  // GitHub Repo Verification
  const verifyGithubRepo = async () => {
    if (!githubRepoInput.trim()) {
      setRepoValidationError('Please enter an owner/repo or GitHub link.');
      return;
    }

    setIsRepoValidating(true);
    setRepoValidationError(null);
    setRepoValidatedInfo(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const res = await fetch('/api/validate-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ repoFullName: githubRepoInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRepoValidationError(data.error?.message || 'Repository verification failed.');
      } else {
        setRepoValidatedInfo({
          id: data.id,
          isPrivate: data.isPrivate,
          lastCommitAt: data.lastCommitAt,
        });
        setIsPrivateRepo(Boolean(data.isPrivate));
        setGithubRepoInput(data.repoFullName);

        // Auto default abandoned date if empty
        if (!abandonedOn && data.lastCommitAt) {
          setAbandonedOn(data.lastCommitAt.slice(0, 10));
        }

        // Capture file tree from GitHub if available
        if (data.fileTree && Array.isArray(data.fileTree)) {
          setFileTree(data.fileTree);
          setIncludedTreePaths(new Set(data.fileTree));
        }

        toast.success(`Repository verified: ${data.repoFullName}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error validating repo';
      setRepoValidationError(msg);
    } finally {
      setIsRepoValidating(false);
    }
  };

  // Archive Selection with Client-Side JSZip Tree Parsing
  const handleArchiveSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Source archive must be 50 MB or smaller.');
      return;
    }

    setArchiveFile(file);

    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const paths: string[] = [];
      const excludedPatterns = [
        /^\.env/i,
        /^node_modules[/\\]/i,
        /^\.git[/\\]/i,
        /\/\.env/i,
        /\/node_modules\//i,
        /\/node_modules$/i,
        /\/\.git\//i,
        /\.DS_Store$/i,
      ];

      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        const isExcluded = excludedPatterns.some((pattern) => pattern.test(relativePath));
        if (!isExcluded) {
          paths.push(relativePath);
        }
      });

      const cleanPaths = paths.slice(0, 300);
      setFileTree(cleanPaths);
      setIncludedTreePaths(new Set(cleanPaths));
      toast.success(`Archive inspected: ${cleanPaths.length} files detected`);
    } catch (err) {
      console.warn('Failed to parse zip entries:', err);
    }
  };

  // Screenshot Selection with Client-side WebP compression
  const handleAddScreenshots = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const f of files) {
      if (screenshotFiles.length + validFiles.length >= 6) {
        toast.error('Maximum 6 screenshots allowed.');
        break;
      }
      try {
        const compressed = await compressImage(f, { maxDimension: 1600, maxSizeBytes: 300 * 1024 });
        validFiles.push(compressed.file);
        previews.push(URL.createObjectURL(compressed.file));
        toast.success(`${compressed.file.name}: ${compressed.savingsText}`);
      } catch {
        validFiles.push(f);
        previews.push(URL.createObjectURL(f));
      }
    }

    setScreenshotFiles((prev) => [...prev, ...validFiles]);
    setScreenshotPreviews((prev) => [...prev, ...previews]);

    // If no cover set, first screenshot becomes cover preview
    if (!coverPreview && previews.length > 0) {
      setCoverPreview(previews[0]);
      setCoverFile(validFiles[0]);
    }
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!title.trim() || title.length < 3) {
        errors.title = 'Title is required (minimum 3 characters).';
      }
      if (!description.trim() || description.length < 10) {
        errors.description = 'Please provide a descriptive overview (minimum 10 characters).';
      }
      if (epitaph.length > 140) {
        errors.epitaph = 'Epitaph must be 140 characters or less.';
      }
      if (techStack.length === 0) {
        errors.techStack = 'Please select at least one technology stack.';
      }
    }

    if (step === 2) {
      if (interactionType === 'buy') {
        if (!priceRupees || priceRupees < 1 || priceRupees > 100000) {
          errors.price = 'Price must be between ₹1 and ₹100,000.';
        }
      }
      if (interactionType === 'collab') {
        if (!roleWanted.trim()) {
          errors.roleWanted = 'Please describe what collaborator role you are looking for.';
        }
      }
    }

    if (step === 3) {
      if (interactionType !== 'collab') {
        if (deliveryMethod === 'archive' && !archiveFile) {
          errors.delivery = 'Please upload a source code archive (.zip, .tar, .7z).';
        }
        if (deliveryMethod === 'github' && !githubRepoInput.trim()) {
          errors.delivery = 'Please provide a repository link.';
        }
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Publish Listing
  const handlePublish = async () => {
    if (!user) {
      toast.error('Authentication required to publish projects.');
      router.push(`/login?next=/submit`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Publishing your codebase to The Graveyard...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired');

      // 1. Upload Cover Image to public 'project-covers' bucket if provided
      let finalCoverUrl: string | null = null;
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop() || 'webp';
        const coverHash = Math.random().toString(36).slice(2, 8);
        const coverPath = `${user.id}/${Date.now()}_${coverHash}_cover.${coverExt}`;
        const { error: coverErr } = await supabase.storage
          .from('project-covers')
          .upload(coverPath, coverFile, { upsert: true });

        if (!coverErr) {
          const { data: publicUrlData } = supabase.storage
            .from('project-covers')
            .getPublicUrl(coverPath);
          finalCoverUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Cover upload failed, continuing with generative cover:', coverErr);
        }
      }

      // 1b. Upload Screenshots to 'project-covers' bucket
      const uploadedScreenshots: string[] = [];
      for (let i = 0; i < screenshotFiles.length; i++) {
        const sf = screenshotFiles[i];
        const sExt = sf.name.split('.').pop() || 'webp';
        const sHash = Math.random().toString(36).slice(2, 8);
        const sPath = `${user.id}/${Date.now()}_${sHash}_shot_${i}.${sExt}`;
        const { error: sErr } = await supabase.storage
          .from('project-covers')
          .upload(sPath, sf, { upsert: true });

        if (!sErr) {
          const { data: sPub } = supabase.storage
            .from('project-covers')
            .getPublicUrl(sPath);
          uploadedScreenshots.push(sPub.publicUrl);
        }
      }

      // Fallback: If no cover set, use first screenshot as cover
      if (!finalCoverUrl && uploadedScreenshots.length > 0) {
        finalCoverUrl = uploadedScreenshots[0];
      }

      // 2. Upload Archive File to private 'project-files' bucket if provided
      let finalFilePath: string | null = null;
      let finalFileSize: number | null = null;
      if (deliveryMethod === 'archive' && archiveFile) {
        const archiveExt = archiveFile.name.split('.').pop() || 'zip';
        const filePath = `${user.id}/${Date.now()}_source.${archiveExt}`;
        const { error: archiveErr } = await supabase.storage
          .from('project-files')
          .upload(filePath, archiveFile, { upsert: true });

        if (archiveErr) {
          throw new Error(`Failed to upload source archive: ${archiveErr.message}`);
        }
        finalFilePath = filePath;
        finalFileSize = archiveFile.size;
      }

      // 3. Insert Project Record with Tombstone & v4 fields
      const pricePaise = interactionType === 'buy' ? toPaise(priceRupees) : 0;
      const effectiveAbandonedOn = abandonedOn || (repoValidatedInfo?.lastCommitAt ? repoValidatedInfo.lastCommitAt.slice(0, 10) : null);
      const effectiveFileTree = fileTree.length > 0 ? fileTree.filter((p) => includedTreePaths.has(p)) : null;

      const primaryPayload: Record<string, any> = {
        seller_id: user.id,
        title: title.trim(),
        tagline: tagline.trim() || null,
        description: description.trim(),
        tech_stack: techStack,
        interaction_type: interactionType,
        price_paise: pricePaise,
        cover_url: finalCoverUrl,
        demo_url: demoUrl.trim() || null,
        license: license,
        collab_terms: interactionType === 'collab' ? collabTerms : null,
        has_archive: Boolean(finalFilePath),
        has_repo: Boolean(githubRepoInput.trim()),
        cause_of_death: causeOfDeath,
        abandoned_on: effectiveAbandonedOn,
        epitaph: epitaph.trim() || null,
        last_commit_at: repoValidatedInfo?.lastCommitAt || null,
        is_sold: false,
        is_archived: false,
        is_collab_filled: false,
        views: 0,
        completion_percent: completionPercent != null ? Number(completionPercent) : null,
        lines_of_code: linesOfCode ? Number(linesOfCode) : null,
        features: features,
        todo_items: todoItems,
        setup_notes: setupNotes.trim() || null,
        screenshots: uploadedScreenshots,
        file_tree: effectiveFileTree,
        collab_roles: interactionType === 'collab' && collabRoles.length > 0 ? collabRoles : null,
      };

      // Zod Validation Check
      const parsedCheck = projectPublishSchema.safeParse(primaryPayload);
      if (!parsedCheck.success) {
        const issue = parsedCheck.error.issues[0];
        throw new Error(issue?.message || 'Invalid listing parameters');
      }

      let newProject: any = null;
      let projErr: any = null;

      const res = await supabase.from('projects').insert(primaryPayload).select().single();
      newProject = res.data;
      projErr = res.error;

      if (projErr && projErr.message && projErr.message.includes('column') && projErr.message.includes('does not exist')) {
        // Fallback to legacy schema
        const legacyPayload: Record<string, any> = {
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          tech_stack: techStack,
          interaction_type: interactionType,
          price: Math.round(pricePaise / 100),
          file_url: finalFilePath || null,
          repo_link: githubRepoInput.trim() || null,
          github_repo_id: repoValidatedInfo?.id || null,
          github_repo_full_name: githubRepoInput.trim() || null,
          is_private_repo: Boolean(isPrivateRepo),
          is_sold: false,
          is_archived: false,
          is_collab_filled: false,
          views: 0,
        };
        const fallbackRes = await supabase.from('projects').insert(legacyPayload).select().single();
        newProject = fallbackRes.data;
        projErr = fallbackRes.error;
      }

      if (projErr) throw projErr;

      // 4. Insert Delivery Asset record if delivery information exists
      if (finalFilePath || githubRepoInput.trim()) {
        try {
          await supabase.from('project_assets').insert({
            project_id: newProject.id,
            file_path: finalFilePath,
            file_size_bytes: finalFileSize,
            github_repo_full_name: githubRepoInput.trim() || null,
            github_repo_id: repoValidatedInfo?.id || null,
            is_private_repo: Boolean(isPrivateRepo),
          });
        } catch {
          // If project_assets table does not exist yet, legacy columns were already populated
        }
      }

      // Clear draft
      localStorage.removeItem('graveyard_submit_draft_v2');

      toast.success('Your listing is live on The Graveyard!', { id: toastId });
      router.push(`/submit/success?id=${newProject.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Publishing failed';
      console.error('Publishing exception:', err);
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already published, show success view
  if (publishedProjectId) {
    return (
      <div className="min-h-dvh bg-bg text-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="p-8 sm:p-10 bg-surface rounded-card border border-line text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center text-[#39ff14] mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Listing published</h1>
              <p className="font-sans text-sm text-muted mt-2 leading-relaxed">
                Your dead project is now live on the marketplace. Other developers can now buy, claim, or partner up.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/project/${publishedProjectId}`}>
                <Button variant="primary" mode="buy" size="md" fullWidth>
                  View listing
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setPublishedProjectId(null);
                  setCurrentStep(1);
                  setTitle('');
                  setDescription('');
                  setEpitaph('');
                  setCoverFile(null);
                  setCoverPreview(null);
                  setArchiveFile(null);
                }}
              >
                Submit another
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Preview tombstone object
  const previewTombstone = formatEpitaph({
    abandoned_on: abandonedOn || (repoValidatedInfo?.lastCommitAt ? repoValidatedInfo.lastCommitAt.slice(0, 10) : null),
    cause_of_death: causeOfDeath,
  });

  return (
    <div className="min-h-dvh bg-bg text-white flex flex-col">
      <Header />

      <main id="main" tabIndex={-1} className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 outline-none">
        {/* Stepper Header */}
        <div className="mb-10 text-center sm:text-left">
          <span className="font-mono text-xs uppercase tracking-widest text-[#ff2a2a] block mb-2">
            Publish codebase
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            List a dead project
          </h1>
          <p className="font-sans text-sm text-muted mt-1.5">
            Give your abandoned repository a chance at resurrection. Your draft saves automatically.
          </p>

          <div className="mt-8 pt-4">
            <Stepper
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={(s) => s < currentStep && setCurrentStep(s)}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full bg-surface rounded-card border border-line p-6 sm:p-10 space-y-8 shadow-xl">
          {/* STEP 1: TOMBSTONE & BASICS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <h2 className="font-display text-xl font-semibold text-white">Project Identity & Tombstone</h2>
                <p className="font-sans text-xs text-muted mt-0.5">Tell the story of how and when the project died.</p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">
                  Project title <span className="text-[#ff2a2a]">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NextForge SaaS Boilerplate"
                  error={Boolean(stepErrors.title)}
                />
                {stepErrors.title && (
                  <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{stepErrors.title}</span>
                  </p>
                )}
              </div>

              {/* Tombstone row: Cause of death & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-sans text-sm font-medium text-white block">
                    Cause of death
                  </label>
                  <select
                    value={causeOfDeath}
                    onChange={(e) => setCauseOfDeath(e.target.value as CauseOfDeath)}
                    className="w-full h-11 px-3.5 bg-surface-2 border border-line rounded-input font-sans text-sm text-white focus:outline-none focus:border-white transition-colors"
                  >
                    {Object.entries(CAUSE_OF_DEATH_LABELS).map(([k, label]) => (
                      <option key={k} value={k} className="bg-surface-2 text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-sans text-sm font-medium text-white block">
                    When did it die? <span className="text-muted text-xs font-normal">(optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={abandonedOn}
                    onChange={(e) => setAbandonedOn(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted font-sans">
                    Defaults to last GitHub commit date if verified in Step 3.
                  </p>
                </div>
              </div>

              {/* Epitaph with character counter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-sm font-medium text-white block">
                    Epitaph <span className="text-muted text-xs font-normal">(one-line tagline, max 140 chars)</span>
                  </label>
                  <span className={`font-mono text-xs ${epitaph.length > 140 ? 'text-[#ff2a2a]' : 'text-muted'}`}>
                    {epitaph.length}/140
                  </span>
                </div>
                <Input
                  value={epitaph}
                  maxLength={140}
                  onChange={(e) => setEpitaph(e.target.value)}
                  placeholder="e.g. Shipped the auth, forgot the product."
                  error={Boolean(stepErrors.epitaph)}
                />
                {stepErrors.epitaph && (
                  <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{stepErrors.epitaph}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">
                  Project description <span className="text-[#ff2a2a]">*</span>
                </label>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what is built, what features are finished, known limitations, and how to run it..."
                  error={Boolean(stepErrors.description)}
                />
                {stepErrors.description && (
                  <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{stepErrors.description}</span>
                  </p>
                )}
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">
                  Cover image <span className="text-muted text-xs font-normal">(optional, generative art if left empty)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="relative border border-dashed border-line hover:border-neutral-500 rounded-card p-6 text-center cursor-pointer transition-colors bg-surface-2/40">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleCoverSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-muted mx-auto mb-2" />
                    <span className="font-sans text-xs font-medium text-white block">Upload custom screenshot</span>
                    <span className="font-mono text-[11px] text-muted">PNG, JPG, WEBP up to 2MB</span>
                  </div>

                  {/* Preview box */}
                  <div className="relative aspect-video bg-surface-2 rounded-card border border-line overflow-hidden flex items-center justify-center">
                    {coverPreview ? (
                      <img src={coverPreview} alt={`${title || 'Project'} cover preview`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CoverArt title={title || 'Dead Project'} mode="buy" className="w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Demo URL */}
              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">
                  Live demo URL <span className="text-muted text-xs font-normal">(optional)</span>
                </label>
                <Input
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://my-demo-preview.vercel.app"
                />
              </div>

              {/* Tech Stack Selection */}
              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">
                  Technologies used <span className="text-[#ff2a2a]">*</span>
                </label>
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
                            : 'bg-surface-2 text-muted border-line hover:text-white'
                        }`}
                      >
                        <span>{tech}</span>
                        {isSelected && <Check className="w-3 h-3 text-black" />}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Tech Tag */}
                <div className="flex gap-2 max-w-sm mt-2">
                  <Input
                    value={customTechInput}
                    onChange={(e) => setCustomTechInput(e.target.value)}
                    onKeyDown={handleAddCustomTech}
                    placeholder="Add other tech (e.g. redis)..."
                    className="h-9 text-xs"
                  />
                  <Button variant="secondary" size="sm" type="button" onClick={handleAddCustomTech}>
                    Add
                  </Button>
                </div>
                {stepErrors.techStack && (
                  <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{stepErrors.techStack}</span>
                  </p>
                )}
              </div>

              {/* Collapsible: Add details (recommended) */}
              <div className="pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-2/60 hover:bg-surface-2 border border-line text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-brand-red" />
                    <div>
                      <span className="font-sans font-semibold text-sm text-white block">
                        Add details (recommended)
                      </span>
                      <span className="font-sans text-xs text-muted">
                        Tagline, completion %, features, todo list, setup notes &amp; screenshots
                      </span>
                    </div>
                  </div>
                  {isDetailsOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </button>

                {isDetailsOpen && (
                  <div className="mt-4 p-5 rounded-2xl bg-surface-2/30 border border-line space-y-6 animate-in fade-in duration-150">
                    {/* Tagline */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-sans text-xs font-semibold text-white block">
                          One-line pitch / Tagline
                        </label>
                        <span className={`font-mono text-[11px] ${tagline.length > 120 ? 'text-[#ff2a2a]' : 'text-muted'}`}>
                          {tagline.length}/120
                        </span>
                      </div>
                      <Input
                        value={tagline}
                        maxLength={120}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g. Multi-tenant invoicing SaaS with GST-ready PDFs."
                      />
                    </div>

                    {/* Completion % and LOC */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-sans text-xs font-semibold text-white block">
                            Completion percentage
                          </label>
                          <span className="font-mono text-xs text-white tabular-nums">
                            {completionPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={completionPercent}
                            onChange={(e) => setCompletionPercent(Number(e.target.value))}
                            className="flex-1 accent-brand-red"
                          />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={completionPercent}
                            onChange={(e) => setCompletionPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-16 h-9 text-xs text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="font-sans text-xs font-semibold text-white block">
                          Lines of code (approximate)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={linesOfCode}
                          onChange={(e) => setLinesOfCode(e.target.value)}
                          placeholder="e.g. 14200"
                          className="h-10"
                        />
                      </div>
                    </div>

                    {/* What works (Features) */}
                    <div className="space-y-2">
                      <label className="font-sans text-xs font-semibold text-white block">
                        What works (up to 10 features)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={featureInput}
                          onChange={(e) => setFeatureInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (featureInput.trim() && features.length < 10) {
                                setFeatures([...features, featureInput.trim()]);
                                setFeatureInput('');
                              }
                            }
                          }}
                          placeholder="e.g. Multi-tenant workspaces with RLS"
                          className="h-9 text-xs"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (featureInput.trim() && features.length < 10) {
                              setFeatures([...features, featureInput.trim()]);
                              setFeatureInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {features.map((f, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-line text-xs text-fg/90"
                            >
                              <span className="text-neon-green font-bold">✓</span>
                              <span>{f}</span>
                              <button
                                type="button"
                                onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                                className="text-muted hover:text-white ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* What's left (Todo items) */}
                    <div className="space-y-2">
                      <label className="font-sans text-xs font-semibold text-white block">
                        What&apos;s left / Known gaps (up to 10 items)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={todoInput}
                          onChange={(e) => setTodoInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (todoInput.trim() && todoItems.length < 10) {
                                setTodoItems([...todoItems, todoInput.trim()]);
                                setTodoInput('');
                              }
                            }
                          }}
                          placeholder="e.g. Credit notes and multi-currency"
                          className="h-9 text-xs"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (todoInput.trim() && todoItems.length < 10) {
                              setTodoItems([...todoItems, todoInput.trim()]);
                              setTodoInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {todoItems.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {todoItems.map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-line text-xs text-fg/80"
                            >
                              <span className="text-amber font-bold">○</span>
                              <span>{t}</span>
                              <button
                                type="button"
                                onClick={() => setTodoItems(todoItems.filter((_, i) => i !== idx))}
                                className="text-muted hover:text-white ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Setup notes */}
                    <div className="space-y-1.5">
                      <label className="font-sans text-xs font-semibold text-white block">
                        Setup notes (Markdown supported)
                      </label>
                      <Textarea
                        rows={3}
                        value={setupNotes}
                        onChange={(e) => setSetupNotes(e.target.value)}
                        placeholder="How to run it, required environment variables, setup time estimate..."
                        className="text-xs font-mono"
                      />
                    </div>

                    {/* Screenshots */}
                    <div className="space-y-2">
                      <label className="font-sans text-xs font-semibold text-white block">
                        Screenshots (up to 6, max 2MB each)
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {screenshotPreviews.map((preview, sIdx) => (
                          <div key={preview} className="relative aspect-[16/10] w-24 rounded-lg overflow-hidden border border-line group">
                            <img src={preview} alt={`${title || 'Project'} screenshot ${sIdx + 1} of ${screenshotPreviews.length}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setScreenshotFiles(screenshotFiles.filter((_, i) => i !== sIdx));
                                setScreenshotPreviews(screenshotPreviews.filter((_, i) => i !== sIdx));
                              }}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}

                        {screenshotFiles.length < 6 && (
                          <label className="aspect-[16/10] w-24 rounded-lg border border-dashed border-line hover:border-neutral-400 flex flex-col items-center justify-center cursor-pointer text-muted hover:text-white transition-colors bg-surface-2/30">
                            <input
                              type="file"
                              multiple
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleAddScreenshots}
                              className="hidden"
                            />
                            <Plus className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px] font-mono">Add</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: TYPE & PRICING */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <h2 className="font-display text-xl font-semibold text-white">Listing Mode & Pricing</h2>
                <p className="font-sans text-xs text-muted mt-0.5">Select how you want to release this repository.</p>
              </div>

              {/* 3 Large Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* For Sale */}
                <button
                  type="button"
                  onClick={() => setInteractionType('buy')}
                  className={`p-5 text-left rounded-card border flex flex-col justify-between transition-all ${
                    interactionType === 'buy'
                      ? 'border-[#39ff14]/60 bg-[#39ff14]/10 shadow-[0_0_20px_rgba(57,255,20,0.12)]'
                      : 'border-line bg-surface-2 hover:border-neutral-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans font-semibold text-sm text-[#39ff14]">For Sale</span>
                      <DollarSign className="w-5 h-5 text-[#39ff14]" />
                    </div>
                    <p className="font-sans text-xs text-fg/80 leading-relaxed">
                      One-time sale. Buyer gets full rights, code archive, or repo access.
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-[#39ff14] mt-4 block">Exclusive claim</span>
                </button>

                {/* Free Fork */}
                <button
                  type="button"
                  onClick={() => setInteractionType('adopt')}
                  className={`p-5 text-left rounded-card border flex flex-col justify-between transition-all ${
                    interactionType === 'adopt'
                      ? 'border-[#fbbf24]/60 bg-[#fbbf24]/10 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                      : 'border-line bg-surface-2 hover:border-neutral-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans font-semibold text-sm text-[#fbbf24]">Free Fork</span>
                      <Sparkles className="w-5 h-5 text-[#fbbf24]" />
                    </div>
                    <p className="font-sans text-xs text-fg/80 leading-relaxed">
                      Zero cost claim. Release your code freely for the developer community.
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-[#fbbf24] mt-4 block">Open adoption</span>
                </button>

                {/* Seeking Partner */}
                <button
                  type="button"
                  onClick={() => setInteractionType('collab')}
                  className={`p-5 text-left rounded-card border flex flex-col justify-between transition-all ${
                    interactionType === 'collab'
                      ? 'border-[#3b82f6]/60 bg-[#3b82f6]/10 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                      : 'border-line bg-surface-2 hover:border-neutral-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans font-semibold text-sm text-[#60a5fa]">Seeking Partner</span>
                      <Users className="w-5 h-5 text-[#60a5fa]" />
                    </div>
                    <p className="font-sans text-xs text-fg/80 leading-relaxed">
                      Find a co-founder or specialist to finish and launch together.
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-[#60a5fa] mt-4 block">Talent match</span>
                </button>
              </div>

              {/* Mode Specific Settings */}
              {interactionType === 'buy' && (
                <div className="p-5 bg-surface-2 rounded-card border border-line space-y-4">
                  <div className="space-y-2">
                    <label className="font-sans text-sm font-medium text-white block">
                      Price (in INR ₹) <span className="text-[#ff2a2a]">*</span>
                    </label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">₹</span>
                      <Input
                        type="number"
                        min={1}
                        max={100000}
                        value={priceRupees || ''}
                        onChange={(e) => setPriceRupees(Number(e.target.value))}
                        className="pl-8"
                        error={Boolean(stepErrors.price)}
                      />
                    </div>
                    {stepErrors.price && (
                      <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{stepErrors.price}</span>
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-black/40 border border-line rounded-lg text-xs font-mono space-y-1.5 text-muted">
                    <div className="flex justify-between">
                      <span>Listing price:</span>
                      <span className="text-white">{formatINR(toPaise(priceRupees), { showFreeForZero: false })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee (0% in test mode):</span>
                      <span className="text-[#39ff14]">₹0</span>
                    </div>
                    <div className="flex justify-between font-bold text-white pt-1.5 border-t border-line">
                      <span>You receive:</span>
                      <span className="text-[#39ff14]">{formatINR(toPaise(priceRupees), { showFreeForZero: false })}</span>
                    </div>
                  </div>
                </div>
              )}

              {interactionType === 'collab' && (
                <div className="p-5 bg-surface-2 rounded-card border border-line space-y-4">
                  <div className="space-y-2">
                    <label className="font-sans text-sm font-medium text-white block">Partnership terms</label>
                    <select
                      value={collabTerms}
                      onChange={(e) => setCollabTerms(e.target.value)}
                      className="w-full h-11 px-3.5 bg-surface-3 border border-line rounded-input font-sans text-sm text-white"
                    >
                      {COLLAB_TERMS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-sans text-sm font-medium text-white block">
                      What role are you seeking? <span className="text-[#ff2a2a]">*</span>
                    </label>
                    <Textarea
                      rows={3}
                      value={roleWanted}
                      onChange={(e) => setRoleWanted(e.target.value)}
                      placeholder="e.g. Looking for a full-stack engineer to integrate payments and deploy AWS infrastructure..."
                      error={Boolean(stepErrors.roleWanted)}
                    />
                    {stepErrors.roleWanted && (
                      <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{stepErrors.roleWanted}</span>
                      </p>
                    )}
                  </div>

                  {/* Collab Roles Editor (max 4) */}
                  <div className="space-y-3 pt-3 border-t border-line">
                    <div className="flex items-center justify-between">
                      <label className="font-sans text-xs font-semibold text-white block">
                        Defined Role Openings (optional, max 4)
                      </label>
                      {collabRoles.length < 4 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2 text-blue-accent hover:text-white"
                          onClick={() => {
                            setCollabRoles([...collabRoles, { role: '', commitment: '5-10 hrs/week', description: '' }]);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Role Slot</span>
                        </Button>
                      )}
                    </div>

                    {collabRoles.map((r, rIdx) => (
                      <div key={rIdx} className="p-3.5 rounded-xl bg-surface-3 border border-line space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            value={r.role}
                            onChange={(e) => {
                              const next = [...collabRoles];
                              next[rIdx].role = e.target.value;
                              setCollabRoles(next);
                            }}
                            placeholder="e.g. Mobile Developer (React Native)"
                            className="h-8 text-xs font-semibold flex-1"
                          />
                          <Input
                            value={r.commitment}
                            onChange={(e) => {
                              const next = [...collabRoles];
                              next[rIdx].commitment = e.target.value;
                              setCollabRoles(next);
                            }}
                            placeholder="e.g. 8-10 hrs/wk"
                            className="w-32 h-8 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setCollabRoles(collabRoles.filter((_, i) => i !== rIdx))}
                            className="text-muted hover:text-[#ff2a2a] p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Input
                          value={r.description}
                          onChange={(e) => {
                            const next = [...collabRoles];
                            next[rIdx].description = e.target.value;
                            setCollabRoles(next);
                          }}
                          placeholder="Brief description of responsibilities..."
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* License Select */}
              <div className="space-y-2">
                <label className="font-sans text-sm font-medium text-white block">Code license</label>
                <select
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="w-full max-w-xs h-11 px-3.5 bg-surface-2 border border-line rounded-input font-sans text-sm text-white"
                >
                  {LICENSE_OPTIONS.map((lic) => (
                    <option key={lic} value={lic}>
                      {lic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: DELIVERY ASSETS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <h2 className="font-display text-xl font-semibold text-white">Delivery & Source Code</h2>
                <p className="font-sans text-xs text-muted mt-0.5">
                  How buyers or adopters will receive the actual codebase.
                </p>
              </div>

              {/* Delivery Method Selector */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('archive')}
                  className={`p-4 text-left rounded-card border flex items-center gap-3 transition-colors ${
                    deliveryMethod === 'archive'
                      ? 'border-white bg-surface-2 text-white font-medium'
                      : 'border-line bg-surface text-muted'
                  }`}
                >
                  <FileArchive className="w-5 h-5 text-[#39ff14]" />
                  <div>
                    <span className="font-sans text-sm font-medium block">Source archive</span>
                    <span className="font-mono text-[11px] opacity-70">Direct ZIP/TAR upload</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('github')}
                  className={`p-4 text-left rounded-card border flex items-center gap-3 transition-colors ${
                    deliveryMethod === 'github'
                      ? 'border-white bg-surface-2 text-white font-medium'
                      : 'border-line bg-surface text-muted'
                  }`}
                >
                  <Github className="w-5 h-5 text-[#60a5fa]" />
                  <div>
                    <span className="font-sans text-sm font-medium block">GitHub repository</span>
                    <span className="font-mono text-[11px] opacity-70">Collaborator invite</span>
                  </div>
                </button>
              </div>

              {/* Delivery Option A: Archive Upload */}
              {deliveryMethod === 'archive' && (
                <div className="space-y-3">
                  <label className="font-sans text-sm font-medium text-white block">
                    Upload source archive (.zip, .tar, .7z) <span className="text-[#ff2a2a]">*</span>
                  </label>
                  <div className="relative border border-dashed border-line hover:border-neutral-500 rounded-card p-8 text-center bg-surface-2/40">
                    <input
                      type="file"
                      accept=".zip,.tar,.tar.gz,.7z,.rar"
                      onChange={handleArchiveSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileArchive className="w-8 h-8 text-[#39ff14] mx-auto mb-2" />
                    <span className="font-sans text-sm font-medium text-white block">
                      {archiveFile ? archiveFile.name : 'Choose codebase archive'}
                    </span>
                    <span className="font-mono text-xs text-muted block mt-1">
                      {archiveFile
                        ? `Size: ${(archiveFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : 'Max size: 50 MB'}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted">
                    Stored in a secure private bucket. Download links are only generated after confirmed settlement.
                  </p>
                </div>
              )}

              {/* Inspected File Tree Viewer & Review (for archive or github) */}
              {fileTree.length > 0 && (
                <div className="p-4 rounded-card bg-surface-2 border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-red" />
                      <span className="font-sans text-xs font-semibold text-white">
                        Inspected File Tree ({fileTree.length} files detected)
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      Toggle to include/hide in public preview
                    </span>
                  </div>

                  <div
                    data-lenis-prevent
                    className="max-h-48 overflow-y-auto rounded-lg bg-black/50 border border-line/60 p-2 font-mono text-xs space-y-1 scrollbar-thin"
                  >
                    {fileTree.map((p) => {
                      const isIncluded = includedTreePaths.has(p);
                      return (
                        <label key={p} className="flex items-center gap-2 hover:bg-white/[0.04] p-1 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={(e) => {
                              const next = new Set(includedTreePaths);
                              if (e.target.checked) next.add(p);
                              else next.delete(p);
                              setIncludedTreePaths(next);
                            }}
                            className="w-3.5 h-3.5 accent-brand-red cursor-pointer"
                          />
                          <span className={`truncate text-[11px] ${isIncluded ? 'text-fg/90' : 'text-muted line-through'}`}>
                            {p}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Option B: GitHub Repo */}
              {deliveryMethod === 'github' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-sans text-sm font-medium text-white block">
                      GitHub repository (owner/repo or URL) <span className="text-[#ff2a2a]">*</span>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={githubRepoInput}
                        onChange={(e) => {
                          setGithubRepoInput(e.target.value);
                          setRepoValidatedInfo(null);
                          setRepoValidationError(null);
                        }}
                        placeholder="e.g. facebook/react or https://github.com/owner/repo"
                      />
                      <Button
                        variant="secondary"
                        size="md"
                        type="button"
                        onClick={verifyGithubRepo}
                        isLoading={isRepoValidating}
                      >
                        Verify
                      </Button>
                    </div>
                    {repoValidationError && (
                      <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{repoValidationError}</span>
                      </p>
                    )}
                    {repoValidatedInfo && (
                      <p className="font-sans text-xs text-[#39ff14] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Repository verified. Platform token has collaborator privileges.</span>
                      </p>
                    )}
                  </div>

                  {/* Private repo toggle */}
                  <div className="p-4 bg-surface-2 rounded-card border border-line space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-sans text-xs font-semibold text-white block">
                          Private repository
                        </span>
                        <span className="font-sans text-xs text-muted">
                          Requires collaborator invitation upon checkout
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isPrivateRepo}
                        onChange={(e) => setIsPrivateRepo(e.target.checked)}
                        className="w-4 h-4 accent-[#39ff14] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {stepErrors.delivery && (
                <p className="font-sans text-xs text-[#ff2a2a] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{stepErrors.delivery}</span>
                </p>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW & PUBLISH */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-line pb-4">
                <h2 className="font-display text-xl font-semibold text-white">Review & Buyer Preview</h2>
                <p className="font-sans text-xs text-muted mt-0.5">
                  Inspect how your dead project will look to scavengers on the marketplace.
                </p>
              </div>

              {/* Preview Card (Exact matching new ProjectCard) */}
              <div className="max-w-md mx-auto">
                <span className="font-mono text-xs text-muted uppercase tracking-wider block mb-3 text-center">
                  Buyer perspective preview
                </span>

                <div className="bg-surface rounded-card border border-line overflow-hidden shadow-2xl">
                  {/* Cover */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                    {coverPreview ? (
                      <img src={coverPreview} alt={`${title || 'Project'} cover image`} className="w-full h-full object-cover" />
                    ) : (
                      <CoverArt title={title || 'Untitled'} mode={interactionType} className="w-full h-full" />
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <ModeBadge mode={interactionType} />
                    </div>
                    {completionPercent != null && (
                      <div className="absolute top-3 right-3 z-10 font-mono text-[10px] text-white/90 px-2 py-0.5 rounded-full bg-black/80 border border-white/15 tabular-nums">
                        {completionPercent}% built
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-sans font-semibold text-xl text-white line-clamp-1">
                      {title || 'Untitled Project'}
                    </h3>

                    {/* Tagline */}
                    {tagline && (
                      <p className="font-sans text-xs font-medium text-fg/90 line-clamp-1">
                        {tagline}
                      </p>
                    )}

                    {/* Tombstone line */}
                    {previewTombstone && (
                      <p className="font-mono text-xs text-muted truncate">
                        {previewTombstone}
                      </p>
                    )}

                    {/* Epitaph quote if entered */}
                    {epitaph && (
                      <p className="font-serif italic text-sm text-white/90 bg-surface-2/60 p-2.5 rounded-lg border border-line">
                        &ldquo;{epitaph}&rdquo;
                      </p>
                    )}

                    <p className="font-sans text-xs text-fg/80 line-clamp-2">
                      {description || 'No description provided.'}
                    </p>

                    {/* Tech Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {techStack.map((tech) => (
                        <TechBadge key={tech} tech={tech} size="sm" />
                      ))}
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 border-t border-line flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar username={user?.username || 'you'} size={24} />
                        <span className="font-sans text-xs text-muted truncate max-w-[100px]">@{user?.username || 'you'}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-medium text-sm text-white">
                          {interactionType === 'buy'
                            ? formatINR(toPaise(priceRupees), { showFreeForZero: false })
                            : interactionType === 'adopt'
                            ? 'Free'
                            : collabTerms}
                        </span>
                        <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                          →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary checklist */}
              <div className="bg-surface-2 rounded-card border border-line p-5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Listing mode:</span>
                  <span className="text-white capitalize">{interactionType === 'adopt' ? 'Free Fork' : interactionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Price:</span>
                  <span className="text-white">
                    {interactionType === 'buy'
                      ? formatINR(toPaise(priceRupees), { showFreeForZero: false })
                      : 'Free'}
                  </span>
                </div>
                {linesOfCode && (
                  <div className="flex justify-between">
                    <span className="text-muted">Lines of code:</span>
                    <span className="text-white">{Number(linesOfCode).toLocaleString()}</span>
                  </div>
                )}
                {features.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Features specified:</span>
                    <span className="text-[#39ff14]">{features.length} listed</span>
                  </div>
                )}
                {todoItems.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Gaps/Todo specified:</span>
                    <span className="text-[#fbbf24]">{todoItems.length} listed</span>
                  </div>
                )}
                {screenshotFiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Screenshots attached:</span>
                    <span className="text-white">{screenshotFiles.length} images</span>
                  </div>
                )}
                {fileTree.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">File tree preview:</span>
                    <span className="text-white">{includedTreePaths.size} files included</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Cause of death:</span>
                  <span className="text-white">{CAUSE_OF_DEATH_LABELS[causeOfDeath]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery:</span>
                  <span className="text-white">
                    {deliveryMethod === 'archive'
                      ? archiveFile
                        ? `Archive (${(archiveFile.size / (1024 * 1024)).toFixed(1)} MB)`
                        : 'None'
                      : githubRepoInput || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Cause of death:</span>
                  <span className="text-white">{CAUSE_OF_DEATH_LABELS[causeOfDeath]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery:</span>
                  <span className="text-white">
                    {deliveryMethod === 'archive'
                      ? archiveFile
                        ? `Archive (${(archiveFile.size / (1024 * 1024)).toFixed(1)} MB)`
                        : 'None'
                      : githubRepoInput || 'None'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons (Sticky at bottom with safe area) */}
          <div className="sticky bottom-0 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-4 sm:p-6 bg-surface/95 backdrop-blur-md border-t border-line flex items-center justify-between gap-4 safe-pb z-20 rounded-b-card shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={handlePrevStep}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                variant="primary"
                mode="brand"
                size="md"
                type="button"
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                mode="buy"
                size="md"
                type="button"
                onClick={handlePublish}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Publish listing now
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
