import React from 'react';
import { useAnalyticsStore, TimeRange } from '../../../stores/analyticsStore';

interface TimeRangeSelectorProps {
  className?: string;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ className = '' }) => {
  const { timeRange, setTimeRange } = useAnalyticsStore();

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '1d', label: 'Today' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  return (
    <div className={`inline-flex rounded-lg border border-gray-300 bg-white ${className}`}>
      {timeRangeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setTimeRange(option.value)}
          className={`
            px-4 py-2 text-sm font-medium transition-colors duration-200
            first:rounded-l-lg last:rounded-r-lg
            ${
              timeRange === option.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;