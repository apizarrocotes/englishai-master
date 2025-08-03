import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

interface GeographicData {
  country: string;
  countryCode: string;
  users: number;
  sessions: number;
  coordinates: [number, number];
}

interface GeographicChartProps {
  height?: number;
  interactive?: boolean;
}

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const GeographicChart: React.FC<GeographicChartProps> = ({ 
  height = 400, 
  interactive = true 
}) => {
  const { geographicData, isLoading } = useAnalyticsStore();
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = React.useState<string>('');
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  const dataToUse = geographicData && geographicData.length > 0 ? geographicData : [];
  
  React.useEffect(() => {
    console.log('🗺️ GeographicChart: geographicData updated:', geographicData?.length || 0, 'records');
  }, [geographicData]);

  // Get user count for a country
  const getUserCount = (countryCode: string): number => {
    const countryData = dataToUse.find(d => d.countryCode === countryCode);
    return countryData?.users || 0;
  };

  // Get color intensity based on user count
  const getCountryColor = (countryCode: string): string => {
    const userCount = getUserCount(countryCode);
    if (userCount === 0) return '#F3F4F6';
    if (userCount < 100) return '#DBEAFE';
    if (userCount < 300) return '#93C5FD';
    if (userCount < 600) return '#60A5FA';
    if (userCount < 1000) return '#3B82F6';
    return '#1D4ED8';
  };

  // Handle mouse events
  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    const countryCode = geo.properties.ISO_A2;
    const countryData = dataToUse.find(d => d.countryCode === countryCode);
    
    if (countryData) {
      setTooltipContent(`${countryData.country}: ${countryData.users} users, ${countryData.sessions} sessions`);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setTooltipContent('');
  };

  const handleClick = (geo: any) => {
    if (interactive) {
      const countryCode = geo.properties.ISO_A2;
      setSelectedCountry(selectedCountry === countryCode ? null : countryCode);
    }
  };

  // Top countries list
  const topCountries = dataToUse
    .sort((a, b) => b.users - a.users)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!dataToUse || dataToUse.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
        </div>
        <div className="flex items-center justify-center flex-col" style={{ height }}>
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500 text-center">No geographic data available</p>
          <p className="text-gray-400 text-sm text-center mt-1">Data will appear as users access the platform</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-2">Users by country</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span className="text-xs">Low</span>
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-xs">High</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* World Map */}
        <div className="lg:col-span-2 relative">
          <div style={{ height }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 100,
                center: [0, 20]
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryCode = geo.properties.ISO_A2;
                      const isSelected = selectedCountry === countryCode;
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getCountryColor(countryCode)}
                          stroke="#FFFFFF"
                          strokeWidth={isSelected ? 2 : 0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: {
                              outline: 'none',
                              stroke: '#374151',
                              strokeWidth: 1.5,
                              cursor: interactive ? 'pointer' : 'default'
                            },
                            pressed: { outline: 'none' }
                          }}
                          onMouseEnter={(event) => handleMouseEnter(geo, event)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleClick(geo)}
                        />
                      );
                    })
                  }
                </Geographies>
                
                {/* Markers for top countries */}
                {dataToUse.slice(0, 3).map((country) => (
                  <Marker key={country.countryCode} coordinates={country.coordinates}>
                    <circle
                      r={Math.sqrt(country.users) / 8}
                      fill="#EF4444"
                      fillOpacity={0.6}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                    />
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Tooltip */}
          {tooltipContent && (
            <div
              className="absolute z-10 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y - 10
              }}
            >
              {tooltipContent}
            </div>
          )}
        </div>

        {/* Top Countries List */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Top Countries</h4>
          <div className="space-y-3">
            {topCountries.map((country, index) => (
              <div
                key={country.countryCode}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{country.country}</p>
                    <p className="text-xs text-gray-500">{country.sessions} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{country.users.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">users</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Global Summary</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-blue-800">
                <span>Total Countries:</span>
                <span className="font-medium">{dataToUse.length}</span>
              </div>
              <div className="flex justify-between text-blue-800">
                <span>Total Users:</span>
                <span className="font-medium">{dataToUse.reduce((sum, c) => sum + c.users, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-800">
                <span>Total Sessions:</span>
                <span className="font-medium">{dataToUse.reduce((sum, c) => sum + c.sessions, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicChart;