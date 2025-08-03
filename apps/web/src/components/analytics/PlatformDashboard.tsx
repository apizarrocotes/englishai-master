import React, { useState } from 'react';
import DashboardControls from './Controls/DashboardControls';
import MetricsGrid from './MetricsCards/MetricsGrid';
import UserActivityChart from './Charts/UserActivityChart';
import FeatureUsageChart from './Charts/FeatureUsageChart';
import GeographicChart from './Charts/GeographicChart';
import DeviceAnalyticsChart from './Charts/DeviceAnalyticsChart';
import PerformanceChart from './Charts/PerformanceChart';
import RealTimeActivity from './Charts/RealTimeActivity';
import DetailedAnalytics from './DetailedAnalytics';
import FeatureUsageDetailedView from './FeatureUsageDetailedView';
import { useAnalyticsStore, useAnalyticsError } from '../../stores/analyticsStore';

const PlatformDashboard: React.FC = () => {
  const { refreshAllData, isLoading } = useAnalyticsStore();
  const error = useAnalyticsError();
  const [activeTab, setActiveTab] = useState<'overview' | 'feature-details'>('overview');

  // Initialize dashboard data on mount
  React.useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Error display component
  const ErrorBanner: React.FC<{ error: string }> = ({ error }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Error loading dashboard data
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          <div className="mt-3">
            <button
              onClick={() => refreshAllData()}
              className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors duration-200"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Controls */}
      <DashboardControls />

      {/* Navigation Tabs */}
      <div className="px-6 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Platform Overview
            </button>
            <button
              onClick={() => setActiveTab('feature-details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feature-details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Feature Usage Analysis
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Error Banner */}
        {error && <ErrorBanner error={error} />}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Cards */}
            <MetricsGrid />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* User Activity Chart */}
              <div className="lg:col-span-1">
                <UserActivityChart height={350} />
              </div>

              {/* Feature Usage Chart */}
              <div className="lg:col-span-1">
                <FeatureUsageChart height={350} />
              </div>
            </div>

            {/* Additional Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Geographic Analytics */}
              <div className="lg:col-span-1">
                <GeographicChart height={350} />
              </div>

              {/* Device Analytics */}
              <div className="lg:col-span-1">
                <DeviceAnalyticsChart height={350} />
              </div>
            </div>

            {/* Performance Metrics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Performance Metrics */}
              <div className="lg:col-span-1">
                <PerformanceChart height={350} />
              </div>

              {/* Real-time Activity */}
              <div className="lg:col-span-1">
                <RealTimeActivity height={350} />
              </div>
            </div>

            {/* Detailed Analytics */}
            <DetailedAnalytics />
          </>
        )}

        {activeTab === 'feature-details' && (
          <FeatureUsageDetailedView />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700">Loading analytics data...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformDashboard;