import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change: {
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon: LucideIcon;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  format,
  isLoading = false
}) => {
  const formatValue = (val: number | string, fmt: string): string => {
    if (typeof val === 'string') return val;
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'duration':
        const minutes = Math.floor(val / 60);
        const seconds = val % 60;
        return `${minutes}m ${seconds}s`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 truncate">{title}</h3>
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Value */}
      <div className="space-y-2">
        <p className="text-2xl font-bold text-gray-900">
          {formatValue(value, format)}
        </p>
        
        {/* Change indicator */}
        <div className="flex items-center space-x-1">
          <span className={`text-sm font-medium ${getTrendColor(change.trend)}`}>
            {getTrendIcon(change.trend)} {Math.abs(change.percentage)}%
          </span>
          <span className="text-sm text-gray-500">vs {change.period}</span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;