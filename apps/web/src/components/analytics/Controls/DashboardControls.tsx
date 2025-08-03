import React from 'react';
import { RefreshCw, Download, Radio } from 'lucide-react';
import TimeRangeSelector from './TimeRangeSelector';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

const DashboardControls: React.FC = () => {
  const { 
    isLoading, 
    realTimeEnabled, 
    toggleRealTime, 
    refreshAllData, 
    exportData,
    lastUpdated 
  } = useAnalyticsStore();

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    exportData(format);
  };

  const handleRefresh = () => {
    refreshAllData();
  };

  const formatLastUpdated = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Left side - Title and last updated */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Platform Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {formatLastUpdated(lastUpdated)}
          </p>
        </div>

        {/* Right side - Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Time Range Selector */}
          <TimeRangeSelector />

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Real-time toggle */}
            <button
              onClick={toggleRealTime}
              className={`
                inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors duration-200
                ${
                  realTimeEnabled
                    ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }
              `}
              title={realTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
            >
              <Radio className={`h-4 w-4 mr-1 ${realTimeEnabled ? 'text-green-600' : ''}`} />
              Real-time
            </button>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Export dropdown */}
            <div className="relative inline-block text-left">
              <div className="group">
                <button
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  title="Export data"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>

                {/* Dropdown menu */}
                <div className="invisible group-hover:visible absolute right-0 z-10 mt-1 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardControls;