'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { InteractionType, CANONICAL_TECHS } from '@/types/project';
import { cn } from '@/lib/utils';

export type SortOption = 'newest' | 'views' | 'price_asc' | 'price_desc' | 'longest_dead';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeMode: InteractionType | 'all';
  setActiveMode: (mode: InteractionType | 'all') => void;
  selectedTechs: string[];
  setSelectedTechs: (techs: string[]) => void;
  activeSort: SortOption;
  setActiveSort: (sort: SortOption) => void;
  includeResurrected: boolean;
  setIncludeResurrected: (val: boolean) => void;
  totalMatching: number;
  counts: {
    all: number;
    buy: number;
    adopt: number;
    collab: number;
  };
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  activeMode,
  setActiveMode,
  selectedTechs,
  setSelectedTechs,
  activeSort,
  setActiveSort,
  includeResurrected,
  setIncludeResurrected,
  totalMatching,
  counts,
  onClearFilters,
}) => {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isTechPopoverOpen, setIsTechPopoverOpen] = useState(false);
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false);
  const [techFilterSearch, setTechFilterSearch] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const techPopoverRef = useRef<HTMLDivElement>(null);
  const sortPopoverRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (techPopoverRef.current && !techPopoverRef.current.contains(event.target as Node)) {
        setIsTechPopoverOpen(false);
      }
      if (sortPopoverRef.current && !sortPopoverRef.current.contains(event.target as Node)) {
        setIsSortPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modeTabs: { id: InteractionType | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All projects', count: counts.all },
    { id: 'buy', label: 'For Sale', count: counts.buy },
    { id: 'adopt', label: 'Free Fork', count: counts.adopt },
    { id: 'collab', label: 'Seeking Partner', count: counts.collab },
  ];

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'newest', label: 'Newest listed' },
    { id: 'views', label: 'Most viewed' },
    { id: 'price_asc', label: 'Price: Low to high' },
    { id: 'price_desc', label: 'Price: High to low' },
    { id: 'longest_dead', label: 'Longest dead' },
  ];

  const toggleTech = (tech: string) => {
    if (selectedTechs.includes(tech)) {
      setSelectedTechs(selectedTechs.filter((t) => t !== tech));
    } else {
      setSelectedTechs([...selectedTechs, tech]);
    }
  };

  const filteredCanonicalTechs = CANONICAL_TECHS.filter((t) =>
    t.toLowerCase().includes(techFilterSearch.toLowerCase())
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    activeMode !== 'all' ||
    selectedTechs.length > 0 ||
    includeResurrected;

  return (
    <div className="sticky top-[60px] md:top-[68px] z-30 w-full bg-[#0a0a0b]/95 border-b border-line py-3.5 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Filter Bar Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Mode Segmented Control with sliding indicator */}
          <div className="hidden lg:flex items-center p-1 rounded-full bg-surface-2 border border-line">
            {modeTabs.map((tab) => {
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMode(tab.id)}
                  className={cn(
                    'relative px-4 py-1.5 rounded-full text-xs font-sans font-medium transition-colors select-none flex items-center gap-1.5',
                    isActive ? 'text-black' : 'text-muted hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterMode"
                      className="absolute inset-0 bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={cn(
                      'relative z-10 font-mono text-[10px] px-1.5 py-0.2 rounded-full',
                      isActive ? 'bg-black/15 text-black font-bold' : 'bg-surface-3 text-muted'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search, Tech Popover, Sort, and Resurrected toggle */}
          <div className="flex items-center gap-2.5 flex-1 lg:flex-none justify-end">
            {/* Search Input */}
            <div className="relative min-w-[180px] sm:min-w-[240px] flex-1 sm:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-9 rounded-full bg-surface-2 border border-line text-xs font-sans text-fg placeholder:text-muted focus:border-white focus:outline-none transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted border border-line px-1 rounded bg-surface">
                  /
                </kbd>
              )}
            </div>

            {/* Tech Stack Popover Button */}
            <div className="relative hidden sm:block" ref={techPopoverRef}>
              <button
                type="button"
                onClick={() => setIsTechPopoverOpen(!isTechPopoverOpen)}
                className={cn(
                  'h-10 px-4 rounded-full border text-xs font-sans font-medium flex items-center gap-2 transition-colors select-none',
                  selectedTechs.length > 0
                    ? 'bg-surface-2 border-white/40 text-white'
                    : 'bg-surface-2 border-line text-muted hover:text-white hover:border-white/20'
                )}
              >
                <span>Tech stack</span>
                {selectedTechs.length > 0 && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-white text-black font-bold">
                    {selectedTechs.length}
                  </span>
                )}
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isTechPopoverOpen && 'rotate-180')} />
              </button>

              {/* Tech Popover Menu */}
              {isTechPopoverOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-line p-3 shadow-2xl z-dropdown animate-in fade-in zoom-in-95 duration-150">
                  <div className="pb-2 border-b border-line flex items-center justify-between mb-2">
                    <span className="text-xs font-sans font-semibold text-white">Filter by tech</span>
                    {selectedTechs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTechs([])}
                        className="text-[11px] font-mono text-muted hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Search techs..."
                    value={techFilterSearch}
                    onChange={(e) => setTechFilterSearch(e.target.value)}
                    className="w-full h-8 px-2.5 mb-2 rounded-lg bg-surface-2 border border-line text-xs font-sans text-fg placeholder:text-muted focus:outline-none"
                  />

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1" data-lenis-prevent>
                    {filteredCanonicalTechs.map((tech) => {
                      const isSelected = selectedTechs.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleTech(tech)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-sans text-left text-muted hover:text-white hover:bg-surface-2 transition-colors"
                        >
                          <span>{tech}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-neon-green" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Popover Button */}
            <div className="relative hidden sm:block" ref={sortPopoverRef}>
              <button
                type="button"
                onClick={() => setIsSortPopoverOpen(!isSortPopoverOpen)}
                className="h-10 px-4 rounded-full bg-surface-2 border border-line text-xs font-sans text-muted hover:text-white hover:border-white/20 flex items-center gap-2 transition-colors select-none"
              >
                <span>{sortOptions.find((s) => s.id === activeSort)?.label}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isSortPopoverOpen && 'rotate-180')} />
              </button>

              {isSortPopoverOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-surface border border-line p-2 shadow-2xl z-dropdown animate-in fade-in zoom-in-95 duration-150">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setActiveSort(opt.id);
                        setIsSortPopoverOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans text-left transition-colors',
                        activeSort === opt.id
                          ? 'bg-surface-2 text-white font-medium'
                          : 'text-muted hover:text-white hover:bg-surface-2'
                      )}
                    >
                      <span>{opt.label}</span>
                      {activeSort === opt.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Include Resurrected Toggle */}
            <button
              type="button"
              onClick={() => setIncludeResurrected(!includeResurrected)}
              className={cn(
                'hidden xl:flex items-center gap-2 h-10 px-3.5 rounded-full border text-xs font-sans transition-colors select-none',
                includeResurrected
                  ? 'bg-neon-green/10 border-neon-green/40 text-neon-green'
                  : 'bg-surface-2 border-line text-muted hover:text-white'
              )}
              title="Show sold and filled projects"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Include revived</span>
            </button>

            {/* Mobile Filters Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(true)}
              className="sm:hidden flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-surface-2 border border-line text-xs font-sans text-fg"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Bottom Status & Active Filter Chips */}
        <div className="flex items-center justify-between gap-3 text-xs text-muted flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-muted">
              Showing <strong className="text-white font-semibold">{totalMatching}</strong> {totalMatching === 1 ? 'project' : 'projects'}
            </span>

            {/* Active Tech Chips */}
            {selectedTechs.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-fg"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 text-[11px] font-sans text-brand-red hover:underline ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet */}
      {isMobileSheetOpen && (
        <div className="fixed inset-0 z-modal bg-black/80 backdrop-blur-sm flex items-end sm:hidden animate-in fade-in duration-200">
          <div
            className="w-full bg-surface border-t border-line rounded-t-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-semibold text-white">Filter & Sort</h3>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="p-1 rounded-full text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode selection */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-muted">Listing Type</span>
              <div className="grid grid-cols-2 gap-2">
                {modeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMode(tab.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-sans text-left flex justify-between items-center',
                      activeMode === tab.id
                        ? 'bg-white text-black border-white font-medium'
                        : 'bg-surface-2 border-line text-muted'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className="font-mono text-[10px]">{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Include Resurrected */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIncludeResurrected(!includeResurrected)}
                className={cn(
                  'w-full p-3 rounded-xl border text-xs font-sans flex items-center justify-between',
                  includeResurrected
                    ? 'bg-neon-green/10 border-neon-green/40 text-neon-green'
                    : 'bg-surface-2 border-line text-muted'
                )}
              >
                <span>Include revived codebases</span>
                <span className="font-mono font-bold">{includeResurrected ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Tech stack */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-muted">Technologies</span>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {CANONICAL_TECHS.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-mono border transition-colors',
                      selectedTechs.includes(tech)
                        ? 'bg-white text-black border-white'
                        : 'bg-surface-2 border-line text-muted'
                    )}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-muted">Sort By</span>
              <div className="grid grid-cols-1 gap-1.5">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveSort(opt.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-sans text-left flex justify-between items-center',
                      activeSort === opt.id
                        ? 'bg-surface-2 text-white border-white/30'
                        : 'bg-surface border-line text-muted'
                    )}
                  >
                    <span>{opt.label}</span>
                    {activeSort === opt.id && <Check className="w-4 h-4 text-neon-green" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(false)}
              className="w-full py-3 rounded-full bg-white text-black font-sans font-semibold text-sm"
            >
              Apply Filters ({totalMatching} results)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;