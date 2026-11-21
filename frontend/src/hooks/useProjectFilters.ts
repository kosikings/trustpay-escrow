import { useState, useEffect, useReducer, useTransition, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Project } from '@/types';

export interface ProjectFilters {
  q: string;
  tokens: string[]; // e.g. ['USDC', 'XLM', 'EURC']
  minBudget: number | null;
  maxBudget: number | null;
  yieldEnabled: boolean;
  tags: string[];
}

export const DEFAULT_FILTERS: ProjectFilters = {
  q: '',
  tokens: [],
  minBudget: null,
  maxBudget: null,
  yieldEnabled: false,
  tags: [],
};

export type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_TOKENS'; payload: string[] }
  | { type: 'TOGGLE_TOKEN'; payload: string }
  | { type: 'SET_BUDGET_RANGE'; payload: { minBudget: number | null; maxBudget: number | null } }
  | { type: 'SET_MIN_BUDGET'; payload: number | null }
  | { type: 'SET_MAX_BUDGET'; payload: number | null }
  | { type: 'SET_YIELD_ENABLED'; payload: boolean }
  | { type: 'TOGGLE_YIELD_ENABLED' }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'TOGGLE_TAG'; payload: string }
  | { type: 'REMOVE_FILTER'; payload: { key: keyof ProjectFilters; value?: string } }
  | { type: 'RESET_FILTERS' }
  | { type: 'SYNC_FROM_PARAMS'; payload: Partial<ProjectFilters> };

export function projectFilterReducer(state: ProjectFilters, action: FilterAction): ProjectFilters {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, q: action.payload };

    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };

    case 'TOGGLE_TOKEN': {
      const token = action.payload.toUpperCase();
      const exists = state.tokens.some((t) => t.toUpperCase() === token);
      const newTokens = exists
        ? state.tokens.filter((t) => t.toUpperCase() !== token)
        : [...state.tokens, action.payload];
      return { ...state, tokens: newTokens };
    }

    case 'SET_BUDGET_RANGE':
      return {
        ...state,
        minBudget: action.payload.minBudget,
        maxBudget: action.payload.maxBudget,
      };

    case 'SET_MIN_BUDGET':
      return { ...state, minBudget: action.payload };

    case 'SET_MAX_BUDGET':
      return { ...state, maxBudget: action.payload };

    case 'SET_YIELD_ENABLED':
      return { ...state, yieldEnabled: action.payload };

    case 'TOGGLE_YIELD_ENABLED':
      return { ...state, yieldEnabled: !state.yieldEnabled };

    case 'SET_TAGS':
      return { ...state, tags: action.payload };

    case 'TOGGLE_TAG': {
      const tag = action.payload.toLowerCase();
      const exists = state.tags.some((t) => t.toLowerCase() === tag);
      const newTags = exists
        ? state.tags.filter((t) => t.toLowerCase() !== tag)
        : [...state.tags, action.payload];
      return { ...state, tags: newTags };
    }

    case 'REMOVE_FILTER': {
      const { key, value } = action.payload;
      if (key === 'q') {
        return { ...state, q: '' };
      }
      if (key === 'tokens') {
        if (value) {
          const valUpper = value.toUpperCase();
          return { ...state, tokens: state.tokens.filter((t) => t.toUpperCase() !== valUpper) };
        }
        return { ...state, tokens: [] };
      }
      if (key === 'minBudget') {
        return { ...state, minBudget: null };
      }
      if (key === 'maxBudget') {
        return { ...state, maxBudget: null };
      }
      if (key === 'yieldEnabled') {
        return { ...state, yieldEnabled: false };
      }
      if (key === 'tags') {
        if (value) {
          const valLower = value.toLowerCase();
          return { ...state, tags: state.tags.filter((t) => t.toLowerCase() !== valLower) };
        }
        return { ...state, tags: [] };
      }
      return state;
    }

    case 'RESET_FILTERS':
      return { ...DEFAULT_FILTERS };

    case 'SYNC_FROM_PARAMS':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}

/**
 * Filter project list by search keyword, token (USDC/XLM/EURC), budget range, and tags
 */
