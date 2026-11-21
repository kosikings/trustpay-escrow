import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ProjectFilterBar } from './ProjectFilterBar';
import { useProjectFilters, DEFAULT_FILTERS, ProjectFilters } from '@/hooks/useProjectFilters';

// Mock Next.js navigation hooks
const mockReplace = vi.fn();
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => '/projects',
  useSearchParams: () => mockSearchParams,
}));

describe('ProjectFilterBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  function createMockFiltersState(overrideFilters: Partial<ProjectFilters> = {}) {
    const filters: ProjectFilters = {
      ...DEFAULT_FILTERS,
      ...overrideFilters,
    };

    const activeFilterCount =
      (filters.q ? 1 : 0) +
      filters.tokens.length +
      (filters.minBudget ? 1 : 0) +
      (filters.maxBudget ? 1 : 0) +
      (filters.yieldEnabled ? 1 : 0) +
      filters.tags.length;

    return {
      filters,
      searchInput: filters.q,
      setSearchInput: vi.fn(),
      dispatch: vi.fn(),
      setSearch: vi.fn(),
      toggleToken: vi.fn(),
      setTokens: vi.fn(),
      setBudgetRange: vi.fn(),
      setMinBudget: vi.fn(),
      setMaxBudget: vi.fn(),
      toggleYieldEnabled: vi.fn(),
      setYieldEnabled: vi.fn(),
      toggleTag: vi.fn(),
      setTags: vi.fn(),
      removeFilter: vi.fn(),
      clearAll: vi.fn(),
      activeFilterCount,
      hasActiveFilters: activeFilterCount > 0,
      filteredProjects: [],
    };
  }

  it('renders search input, filter toggle button, and basic structure', () => {
    const mockState = createMockFiltersState();
    render(<ProjectFilterBar filtersState={mockState} />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-filters-drawer')).toBeInTheDocument();
  });

  it('debounces search input by 300ms to eliminate redundant UI re-renders', async () => {
    vi.useFakeTimers();

    // Harness component using real useProjectFilters hook
    function TestSearchHarness() {
      const filtersState = useProjectFilters([]);
      return <ProjectFilterBar filtersState={filtersState} />;
    }

    render(<TestSearchHarness />);

    const searchInput = screen.getByTestId('search-input');

    // Type into search input
    fireEvent.change(searchInput, { target: { value: 'soroban' } });

    // Immediately, the input should display the typed text
    expect(searchInput).toHaveValue('soroban');

    // Before 300ms, router.replace should not have been called with debounced query
    expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining('q=soroban'), expect.anything());

    // Advance timers by 299ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining('q=soroban'), expect.anything());

    // Advance past 300ms
    act(() => {
      vi.advanceTimersByTime(10);
    });

    // Debounced URL query sync fired!
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('q=soroban'),
      expect.objectContaining({ scroll: false })
    );

    vi.useRealTimers();
  });

  it('toggles token checkboxes when clicking token checkboxes', () => {
    const mockState = createMockFiltersState({ tokens: ['USDC'] });
    render(<ProjectFilterBar filtersState={mockState} />);

    // Open drawer
    fireEvent.click(screen.getByTestId('toggle-filters-drawer'));

    // Check USDC is checked
    const usdcCheckbox = screen.getByTestId('token-checkbox-usdc') as HTMLInputElement;
    expect(usdcCheckbox.checked).toBe(true);

    // Click XLM checkbox
    const xlmCheckbox = screen.getByTestId('token-checkbox-xlm');
    fireEvent.click(xlmCheckbox);

    expect(mockState.toggleToken).toHaveBeenCalledWith('XLM');
  });

  it('verifies budget range slider rendering and budget update call', () => {
    const mockState = createMockFiltersState({ maxBudget: 10000 });
    render(<ProjectFilterBar filtersState={mockState} />);

    // Open drawer
    fireEvent.click(screen.getByTestId('toggle-filters-drawer'));

    const slider = screen.getByTestId('budget-range-slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('10000');

    // Update budget slider to 15000
    fireEvent.change(slider, { target: { value: '15000' } });
    expect(mockState.setMaxBudget).toHaveBeenCalledWith(15000);
  });

  it('verifies numeric min and max budget inputs', () => {
    const mockState = createMockFiltersState();
    render(<ProjectFilterBar filtersState={mockState} />);

    // Open drawer
    fireEvent.click(screen.getByTestId('toggle-filters-drawer'));

    const minInput = screen.getByTestId('min-budget-input');
    fireEvent.change(minInput, { target: { value: '500' } });
    expect(mockState.setMinBudget).toHaveBeenCalledWith(500);

    const maxInput = screen.getByTestId('max-budget-input');
    fireEvent.change(maxInput, { target: { value: '8000' } });
    expect(mockState.setMaxBudget).toHaveBeenCalledWith(8000);
  });

  it('toggles yield enabled checkbox', () => {
    const mockState = createMockFiltersState({ yieldEnabled: false });
    render(<ProjectFilterBar filtersState={mockState} />);

    // Open drawer
    fireEvent.click(screen.getByTestId('toggle-filters-drawer'));

    const yieldCheckbox = screen.getByTestId('yield-enabled-checkbox');
    fireEvent.click(yieldCheckbox);
    expect(mockState.toggleYieldEnabled).toHaveBeenCalled();
  });

  it('toggles tags when clicking tag pills', () => {
    const mockState = createMockFiltersState({ tags: ['Rust'] });
    render(<ProjectFilterBar filtersState={mockState} availableTags={['Rust', 'Soroban', 'Frontend']} />);

    // Open drawer
    fireEvent.click(screen.getByTestId('toggle-filters-drawer'));

    const sorobanPill = screen.getByTestId('tag-pill-soroban');
    fireEvent.click(sorobanPill);
    expect(mockState.toggleTag).toHaveBeenCalledWith('Soroban');
  });

  it('displays active filter chips with 1-click removal and Clear All button', () => {
    const mockState = createMockFiltersState({
      q: 'audit',
      tokens: ['USDC'],
      minBudget: 1000,
      maxBudget: 5000,
      yieldEnabled: true,
      tags: ['Security'],
    });

    render(<ProjectFilterBar filtersState={mockState} totalResultsCount={3} />);

    // Active chips container should be visible
    expect(screen.getByTestId('active-filter-chips-container')).toBeInTheDocument();

    // Verify chips are rendered
    expect(screen.getByTestId('filter-chip-q')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-token-usdc')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-budget')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-yield')).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-tag-security')).toBeInTheDocument();

    // 1-click removal of search chip
    fireEvent.click(screen.getByTestId('remove-chip-q'));
    expect(mockState.removeFilter).toHaveBeenCalledWith('q');

    // 1-click removal of token chip
    fireEvent.click(screen.getByTestId('remove-chip-token-usdc'));
    expect(mockState.removeFilter).toHaveBeenCalledWith('tokens', 'USDC');

    // 1-click removal of budget chip
    fireEvent.click(screen.getByTestId('remove-chip-budget'));
    expect(mockState.removeFilter).toHaveBeenCalledWith('minBudget');
    expect(mockState.removeFilter).toHaveBeenCalledWith('maxBudget');

    // 1-click removal of yield chip
    fireEvent.click(screen.getByTestId('remove-chip-yield'));
    expect(mockState.removeFilter).toHaveBeenCalledWith('yieldEnabled');

    // 1-click removal of tag chip
    fireEvent.click(screen.getByTestId('remove-chip-tag-security'));
    expect(mockState.removeFilter).toHaveBeenCalledWith('tags', 'Security');

    // Clear All button
    const clearAllButton = screen.getByTestId('clear-all-filters');
    expect(clearAllButton).toBeInTheDocument();
    fireEvent.click(clearAllButton);
    expect(mockState.clearAll).toHaveBeenCalled();
  });

  it('hides active filter chips and Clear All button when no filters are active', () => {
    const mockState = createMockFiltersState();
    render(<ProjectFilterBar filtersState={mockState} />);

    expect(screen.queryByTestId('active-filter-chips-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('clear-all-filters')).not.toBeInTheDocument();
  });
});
