import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface FeatureUsageChartProps {
  height?: number;
  showDetailed?: boolean;
  chartType?: 'doughnut' | 'bar';
}

const FeatureUsageChart: React.FC<FeatureUsageChartProps> = ({ 
  height = 300, 
  showDetailed = false,
  chartType = 'doughnut'
}) => {
  const { featureUsage, detailedFeatureUsage, isLoading, timeRange, fetchDetailedFeatureUsage } = useAnalyticsStore();


  const chartData = React.useMemo(() => {
    if (!featureUsage.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    
    if (chartType === 'bar') {
      return {
        labels: featureUsage.map(item => item.feature),
        datasets: [
          {
            label: 'Usage Count',
            data: featureUsage.map(item => item.usageCount),
            backgroundColor: colors[0] + '80',
            borderColor: colors[0],
            borderWidth: 1,
          },
          {
            label: 'Unique Users',
            data: featureUsage.map(item => item.uniqueUsers),
            backgroundColor: colors[1] + '80',
            borderColor: colors[1],
            borderWidth: 1,
          }
        ],
      };
    }
    
    return {
      labels: featureUsage.map(item => item.feature),
      datasets: [
        {
          data: featureUsage.map(item => item.percentage),
          backgroundColor: featureUsage.map((_, index) => colors[index % colors.length]),
          borderColor: featureUsage.map((_, index) => colors[index % colors.length]),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8,
        },
      ],
    };
  }, [featureUsage, chartType]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, index: number) => {
                const percentage = data.datasets[0].data[index];
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[index],
                  strokeStyle: data.datasets[0].borderColor[index],
                  lineWidth: data.datasets[0].borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: index,
                };
              });
            }
            return [];
          },
        },
      },
      title: {
        display: true,
        text: 'Feature Usage Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter, sans-serif',
        },
        color: '#1F2937',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return context[0].label;
          },
          label: (context: any) => {
            const featureData = featureUsage[context.dataIndex];
            if (featureData) {
              return [
                `Usage: ${context.formattedValue}%`,
                `Count: ${new Intl.NumberFormat('en-US').format(featureData.usageCount)}`,
                `Users: ${new Intl.NumberFormat('en-US').format(featureData.uniqueUsers)}`,
                `Avg Time: ${Math.round(featureData.avgTimePerUse / 60)}m`,
              ];
            }
            return `${context.formattedValue}%`;
          },
        },
      },
    },
    cutout: '60%',
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Feature Usage Statistics',
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter, sans-serif',
        },
        color: '#1F2937',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
    },
  };

  const options = chartType === 'doughnut' ? doughnutOptions : barOptions;

  // Calculate total usage for center display
  const totalUsage = featureUsage.reduce((sum, item) => sum + item.usageCount, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!featureUsage.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage Distribution</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">🎯</p>
            <p>No feature usage data available</p>
            <p className="text-sm">Data will appear once features are used</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="relative" style={{ height: `${height}px` }}>
        {chartType === 'doughnut' ? (
          <>
            <Doughnut data={chartData} options={options} />
            {/* Center text overlay for doughnut chart */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US').format(totalUsage)}
                </p>
                <p className="text-sm text-gray-600">Total Usage</p>
              </div>
            </div>
          </>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>

      {/* Feature usage stats below chart */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {featureUsage.slice(0, 3).map((feature, index) => (
          <div key={feature.feature} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'][index] }}
              ></div>
              <span className="text-sm font-medium text-gray-900">{feature.feature}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{feature.percentage}%</p>
            <p className="text-xs text-gray-500">
              {new Intl.NumberFormat('en-US').format(feature.usageCount)} uses
            </p>
            <p className="text-xs text-gray-400">
              {Math.round(feature.avgTimePerUse / 60)}m avg
            </p>
          </div>
        ))}
      </div>

      {/* Detailed breakdown if requested */}
      {showDetailed && detailedFeatureUsage && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h4>
          
          {/* Top Users */}
          <div className="mb-6">
            <h5 className="text-md font-medium text-gray-700 mb-3">Top Feature Users</h5>
            <div className="space-y-2">
              {detailedFeatureUsage.topUsers.slice(0, 5).map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{user.userName}</span>
                    <p className="text-sm text-gray-600">
                      {user.totalUsage} total uses
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex space-x-2">
                      {Object.entries(user.featureBreakdown).slice(0, 3).map(([feature, count]) => (
                        <span key={feature} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {feature}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">Feature Comparison</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Time/Use
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailedFeatureUsage.overview.map((feature) => (
                    <tr key={feature.feature}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {feature.feature}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Intl.NumberFormat('en-US').format(feature.usageCount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Intl.NumberFormat('en-US').format(feature.uniqueUsers)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(feature.avgTimePerUse / 60)}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${feature.percentage}%` }}
                            ></div>
                          </div>
                          {feature.percentage}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureUsageChart;