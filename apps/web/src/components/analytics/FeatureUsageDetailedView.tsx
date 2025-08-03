import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import FeatureUsageChart from './Charts/FeatureUsageChart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const FeatureUsageDetailedView: React.FC = () => {
  const { detailedFeatureUsage, timeRange, isLoading, fetchDetailedFeatureUsage } = useAnalyticsStore();
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'users'>('overview');
  const [chartType, setChartType] = useState<'doughnut' | 'bar'>('doughnut');

  React.useEffect(() => {
    fetchDetailedFeatureUsage(timeRange);
  }, [timeRange, fetchDetailedFeatureUsage]);

  // Prepare trends chart data
  const trendsChartData = React.useMemo(() => {
    if (!detailedFeatureUsage?.trends.length) {
      return { labels: [], datasets: [] };
    }

    const trends = detailedFeatureUsage.trends;
    const features = Object.keys(trends[0]?.features || {});
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    return {
      labels: trends.map(trend => new Date(trend.date).toLocaleDateString()),
      datasets: features.map((feature, index) => ({
        label: feature,
        data: trends.map(trend => trend.features[feature] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1,
        fill: false,
      })),
    };
  }, [detailedFeatureUsage?.trends]);

  const trendsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Feature Usage Trends Over Time',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter, sans-serif',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Usage Count',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!detailedFeatureUsage) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No detailed feature usage data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Feature Usage Distribution</h2>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            {/* View selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'trends', label: 'Trends' },
                { key: 'users', label: 'Users' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedView(tab.key as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedView === tab.key
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chart type selector for overview */}
            {selectedView === 'overview' && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'doughnut', label: '🍩' },
                  { key: 'bar', label: '📊' },
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setChartType(type.key as any)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      chartType === type.key
                        ? 'bg-white shadow'
                        : 'hover:bg-gray-200'
                    }`}
                    title={type.key === 'doughnut' ? 'Doughnut Chart' : 'Bar Chart'}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content based on selected view */}
        {selectedView === 'overview' && (
          <FeatureUsageChart 
            height={400} 
            showDetailed={false}
            chartType={chartType}
          />
        )}

        {selectedView === 'trends' && (
          <div style={{ height: '400px' }}>
            <Line data={trendsChartData} options={trendsOptions} />
          </div>
        )}

        {selectedView === 'users' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Feature Users</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailedFeatureUsage.topUsers.map((user, index) => (
                <div key={user.userId} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold text-gray-900">{user.userName}</h4>
                        <p className="text-sm text-gray-600">{user.totalUsage} total uses</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(user.featureBreakdown).map(([feature, count]) => {
                      const percentage = user.totalUsage > 0 ? Math.round((count / user.totalUsage) * 100) : 0;
                      return (
                        <div key={feature} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{feature}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {detailedFeatureUsage.overview.map((feature, index) => (
            <div key={feature.feature} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: feature.color || '#3B82F6' }}
                ></div>
                <h4 className="font-medium text-gray-900 text-sm">{feature.feature}</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Usage Count:</span>
                  <span className="text-xs font-medium text-gray-900">
                    {new Intl.NumberFormat('en-US').format(feature.usageCount)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Unique Users:</span>
                  <span className="text-xs font-medium text-gray-900">
                    {new Intl.NumberFormat('en-US').format(feature.uniqueUsers)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Avg Time:</span>
                  <span className="text-xs font-medium text-gray-900">
                    {Math.round(feature.avgTimePerUse / 60)}m
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Share:</span>
                  <span className="text-xs font-medium text-gray-900">
                    {feature.percentage}%
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${feature.percentage}%`,
                      backgroundColor: feature.color || '#3B82F6'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <p className="text-sm text-gray-600">Download feature usage data for further analysis</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => useAnalyticsStore.getState().exportData('csv')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Export CSV
            </button>
            <button 
              onClick={() => useAnalyticsStore.getState().exportData('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureUsageDetailedView;