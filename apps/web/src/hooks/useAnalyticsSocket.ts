import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAnalyticsStore } from '../stores/analyticsStore';

interface RealTimeMetrics {
  activeUsers: number;
  currentSessions: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
  };
  recentActivities: Activity[];
  timestamp: string;
}

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface UseAnalyticsSocketOptions {
  enabled?: boolean;
  autoConnect?: boolean;
}

interface AnalyticsSocketState {
  isConnected: boolean;
  isSubscribed: boolean;
  error: string | null;
  lastUpdate: string | null;
}

export const useAnalyticsSocket = (options: UseAnalyticsSocketOptions = {}) => {
  const { enabled = true, autoConnect = true } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<AnalyticsSocketState>({
    isConnected: false,
    isSubscribed: false,
    error: null,
    lastUpdate: null,
  });

  const { realTimeEnabled, setError } = useAnalyticsStore();

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.englishai.com' 
    : 'http://localhost:3001';

  // Helper function to get auth token
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  // Helper function to get user ID
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    try {
      const token = getAuthToken();
      if (!token) return null;
      
      // Decode JWT payload (basic implementation)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub;
    } catch {
      return null;
    }
  };

  // Connect to analytics socket
  const connect = () => {
    if (!enabled || socketRef.current?.connected) return;

    const token = getAuthToken();
    const userId = getUserId();

    if (!token || !userId) {
      setSocketState(prev => ({ 
        ...prev, 
        error: 'Authentication required for real-time analytics' 
      }));
      return;
    }

    try {
      // Create socket connection to analytics namespace
      const socket = io(`${API_BASE_URL}/analytics`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        retries: 3,
      });

      socketRef.current = socket;

      // Handle connection events
      socket.on('connect', () => {
        console.log('Analytics socket connected');
        setSocketState(prev => ({ 
          ...prev, 
          isConnected: true, 
          error: null 
        }));

        // Subscribe to analytics updates
        socket.emit('analytics:subscribe', { userId, token });
      });

      socket.on('disconnect', (reason) => {
        console.log('Analytics socket disconnected:', reason);
        setSocketState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isSubscribed: false,
          error: reason === 'io server disconnect' ? 'Server disconnected' : null
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('Analytics socket connection error:', error);
        setSocketState(prev => ({ 
          ...prev, 
          error: `Connection failed: ${error.message}` 
        }));
      });

      // Handle analytics events
      socket.on('analytics:subscribed', (data) => {
        console.log('Subscribed to analytics updates:', data);
        setSocketState(prev => ({ 
          ...prev, 
          isSubscribed: true 
        }));
      });

      socket.on('analytics:data', (data: RealTimeMetrics) => {
        console.log('Received real-time analytics data:', data);
        
        // Update store with real-time data
        useAnalyticsStore.setState({
          realTimeData: data,
          lastUpdated: data.timestamp,
        });

        setSocketState(prev => ({ 
          ...prev, 
          lastUpdate: data.timestamp 
        }));
      });

      socket.on('analytics:activity', (activity: Activity) => {
        console.log('New activity:', activity);
        
        // Update activities in real-time data
        const currentState = useAnalyticsStore.getState();
        if (currentState.realTimeData) {
          const updatedActivities = [activity, ...currentState.realTimeData.recentActivities].slice(0, 10);
          useAnalyticsStore.setState({
            realTimeData: {
              ...currentState.realTimeData,
              recentActivities: updatedActivities,
            },
          });
        }
      });

      socket.on('analytics:system-health', (health: any) => {
        console.log('System health update:', health);
        
        // Update system health in real-time data
        const currentState = useAnalyticsStore.getState();
        if (currentState.realTimeData) {
          useAnalyticsStore.setState({
            realTimeData: {
              ...currentState.realTimeData,
              systemHealth: health,
            },
          });
        }
      });

      socket.on('analytics:response', (response: any) => {
        console.log('Analytics response:', response);
        // Handle specific data requests if needed
      });

      socket.on('analytics:error', (error: any) => {
        console.error('Analytics socket error:', error);
        setSocketState(prev => ({ 
          ...prev, 
          error: error.message || 'Analytics error' 
        }));
        setError(error.message || 'Real-time analytics error');
      });

    } catch (error) {
      console.error('Error creating analytics socket:', error);
      setSocketState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };

  // Disconnect from analytics socket
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketState({
        isConnected: false,
        isSubscribed: false,
        error: null,
        lastUpdate: null,
      });
    }
  };

  // Request specific analytics data
  const requestData = (type: string, params?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('analytics:request', { type, params });
    }
  };

  // Manual refresh
  const refresh = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('analytics:refresh');
    }
  };

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && realTimeEnabled && enabled) {
      connect();
    } else if (!realTimeEnabled) {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, realTimeEnabled, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    // State
    isConnected: socketState.isConnected,
    isSubscribed: socketState.isSubscribed,
    error: socketState.error,
    lastUpdate: socketState.lastUpdate,
    
    // Actions
    connect,
    disconnect,
    requestData,
    refresh,
  };
};

// Hook for accessing real-time data specifically
export const useRealTimeAnalytics = () => {
  const realTimeData = useAnalyticsStore(state => state.realTimeData);
  const realTimeEnabled = useAnalyticsStore(state => state.realTimeEnabled);
  
  const socket = useAnalyticsSocket({
    enabled: realTimeEnabled,
    autoConnect: true,
  });

  return {
    data: realTimeData,
    enabled: realTimeEnabled,
    socket,
  };
};

export default useAnalyticsSocket;