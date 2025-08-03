# 📊 Platform Usage Dashboard - Design Specification

**Feature**: Platform Usage Dashboard  
**Priority**: CRITICAL  
**Release**: v1.2.0 (September 2025)  
**Story Points**: 21  

## 🎯 Overview

Comprehensive analytics dashboard providing real-time insights into platform usage, user behavior, performance metrics, and business intelligence for EnglishAI Master.

## 🎨 UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    📊 Platform Analytics                        │
├─────────────────────────────────────────────────────────────────┤
│  [Time Range Selector] [Export] [Refresh] [Real-time Toggle]    │
├─────────────────────────────────────────────────────────────────┤
│  📈 Key Metrics Cards                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │   DAU   │ │   MAU   │ │Sessions │ │Revenue │               │
│  │  1,234  │ │ 12,456  │ │  2,567  │ │ $4,890 │               │
│  │ +12.5%  │ │  +8.3%  │ │ +15.2%  │ │ +22.1% │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
├─────────────────────────────────────────────────────────────────┤
│  📊 Charts Section                                              │
│  ┌───────────────────────────┐ ┌─────────────────────────────┐  │
│  │     User Activity         │ │    Feature Usage            │  │
│  │    (Line Chart)           │ │   (Donut Chart)             │  │
│  │                           │ │                             │  │
│  │   [7D] [30D] [90D] [1Y]   │ │   Voice: 45%               │  │
│  └───────────────────────────┘ │   Text: 35%                │  │
│                                 │   Lessons: 20%              │  │
│                                 └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  🌍 Geographic & Device Analytics                               │
│  ┌───────────────────────────┐ ┌─────────────────────────────┐  │
│  │    Geographic Map         │ │    Device Breakdown         │  │
│  │                           │ │                             │  │
│  │    [Interactive Map]      │ │   Desktop: 60%             │  │
│  │                           │ │   Mobile: 35%              │  │
│  │                           │ │   Tablet: 5%               │  │
│  └───────────────────────────┘ └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ⚡ Performance & System Health                                 │
│  ┌───────────────────────────┐ ┌─────────────────────────────┐  │
│  │    Response Times         │ │    Error Rates              │  │
│  │    (Area Chart)           │ │    (Bar Chart)              │  │
│  └───────────────────────────┘ └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  📋 Detailed Tables                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Top Users | Recent Sessions | Feature Analytics           ││
│  │  [User List with Activity Metrics]                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Color Scheme & Branding

```css
/* Primary Colors */
--primary-blue: #3B82F6;
--primary-dark: #1E40AF;
--success-green: #10B981;
--warning-yellow: #F59E0B;
--danger-red: #EF4444;

/* Chart Colors */
--chart-colors: [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
];

/* Background */
--bg-primary: #F8FAFC;
--bg-secondary: #FFFFFF;
--border-color: #E2E8F0;
```

## 📊 Dashboard Components

### 1. Key Metrics Cards
```typescript
interface MetricCard {
  title: string;
  value: number | string;
  change: {
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon: ReactNode;
  format: 'number' | 'currency' | 'percentage' | 'duration';
}

const keyMetrics: MetricCard[] = [
  {
    title: 'Daily Active Users',
    value: 1234,
    change: { percentage: 12.5, trend: 'up', period: '7d' },
    icon: <Users />,
    format: 'number'
  },
  {
    title: 'Monthly Active Users', 
    value: 12456,
    change: { percentage: 8.3, trend: 'up', period: '30d' },
    icon: <TrendingUp />,
    format: 'number'
  },
  {
    title: 'Active Sessions',
    value: 2567,
    change: { percentage: 15.2, trend: 'up', period: '24h' },
    icon: <Activity />,
    format: 'number'
  },
  {
    title: 'Monthly Revenue',
    value: 4890,
    change: { percentage: 22.1, trend: 'up', period: '30d' },
    icon: <DollarSign />,
    format: 'currency'
  }
];
```

