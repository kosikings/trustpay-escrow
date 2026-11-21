'use client';

import React, { Suspense } from 'react';
import { DashboardRouter } from '@/components/DashboardRouter';

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#a1a1aa] text-sm">
          Loading projects...
        </div>
      }
    >
      <DashboardRouter />
    </Suspense>
  );
}
