import React from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface PlatformMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalSessions: number;
  totalRevenue: number;
  avgSessionLength: number;
  newUsers: number;
  returningUsers: number;
  changePercentage: {
    dau: number;
    mau: number;
    sessions: number;
    revenue: number;
  };
}

export interface UserActivityData {
  date: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  totalTime: number;
}

export interface FeatureUsageData {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  percentage: number;
  totalTime: number;
  avgTimePerUse: number;
  color?: string;
}

export interface DetailedFeatureUsage {
  overview: FeatureUsageData[];
  trends: Array<{
    date: string;
    features: Record<string, number>;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    totalUsage: number;
    featureBreakdown: Record<string, number>;
  }>;
}

export interface GeographicData {
  country: string;
  countryCode: string;
  users: number;
  sessions: number;
  totalTime: number;
  coordinates: [number, number];
}

export interface DeviceBreakdown {
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

export interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  errorCount: number;
  uptimePercentage: number;
  incidentCount: number;
  trend: number[];
}

export interface RealTimeData {
  activeUsers: number;
  currentSessions: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
  };
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type TimeRange = '1d' | '7d' | '30d' | '90d' | '1y';

export interface AnalyticsFilters {
  userSegment?: 'all' | 'new' | 'returning' | 'premium';
  country?: string;
  feature?: string;
  deviceType?: 'all' | 'desktop' | 'mobile' | 'tablet';
}

interface AnalyticsState {
  // Data
  metrics: PlatformMetrics | null;
  userActivity: UserActivityData[];
  featureUsage: FeatureUsageData[];
  detailedFeatureUsage: DetailedFeatureUsage | null;
  geographicData: GeographicData[];
  deviceData: DeviceBreakdown | null;
  performanceData: PerformanceMetrics | null;
  realTimeData: RealTimeData | null;
  
  // UI State
  timeRange: TimeRange;
  isLoading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  realTimeEnabled: boolean;
  lastUpdated: string | null;
  