### 2. User Activity Chart
```typescript
interface ActivityChartProps {
  data: {
    date: string;
    activeUsers: number;
    newUsers: number;
    sessions: number;
  }[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: string) => void;
}
```

### 3. Feature Usage Donut Chart
```typescript
interface FeatureUsageData {
  feature: string;
  usage: number;
  percentage: number;
  color: string;
}

const featureUsage: FeatureUsageData[] = [
  { feature: 'Voice Conversations', usage: 4521, percentage: 45, color: '#3B82F6' },
  { feature: 'Text Chat', usage: 3516, percentage: 35, color: '#10B981' },
  { feature: 'Lesson Practice', usage: 2008, percentage: 20, color: '#F59E0B' }
];
```

### 4. Geographic Heat Map
```typescript
interface GeographicData {
  country: string;
  countryCode: string;
  users: number;
  sessions: number;
  coordinates: [number, number];
}

interface MapComponentProps {
  data: GeographicData[];
  interactive: boolean;
  showTooltips: boolean;
}
```

### 5. Device & Browser Analytics
```typescript
interface DeviceAnalytics {
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
```

### 6. Performance Metrics
```typescript
interface PerformanceMetrics {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
    trend: number[];
  };
  errorRate: {
    percentage: number;
    count: number;
    byEndpoint: Record<string, number>;
  };
  uptime: {
    percentage: number;
    incidents: number;
  };
}
```

## 🔧 Technical Architecture

### Frontend Components Structure
```
apps/web/src/components/analytics/
├── PlatformDashboard.tsx           # Main dashboard container
├── MetricsCards/
│   ├── MetricCard.tsx             # Individual metric card
│   ├── MetricsGrid.tsx            # Grid layout for cards
│   └── MetricsTrend.tsx           # Trend indicators
├── Charts/
│   ├── UserActivityChart.tsx      # Line chart for user activity
│   ├── FeatureUsageChart.tsx      # Donut chart for features
│   ├── GeographicMap.tsx          # Interactive world map
│   ├── DeviceBreakdown.tsx        # Device analytics charts
│   └── PerformanceCharts.tsx      # Performance metrics
├── Tables/
│   ├── TopUsersTable.tsx          # Most active users
│   ├── RecentSessionsTable.tsx    # Recent activity
│   └── FeatureAnalyticsTable.tsx  # Detailed feature stats
├── Controls/
│   ├── TimeRangeSelector.tsx      # Date range picker
│   ├── ExportButton.tsx           # Data export functionality
│   ├── RefreshButton.tsx          # Manual refresh
│   └── RealTimeToggle.tsx         # Live updates toggle
└── Filters/
    ├── UserSegmentFilter.tsx      # Filter by user segments
    ├── GeographicFilter.tsx       # Filter by location
    └── FeatureFilter.tsx          # Filter by features
```

### State Management (Zustand)
```typescript
interface AnalyticsStore {
  // Data
  metrics: PlatformMetrics | null;
  userActivity: UserActivityData[];
  featureUsage: FeatureUsageData[];
  geographicData: GeographicData[];
  performanceData: PerformanceMetrics | null;
  
  // UI State
  timeRange: TimeRange;
  isLoading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  realTimeEnabled: boolean;
  
  // Actions
  fetchDashboardData: (timeRange: TimeRange) => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  toggleRealTime: () => void;
  exportData: (format: 'csv' | 'pdf' | 'excel') => Promise<void>;
  refreshData: () => Promise<void>;
}
```

### API Integration
```typescript
interface AnalyticsAPI {
  getDashboardMetrics(params: DashboardParams): Promise<PlatformMetrics>;
  getUserActivity(params: ActivityParams): Promise<UserActivityData[]>;
  getFeatureUsage(params: UsageParams): Promise<FeatureUsageData[]>;
  getGeographicData(params: GeoParams): Promise<GeographicData[]>;
  getPerformanceMetrics(params: PerfParams): Promise<PerformanceMetrics>;
  exportDashboard(format: ExportFormat, params: ExportParams): Promise<Blob>;
}
```

