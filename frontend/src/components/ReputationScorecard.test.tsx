import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import {
  ReputationScorecard,
  ReputationTierBadge,
  calculateReputationTier,
  computeReputationStats,
} from './ReputationScorecard';
import { ReputationStats } from '@/types';

describe('Reputation Tier Calculation Logic', () => {
  it('correctly calculates Gold Tier for counterparties with 10+ completed escrows, >=95% completion, and <=5% disputes', () => {
    // 15 completed, 0 disputes (100% completion, 0% dispute)
    expect(
      calculateReputationTier({
        completed_escrows: 15,
        total_escrows: 15,
        disputed_escrows: 0,
      })
    ).toBe('Gold');

    // 19 completed, 1 dispute (20 total: 95% completion, 5% dispute)
    expect(
      calculateReputationTier({
        completed_escrows: 19,
        total_escrows: 20,
        disputed_escrows: 1,
      })
    ).toBe('Gold');

    // 10 completed, 0 disputes
    expect(
      calculateReputationTier({
        completed_escrows: 10,
        disputed_escrows: 0,
      })
    ).toBe('Gold');
  });

  it('correctly calculates Silver Tier for counterparties with 5+ completed escrows, >=85% completion, and <=10% disputes', () => {
    // 8 completed, 0 disputes
    expect(
      calculateReputationTier({
        completed_escrows: 8,
        disputed_escrows: 0,
      })
    ).toBe('Silver');

    // 9 completed, 1 dispute (10 total: 90% completion, 10% dispute)
    expect(
      calculateReputationTier({
        completed_escrows: 9,
        total_escrows: 10,
        disputed_escrows: 1,
      })
    ).toBe('Silver');

    // 5 completed, 0 disputes
    expect(
      calculateReputationTier({
        completed_escrows: 5,
        disputed_escrows: 0,
      })
    ).toBe('Silver');
  });

  it('correctly calculates Bronze Tier for counterparties with 3+ completed escrows and >=70% completion', () => {
    // 4 completed, 0 disputes
    expect(
      calculateReputationTier({
        completed_escrows: 4,
        disputed_escrows: 0,
      })
    ).toBe('Bronze');

    // 3 completed, 1 dispute (4 total: 75% completion, 25% dispute)
    expect(
      calculateReputationTier({
        completed_escrows: 3,
        total_escrows: 4,
        disputed_escrows: 1,
      })
    ).toBe('Bronze');

    // 7 completed, 2 disputes (9 total: ~77.8% completion, 22.2% dispute)
    expect(
      calculateReputationTier({
        completed_escrows: 7,
        total_escrows: 9,
        disputed_escrows: 2,
      })
    ).toBe('Bronze');
  });

  it('correctly classifies counterparties with <3 completed escrows as Verified Newcomer', () => {
    // 0 completed escrows (brand new wallet)
    expect(
      calculateReputationTier({
        completed_escrows: 0,
        disputed_escrows: 0,
      })
    ).toBe('Verified Newcomer');

    // 1 completed escrow
    expect(
      calculateReputationTier({
        completed_escrows: 1,
        disputed_escrows: 0,
      })
    ).toBe('Verified Newcomer');

    // 2 completed escrows
    expect(
      calculateReputationTier({
        completed_escrows: 2,
        disputed_escrows: 0,
      })
    ).toBe('Verified Newcomer');
  });

  it('computes trust metrics including dispute-free ratio, completion rate, and flags elevated dispute warning when >20%', () => {
    // High dispute rate case: 3 disputes out of 10 escrows (30% dispute rate)
    const statsWithWarning = computeReputationStats({
      address: 'GDISPUTE_ADDRESS_123',
      completed_escrows: 7,
      disputed_escrows: 3,
      total_escrows: 10,
      total_volume_usdc: 10500,
      avg_approval_time_hours: 48,
    });

    expect(statsWithWarning.completion_rate).toBe(70);
    expect(statsWithWarning.dispute_rate).toBe(30);
    expect(statsWithWarning.dispute_free_ratio).toBe(70);
    expect(statsWithWarning.has_high_dispute_warning).toBe(true);
    expect(statsWithWarning.tier).toBe('Bronze');

    // Low dispute rate case: 0 disputes out of 12 escrows
    const healthyStats = computeReputationStats({
      address: 'GHEALTHY_ADDRESS_456',
      completed_escrows: 12,
      disputed_escrows: 0,
      total_escrows: 12,
      total_volume_usdc: 24000,
      avg_approval_time_hours: 24,
    });

    expect(healthyStats.completion_rate).toBe(100);
    expect(healthyStats.dispute_rate).toBe(0);
    expect(healthyStats.dispute_free_ratio).toBe(100);
    expect(healthyStats.has_high_dispute_warning).toBe(false);
    expect(healthyStats.tier).toBe('Gold');
  });
});

