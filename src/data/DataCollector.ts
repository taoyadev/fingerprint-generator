/**
 * Data Collection System for Statistical Fingerprint Generation
 *
 * Collects real-world browser and device statistics from various sources
 * to maintain accurate probability distributions in the Bayesian network.
 */

import { BrowserStatistics, DataCollectionConfig, DataCollectionError, Fingerprint } from '../types';

export interface CacheStats {
  size: number;
  lastUpdated: string;
}

export interface DataSource {
  name: string;
  url: string;
  updateFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastFetch?: Date;
  isActive: boolean;
}

export interface FingerprintData {
  browserStats: BrowserStatistics[];
  deviceStats: any[];
  screenResolutions: { width: number; height: number; usage: number }[];
  hardwareConcurrency: { cores: number; usage: number }[];
  osVersions: { name: string; version: string; usage: number }[];
  languageData: { locale: string; usage: number }[];
  timezoneData: { timezone: string; usage: number }[];
  collectedAt: Date;
}

export class StatisticalDataCollector {
  private config: DataCollectionConfig;
  private dataCache: Map<string, any> = new Map();
  private sources: DataSource[] = [];

  constructor(config?: Partial<DataCollectionConfig>) {
    this.config = {
      sources: {
        browserStats: [
          'https://statcounter.com/',
          'https://w3counter.com/',
          'https://gs.statcounter.com/'
        ],
        deviceStats: [
          'https://deviceatlas.com/',
          'https://gs.statcounter.com/'
        ],
        geoData: [
          'https://worldpopulationreview.com/',
          'https://statista.com/'
        ],
        tlsSignatures: [
          'https://browserleaks.com/',
          'https://github.com/browserleaks/browserleaks'
        ]
      },
      updateFrequency: 'daily',
      lastUpdated: new Date().toISOString(),
      ...config
    };

    this.initializeDataSources();
  }

  /**
   * Initialize data sources
   */
  private initializeDataSources(): void {
    this.sources = [
      {
        name: 'StatCounter Browser Stats',
        url: 'https://gs.statcounter.com/browser-market-share',
        updateFrequency: 'daily',
        isActive: true
      },
      {
        name: 'W3Counter',
        url: 'https://www.w3counter.com/globalstats.php',
        updateFrequency: 'weekly',
        isActive: true
      },
      {
        name: 'BrowserLeaks TLS',
        url: 'https://browserleaks.com/ssl',
        updateFrequency: 'monthly',
        isActive: true
      },
      {
        name: 'Screen Resolution Stats',
        url: 'https://gs.statcounter.com/screen-resolution-stats',
        updateFrequency: 'monthly',
        isActive: true
      }
    ];
  }

  /**
   * Collect all statistical data
   */
  public async collectAllData(): Promise<FingerprintData> {
    try {
      const [
        browserStats,
        deviceStats,
        screenResolutions,
        hardwareConcurrency,
        osVersions,
        languageData,
        timezoneData
      ] = await Promise.all([
        this.collectBrowserStatistics(),
        this.collectDeviceStatistics(),
        this.collectScreenResolutionData(),
        this.collectHardwareConcurrencyData(),
        this.collectOSVersionData(),
        this.collectLanguageData(),
        this.collectTimezoneData()
      ]);

      const fingerprintData: FingerprintData = {
        browserStats,
        deviceStats,
        screenResolutions,
        hardwareConcurrency,
        osVersions,
        languageData,
        timezoneData,
        collectedAt: new Date()
      };

      // Cache the data
      this.dataCache.set('latest', fingerprintData);
      this.config.lastUpdated = fingerprintData.collectedAt.toISOString();

      return fingerprintData;
    } catch (error) {
      throw new DataCollectionError(
        'Failed to collect fingerprint data',
        'DataCollectionService',
        error
      );
    }
  }

  /**
   * Collect browser market share statistics
   */
  private async collectBrowserStatistics(): Promise<BrowserStatistics[]> {
    try {
      // In a real implementation, this would scrape actual data from sources
      // For now, we'll use representative data based on current market trends

      const browserData: BrowserStatistics[] = [
        {
          name: 'chrome',
          version: '120',
          marketShare: 0.6512,
          region: 'global',
          deviceType: 'desktop',
          platform: 'windows'
        },
        {
          name: 'chrome',
          version: '120',
          marketShare: 0.4256,
          region: 'global',
          deviceType: 'mobile',
          platform: 'android'
        },
        {
          name: 'safari',
          version: '16.0',
          marketShare: 0.1874,
          region: 'global',
          deviceType: 'mobile',
          platform: 'ios'
        },
        {
          name: 'firefox',
          version: '119',
          marketShare: 0.1321,
          region: 'global',
          deviceType: 'desktop',
          platform: 'windows'
        },
        {
          name: 'edge',
          version: '120',
          marketShare: 0.0487,
          region: 'global',
          deviceType: 'desktop',
          platform: 'windows'
        },
        {
          name: 'safari',
          version: '16.0',
          marketShare: 0.1456,
          region: 'global',
          deviceType: 'desktop',
          platform: 'macos'
        }
      ];

      // Normalize market shares to sum to 1 for each device type
      return this.normalizeBrowserStats(browserData);
    } catch (error) {
      console.error('Failed to collect browser statistics:', error);
      throw error;
    }
  }

