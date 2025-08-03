import { logger } from '../utils/logger';

export interface LocationData {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export class GeoLocationService {
  private static instance: GeoLocationService;
  private cache = new Map<string, LocationData>();
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): GeoLocationService {
    if (!GeoLocationService.instance) {
      GeoLocationService.instance = new GeoLocationService();
    }
    return GeoLocationService.instance;
  }

  /**
   * Get location data from IP address
   */
  async getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
    try {
      // Skip localhost and private IPs
      if (this.isPrivateIP(ipAddress)) {
        return this.getDefaultLocation();
      }

      // Check cache first
      const cacheKey = `location:${ipAddress}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Try multiple free geolocation services
      let locationData = await this.tryIPAPI(ipAddress);
      
      if (!locationData) {
        locationData = await this.tryIPInfo(ipAddress);
      }

      if (!locationData) {
        locationData = await this.tryFreeGeoIP(ipAddress);
      }

      if (!locationData) {
        logger.warn(`Could not get location for IP: ${ipAddress}`);
        return this.getDefaultLocation();
      }

      // Cache the result
      this.cache.set(cacheKey, locationData);
      
      // Clean cache periodically
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheExpiry);

      return locationData;
    } catch (error) {
      logger.error('Error getting location from IP:', error);
      return this.getDefaultLocation();
    }
  }

  /**
   * Try ip-api.com (free, no key required)
   */
  private async tryIPAPI(ipAddress: string): Promise<LocationData | null> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,city,lat,lon,timezone`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          country: data.country,
          countryCode: data.countryCode,
          region: data.region,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone
        };
      }
    } catch (error) {
      logger.debug('ip-api.com failed:', error);
    }
    return null;
  }

  /**
   * Try ipinfo.io (free tier available)
   */
  private async tryIPInfo(ipAddress: string): Promise<LocationData | null> {
    try {
      const response = await fetch(`https://ipinfo.io/${ipAddress}/json`);
      const data = await response.json();

      if (data.country) {
        const [lat, lon] = data.loc ? data.loc.split(',').map(Number) : [0, 0];
        
        return {
          country: this.getCountryName(data.country),
          countryCode: data.country,
          region: data.region,
          city: data.city,
          latitude: lat || undefined,
          longitude: lon || undefined,
          timezone: data.timezone
        };
      }
    } catch (error) {
      logger.debug('ipinfo.io failed:', error);
    }
    return null;
  }

  /**
   * Try freegeoip.app as fallback
   */
  private async tryFreeGeoIP(ipAddress: string): Promise<LocationData | null> {
    try {
      const response = await fetch(`https://freegeoip.app/json/${ipAddress}`);
      const data = await response.json();

      if (data.country_code) {
        return {
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region_name,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.time_zone
        };
      }
    } catch (error) {
      logger.debug('freegeoip.app failed:', error);
    }
    return null;
  }

  /**
   * Check if IP is private/localhost
   */
  private isPrivateIP(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return true;
    }

    // Check for private IP ranges
    const ipv4Regex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
    const match = ip.match(ipv4Regex);
    
    if (match) {
      const a = parseInt(match[1]);
      const b = parseInt(match[2]);
      
      // Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      return (a === 10) ||
             (a === 172 && b >= 16 && b <= 31) ||
             (a === 192 && b === 168);
    }

    return false;
  }

  /**
   * Get country name from country code
   */
  private getCountryName(countryCode: string): string {
    const countries: Record<string, string> = {
      'US': 'United States',
      'ES': 'Spain',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'CA': 'Canada',
      'AU': 'Australia',
      'JP': 'Japan',
      'BR': 'Brazil',
      'IT': 'Italy',
      'IN': 'India',
      'CN': 'China',
      'RU': 'Russia',
      'ZA': 'South Africa',
      'KR': 'South Korea',
      'NL': 'Netherlands',
      'SE': 'Sweden',
      'NO': 'Norway'
    };
    
    return countries[countryCode] || countryCode;
  }

  /**
   * Get default location for localhost/private IPs
   */
  private getDefaultLocation(): LocationData {
    return {
      country: 'Spain', // Default for development
      countryCode: 'ES',
      region: 'Madrid',
      city: 'Madrid',
      latitude: 40.4168,
      longitude: -3.7038,
      timezone: 'Europe/Madrid'
    };
  }

  /**
   * Extract real IP from request (considering proxies, load balancers)
   */
  static extractIPFromRequest(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // Get first IP if multiple (comma-separated)
      return forwarded.split(',')[0].trim();
    }

    return req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  }
}

export default GeoLocationService;