## 🎯 User Experience Features

### 1. Interactive Elements
- **Hover Effects**: Smooth hover states on all interactive elements
- **Click Interactions**: Charts respond to clicks for detailed views
- **Drag & Drop**: Customizable dashboard layout
- **Tooltips**: Contextual information on hover

### 2. Responsive Design
```css
/* Mobile First Approach */
.dashboard-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
  
  @media (min-width: 1440px) {
    grid-template-columns: repeat(6, 1fr);
  }
}
```

### 3. Loading States
```typescript
interface LoadingStates {
  skeleton: boolean;      // Show skeleton loaders
  shimmer: boolean;       // Shimmer effect on cards
  progressive: boolean;   // Load charts progressively
  realTime: boolean;      // Real-time data indicators
}
```

### 4. Error Handling
```typescript
interface ErrorStates {
  noData: ReactNode;          // Empty state component
  networkError: ReactNode;    // Network failure state
  serverError: ReactNode;     // 5xx error state
  retry: () => void;          // Retry mechanism
}
```

## 📱 Real-time Features

### WebSocket Integration
```typescript
interface RealTimeData {
  activeUsers: number;
  currentSessions: number;
  recentActivities: Activity[];
  systemHealth: HealthStatus;
}

class AnalyticsWebSocket {
  private ws: WebSocket;
  private reconnectAttempts: number = 0;
  
  connect(): void;
  disconnect(): void;
  subscribe(event: string, callback: (data: any) => void): void;
  unsubscribe(event: string): void;
}
```

### Live Updates
- **Auto-refresh**: Configurable intervals (5s, 30s, 1m, 5m)
- **Smart Updates**: Only update changed data
- **Connection Status**: Visual indicator of real-time connection
- **Offline Mode**: Graceful degradation when offline

## 🎨 Animation & Micro-interactions

### Chart Animations
```typescript
const chartAnimations = {
  enter: {
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 0.6,
    easing: 'easeOutCubic'
  },
  update: {
    duration: 0.4,
    easing: 'easeInOutQuad'
  },
  hover: {
    scale: 1.05,
    duration: 0.2
  }
};
```

### Card Interactions
```css
.metric-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
}
```

## 📊 Data Visualization Library

### Chart.js Integration
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
```

### Custom Chart Themes
```typescript
const chartTheme = {
  colors: {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4'
  },
  fonts: {
    family: 'Inter, sans-serif',
    size: 12,
    weight: 500
  },
  grid: {
    color: '#F1F5F9',
    borderDash: [5, 5]
  }
};
```

## 🔒 Security & Privacy

### Data Protection
- **Role-based Access**: Admin-only dashboard access
- **Data Anonymization**: Personal data protected in exports
- **Audit Logging**: Track dashboard access and exports
- **GDPR Compliance**: Respect user privacy preferences

### API Security
```typescript
interface SecurityMiddleware {
  authenticate: (req: Request) => Promise<User>;
  authorize: (user: User, resource: string) => boolean;
  rateLimit: (user: User) => Promise<boolean>;
  auditLog: (action: string, user: User, resource: string) => void;
}
```

## 📈 Performance Optimization

### Data Caching Strategy
```typescript
interface CacheStrategy {
  redis: {
    keyPrefix: 'analytics';
    ttl: {
      realTime: 30,      // 30 seconds
      hourly: 3600,      // 1 hour
      daily: 86400,      // 24 hours
      monthly: 2592000   // 30 days
    };
  };
  
  clientSide: {
    staleTime: 5 * 60 * 1000,    // 5 minutes
    cacheTime: 10 * 60 * 1000,   // 10 minutes
  };
}
```

### Query Optimization
- **Database Indexing**: Optimized indexes for analytics queries
- **Aggregation**: Pre-computed aggregations for common metrics
- **Pagination**: Efficient data loading for large datasets
- **Compression**: Gzipped API responses

This comprehensive design specification provides the complete blueprint for implementing the Platform Usage Dashboard with a focus on usability, performance, and real-time capabilities.