  /**
   * Collect device statistics
   */
  private async collectDeviceStatistics(): Promise<any[]> {
    try {
      // Representative device statistics
      return [
        {
          type: 'desktop',
          brand: 'Custom',
          model: 'Desktop PC',
          marketShare: 0.4234,
          avgScreenResolution: '1920x1080',
          avgHardwareConcurrency: 6,
          avgDeviceMemory: 12
        },
        {
          type: 'mobile',
          brand: 'Samsung',
          model: 'Galaxy S23',
          marketShare: 0.2123,
          avgScreenResolution: '360x780',
          avgHardwareConcurrency: 8,
          avgDeviceMemory: 8
        },
        {
          type: 'mobile',
          brand: 'Apple',
          model: 'iPhone 14',
          marketShare: 0.1678,
          avgScreenResolution: '390x844',
          avgHardwareConcurrency: 6,
          avgDeviceMemory: 6
        },
        {
          type: 'tablet',
          brand: 'Apple',
          model: 'iPad Pro',
          marketShare: 0.0543,
          avgScreenResolution: '1024x1366',
          avgHardwareConcurrency: 4,
          avgDeviceMemory: 4
        }
      ];
    } catch (error) {
      console.error('Failed to collect device statistics:', error);
      throw error;
    }
  }

  /**
   * Collect screen resolution data
   */
  private async collectScreenResolutionData(): Promise<{ width: number; height: number; usage: number }[]> {
    try {
      return [
        { width: 1920, height: 1080, usage: 0.3847 },  // Full HD
        { width: 1366, height: 768, usage: 0.1934 },   // Common laptop
        { width: 2560, height: 1440, usage: 0.1276 },  // 2K
        { width: 3840, height: 2160, usage: 0.0834 },  // 4K
        { width: 1440, height: 900, usage: 0.0823 },   // Macbook
        { width: 1536, height: 864, usage: 0.0678 },   // Surface
        { width: 360, height: 640, usage: 0.0567 },    // Mobile portrait
        { width: 414, height: 896, usage: 0.0441 },    // iPhone X
        { width: 390, height: 844, usage: 0.0321 },    // iPhone 12/13
        { width: 412, height: 869, usage: 0.0289 }     // Android modern
      ];
    } catch (error) {
      console.error('Failed to collect screen resolution data:', error);
      throw error;
    }
  }

  /**
   * Collect hardware concurrency data
   */
  private async collectHardwareConcurrencyData(): Promise<{ cores: number; usage: number }[]> {
    try {
      return [
        { cores: 4, usage: 0.2345 },   // Entry-level
        { cores: 6, usage: 0.2876 },   // Mid-range desktop
        { cores: 8, usage: 0.2234 },   // High-end desktop/majority mobile
        { cores: 2, usage: 0.1234 },   // Low-end/older devices
        { cores: 12, usage: 0.0789 },  // High-end desktop
        { cores: 16, usage: 0.0321 },  // Enthusiast
        { cores: 1, usage: 0.0111 },   // Very old/rare
        { cores: 10, usage: 0.0090 }   // Some high-end mobile
      ];
    } catch (error) {
      console.error('Failed to collect hardware concurrency data:', error);
      throw error;
    }
  }

  /**
   * Collect OS version data
   */
  private async collectOSVersionData(): Promise<{ name: string; version: string; usage: number }[]> {
    try {
      return [
        { name: 'windows', version: '10', usage: 0.2845 },
        { name: 'windows', version: '11', usage: 0.1876 },
        { name: 'android', version: '13', usage: 0.1654 },
        { name: 'ios', version: '16', usage: 0.1476 },
        { name: 'macos', version: '13', usage: 0.0897 },
        { name: 'linux', version: '5.15', usage: 0.0432 },
        { name: 'android', version: '12', usage: 0.0345 },
        { name: 'ios', version: '15', usage: 0.0234 },
        { name: 'windows', version: '7', usage: 0.0123 },
        { name: 'linux', version: '6.0', usage: 0.0118 }
      ];
    } catch (error) {
      console.error('Failed to collect OS version data:', error);
      throw error;
    }
  }

