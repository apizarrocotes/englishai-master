'use client';

import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../../stores/analyticsStore';

const DebugAnalytics: React.FC = () => {
  const { 
    featureUsage, 
    detailedFeatureUsage, 
    isLoading, 
    error, 
    timeRange,
    fetchFeatureUsage,
    fetchDetailedFeatureUsage 
  } = useAnalyticsStore();

  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<string>('');

  // Test direct API call
  const testDirectAPI = async () => {
    try {
      const response = await fetch('https://89.58.17.78:3001/api/analytics/feature-usage?timeRange=30d', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setRawResponse(JSON.stringify(data, null, 2));
      setDebugInfo({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers.entries()]),
        data: data
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    testDirectAPI();
  }, []);

  const handleFetchFeatureUsage = () => {
    fetchFeatureUsage(timeRange);
  };

  const handleFetchDetailedUsage = () => {
    fetchDetailedFeatureUsage(timeRange);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Analytics Debug Panel</h2>
      
      {/* Store State */}
      <div className="border rounded p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Store State</h3>
        <div className="space-y-2 text-sm">
          <div>Loading: <span className={`font-mono ${isLoading ? 'text-orange-600' : 'text-green-600'}`}>{isLoading.toString()}</span></div>
          <div>Error: <span className={`font-mono ${error ? 'text-red-600' : 'text-green-600'}`}>{error || 'null'}</span></div>
          <div>Time Range: <span className="font-mono text-blue-600">{timeRange}</span></div>
          <div>Feature Usage Length: <span className="font-mono text-blue-600">{featureUsage.length}</span></div>
          <div>Detailed Feature Usage: <span className={`font-mono ${detailedFeatureUsage ? 'text-green-600' : 'text-red-600'}`}>{detailedFeatureUsage ? 'EXISTS' : 'NULL'}</span></div>
        </div>
      </div>

      {/* Actions */}
      <div className="border rounded p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Actions</h3>
        <div className="space-x-2">
          <button 
            onClick={handleFetchFeatureUsage}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Fetch Feature Usage
          </button>
          <button 
            onClick={handleFetchDetailedUsage}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Fetch Detailed Usage
          </button>
          <button 
            onClick={testDirectAPI}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            Test Direct API
          </button>
        </div>
      </div>

      {/* Direct API Test Results */}
      {debugInfo && (
        <div className="border rounded p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Direct API Test</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Raw Response */}
      {rawResponse && (
        <div className="border rounded p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Raw API Response</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {rawResponse}
          </pre>
        </div>
      )}

      {/* Feature Usage Data */}
      {featureUsage.length > 0 && (
        <div className="border rounded p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Feature Usage Data</h3>
          <div className="space-y-1 text-sm">
            {featureUsage.map((feature, index) => (
              <div key={index} className="flex justify-between">
                <span>{feature.feature}</span>
                <span className="font-mono">{feature.usageCount} uses ({feature.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Feature Usage Data */}
      {detailedFeatureUsage && (
        <div className="border rounded p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Detailed Feature Usage</h3>
          <div className="space-y-2 text-sm">
            <div>Overview: {detailedFeatureUsage.overview.length} features</div>
            <div>Trends: {detailedFeatureUsage.trends.length} data points</div>
            <div>Top Users: {detailedFeatureUsage.topUsers.length} users</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugAnalytics;