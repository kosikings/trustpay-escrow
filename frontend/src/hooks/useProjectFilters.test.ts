import { describe, it, expect, vi } from 'vitest';
import {
  projectFilterReducer,
  filterProjects,
  parseFiltersFromSearchParams,
  serializeFiltersToSearchParams,
  DEFAULT_FILTERS,
  ProjectFilters,
} from './useProjectFilters';
import { Project } from '@/types';

describe('useProjectFilters unit tests', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      title: 'Soroban Smart Contract Escrow',
      description: 'Build a decentralized escrow using Rust and Soroban',
      category: 'Smart Contracts',
      budget: 3500,
      token: 'USDC',
      status: 'open',
      yield_enabled: true,
      tags: ['Rust', 'Soroban', 'Security'],
    } as any,
    {
      id: 'proj-2',
      title: 'Next.js 16 Web3 Freelancer Dashboard',
      description: 'Implement responsive frontend dashboard with Tailwind CSS',
      category: 'Frontend',
      budget: 1800,
      token: 'XLM',
      status: 'open',
      yield_enabled: false,
      tags: ['React', 'Frontend', 'Next.js'],
    } as any,
    {
      id: 'proj-3',
      title: 'DeFi Liquidity Pool Security Audit',
      description: 'Full mathematical audit of AMM constant product pool',
      category: 'Auditing',
      budget: 12000,
      token: 'USDC',
      status: 'open',
      yield_enabled: true,
      tags: ['Auditing', 'Security', 'Rust'],
    } as any,
    {
      id: 'proj-4',
      title: 'Cross-Border EURC Remittance Interface',
      description: 'European settlement corridor UI connecting to Stellar anchors',
      category: 'Frontend',
      budget: 450,
      token: 'EURC',
      status: 'open',
      yield_enabled: false,
      tags: ['Frontend', 'Stellar'],
    } as any,
  ];

  describe('projectFilterReducer', () => {
    it('handles SET_SEARCH', () => {
      const state = projectFilterReducer(DEFAULT_FILTERS, {
        type: 'SET_SEARCH',
        payload: 'stellar',
      });
      expect(state.q).toBe('stellar');
    });

    it('handles SET_TOKENS and TOGGLE_TOKEN', () => {
      let state = projectFilterReducer(DEFAULT_FILTERS, {
        type: 'SET_TOKENS',
        payload: ['USDC'],
      });
      expect(state.tokens).toEqual(['USDC']);

      // Toggle XLM on
      state = projectFilterReducer(state, {
        type: 'TOGGLE_TOKEN',
        payload: 'XLM',
      });
      expect(state.tokens).toEqual(['USDC', 'XLM']);

      // Toggle USDC off
      state = projectFilterReducer(state, {
        type: 'TOGGLE_TOKEN',
        payload: 'USDC',
      });
      expect(state.tokens).toEqual(['XLM']);
    });

    it('handles SET_BUDGET_RANGE, SET_MIN_BUDGET, and SET_MAX_BUDGET', () => {
      let state = projectFilterReducer(DEFAULT_FILTERS, {
        type: 'SET_BUDGET_RANGE',
        payload: { minBudget: 500, maxBudget: 5000 },
      });
      expect(state.minBudget).toBe(500);
      expect(state.maxBudget).toBe(5000);

      state = projectFilterReducer(state, {
        type: 'SET_MIN_BUDGET',
        payload: 1000,
      });
      expect(state.minBudget).toBe(1000);

      state = projectFilterReducer(state, {
        type: 'SET_MAX_BUDGET',
        payload: 8000,
      });
      expect(state.maxBudget).toBe(8000);
    });

    it('handles SET_YIELD_ENABLED and TOGGLE_YIELD_ENABLED', () => {
      let state = projectFilterReducer(DEFAULT_FILTERS, {
        type: 'SET_YIELD_ENABLED',
        payload: true,
      });
      expect(state.yieldEnabled).toBe(true);

      state = projectFilterReducer(state, {
        type: 'TOGGLE_YIELD_ENABLED',
      });
      expect(state.yieldEnabled).toBe(false);
    });

    it('handles SET_TAGS and TOGGLE_TAG', () => {
      let state = projectFilterReducer(DEFAULT_FILTERS, {
        type: 'SET_TAGS',
        payload: ['Rust'],
      });
      expect(state.tags).toEqual(['Rust']);

      // Toggle Soroban on
      state = projectFilterReducer(state, {
        type: 'TOGGLE_TAG',
        payload: 'Soroban',
      });
      expect(state.tags).toEqual(['Rust', 'Soroban']);

      // Toggle Rust off
      state = projectFilterReducer(state, {
        type: 'TOGGLE_TAG',
        payload: 'Rust',
      });
      expect(state.tags).toEqual(['Soroban']);
    });

    it('handles REMOVE_FILTER for each individual filter key', () => {
      const activeState: ProjectFilters = {
        q: 'soroban',
        tokens: ['USDC', 'XLM'],
        minBudget: 500,
        maxBudget: 5000,
        yieldEnabled: true,
        tags: ['Rust', 'Frontend'],
      };

      // Remove search
      let state = projectFilterReducer(activeState, {
        type: 'REMOVE_FILTER',
        payload: { key: 'q' },
      });
      expect(state.q).toBe('');

      // Remove single token
      state = projectFilterReducer(state, {
        type: 'REMOVE_FILTER',
        payload: { key: 'tokens', value: 'USDC' },
      });
      expect(state.tokens).toEqual(['XLM']);

      // Remove minBudget
      state = projectFilterReducer(state, {
        type: 'REMOVE_FILTER',
        payload: { key: 'minBudget' },
      });
      expect(state.minBudget).toBeNull();

      // Remove maxBudget
      state = projectFilterReducer(state, {
        type: 'REMOVE_FILTER',
        payload: { key: 'maxBudget' },
      });
      expect(state.maxBudget).toBeNull();

      // Remove yieldEnabled
      state = projectFilterReducer(state, {
        type: 'REMOVE_FILTER',
        payload: { key: 'yieldEnabled' },
      });
      expect(state.yieldEnabled).toBe(false);

      // Remove single tag
      state = projectFilterReducer(state, {
        type: 'REMOVE_FILTER',
        payload: { key: 'tags', value: 'Rust' },
      });
      expect(state.tags).toEqual(['Frontend']);
    });

    it('handles RESET_FILTERS', () => {
      const activeState: ProjectFilters = {
        q: 'audit',
        tokens: ['USDC'],
        minBudget: 1000,
        maxBudget: 10000,
        yieldEnabled: true,
        tags: ['Security'],
      };

      const reset = projectFilterReducer(activeState, { type: 'RESET_FILTERS' });
      expect(reset).toEqual(DEFAULT_FILTERS);
    });

    it('handles SYNC_FROM_PARAMS', () => {
      const state = projectFilterReducer(DEFAULT_FILTERS, {
        type: 'SYNC_FROM_PARAMS',
        payload: {
          q: 'escrow',
          tokens: ['USDC', 'EURC'],
          minBudget: 200,
        },
      });
      expect(state.q).toBe('escrow');
      expect(state.tokens).toEqual(['USDC', 'EURC']);
      expect(state.minBudget).toBe(200);
      expect(state.yieldEnabled).toBe(false);
    });
  });

  describe('filterProjects matching multiple simultaneous criteria', () => {
    it('returns all projects when default filters are active', () => {
      const results = filterProjects(mockProjects, DEFAULT_FILTERS);
      expect(results).toHaveLength(4);
    });

    it('filters project list by search keyword', () => {
      const results = filterProjects(mockProjects, {
        ...DEFAULT_FILTERS,
        q: 'escrow',
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('proj-1');
    });

    it('filters project list by token (USDC/XLM/EURC)', () => {
      const usdcResults = filterProjects(mockProjects, {
        ...DEFAULT_FILTERS,
        tokens: ['USDC'],
      });
      expect(usdcResults).toHaveLength(2);
      expect(usdcResults.map((p) => p.id)).toEqual(['proj-1', 'proj-3']);

      const multiTokenResults = filterProjects(mockProjects, {
        ...DEFAULT_FILTERS,
        tokens: ['XLM', 'EURC'],
      });
      expect(multiTokenResults).toHaveLength(2);
      expect(multiTokenResults.map((p) => p.id)).toEqual(['proj-2', 'proj-4']);
    });

    it('filters project list by budget range (minBudget and maxBudget)', () => {
      const budgetResults = filterProjects(mockProjects, {
        ...DEFAULT_FILTERS,
        minBudget: 1000,
        maxBudget: 5000,
      });
      // proj-1 (3500) and proj-2 (1800) match
      expect(budgetResults).toHaveLength(2);
      expect(budgetResults.map((p) => p.id)).toEqual(['proj-1', 'proj-2']);
    });

    it('filters project list by yieldEnabled', () => {
      const yieldResults = filterProjects(mockProjects, {
        ...DEFAULT_FILTERS,
        yieldEnabled: true,
      });
      // proj-1 and proj-3 have yield_enabled = true
      expect(yieldResults).toHaveLength(2);
      expect(yieldResults.map((p) => p.id)).toEqual(['proj-1', 'proj-3']);
    });

    it('filters project list by tags', () => {
      const tagResults = filterProjects(mockProjects, {
        ...DEFAULT_FILTERS,
        tags: ['Security'],
      });
      // proj-1 and proj-3 have Security tag
      expect(tagResults).toHaveLength(2);
      expect(tagResults.map((p) => p.id)).toEqual(['proj-1', 'proj-3']);
    });

    it('matches projects against multiple simultaneous criteria (keyword + token + budget + yield + tags)', () => {
      const strictFilters: ProjectFilters = {
        q: 'smart contract',
        tokens: ['USDC'],
        minBudget: 2000,
        maxBudget: 5000,
        yieldEnabled: true,
        tags: ['Rust'],
      };

      const results = filterProjects(mockProjects, strictFilters);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('proj-1');
    });

    it('excludes projects if any one of simultaneous criteria fails', () => {
      // proj-1 matches keyword, token, budget, and yield, but fails tag 'Frontend'
      const failingTagFilters: ProjectFilters = {
        q: 'escrow',
        tokens: ['USDC'],
        minBudget: 1000,
        maxBudget: 5000,
        yieldEnabled: true,
        tags: ['Frontend'],
      };

      const results = filterProjects(mockProjects, failingTagFilters);
      expect(results).toHaveLength(0);
    });
  });

  describe('URL search parameter synchronization', () => {
    it('serializes active filters to URL search parameters correctly', () => {
      const filters: ProjectFilters = {
        q: 'soroban',
        tokens: ['USDC', 'XLM'],
        minBudget: 500,
        maxBudget: 10000,
        yieldEnabled: true,
        tags: ['Rust', 'Security'],
      };

      const params = serializeFiltersToSearchParams(filters);
      expect(params.get('q')).toBe('soroban');
      expect(params.get('token')).toBe('USDC,XLM');
      expect(params.get('minBudget')).toBe('500');
      expect(params.get('maxBudget')).toBe('10000');
      expect(params.get('yieldEnabled')).toBe('true');
      expect(params.get('tags')).toBe('Rust,Security');
    });

    it('omits default / empty filter parameters from URL query string', () => {
      const params = serializeFiltersToSearchParams(DEFAULT_FILTERS);
      expect(params.toString()).toBe('');
      expect(params.get('q')).toBeNull();
      expect(params.get('token')).toBeNull();
      expect(params.get('minBudget')).toBeNull();
      expect(params.get('maxBudget')).toBeNull();
      expect(params.get('yieldEnabled')).toBeNull();
      expect(params.get('tags')).toBeNull();
    });

    it('parses URL search parameters into ProjectFilters correctly', () => {
      const searchParams = new URLSearchParams(
        'q=audit&token=USDC,EURC&minBudget=1000&maxBudget=15000&yieldEnabled=true&tags=Auditing,Security'
      );

      const parsed = parseFiltersFromSearchParams(searchParams);
      expect(parsed.q).toBe('audit');
      expect(parsed.tokens).toEqual(['USDC', 'EURC']);
      expect(parsed.minBudget).toBe(1000);
      expect(parsed.maxBudget).toBe(15000);
      expect(parsed.yieldEnabled).toBe(true);
      expect(parsed.tags).toEqual(['Auditing', 'Security']);
    });

    it('verifies URL parameter synchronization when updating budget range slider', () => {
      const initialFilters: ProjectFilters = {
        ...DEFAULT_FILTERS,
        tokens: ['USDC'],
      };

      // 1. Initial serialization contains token but no budget params
      const initialParams = serializeFiltersToSearchParams(initialFilters);
      expect(initialParams.get('minBudget')).toBeNull();
      expect(initialParams.get('maxBudget')).toBeNull();

      // 2. User slides max budget slider to 7500
      const updatedMaxFilters = projectFilterReducer(initialFilters, {
        type: 'SET_MAX_BUDGET',
        payload: 7500,
      });
      const updatedMaxParams = serializeFiltersToSearchParams(updatedMaxFilters, initialParams);
      expect(updatedMaxParams.get('maxBudget')).toBe('7500');
      expect(updatedMaxParams.get('token')).toBe('USDC');

      // 3. User sets budget range: min 1500, max 7500
      const rangeFilters = projectFilterReducer(updatedMaxFilters, {
        type: 'SET_BUDGET_RANGE',
        payload: { minBudget: 1500, maxBudget: 7500 },
      });
      const rangeParams = serializeFiltersToSearchParams(rangeFilters);
      expect(rangeParams.get('minBudget')).toBe('1500');
      expect(rangeParams.get('maxBudget')).toBe('7500');

      // 4. Verify bidirectional parsing of budget range slider params
      const parsedRange = parseFiltersFromSearchParams(rangeParams);
      expect(parsedRange.minBudget).toBe(1500);
      expect(parsedRange.maxBudget).toBe(7500);
    });
  });
});
