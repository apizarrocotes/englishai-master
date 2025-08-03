import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

interface DeviceAnalyticsData {
  device: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browser: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
    other: number;
  };
  os: {
    windows: number;
    macos: number;
    linux: number;
    ios: number;
    android: number;
  };
}

interface DeviceAnalyticsChartProps {
  height?: number;
}

const COLORS = {
  device: ['#3B82F6', '#10B981', '#F59E0B'],
  browser: ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#6B7280'],
  os: ['#3B82F6', '#6B7280', '#F59E0B', '#10B981', '#EF4444']
};

const DeviceAnalyticsChart: React.FC<DeviceAnalyticsChartProps> = ({ height = 400 }) => {
  const { deviceData, isLoading } = useAnalyticsStore();
  const [activeView, setActiveView] = React.useState<'device' | 'browser' | 'os'>('device');

  const dataToUse = deviceData;

  // Transform data for charts
  const getChartData = (type: 'device' | 'browser' | 'os') => {
    if (!dataToUse || !dataToUse[type]) return [];
    const data = dataToUse[type];
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(data).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: Math.round((value / total) * 100)
    }));
  };

  const deviceChartData = getChartData('device');
  const browserChartData = getChartData('browser');
  const osChartData = getChartData('os');

  const getCurrentData = () => {
    switch (activeView) {
      case 'device': return deviceChartData;
      case 'browser': return browserChartData;
      case 'os': return osChartData;
      default: return deviceChartData;
    }
  };

  const getCurrentColors = () => {
    return COLORS[activeView];
  };

  const getCurrentTitle = () => {
    switch (activeView) {
      case 'device': return 'Device Types';
      case 'browser': return 'Browser Distribution';
      case 'os': return 'Operating Systems';
      default: return 'Device Types';
    }
  };

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-blue-600">
            <span className="font-semibold">{data.value.toLocaleString()}</span> users
          </p>
          <p className="text-gray-600 text-sm">{data.payload.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderLabel = ({ percentage }: any) => {
    return `${percentage}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Device & Browser Analytics</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!dataToUse || getCurrentData().length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Device & Browser Analytics</h3>
        </div>
        <div className="flex items-center justify-center flex-col" style={{ height }}>
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500 text-center">No device analytics data available</p>
          <p className="text-gray-400 text-sm text-center mt-1">Data will appear as users access the platform</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Device & Browser Analytics</h3>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['device', 'browser', 'os'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activeView === view
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view === 'device' ? 'Devices' : view === 'browser' ? 'Browsers' : 'OS'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{getCurrentTitle()}</h4>
          </div>
          <ResponsiveContainer width="100%" height={height * 0.8}>
            <PieChart>
              <Pie
                data={getCurrentData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {getCurrentData().map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getCurrentColors()[index % getCurrentColors().length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics Panel */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Breakdown</h4>
          <div className="space-y-3">
            {getCurrentData().map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getCurrentColors()[index % getCurrentColors().length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Summary</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users:</span>
                <span className="font-medium text-gray-900">
                  {getCurrentData().reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Most Popular:</span>
                <span className="font-medium text-gray-900">
                  {getCurrentData().sort((a, b) => b.value - a.value)[0]?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categories:</span>
                <span className="font-medium text-gray-900">{getCurrentData().length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceAnalyticsChart;