'use client';

import React, { useEffect, useState } from 'react';
import { ReputationStats, ReputationTier } from '@/types';
import {
  calculateReputationTier,
  computeReputationStats,
  fetchReputationProfile,
  deriveDeterministicReputation,
} from '@/lib/api';

export { calculateReputationTier, computeReputationStats };

export interface ReputationScorecardProps {
  address?: string;
  stats?: Partial<ReputationStats>;
  variant?: 'full' | 'compact' | 'badge-only';
  isTestnet?: boolean;
  className?: string;
}

export function ReputationTierBadge({
  tier,
  size = 'md',
  className = '',
}: {
  tier: ReputationTier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  }[size];

  const getTierStyles = (t: ReputationTier) => {
    switch (t) {
      case 'Gold':
        return {
          container:
            'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 text-amber-300 border-amber-400/40 shadow-amber-500/10',
          icon: '🏆',
          label: 'Gold Tier',
          glow: 'bg-amber-400',
        };
      case 'Silver':
        return {
          container:
            'bg-gradient-to-r from-slate-400/20 via-zinc-400/10 to-slate-500/20 text-slate-200 border-slate-400/40 shadow-slate-400/10',
          icon: '🥈',
          label: 'Silver Tier',
          glow: 'bg-slate-300',
        };
      case 'Bronze':
        return {
          container:
            'bg-gradient-to-r from-amber-800/25 via-orange-900/15 to-amber-700/25 text-amber-400 border-amber-600/40 shadow-amber-700/10',
          icon: '🥉',
          label: 'Bronze Tier',
          glow: 'bg-amber-600',
        };
      case 'Verified Newcomer':
      default:
        return {
          container:
            'bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-cyan-600/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10',
          icon: '✨',
          label: 'Verified Newcomer',
          glow: 'bg-cyan-400',
        };
    }
  };

  const style = getTierStyles(tier);

  return (
    <span
      data-testid="reputation-tier-badge"
      className={`inline-flex items-center font-bold rounded-full border shadow-sm backdrop-blur-sm transition-all ${sizeClasses} ${style.container} ${className}`}
    >
      <span className="shrink-0">{style.icon}</span>
      <span>{style.label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${style.glow} animate-pulse shrink-0`} />
    </span>
  );
}

export function ReputationScorecard({
  address = 'GAUBK...NLSGV',
  stats: initialStats,
  variant = 'full',
  isTestnet = true,
  className = '',
}: ReputationScorecardProps) {
  const [data, setData] = useState<ReputationStats>(() => {
    if (initialStats && initialStats.tier) {
      return initialStats as ReputationStats;
    }
    if (initialStats && initialStats.completed_escrows !== undefined) {
      return computeReputationStats({
        address,
        completed_escrows: initialStats.completed_escrows ?? 0,
        disputed_escrows: initialStats.disputed_escrows ?? 0,
        total_escrows: initialStats.total_escrows,
        total_volume_usdc: initialStats.total_volume_usdc,
        avg_approval_time_hours: initialStats.avg_approval_time_hours,
        isTestnet,
      });
    }
    return deriveDeterministicReputation(address, isTestnet);
  });

  useEffect(() => {
    if (initialStats) {
      if (initialStats.tier) {
        setData(initialStats as ReputationStats);
      } else if (initialStats.completed_escrows !== undefined) {
        setData(
          computeReputationStats({
            address,
            completed_escrows: initialStats.completed_escrows ?? 0,
            disputed_escrows: initialStats.disputed_escrows ?? 0,
            total_escrows: initialStats.total_escrows,
            total_volume_usdc: initialStats.total_volume_usdc,
            avg_approval_time_hours: initialStats.avg_approval_time_hours,
            isTestnet,
          })
        );
      }
      return;
    }

    let isMounted = true;
    fetchReputationProfile(address, isTestnet).then((res) => {
      if (isMounted) setData(res);
    });
    return () => {
      isMounted = false;
    };
  }, [address, initialStats, isTestnet]);

  const network = isTestnet ? 'testnet' : 'public';
  const explorerUrl =
    data.historical_transactions_url ||
    `https://stellar.expert/explorer/${network}/account/${data.address}`;

  // 1. Badge-only variant
  if (variant === 'badge-only') {
    return <ReputationTierBadge tier={data.tier} className={className} />;
  }

  // 2. Compact variant (Ideal for applicant cards & quick overview bars)
  if (variant === 'compact') {
    return (
      <div
        data-testid="reputation-scorecard-compact"
        className={`bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Reputation:</span>
            <ReputationTierBadge tier={data.tier} size="sm" />
          </div>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono hover:underline flex items-center gap-1"
            title="Verify historical contract interactions on Stellar Expert"
          >
            <span>🔗 On-Chain History</span>
            <span>↗</span>
          </a>
        </div>

        {/* Warning Banner for Elevated Dispute Ratios (>20%) */}
        {(data.dispute_rate > 20 || data.has_high_dispute_warning) && (
          <div
            data-testid="dispute-warning-banner"
            className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2"
          >
            <span className="text-base shrink-0">⚠️</span>
            <p className="leading-tight">
              <strong>High Dispute Warning:</strong> This counterparty has an elevated dispute ratio of{' '}
              <span className="font-bold underline text-amber-200">{data.dispute_rate}%</span> (&gt;20%).
              Exercise caution before escrow agreement.
            </p>
          </div>
        )}

        {/* Verified metrics row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Completed</span>
            <span className="font-semibold text-emerald-400">{data.completed_escrows} Escrows</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">({data.completion_rate}%)</span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Dispute-Free</span>
            <span className={`font-semibold ${data.dispute_rate > 20 ? 'text-amber-400' : 'text-blue-400'}`}>
              {data.dispute_free_ratio}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {data.disputed_escrows > 0 ? `${data.disputed_escrows} disputes` : '0 disputes'}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Turnaround</span>
            <span className="font-semibold text-indigo-400">
              {data.avg_turnaround_days ? `${data.avg_turnaround_days}d avg` : `${data.avg_approval_time_hours}h`}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ${Number(data.total_volume_usdc).toLocaleString()} USDC
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Full scorecard variant
  return (
    <div
      data-testid="reputation-scorecard"
      className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h3 className="text-lg font-bold text-white tracking-tight">Trust & Reputation Profile</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
              <span>✓</span> On-Chain Verified
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Calculated from historical Stellar Soroban milestone settlement and escrow release data.
          </p>
        </div>

        <div className="self-start sm:self-center">
          <ReputationTierBadge tier={data.tier} size="lg" />
        </div>
      </div>

      {/* Warning Banner for Elevated Dispute Ratios (>20%) */}
      {(data.dispute_rate > 20 || data.has_high_dispute_warning) && (
        <div
          data-testid="dispute-warning-banner"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg"
        >
          <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 text-lg shrink-0">
            ⚠️
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">
              Warning: Elevated Dispute Ratio Detected ({data.dispute_rate}%)
            </h4>
            <p className="text-amber-200/80 text-xs leading-relaxed">
              This counterparty has a dispute frequency exceeding the 20% safety threshold ({data.disputed_escrows} disputes out of {data.total_escrows} escrows). Historical settlement records indicate a higher arbitration frequency. Exercise caution and utilize multi-stage milestones before initiating high-value contracts.
            </p>
          </div>
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Completed Escrows & Completion Rate */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Completed Escrows
          </span>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {data.completed_escrows}
          </div>
          <p className="text-xs text-slate-400">
            Completion Rate: <span className="text-emerald-300 font-semibold">{data.completion_rate}%</span>
          </p>
        </div>

        {/* Metric 2: Dispute-Free Ratio */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Dispute-Free Ratio
          </span>
          <div
            className={`text-2xl font-black tracking-tight ${
              data.dispute_rate > 20 ? 'text-amber-400' : 'text-blue-400'
            }`}
          >
            {data.dispute_free_ratio}%
          </div>
          <p className="text-xs text-slate-400">
            Dispute Freq: <span className="font-semibold">{data.dispute_rate}%</span> ({data.disputed_escrows} total)
          </p>
        </div>

        {/* Metric 3: Average Turnaround */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Avg Turnaround
          </span>
          <div className="text-2xl font-black text-indigo-400 tracking-tight">
            {data.avg_turnaround_days ? `${data.avg_turnaround_days}d` : `${data.avg_approval_time_hours}h`}
          </div>
          <p className="text-xs text-slate-400">
            Approval Time: <span className="text-indigo-300 font-semibold">{data.avg_approval_time_hours} hrs</span>
          </p>
        </div>

        {/* Metric 4: Total Volume Settled in USDC */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Volume Settled
          </span>
          <div className="text-2xl font-black text-white tracking-tight">
            ${Number(data.total_volume_usdc).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">
            Asset: <span className="text-slate-200 font-semibold">USDC (Stellar)</span>
          </p>
        </div>
      </div>

      {/* Footer Strip: On-chain Transaction Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            Counterparty: <code className="text-slate-300 font-mono text-[11px]">{data.address}</code>
          </span>
        </div>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl font-medium transition-colors"
        >
          <span>🔗 Verify On-Chain Transaction History</span>
          <span>↗</span>
        </a>
      </div>
    </div>
  );
}
