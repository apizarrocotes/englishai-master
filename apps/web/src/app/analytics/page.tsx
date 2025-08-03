'use client';

import React from 'react';
import PlatformDashboard from '../../components/analytics/PlatformDashboard';
import DebugAnalytics from '../../components/analytics/DebugAnalytics';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <DebugAnalytics />
      <PlatformDashboard />
    </div>
  );
}