describe('ReputationTierBadge Component', () => {
  it('renders Gold Tier badge with correct icon and text', () => {
    render(<ReputationTierBadge tier="Gold" />);
    expect(screen.getByTestId('reputation-tier-badge')).toHaveTextContent('Gold Tier');
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders Silver Tier badge with correct icon and text', () => {
    render(<ReputationTierBadge tier="Silver" />);
    expect(screen.getByTestId('reputation-tier-badge')).toHaveTextContent('Silver Tier');
    expect(screen.getByText('🥈')).toBeInTheDocument();
  });

  it('renders Bronze Tier badge with correct icon and text', () => {
    render(<ReputationTierBadge tier="Bronze" />);
    expect(screen.getByTestId('reputation-tier-badge')).toHaveTextContent('Bronze Tier');
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('renders Verified Newcomer badge with correct icon and text', () => {
    render(<ReputationTierBadge tier="Verified Newcomer" />);
    expect(screen.getByTestId('reputation-tier-badge')).toHaveTextContent('Verified Newcomer');
    expect(screen.getByText('✨')).toBeInTheDocument();
  });
});

describe('ReputationScorecard Component', () => {
  const mockHealthyStats: ReputationStats = {
    address: 'GAUBK6P5Z7I7ZXZZ6D7XQWJ7M2U3H7T5W7O6X7Y8Z9A1B2C3D4E5F6G7',
    total_escrows: 15,
    completed_escrows: 15,
    disputed_escrows: 0,
    completion_rate: 100,
    dispute_rate: 0,
    dispute_free_ratio: 100,
    avg_approval_time_hours: 24,
    avg_turnaround_days: 1,
    total_volume_usdc: 25000,
    tier: 'Gold',
    has_high_dispute_warning: false,
    historical_transactions_url:
      'https://stellar.expert/explorer/testnet/account/GAUBK6P5Z7I7ZXZZ6D7XQWJ7M2U3H7T5W7O6X7Y8Z9A1B2C3D4E5F6G7',
    contract_interactions_count: 15,
  };

  const mockDisputeStats: ReputationStats = {
    address: 'GWARN6P5Z7I7ZXZZ6D7XQWJ7M2U3H7T5W7O6X7Y8Z9A1B2C3D4E5F6G7',
    total_escrows: 10,
    completed_escrows: 7,
    disputed_escrows: 3,
    completion_rate: 70,
    dispute_rate: 30, // >20%
    dispute_free_ratio: 70,
    avg_approval_time_hours: 60,
    avg_turnaround_days: 2.5,
    total_volume_usdc: 8500,
    tier: 'Bronze',
    has_high_dispute_warning: true,
    historical_transactions_url:
      'https://stellar.expert/explorer/testnet/account/GWARN6P5Z7I7ZXZZ6D7XQWJ7M2U3H7T5W7O6X7Y8Z9A1B2C3D4E5F6G7',
    contract_interactions_count: 10,
  };

  it('renders verified metrics: Completed Escrows, Dispute-Free Ratio, and Average Turnaround', () => {
    render(<ReputationScorecard stats={mockHealthyStats} variant="full" />);

    expect(screen.getByText('Completed Escrows')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Dispute-Free Ratio')).toBeInTheDocument();
    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Avg Turnaround')).toBeInTheDocument();
    expect(screen.getByText('1d')).toBeInTheDocument();
    expect(screen.getByText('$25,000')).toBeInTheDocument();
  });

  it('renders on-chain transaction history link verifying contract interactions', () => {
    render(<ReputationScorecard stats={mockHealthyStats} variant="full" />);

    const link = screen.getByRole('link', { name: /verify on-chain transaction history/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/testnet/account/GAUBK6P5Z7I7ZXZZ6D7XQWJ7M2U3H7T5W7O6X7Y8Z9A1B2C3D4E5F6G7'
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders warning banner for addresses with elevated dispute ratios (>20%)', () => {
    render(<ReputationScorecard stats={mockDisputeStats} variant="full" />);

    expect(screen.getByTestId('dispute-warning-banner')).toBeInTheDocument();
    expect(
      screen.getByText(/Warning: Elevated Dispute Ratio Detected \(30%\)/i)
    ).toBeInTheDocument();
  });

  it('does NOT render warning banner when dispute ratio is <= 20%', () => {
    render(<ReputationScorecard stats={mockHealthyStats} variant="full" />);

    expect(screen.queryByTestId('dispute-warning-banner')).not.toBeInTheDocument();
  });

  it('renders compact scorecard variant with warning banner when dispute ratio >20%', () => {
    render(<ReputationScorecard stats={mockDisputeStats} variant="compact" />);

    expect(screen.getByTestId('reputation-scorecard-compact')).toBeInTheDocument();
    expect(screen.getByTestId('dispute-warning-banner')).toBeInTheDocument();
    expect(screen.getByText(/High Dispute Warning/i)).toBeInTheDocument();
    expect(screen.getByText('7 Escrows')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });
});