export function filterProjects(projects: Project[], filters: ProjectFilters): Project[] {
  const query = filters.q.trim().toLowerCase();
  const selectedTokens = filters.tokens.map((t) => t.toUpperCase());
  const selectedTags = filters.tags.map((t) => t.toLowerCase());

  return projects.filter((project) => {
    // 1. Search keyword (matches title, description, category, or tags)
    if (query) {
      const titleMatch = (project.title || '').toLowerCase().includes(query);
      const descMatch = (project.description || '').toLowerCase().includes(query);
      const catMatch = (project.category || '').toLowerCase().includes(query);
      const projectTags: string[] = Array.isArray((project as any).tags) ? (project as any).tags : [];
      const tagsMatch = projectTags.some((t) => t.toLowerCase().includes(query));

      if (!titleMatch && !descMatch && !catMatch && !tagsMatch) {
        return false;
      }
    }

    // 2. Token checkbox filter (USDC, XLM, EURC, etc.)
    if (selectedTokens.length > 0) {
      const projectToken = (project.token || 'USDC').toUpperCase();
      if (!selectedTokens.includes(projectToken)) {
        return false;
      }
    }

    // 3. Min budget
    if (filters.minBudget !== null && filters.minBudget !== undefined && filters.minBudget > 0) {
      const budget = Number(project.budget) || 0;
      if (budget < filters.minBudget) {
        return false;
      }
    }

    // 4. Max budget
    if (filters.maxBudget !== null && filters.maxBudget !== undefined && filters.maxBudget > 0) {
      const budget = Number(project.budget) || 0;
      if (budget > filters.maxBudget) {
        return false;
      }
    }

    // 5. Yield Enabled filter
    if (filters.yieldEnabled) {
      if (!project.yield_enabled) {
        return false;
      }
    }

    // 6. Tags filter
    if (selectedTags.length > 0) {
      const projectTags: string[] = Array.isArray((project as any).tags)
        ? (project as any).tags.map((t: string) => t.toLowerCase())
        : [];
      const projectCategory = (project.category || '').toLowerCase();

      const hasMatchingTag = selectedTags.some(
        (st) => projectTags.includes(st) || projectCategory === st
      );

      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Parses URL search params into a ProjectFilters object
 */
export function parseFiltersFromSearchParams(
  searchParams: URLSearchParams | { get: (k: string) => string | null; getAll?: (k: string) => string[] } | null
): ProjectFilters {
  if (!searchParams) return { ...DEFAULT_FILTERS };

  const q = searchParams.get('q') || '';

  // Extract tokens: handle comma-separated (token=USDC,XLM) or multi-params (token=USDC&token=XLM)
  let tokens: string[] = [];
  if (typeof (searchParams as any).getAll === 'function') {
    const rawTokens = (searchParams as any).getAll('token');
    if (rawTokens.length > 0) {
      tokens = rawTokens.flatMap((t: string) => t.split(',')).map((t: string) => t.trim().toUpperCase()).filter(Boolean);
    }
  }
  if (tokens.length === 0) {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      tokens = tokenParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
    }
  }

  // Min and max budget
  const minBudgetRaw = searchParams.get('minBudget');
  const minBudget = minBudgetRaw !== null && !isNaN(Number(minBudgetRaw)) && Number(minBudgetRaw) >= 0
    ? Number(minBudgetRaw)
    : null;

  const maxBudgetRaw = searchParams.get('maxBudget');
  const maxBudget = maxBudgetRaw !== null && !isNaN(Number(maxBudgetRaw)) && Number(maxBudgetRaw) > 0
    ? Number(maxBudgetRaw)
    : null;

  // Yield enabled
  const yieldParam = searchParams.get('yieldEnabled');
  const yieldEnabled = yieldParam === 'true' || yieldParam === '1';

  // Tags: comma-separated or multi-params
  let tags: string[] = [];
  if (typeof (searchParams as any).getAll === 'function') {
    const rawTags = (searchParams as any).getAll('tags');
    if (rawTags.length > 0) {
      tags = rawTags.flatMap((t: string) => t.split(',')).map((t: string) => t.trim()).filter(Boolean);
    }
  }
  if (tags.length === 0) {
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  return {
    q,
    tokens: Array.from(new Set(tokens)),
    minBudget,
    maxBudget,
    yieldEnabled,
    tags: Array.from(new Set(tags)),
  };
}

/**
 * Serializes ProjectFilters object into URLSearchParams
 */
export function serializeFiltersToSearchParams(
  filters: ProjectFilters,
  baseParams?: URLSearchParams | null
): URLSearchParams {
  const params = new URLSearchParams(baseParams ? baseParams.toString() : '');

  // q
  if (filters.q.trim()) {
    params.set('q', filters.q.trim());
  } else {
    params.delete('q');
  }

  // token
  if (filters.tokens.length > 0) {
    params.set('token', filters.tokens.join(','));
  } else {
    params.delete('token');
  }

  // minBudget
  if (filters.minBudget !== null && filters.minBudget !== undefined && filters.minBudget > 0) {
    params.set('minBudget', filters.minBudget.toString());
  } else {
    params.delete('minBudget');
  }

  // maxBudget
  if (filters.maxBudget !== null && filters.maxBudget !== undefined && filters.maxBudget > 0) {
    params.set('maxBudget', filters.maxBudget.toString());
  } else {
    params.delete('maxBudget');
  }

  // yieldEnabled
  if (filters.yieldEnabled) {
    params.set('yieldEnabled', 'true');
  } else {
    params.delete('yieldEnabled');
  }

  // tags
  if (filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','));
  } else {
    params.delete('tags');
  }

  return params;
}

/**
 * Custom hook to manage project filters with debounced text search,
 * token checkboxes, budget sliders, tags, and bidirectional Next.js URL query sync.
 */
export function useProjectFilters(initialProjects: Project[] = []) {
  let router: any = null;
  let pathname = '';
  let searchParams: URLSearchParams = new URLSearchParams();

  try {
    router = useRouter();
    pathname = usePathname() || '/projects';
    const nextSearchParams = useSearchParams();
    if (nextSearchParams) {
      searchParams = new URLSearchParams(nextSearchParams.toString());
    }
  } catch {
    // Graceful fallback for non-Next router / test environments
    if (typeof window !== 'undefined' && window.location) {
      pathname = window.location.pathname || '/projects';
      searchParams = new URLSearchParams(window.location.search);
    }
  }

  const initialFilters = useMemo(() => {
    return parseFiltersFromSearchParams(searchParams);
  }, []);

  const [filters, dispatch] = useReducer(projectFilterReducer, initialFilters);
  const [searchInput, setSearchInput] = useState(filters.q);
  const [, startTransition] = useTransition();

  // Keep searchInput in sync if filters.q is changed externally (e.g. Clear All or URL change)
  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  // Debounce search input by 300ms to eliminate redundant UI re-renders and URL updates
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.q) {
        startTransition(() => {
          dispatch({ type: 'SET_SEARCH', payload: searchInput });
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, filters.q]);

  // Sync active filters to URL query parameters bidirectionally
  useEffect(() => {
    const serialized = serializeFiltersToSearchParams(filters, searchParams);
    const newQuery = serialized.toString();
    const currentQuery = searchParams.toString();

    if (newQuery !== currentQuery) {
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      if (router && typeof router.replace === 'function') {
        router.replace(newUrl, { scroll: false });
      } else if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [filters, pathname, router, searchParams]);

  // External URL changes (e.g. back/forward navigation or link click) sync to filters state
  useEffect(() => {
    const parsed = parseFiltersFromSearchParams(searchParams);
    const hasDiff =
      parsed.q !== filters.q ||
      parsed.tokens.join(',') !== filters.tokens.join(',') ||
      parsed.minBudget !== filters.minBudget ||
      parsed.maxBudget !== filters.maxBudget ||
      parsed.yieldEnabled !== filters.yieldEnabled ||
      parsed.tags.join(',') !== filters.tags.join(',');

    if (hasDiff) {
      dispatch({ type: 'SYNC_FROM_PARAMS', payload: parsed });
    }
  }, [searchParams]);

  // Action helpers
  const setSearch = useCallback((val: string) => {
    setSearchInput(val);
  }, []);

  const toggleToken = useCallback((token: string) => {
    dispatch({ type: 'TOGGLE_TOKEN', payload: token });
  }, []);

  const setTokens = useCallback((tokens: string[]) => {
    dispatch({ type: 'SET_TOKENS', payload: tokens });
  }, []);

  const setBudgetRange = useCallback((minBudget: number | null, maxBudget: number | null) => {
    dispatch({ type: 'SET_BUDGET_RANGE', payload: { minBudget, maxBudget } });
  }, []);

  const setMinBudget = useCallback((min: number | null) => {
    dispatch({ type: 'SET_MIN_BUDGET', payload: min });
  }, []);

  const setMaxBudget = useCallback((max: number | null) => {
    dispatch({ type: 'SET_MAX_BUDGET', payload: max });
  }, []);

  const toggleYieldEnabled = useCallback(() => {
    dispatch({ type: 'TOGGLE_YIELD_ENABLED' });
  }, []);

  const setYieldEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_YIELD_ENABLED', payload: enabled });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    dispatch({ type: 'TOGGLE_TAG', payload: tag });
  }, []);

  const setTags = useCallback((tags: string[]) => {
    dispatch({ type: 'SET_TAGS', payload: tags });
  }, []);

  const removeFilter = useCallback((key: keyof ProjectFilters, value?: string) => {
    dispatch({ type: 'REMOVE_FILTER', payload: { key, value } });
  }, []);

  const clearAll = useCallback(() => {
    setSearchInput('');
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  // Filtered projects memo
  const filteredProjects = useMemo(() => {
    return filterProjects(initialProjects, filters);
  }, [initialProjects, filters]);

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.q.trim()) count += 1;
    count += filters.tokens.length;
    if (filters.minBudget !== null && filters.minBudget > 0) count += 1;
    if (filters.maxBudget !== null && filters.maxBudget > 0) count += 1;
    if (filters.yieldEnabled) count += 1;
    count += filters.tags.length;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    searchInput,
    setSearchInput,
    dispatch,
    setSearch,
    toggleToken,
    setTokens,
    setBudgetRange,
    setMinBudget,
    setMaxBudget,
    toggleYieldEnabled,
    setYieldEnabled,
    toggleTag,
    setTags,
    removeFilter,
    clearAll,
    activeFilterCount,
    hasActiveFilters,
    filteredProjects,
  };
}