  // Actions
  setTimeRange: (range: TimeRange) => void;
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  toggleRealTime: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Data fetching actions
  fetchDashboardData: (timeRange?: TimeRange) => Promise<void>;
  fetchUserActivity: (timeRange?: TimeRange) => Promise<void>;
  fetchFeatureUsage: (timeRange?: TimeRange) => Promise<void>;
  fetchDetailedFeatureUsage: (timeRange?: TimeRange) => Promise<void>;
  fetchGeographicData: (timeRange?: TimeRange) => Promise<void>;
  fetchDeviceData: (timeRange?: TimeRange) => Promise<void>;
  fetchPerformanceData: (timeRange?: TimeRange) => Promise<void>;
  fetchRealTimeData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  exportData: (format: 'csv' | 'pdf' | 'excel') => Promise<void>;
  recordFeatureUsage: (userId: string, feature: string, duration: number) => Promise<void>;
}

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.englishai.com' 
  : 'https://89.58.17.78:3001';

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// Helper function for API calls
const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/api/analytics${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
};

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      metrics: null,
      userActivity: [],
      featureUsage: [],
      detailedFeatureUsage: null,
      geographicData: [],
      deviceData: null,
      performanceData: null,
      realTimeData: null,
      timeRange: '30d',
      isLoading: false,
      error: null,
      filters: {},
      realTimeEnabled: false,
      lastUpdated: null,

      // UI actions
      setTimeRange: (range) => {
        console.log('🔄 Setting time range to:', range);
        set({ timeRange: range });
        get().refreshAllData();
      },

      setFilters: (filters) => {
        set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        }));
      },

      toggleRealTime: () => {
        const newState = !get().realTimeEnabled;
        set({ realTimeEnabled: newState });
        
        if (newState) {
          get().fetchRealTimeData();
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Data fetching actions
      fetchDashboardData: async (timeRange) => {
        try {
          set({ isLoading: true, error: null });
          const range = timeRange || get().timeRange;
          
          const metrics = await apiCall<PlatformMetrics>(`/dashboard?timeRange=${range}`);
          
          set({ 
            metrics,
            lastUpdated: new Date().toISOString(),
            isLoading: false 
          });
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
            isLoading: false 
          });
        }
      },

      fetchUserActivity: async (timeRange) => {
        try {
          const range = timeRange || get().timeRange;
          const userActivity = await apiCall<UserActivityData[]>(`/user-activity?timeRange=${range}`);
          set({ userActivity });
        } catch (error) {
          console.error('Error fetching user activity:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch user activity data' });
        }
      },

      fetchFeatureUsage: async (timeRange) => {
        try {
          const range = timeRange || get().timeRange;
          const featureUsage = await apiCall<FeatureUsageData[]>(`/feature-usage?timeRange=${range}`);
          
          // Add colors to feature usage data
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
          const featureUsageWithColors = featureUsage.map((item, index) => ({
            ...item,
            color: colors[index % colors.length]
          }));
          
          set({ featureUsage: featureUsageWithColors });
        } catch (error) {
          console.error('Error fetching feature usage:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch feature usage data' });
        }
      },

      fetchDetailedFeatureUsage: async (timeRange) => {
        try {
          const range = timeRange || get().timeRange;
          const detailedFeatureUsage = await apiCall<DetailedFeatureUsage>(`/feature-usage/detailed?timeRange=${range}`);
          
          // Add colors to overview data
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
          const overviewWithColors = detailedFeatureUsage.overview.map((item, index) => ({
            ...item,
            color: colors[index % colors.length]
          }));
          
          set({ 
            detailedFeatureUsage: {
              ...detailedFeatureUsage,
              overview: overviewWithColors
            }
          });
        } catch (error) {
          console.error('Error fetching detailed feature usage:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch detailed feature usage data' });
        }
      },

      fetchGeographicData: async (timeRange) => {
        try {
          const range = timeRange || get().timeRange;
          console.log('🌍 Fetching geographic data for timeRange:', range);
          const geographicData = await apiCall<GeographicData[]>(`/geographic?timeRange=${range}`);
          console.log('🌍 Geographic data received:', geographicData.length, 'records');
          set({ geographicData });
        } catch (error) {
          console.error('Error fetching geographic data:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch geographic data' });
        }
      },

      fetchDeviceData: async (timeRange) => {
        try {
          const range = timeRange || get().timeRange;
          const deviceData = await apiCall<DeviceBreakdown>(`/devices?timeRange=${range}`);
          set({ deviceData });
        } catch (error) {
          console.error('Error fetching device data:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch device data' });
        }
      },

      fetchPerformanceData: async (timeRange) => {
        try {
          const range = timeRange || get().timeRange;
          const performanceData = await apiCall<PerformanceMetrics>(`/performance?timeRange=${range}`);
          set({ performanceData });
        } catch (error) {
          console.error('Error fetching performance data:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch performance data' });
        }
      },

      fetchRealTimeData: async () => {
        try {
          const realTimeData = await apiCall<RealTimeData>('/realtime');
          set({ realTimeData });
        } catch (error) {
          console.error('Error fetching real-time data:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch real-time data' });
        }
      },

      refreshAllData: async () => {
        const { timeRange } = get();
        console.log('🔄 Refreshing all data for timeRange:', timeRange);
        
        try {
          set({ isLoading: true, error: null });
          
          await Promise.all([
            get().fetchDashboardData(timeRange),
            get().fetchUserActivity(timeRange),
            get().fetchFeatureUsage(timeRange),
            get().fetchDetailedFeatureUsage(timeRange),
            get().fetchGeographicData(timeRange),
            get().fetchDeviceData(timeRange),
            get().fetchPerformanceData(timeRange),
          ]);

          if (get().realTimeEnabled) {
            await get().fetchRealTimeData();
          }

          set({ 
            lastUpdated: new Date().toISOString(),
            isLoading: false 
          });
          console.log('✅ All data refreshed successfully');
        } catch (error) {
          console.error('Error refreshing all data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh data',
            isLoading: false 
          });
        }
      },

      recordFeatureUsage: async (userId, feature, duration) => {
        try {
          await apiCall('/feature-usage/record', {
            method: 'POST',
            body: JSON.stringify({ userId, feature, duration }),
          });
          
          // Optionally refresh feature usage data after recording
          await get().fetchFeatureUsage();
        } catch (error) {
          console.error('Error recording feature usage:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to record feature usage' });
        }
      },

      exportData: async (format) => {
        try {
          const { timeRange } = get();
          
          const response = await fetch(`${API_BASE_URL}/api/analytics/export`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
            },
            body: JSON.stringify({ timeRange, format }),
          });

          if (!response.ok) {
            throw new Error('Export failed');
          }

          const result = await response.json();
          
          // In a real implementation, you would handle file download here
          console.log('Export initiated:', result);
          
          // For now, just show a success message
          alert(`Export in ${format} format initiated. Check your downloads.`);
        } catch (error) {
          console.error('Error exporting data:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to export data' });
        }
      },
    }),
    {
      name: 'analytics-store',
    }
  )
);

// Real-time updates hook
export const useRealTimeUpdates = () => {
  const { realTimeEnabled, fetchRealTimeData } = useAnalyticsStore();
  
  React.useEffect(() => {
    if (!realTimeEnabled) return;
    
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [realTimeEnabled, fetchRealTimeData]);
};

// Export individual selectors for better performance
export const useAnalyticsMetrics = () => useAnalyticsStore((state) => state.metrics);
export const useAnalyticsLoading = () => useAnalyticsStore((state) => state.isLoading);
export const useAnalyticsError = () => useAnalyticsStore((state) => state.error);
export const useAnalyticsTimeRange = () => useAnalyticsStore((state) => state.timeRange);
export const useAnalyticsFilters = () => useAnalyticsStore((state) => state.filters);

export default useAnalyticsStore;