import React from 'react';
import { Users, TrendingUp, Activity, DollarSign } from 'lucide-react';
import MetricCard from './MetricCard';
import { useAnalyticsMetrics, useAnalyticsLoading } from '../../../stores/analyticsStore';

const MetricsGrid: React.FC = () => {
  const metrics = useAnalyticsMetrics();
  const isLoading = useAnalyticsLoading();

  const metricCards = React.useMemo(() => {
    if (!metrics) return [];

    return [
      {
        title: 'Daily Active Users',
        value: metrics.dailyActiveUsers,
        change: {
          percentage: metrics.changePercentage.dau,
          trend: (metrics.changePercentage.dau >= 0 ? 'up' : 'down') as 'up' | 'down',
          period: '7d'
        },
        icon: Users,
        format: 'number' as const
      },
      {
        title: 'Monthly Active Users',
        value: metrics.monthlyActiveUsers,
        change: {
          percentage: metrics.changePercentage.mau,
          trend: (metrics.changePercentage.mau >= 0 ? 'up' : 'down') as 'up' | 'down',
          period: '30d'
        },
        icon: TrendingUp,
        format: 'number' as const
      },
      {
        title: 'Active Sessions',
        value: metrics.totalSessions,
        change: {
          percentage: metrics.changePercentage.sessions,
          trend: (metrics.changePercentage.sessions >= 0 ? 'up' : 'down') as 'up' | 'down',
          period: '24h'
        },
        icon: Activity,
        format: 'number' as const
      },
      {
        title: 'Monthly Revenue',
        value: metrics.totalRevenue,
        change: {
          percentage: metrics.changePercentage.revenue,
          trend: (metrics.changePercentage.revenue >= 0 ? 'up' : 'down') as 'up' | 'down',
          period: '30d'
        },
        icon: DollarSign,
        format: 'currency' as const
      }
    ];
  }, [metrics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {isLoading || !metrics ? (
        // Show skeleton cards while loading
        Array.from({ length: 4 }).map((_, index) => (
          <MetricCard
            key={index}
            title=""
            value={0}
            change={{ percentage: 0, trend: 'neutral', period: '' }}
            icon={Users}
            format="number"
            isLoading={true}
          />
        ))
      ) : (
        metricCards.map((card, index) => (
          <MetricCard
            key={index}
            title={card.title}
            value={card.value}
            change={card.change}
            icon={card.icon}
            format={card.format}
            isLoading={false}
          />
        ))
      )}
    </div>
  );
};

export default MetricsGrid;