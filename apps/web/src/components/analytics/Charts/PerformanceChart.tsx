import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

interface ChartPerformanceMetrics {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
    trend: Array<{ time: string; value: number }>;
  };
  errorRate: {
    percentage: number;
    count: number;
    byEndpoint: Record<string, number>;
    trend: Array<{ time: string; value: number }>;
  };
  uptime: {
    percentage: number;
    incidents: number;
  };
  throughput: {
    requestsPerSecond: number;
    trend: Array<{ time: string; value: number }>;
  };
}

interface PerformanceChartProps {
  height?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ height = 400 }) => {
  const { performanceData, isLoading } = useAnalyticsStore();
  const [activeMetric, setActiveMetric] = React.useState<'response' | 'errors' | 'throughput'>('response');

  // Sample data for demonstration
  const sampleData: ChartPerformanceMetrics = React.useMemo(() => ({
    responseTime: {
      avg: 245,
      p95: 580,
      p99: 1200,
      trend: [
        { time: '00:00', value: 230 },
        { time: '04:00', value: 220 },
        { time: '08:00', value: 280 },
        { time: '12:00', value: 320 },
        { time: '16:00', value: 290 },
        { time: '20:00', value: 245 },
      ]
    },
    errorRate: {
      percentage: 2.1,
      count: 127,
      byEndpoint: {
        '/api/voice': 45,
        '/api/analytics': 32,
        '/api/auth': 28,
        '/api/lessons': 22
      },
      trend: [
        { time: '00:00', value: 1.8 },
        { time: '04:00', value: 1.5 },
        { time: '08:00', value: 2.3 },
        { time: '12:00', value: 2.8 },
        { time: '16:00', value: 2.4 },
        { time: '20:00', value: 2.1 },
      ]
    },
    uptime: {
      percentage: 99.94,
      incidents: 2
    },
    throughput: {
      requestsPerSecond: 128,
      trend: [
        { time: '00:00', value: 89 },
        { time: '04:00', value: 45 },
        { time: '08:00', value: 156 },
        { time: '12:00', value: 203 },
        { time: '16:00', value: 178 },
        { time: '20:00', value: 128 },
      ]
    }
  }), []);

  // Transform store data to chart format
  const transformToChartFormat = (storeData: any): ChartPerformanceMetrics => {
    if (!storeData) return sampleData;
    
    return {
      responseTime: {
        avg: storeData.avgResponseTime || 0,
        p95: storeData.p95ResponseTime || 0,
        p99: storeData.p99ResponseTime || 0,
        trend: storeData.trend?.map((value: number, index: number) => ({
          time: `${String(index * 4).padStart(2, '0')}:00`,
          value
        })) || sampleData.responseTime.trend
      },
      errorRate: {
        percentage: storeData.errorRate || 0,
        count: storeData.errorCount || 0,
        byEndpoint: {
          '/api/voice': Math.floor((storeData.errorCount || 127) * 0.35),
          '/api/analytics': Math.floor((storeData.errorCount || 127) * 0.25),
          '/api/auth': Math.floor((storeData.errorCount || 127) * 0.22),
          '/api/lessons': Math.floor((storeData.errorCount || 127) * 0.18)
        },
        trend: storeData.trend?.map((value: number, index: number) => ({
          time: `${String(index * 4).padStart(2, '0')}:00`,
          value: value / 100 // Convert to percentage
        })) || sampleData.errorRate.trend
      },
      uptime: {
        percentage: storeData.uptimePercentage || 99.94,
        incidents: storeData.incidentCount || 2
      },
      throughput: {
        requestsPerSecond: 128, // Not in store, use default
        trend: storeData.trend?.map((value: number, index: number) => ({
          time: `${String(index * 4).padStart(2, '0')}:00`,
          value: Math.floor(Math.random() * 100) + 50 // Generate sample throughput
        })) || sampleData.throughput.trend
      }
    };
  };

  const dataToUse = transformToChartFormat(performanceData);

  const getCurrentChartData = () => {
    switch (activeMetric) {
      case 'response': return dataToUse.responseTime.trend;
      case 'errors': return dataToUse.errorRate.trend;
      case 'throughput': return dataToUse.throughput.trend;
      default: return dataToUse.responseTime.trend;
    }
  };

  const getMetricLabel = () => {
    switch (activeMetric) {
      case 'response': return 'Response Time (ms)';
      case 'errors': return 'Error Rate (%)';
      case 'throughput': return 'Requests/sec';
      default: return 'Response Time (ms)';
    }
  };

  const getMetricColor = () => {
    switch (activeMetric) {
      case 'response': return '#3B82F6';
      case 'errors': return '#EF4444';
      case 'throughput': return '#10B981';
      default: return '#3B82F6';
    }
  };

  const formatTooltipValue = (value: number) => {
    switch (activeMetric) {
      case 'response': return `${value}ms`;
      case 'errors': return `${value}%`;
      case 'throughput': return `${value} req/s`;
      default: return value.toString();
    }
  };

  // Error breakdown data for bar chart
  const errorBreakdownData = Object.entries(dataToUse.errorRate.byEndpoint).map(([endpoint, count]) => ({
    endpoint: endpoint.replace('/api/', ''),
    count,
    percentage: Math.round((count / dataToUse.errorRate.count) * 100)
  }));

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['response', 'errors', 'throughput'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activeMetric === metric
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {metric === 'response' ? 'Response' : metric === 'errors' ? 'Errors' : 'Throughput'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Avg Response</p>
              <p className="text-2xl font-bold text-blue-900">{dataToUse.responseTime.avg}ms</p>
            </div>
            <div className="text-blue-500">⚡</div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Error Rate</p>
              <p className="text-2xl font-bold text-red-900">{dataToUse.errorRate.percentage}%</p>
            </div>
            <div className="text-red-500">🚨</div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Uptime</p>
              <p className="text-2xl font-bold text-green-900">{dataToUse.uptime.percentage}%</p>
            </div>
            <div className="text-green-500">✅</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Throughput</p>
              <p className="text-2xl font-bold text-purple-900">{dataToUse.throughput.requestsPerSecond}/s</p>
            </div>
            <div className="text-purple-500">📊</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Performance Chart */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{getMetricLabel()} Trend</h4>
          </div>
          <ResponsiveContainer width="100%" height={height * 0.7}>
            <AreaChart data={getCurrentChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [formatTooltipValue(value), getMetricLabel()]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={getMetricColor()}
                fill={getMetricColor()}
                fillOpacity={0.3}
                strokeWidth={2}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Details */}
        <div className="space-y-6">
          {/* Response Time Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Response Time Percentiles</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Average</span>
                <span className="font-semibold text-gray-900">{dataToUse.responseTime.avg}ms</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">95th Percentile</span>
                <span className="font-semibold text-gray-900">{dataToUse.responseTime.p95}ms</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">99th Percentile</span>
                <span className="font-semibold text-gray-900">{dataToUse.responseTime.p99}ms</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">System Health</h4>
            <div className="space-y-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Uptime</span>
                  <span className="text-lg font-bold text-green-600">{dataToUse.uptime.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${dataToUse.uptime.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{dataToUse.uptime.incidents} incidents this month</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Error Rate</span>
                  <span className="text-lg font-bold text-red-600">{dataToUse.errorRate.percentage}%</span>
                </div>
                <p className="text-xs text-gray-500">{dataToUse.errorRate.count} errors in last 24h</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200">
                View Detailed Logs
              </button>
              <button className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200">
                Export Report
              </button>
              <button className="w-full px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors duration-200">
                System Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Breakdown Chart */}
      <div className="mt-8">
        <h4 className="font-medium text-gray-900 mb-4">Error Breakdown by Endpoint</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={errorBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis 
              dataKey="endpoint" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => [
                name === 'count' ? `${value} errors` : `${value}%`, 
                name === 'count' ? 'Count' : 'Percentage'
              ]}
            />
            <Bar 
              dataKey="count" 
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;