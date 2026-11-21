'use client';

import React, { useState } from 'react';
import { useProjectFilters, ProjectFilters } from '@/hooks/useProjectFilters';

export interface ProjectFilterBarProps {
  filtersState: ReturnType<typeof useProjectFilters>;
  availableTags?: string[];
  totalResultsCount?: number;
  className?: string;
}

const DEFAULT_SUPPORTED_TOKENS = ['USDC', 'XLM', 'EURC'];
const POPULAR_TAGS = [
  'Smart Contracts',
  'Soroban',
  'Rust',
  'Frontend',
  'React',
  'Security',
  'Design',
  'Auditing',
  'Backend',
  'Full Stack',
];

export function ProjectFilterBar({
  filtersState,
  availableTags = POPULAR_TAGS,
  totalResultsCount,
  className = '',
}: ProjectFilterBarProps) {
  const {
    filters,
    searchInput,
    setSearchInput,
    toggleToken,
    setBudgetRange,
    setMinBudget,
    setMaxBudget,
    toggleYieldEnabled,
    toggleTag,
    removeFilter,
    clearAll,
    activeFilterCount,
    hasActiveFilters,
  } = filtersState;

  const [isExpanded, setIsExpanded] = useState(false);
  const [sliderMax, setSliderMax] = useState<number>(filters.maxBudget || 25000);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderMax(val);
    setMaxBudget(val === 0 ? null : val);
  };

  return (
    <div className={`space-y-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl p-4 sm:p-5 shadow-xl text-white ${className}`}>
      {/* Top Search & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input with Debounce */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717a]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            role="searchbox"
            aria-label="Search projects"
            data-testid="search-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects by keyword, skills, title, or category..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#232326] border border-[#333338] focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-[#71717a] transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchInput && (
            <button
              type="button"
              data-testid="clear-search-input"
              aria-label="Clear search"
              onClick={() => {
                setSearchInput('');
                removeFilter('q');
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71717a] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Drawer Toggle & Clear All */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            data-testid="toggle-filters-drawer"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm ${
              isExpanded || hasActiveFilters
                ? 'bg-[#27272a] border-indigo-500/50 text-indigo-300'
                : 'bg-[#232326] border-[#333338] text-[#a1a1aa] hover:text-white hover:border-[#4b4b52]'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span
                data-testid="active-filter-badge"
                className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold"
              >
                {activeFilterCount}
              </span>
            )}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              data-testid="clear-all-filters"
              onClick={clearAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {isExpanded && (
        <div data-testid="advanced-filters-panel" className="pt-3 border-t border-[#27272a] space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Token Checkboxes */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider block">
                Settlement Token
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SUPPORTED_TOKENS.map((token) => {
                  const isChecked = filters.tokens.some((t) => t.toUpperCase() === token.toUpperCase());
                  return (
                    <label
                      key={token}
                      data-testid={`token-checkbox-label-${token.toLowerCase()}`}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold shadow-sm'
                          : 'bg-[#232326] border-[#333338] text-[#a1a1aa] hover:border-[#4b4b52] hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        data-testid={`token-checkbox-${token.toLowerCase()}`}
                        aria-label={`Filter by ${token}`}
                        checked={isChecked}
                        onChange={() => toggleToken(token)}
                        className="rounded border-[#3f3f46] bg-[#18181b] text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                      />
                      <span>{token}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 2. Budget Range Slider & Number Inputs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                  Budget Range (USDC)
                </label>
                <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                  {filters.minBudget ? `${filters.minBudget}` : '0'} – {filters.maxBudget ? `${filters.maxBudget}` : 'Any'}
                </span>
              </div>

              {/* Slider for Max Budget */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  role="slider"
                  aria-label="Budget Range Slider"
                  data-testid="budget-range-slider"
                  value={filters.maxBudget ?? sliderMax}
                  onChange={handleSliderChange}
                  className="w-full h-1.5 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Min & Max Numeric Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min budget"
                    aria-label="Min Budget"
                    data-testid="min-budget-input"
                    value={filters.minBudget ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      setMinBudget(val);
                    }}
                    className="w-full px-2.5 py-1.5 bg-[#232326] border border-[#333338] rounded-lg text-white text-xs placeholder-[#71717a] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max budget"
                    aria-label="Max Budget"
                    data-testid="max-budget-input"
                    value={filters.maxBudget ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      setMaxBudget(val);
                      if (val) setSliderMax(val);
                    }}
                    className="w-full px-2.5 py-1.5 bg-[#232326] border border-[#333338] rounded-lg text-white text-xs placeholder-[#71717a] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Quick Budget Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  data-testid="preset-under-1k"
                  onClick={() => setBudgetRange(null, 1000)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#27272a] hover:bg-[#323236] text-[#a1a1aa] hover:text-white"
                >
                  &lt; 1,000
                </button>
                <button
                  type="button"
                  data-testid="preset-1k-5k"
                  onClick={() => setBudgetRange(1000, 5000)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#27272a] hover:bg-[#323236] text-[#a1a1aa] hover:text-white"
                >
                  1K - 5K
                </button>
                <button
                  type="button"
                  data-testid="preset-5k-20k"
                  onClick={() => setBudgetRange(5000, 20000)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#27272a] hover:bg-[#323236] text-[#a1a1aa] hover:text-white"
                >
                  5K - 20K
                </button>
                <button
                  type="button"
                  data-testid="preset-20k-plus"
                  onClick={() => setBudgetRange(20000, null)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#27272a] hover:bg-[#323236] text-[#a1a1aa] hover:text-white"
                >
                  20K+
                </button>
              </div>
            </div>

            {/* 3. Yield Optimization Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider block">
                Features & Protocol
              </label>
              <label
                data-testid="yield-enabled-toggle-label"
                className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                  filters.yieldEnabled
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-[#232326] border-[#333338] text-[#a1a1aa] hover:border-[#4b4b52] hover:text-white'
                }`}
              >
                <input
                  type="checkbox"
                  role="checkbox"
                  aria-label="Yield Optimized (Blend APY)"
                  data-testid="yield-enabled-checkbox"
                  checked={filters.yieldEnabled}
                  onChange={toggleYieldEnabled}
                  className="mt-0.5 rounded border-[#3f3f46] bg-[#18181b] text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>Yield Optimized</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">
                      Blend APY
                    </span>
                  </div>
                  <p className="text-[10px] text-[#71717a] leading-tight">
                    Show only escrow listings that accrue lending yield while locked.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Tags / Skills Filter */}
          <div className="space-y-2 pt-2 border-t border-[#27272a]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                Filter by Skills & Tags
              </label>
              {filters.tags.length > 0 && (
                <button
                  type="button"
                  data-testid="clear-tags"
                  onClick={() => removeFilter('tags')}
                  className="text-[10px] text-[#71717a] hover:text-white underline"
                >
                  Clear tags ({filters.tags.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = filters.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    data-testid={`tag-pill-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-sm ring-1 ring-indigo-400'
                        : 'bg-[#232326] text-[#a1a1aa] hover:text-white hover:bg-[#2b2b30] border border-[#333338]'
                    }`}
                  >
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar with 1-Click Removal */}
      {hasActiveFilters && (
        <div data-testid="active-filter-chips-container" className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-[#71717a] font-semibold mr-1">Active Filters:</span>

          {/* Search Keyword Chip */}
          {filters.q.trim() && (
            <span
              data-testid="filter-chip-q"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#27272a] text-white border border-[#3f3f46] text-xs shadow-sm"
            >
              <span className="text-[#a1a1aa]">Keyword:</span>
              <span className="font-semibold text-indigo-300">"{filters.q}"</span>
              <button
                type="button"
                data-testid="remove-chip-q"
                aria-label={`Remove search filter for ${filters.q}`}
                onClick={() => {
                  setSearchInput('');
                  removeFilter('q');
                }}
                className="text-[#71717a] hover:text-white ml-0.5 rounded p-0.5 transition-colors"
              >
                ✕
              </button>
            </span>
          )}

          {/* Token Chips */}
          {filters.tokens.map((token) => (
            <span
              key={token}
              data-testid={`filter-chip-token-${token.toLowerCase()}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#27272a] text-white border border-[#3f3f46] text-xs shadow-sm"
            >
              <span className="text-[#a1a1aa]">Token:</span>
              <span className="font-semibold text-emerald-400">{token}</span>
              <button
                type="button"
                data-testid={`remove-chip-token-${token.toLowerCase()}`}
                aria-label={`Remove token filter for ${token}`}
                onClick={() => removeFilter('tokens', token)}
                className="text-[#71717a] hover:text-white ml-0.5 rounded p-0.5 transition-colors"
              >
                ✕
              </button>
            </span>
          ))}

          {/* Budget Range Chip */}
          {(filters.minBudget !== null || filters.maxBudget !== null) && (
            <span
              data-testid="filter-chip-budget"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#27272a] text-white border border-[#3f3f46] text-xs shadow-sm"
            >
              <span className="text-[#a1a1aa]">Budget:</span>
              <span className="font-semibold text-emerald-300 font-mono">
                {filters.minBudget ? `${filters.minBudget}` : '0'} – {filters.maxBudget ? `${filters.maxBudget}` : 'Any'}
              </span>
              <button
                type="button"
                data-testid="remove-chip-budget"
                aria-label="Remove budget filter"
                onClick={() => {
                  removeFilter('minBudget');
                  removeFilter('maxBudget');
                }}
                className="text-[#71717a] hover:text-white ml-0.5 rounded p-0.5 transition-colors"
              >
                ✕
              </button>
            </span>
          )}

          {/* Yield Enabled Chip */}
          {filters.yieldEnabled && (
            <span
              data-testid="filter-chip-yield"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#27272a] text-amber-300 border border-amber-500/30 text-xs shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Yield Enabled</span>
              <button
                type="button"
                data-testid="remove-chip-yield"
                aria-label="Remove yield filter"
                onClick={() => removeFilter('yieldEnabled')}
                className="text-amber-400/70 hover:text-amber-200 ml-0.5 rounded p-0.5 transition-colors"
              >
                ✕
              </button>
            </span>
          )}

          {/* Tag Chips */}
          {filters.tags.map((tag) => (
            <span
              key={tag}
              data-testid={`filter-chip-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#27272a] text-indigo-300 border border-indigo-500/30 text-xs shadow-sm"
            >
              <span className="text-[#a1a1aa]">Tag:</span>
              <span className="font-semibold">{tag}</span>
              <button
                type="button"
                data-testid={`remove-chip-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                aria-label={`Remove tag filter for ${tag}`}
                onClick={() => removeFilter('tags', tag)}
                className="text-[#71717a] hover:text-white ml-0.5 rounded p-0.5 transition-colors"
              >
                ✕
              </button>
            </span>
          ))}

          {/* Results Summary count */}
          {totalResultsCount !== undefined && (
            <span className="text-[11px] text-[#71717a] ml-auto">
              Found <strong className="text-white">{totalResultsCount}</strong> listing{totalResultsCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