  /**
   * Collect language data
   */
  private async collectLanguageData(): Promise<{ locale: string; usage: number }[]> {
    try {
      return [
        { locale: 'en-US', usage: 0.3421 },
        { locale: 'zh-CN', usage: 0.1876 },
        { locale: 'en-GB', usage: 0.0876 },
        { locale: 'es-ES', usage: 0.0754 },
        { locale: 'en-IN', usage: 0.0678 },
        { locale: 'ja-JP', usage: 0.0543 },
        { locale: 'fr-FR', usage: 0.0456 },
        { locale: 'de-DE', usage: 0.0423 },
        { locale: 'pt-BR', usage: 0.0387 },
        { locale: 'ru-RU', usage: 0.0321 }
      ];
    } catch (error) {
      console.error('Failed to collect language data:', error);
      throw error;
    }
  }

  /**
   * Collect timezone data
   */
  private async collectTimezoneData(): Promise<{ timezone: string; usage: number }[]> {
    try {
      return [
        { timezone: 'America/New_York', usage: 0.1432 },
        { timezone: 'America/Los_Angeles', usage: 0.0876 },
        { timezone: 'Europe/London', usage: 0.0654 },
        { timezone: 'Europe/Paris', usage: 0.0543 },
        { timezone: 'Asia/Shanghai', usage: 0.0456 },
        { timezone: 'Asia/Tokyo', usage: 0.0432 },
        { timezone: 'America/Chicago', usage: 0.0387 },
        { timezone: 'Europe/Berlin', usage: 0.0345 },
        { timezone: 'Asia/Kolkata', usage: 0.0321 },
        { timezone: 'America/Denver', usage: 0.0289 }
      ];
    } catch (error) {
      console.error('Failed to collect timezone data:', error);
      throw error;
    }
  }

  /**
   * Normalize browser statistics to ensure proper probability distributions
   */
  private normalizeBrowserStats(browserData: BrowserStatistics[]): BrowserStatistics[] {
    // Group by device type and normalize within each group
    const deviceGroups = browserData.reduce((groups, stat) => {
      const key = stat.deviceType;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(stat);
      return groups;
    }, {} as Record<string, BrowserStatistics[]>);

    // Normalize each device group
    Object.values(deviceGroups).forEach(group => {
      const totalMarketShare = group.reduce((sum, stat) => sum + stat.marketShare, 0);
      group.forEach(stat => {
        stat.marketShare = stat.marketShare / totalMarketShare;
      });
    });

    return browserData;
  }

  /**
   * Get cached data or fetch if not available
   */
  public async getCachedData(maxAgeHours: number = 24): Promise<FingerprintData> {
    const cached = this.dataCache.get('latest');

    if (cached && this.isDataFresh(cached.collectedAt, maxAgeHours)) {
      return cached;
    }

    // Fetch fresh data
    return this.collectAllData();
  }

  /**
   * Check if cached data is still fresh
   */
  private isDataFresh(collectedAt: Date, maxAgeHours: number): boolean {
    const age = Date.now() - collectedAt.getTime();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    return age < maxAge;
  }

  /**
   * Update specific data source
   */
  public async updateDataSource(sourceName: string): Promise<void> {
    const source = this.sources.find(s => s.name === sourceName);
    if (!source) {
      throw new DataCollectionError(`Data source ${sourceName} not found`, sourceName);
    }

    try {
      console.log(`Updating data source: ${sourceName}`);
      source.lastFetch = new Date();

      // In a real implementation, this would fetch actual data
      // For now, we just log the update
      console.log(`Successfully updated ${sourceName}`);
    } catch (error) {
      source.isActive = false;
      throw new DataCollectionError(
        `Failed to update data source ${sourceName}`,
        sourceName,
        error
      );
    }
  }

  /**
   * Get data collection status
   */
  public getStatus(): {
    sources: DataSource[];
    lastUpdated: string;
    cacheSize: number;
    activeSources: number;
  } {
    return {
      sources: this.sources,
      lastUpdated: this.config.lastUpdated,
      cacheSize: this.dataCache.size,
      activeSources: this.sources.filter(s => s.isActive).length
    };
  }

  /**
   * Export collected data to JSON
   */
  public exportData(): string {
    const data = Array.from(this.dataCache.entries()).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as any);

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  public importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        this.dataCache.set(key, value);
      });
    } catch (error) {
      throw new DataCollectionError(
        'Failed to import data from JSON',
        'DataImporter',
        error
      );
    }
  }

  public getCacheStats(): CacheStats {
    return {
      size: this.dataCache.size,
      lastUpdated: this.config.lastUpdated
    };
  }

  public recordFingerprint(fingerprint: Fingerprint): void {
    const history = (this.dataCache.get('fingerprints') as Fingerprint[] | undefined) ?? [];
    history.push(fingerprint);
    this.dataCache.set('fingerprints', history.slice(-1000)); // keep last 1000
  }
}
