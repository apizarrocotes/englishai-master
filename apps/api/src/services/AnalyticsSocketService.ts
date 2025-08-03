import { Server, Socket } from 'socket.io';
import { AnalyticsService } from './AnalyticsService';
import { logger } from '../utils/logger';

interface AnalyticsSocketData {
  userId?: string;
  isAdmin?: boolean;
}

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

export class AnalyticsSocketService {
  private io: Server;
  private analyticsService: AnalyticsService;
  private realTimeInterval: NodeJS.Timeout | null = null;
  private connectedClients = new Set<string>();
  private recentActivities: Activity[] = [];

  constructor(io: Server) {
    this.io = io;
    this.analyticsService = AnalyticsService.getInstance();
    this.setupNamespace();
  }

  private setupNamespace() {
    const analyticsNamespace = this.io.of('/analytics');

    analyticsNamespace.on('connection', (socket: Socket<any, any, any, AnalyticsSocketData>) => {
      logger.info('Analytics socket connected', { socketId: socket.id });
      this.connectedClients.add(socket.id);

      // Authenticate and setup analytics subscription
      socket.on('analytics:subscribe', async (data: { userId: string; token: string }) => {
        try {
          // In production, verify JWT token here
          // For now, we'll assume authentication is handled by middleware
          socket.data.userId = data.userId;
          socket.data.isAdmin = true; // In production, check user roles

          // Join analytics room for real-time updates
          socket.join('analytics-subscribers');

          // Send initial data
          const initialData = await this.getRealTimeMetrics();
          socket.emit('analytics:data', initialData);

          // Start real-time updates if this is the first subscriber
          if (this.connectedClients.size === 1) {
            this.startRealTimeUpdates();
          }

          socket.emit('analytics:subscribed', {
            message: 'Successfully subscribed to analytics updates',
            updateInterval: 30000 // 30 seconds
          });

          logger.info('User subscribed to analytics', {
            socketId: socket.id,
            userId: data.userId
          });
        } catch (error) {
          socket.emit('analytics:error', {
            message: 'Failed to subscribe to analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          logger.error('Error subscribing to analytics', {
            socketId: socket.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle request for specific data
      socket.on('analytics:request', async (data: { type: string; params?: any }) => {
        try {
          let responseData;

          switch (data.type) {
            case 'dashboard':
              responseData = await this.analyticsService.getDashboardMetrics(data.params?.timeRange || '30d');
              break;
            case 'user-activity':
              responseData = await this.analyticsService.getUserActivity(data.params?.timeRange || '30d');
              break;
            case 'feature-usage':
              responseData = await this.analyticsService.getFeatureUsage(data.params?.timeRange || '30d');
              break;
            case 'geographic':
              responseData = await this.analyticsService.getGeographicData(data.params?.timeRange || '30d');
              break;
            case 'devices':
              responseData = await this.analyticsService.getDeviceAnalytics(data.params?.timeRange || '30d');
              break;
            case 'performance':
              responseData = await this.analyticsService.getPerformanceMetrics(data.params?.timeRange || '30d');
              break;
            default:
              throw new Error(`Unknown analytics request type: ${data.type}`);
          }

          socket.emit('analytics:response', {
            type: data.type,
            data: responseData,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('analytics:error', {
            message: `Failed to fetch ${data.type} data`,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle manual refresh request
      socket.on('analytics:refresh', async () => {
        try {
          const refreshedData = await this.getRealTimeMetrics();
          socket.emit('analytics:data', refreshedData);
          
          logger.info('Analytics data manually refreshed', {
            socketId: socket.id,
            userId: socket.data.userId
          });
        } catch (error) {
          socket.emit('analytics:error', {
            message: 'Failed to refresh analytics data',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        logger.info('Analytics socket disconnected', {
          socketId: socket.id,
          userId: socket.data.userId,
          reason
        });
        
        this.connectedClients.delete(socket.id);
        
        // Stop real-time updates if no clients are connected
        if (this.connectedClients.size === 0) {
          this.stopRealTimeUpdates();
        }
      });
    });
  }

  private async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      // Get basic metrics
      const metrics = await this.analyticsService.getDashboardMetrics('7d');
      
      // Calculate current active sessions (estimated)
      const currentSessions = Math.floor(metrics.totalSessions * 0.1);
      
      // Get system health (placeholder - in production this would come from monitoring)
      const systemHealth = {
        status: 'healthy' as const,
        uptime: 99.8,
        responseTime: 120 + Math.random() * 50 // Simulate variation
      };

      return {
        activeUsers: metrics.dailyActiveUsers,
        currentSessions,
        systemHealth,
        recentActivities: this.recentActivities.slice(-10), // Last 10 activities
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting real-time metrics', error);
      
      // Return fallback data
      return {
        activeUsers: 0,
        currentSessions: 0,
        systemHealth: {
          status: 'critical',
          uptime: 0,
          responseTime: 0
        },
        recentActivities: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  private startRealTimeUpdates() {
    if (this.realTimeInterval) return;

    logger.info('Starting real-time analytics updates');
    
    this.realTimeInterval = setInterval(async () => {
      try {
        const data = await this.getRealTimeMetrics();
        
        // Broadcast to all subscribed clients
        this.io.of('/analytics').to('analytics-subscribers').emit('analytics:data', data);
        
        logger.debug('Real-time analytics data broadcasted', {
          subscriberCount: this.connectedClients.size,
          timestamp: data.timestamp
        });
      } catch (error) {
        logger.error('Error broadcasting real-time analytics', error);
      }
    }, 30000); // Update every 30 seconds
  }

  private stopRealTimeUpdates() {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
      logger.info('Stopped real-time analytics updates');
    }
  }

  // Method to track user activities from other parts of the application
  public trackActivity(activity: Omit<Activity, 'id' | 'timestamp'>) {
    const activityWithMetadata: Activity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.recentActivities.push(activityWithMetadata);
    
    // Keep only last 50 activities
    if (this.recentActivities.length > 50) {
      this.recentActivities = this.recentActivities.slice(-50);
    }

    // Broadcast activity to connected clients
    this.io.of('/analytics').to('analytics-subscribers').emit('analytics:activity', activityWithMetadata);
    
    logger.debug('Activity tracked', {
      activityId: activityWithMetadata.id,
      userId: activity.userId,
      action: activity.action
    });
  }

  // Method to update system health metrics
  public updateSystemHealth(health: Partial<RealTimeMetrics['systemHealth']>) {
    // Broadcast system health update
    this.io.of('/analytics').to('analytics-subscribers').emit('analytics:system-health', {
      ...health,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup method
  public cleanup() {
    this.stopRealTimeUpdates();
    this.connectedClients.clear();
    this.recentActivities = [];
    logger.info('Analytics socket service cleaned up');
  }
}

export default AnalyticsSocketService;