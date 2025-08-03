import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

interface RealTimeData {
  timestamp: string;
  activeUsers: number;
  currentSessions: number;
  newUsers: number;
  voiceInteractions: number;
  textMessages: number;
}

interface RecentActivity {
  id: string;
  type: 'session_start' | 'voice_interaction' | 'lesson_complete' | 'user_register';
  userId: string;
  userName?: string;
  timestamp: string;
  details: string;
}

interface RealTimeActivityProps {
  height?: number;
}

const RealTimeActivity: React.FC<RealTimeActivityProps> = ({ height = 400 }) => {
  const { realTimeData, fetchRealTimeData, realTimeEnabled, toggleRealTime } = useAnalyticsStore();
  const [historicalData, setHistoricalData] = React.useState<RealTimeData[]>([]);
  const [displayMode, setDisplayMode] = React.useState<'users' | 'sessions' | 'interactions'>('users');
  const [isConnected, setIsConnected] = React.useState(false);

  // Initialize with sample data and fetch real data
  React.useEffect(() => {
    const now = Date.now();
    const sampleData: RealTimeData[] = Array.from({ length: 20 }, (_, i) => {
      const timestamp = new Date(now - (19 - i) * 30000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      return {
        timestamp,
        activeUsers: Math.floor(Math.random() * 50) + 120,
        currentSessions: Math.floor(Math.random() * 30) + 45,
        newUsers: Math.floor(Math.random() * 10) + 2,
        voiceInteractions: Math.floor(Math.random() * 15) + 8,
        textMessages: Math.floor(Math.random() * 25) + 15
      };
    });
    setHistoricalData(sampleData);
    
    // Enable real-time mode if not already enabled
    if (!realTimeEnabled) {
      toggleRealTime();
    }
    
    // Fetch real-time data immediately
    fetchRealTimeData();
    setIsConnected(true);
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      if (realTimeEnabled) {
        fetchRealTimeData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchRealTimeData, realTimeEnabled]);

  // Update historical data when new real-time data arrives
  React.useEffect(() => {
    if (realTimeData) {
      const transformedData: RealTimeData = {
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        activeUsers: realTimeData.activeUsers,
        currentSessions: realTimeData.currentSessions,
        newUsers: Math.floor(Math.random() * 10) + 2, // Sample data
        voiceInteractions: Math.floor(Math.random() * 15) + 8,
        textMessages: Math.floor(Math.random() * 25) + 15
      };
      
      setHistoricalData(prev => {
        const newData = [...prev.slice(1), transformedData];
        return newData;
      });
    }
  }, [realTimeData]);

  // Sample recent activities
  const sampleActivities: RecentActivity[] = React.useMemo(() => [
    {
      id: '1',
      type: 'session_start',
      userId: 'user_123',
      userName: 'Alex Johnson',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      details: 'Started conversation practice session'
    },
    {
      id: '2',
      type: 'voice_interaction',
      userId: 'user_456',
      userName: 'Maria Garcia',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      details: 'Completed pronunciation exercise'
    },
    {
      id: '3',
      type: 'lesson_complete',
      userId: 'user_789',
      userName: 'David Chen',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      details: 'Finished Business English lesson'
    },
    {
      id: '4',
      type: 'user_register',
      userId: 'user_999',
      userName: 'Sarah Wilson',
      timestamp: new Date(Date.now() - 90000).toISOString(),
      details: 'Created new account and started onboarding'
    },
    {
      id: '5',
      type: 'voice_interaction',
      userId: 'user_111',
      userName: 'John Smith',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      details: 'Practiced conversation with AI teacher'
    }
  ], []);

  // Transform activities from store format to component format
  const transformActivities = (activities: any[]): RecentActivity[] => {
    if (!activities || !Array.isArray(activities)) return [];
    
    return activities.map(activity => ({
      id: activity.id,
      type: activity.action === 'session_start' || !activity.action ? 'session_start' :
            activity.action.includes('voice') ? 'voice_interaction' :
            activity.action.includes('lesson') ? 'lesson_complete' :
            activity.action.includes('register') ? 'user_register' : 'session_start',
      userId: activity.userId,
      userName: activity.userName || `User ${activity.userId.slice(-4)}`,
      timestamp: activity.timestamp,
      details: activity.action === 'session_start' ? 
        `Started new session on ${activity.metadata?.deviceType || 'unknown device'}` :
        activity.action || 'User activity'
    }));
  };

  // Debug logging
  React.useEffect(() => {
    if (realTimeData) {
      console.log('RealTimeActivity: Received realTimeData:', realTimeData);
      console.log('RealTimeActivity: Recent activities:', realTimeData.recentActivities);
    }
  }, [realTimeData]);

  const activitiesToShow = realTimeData?.recentActivities && realTimeData.recentActivities.length > 0
    ? transformActivities(realTimeData.recentActivities) 
    : sampleActivities;

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'session_start': return '🎯';
      case 'voice_interaction': return '🎤';
      case 'lesson_complete': return '✅';
      case 'user_register': return '👋';
      default: return '📝';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'session_start': return 'bg-blue-50 text-blue-700';
      case 'voice_interaction': return 'bg-green-50 text-green-700';
      case 'lesson_complete': return 'bg-purple-50 text-purple-700';
      case 'user_register': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getCurrentData = () => {
    return historicalData.map(item => ({
      ...item,
      value: displayMode === 'users' ? item.activeUsers 
           : displayMode === 'sessions' ? item.currentSessions 
           : item.voiceInteractions + item.textMessages
    }));
  };

  const getYAxisLabel = () => {
    switch (displayMode) {
      case 'users': return 'Active Users';
      case 'sessions': return 'Current Sessions';
      case 'interactions': return 'Interactions/min';
      default: return 'Count';
    }
  };

  const getChartColor = () => {
    switch (displayMode) {
      case 'users': return '#3B82F6';
      case 'sessions': return '#10B981';
      case 'interactions': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const currentStats = historicalData[historicalData.length - 1] || {
    activeUsers: 0,
    currentSessions: 0,
    newUsers: 0,
    voiceInteractions: 0,
    textMessages: 0
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Real-time Activity</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['users', 'sessions', 'interactions'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                displayMode === mode
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600">Active Users</p>
              <p className="text-lg font-bold text-blue-900">{currentStats.activeUsers}</p>
            </div>
            <div className="text-blue-500">👥</div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-600">Current Sessions</p>
              <p className="text-lg font-bold text-green-900">{currentStats.currentSessions}</p>
            </div>
            <div className="text-green-500">🎯</div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-yellow-600">New Users</p>
              <p className="text-lg font-bold text-yellow-900">{currentStats.newUsers}</p>
            </div>
            <div className="text-yellow-500">✨</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-600">Voice</p>
              <p className="text-lg font-bold text-purple-900">{currentStats.voiceInteractions}</p>
            </div>
            <div className="text-purple-500">🎤</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Text</p>
              <p className="text-lg font-bold text-gray-900">{currentStats.textMessages}</p>
            </div>
            <div className="text-gray-500">💬</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Chart */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{getYAxisLabel()} (Last 10 minutes)</h4>
          </div>
          <ResponsiveContainer width="100%" height={height * 0.8}>
            <AreaChart data={getCurrentData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                interval="preserveStartEnd"
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
                formatter={(value: number) => [value, getYAxisLabel()]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={getChartColor()}
                fill={getChartColor()}
                fillOpacity={0.3}
                strokeWidth={2}
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activitiesToShow.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.userName || `User ${activity.userId.slice(-4)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Summary */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Last 5 Minutes</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">New Sessions:</span>
                <span className="font-medium text-gray-900">
                  {activitiesToShow.filter(a => a.type === 'session_start').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Voice Interactions:</span>
                <span className="font-medium text-gray-900">
                  {activitiesToShow.filter(a => a.type === 'voice_interaction').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completions:</span>
                <span className="font-medium text-gray-900">
                  {activitiesToShow.filter(a => a.type === 'lesson_complete').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeActivity;