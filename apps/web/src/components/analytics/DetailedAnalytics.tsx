import React, { useState, useEffect } from 'react';
import { useAnalyticsStore } from '../../stores/analyticsStore';

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  email: string;
  startTime: string;
  endTime?: string;
  duration: number;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  interactions: number;
  pageViews: number;
}

interface TopUser {
  userId: string;
  userName: string;
  email: string;
  sessionCount: number;
  totalTime: number;
  lastSeen: string;
  avgSessionTime: number;
}

type TabType = 'top-users' | 'recent-sessions' | 'feature-analytics';

const DetailedAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('recent-sessions');
  const [recentSessions, setRecentSessions] = useState<UserSession[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.englishai.com' 
    : 'https://89.58.17.78:3001';

  // Helper function to get auth token
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  // Helper function for API calls
  const apiCall = async (endpoint: string): Promise<any> => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/analytics${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  };

  // Real function to get detailed session data
  const fetchDetailedSessions = async () => {
    setLoading(true);
    try {
      const sessions = await apiCall('/sessions?limit=20') as UserSession[];
      
      // Transform API response to component format
      const transformedSessions = sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        userName: session.userName,
        email: session.email || 'unknown@example.com',
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress,
        interactions: session.interactions,
        pageViews: session.pageViews
      }));
      
      setRecentSessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching detailed sessions:', error);
      // Fallback to empty array on error
      setRecentSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Real function to get top users data
  const fetchTopUsers = async () => {
    setLoading(true);
    try {
      const users = await apiCall('/top-users?limit=10') as TopUser[];
      setTopUsers(users);
    } catch (error) {
      console.error('Error fetching top users:', error);
      // Fallback to empty array on error
      setTopUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data based on active tab
    if (activeTab === 'recent-sessions') {
      fetchDetailedSessions();
    } else if (activeTab === 'top-users') {
      fetchTopUsers();
    }
  }, [activeTab]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderRecentSessions = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Session
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Device
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Activity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Started
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {recentSessions.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {session.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{session.userName}</div>
                    <div className="text-sm text-gray-500">{session.userId.slice(-8)}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{session.id.slice(0, 20)}...</div>
                <div className="text-sm text-gray-500">{session.ipAddress}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{session.deviceType}</div>
                <div className="text-sm text-gray-500">{session.browser} • {session.os}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDuration(session.duration)}</div>
                <div className="text-sm text-gray-500">{session.interactions} interactions</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{session.pageViews} page views</div>
                <div className="text-sm text-gray-500">{session.interactions} clicks</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTimeAgo(session.startTime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTopUsers = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sessions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Session
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Seen
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {topUsers.map((user) => (
            <tr key={user.userId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {user.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.sessionCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDuration(user.totalTime)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDuration(user.avgSessionTime)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTimeAgo(user.lastSeen)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFeatureAnalytics = () => (
    <div className="text-center py-12">
      <div className="text-gray-500">
        <p className="text-lg mb-2">📊</p>
        <p>Feature Analytics</p>
        <p className="text-sm">Feature usage metrics will be available soon</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('top-users')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
              activeTab === 'top-users'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Top Users
          </button>
          <button
            onClick={() => setActiveTab('recent-sessions')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
              activeTab === 'recent-sessions'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Recent Sessions
          </button>
          <button
            onClick={() => setActiveTab('feature-analytics')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
              activeTab === 'feature-analytics'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Feature Analytics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="min-h-48">
          {activeTab === 'recent-sessions' && renderRecentSessions()}
          {activeTab === 'top-users' && renderTopUsers()}
          {activeTab === 'feature-analytics' && renderFeatureAnalytics()}
        </div>
      )}
    </div>
  );
};

export default DetailedAnalytics;