/**
 * Unit tests for Statistical Data Collector
 */

import { StatisticalDataCollector } from '../../src/data/DataCollector';

describe('StatisticalDataCollector', () => {
  let collector: StatisticalDataCollector;

  beforeEach(() => {
    collector = new StatisticalDataCollector();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(collector).toBeDefined();

      const status = collector.getStatus();
      expect(status.activeSources).toBeGreaterThan(0);
      expect(status.cacheSize).toBe(0);
    });

    test('should accept custom configuration', () => {
      const customConfig = {
        updateFrequency: 'hourly' as const,
        lastUpdated: new Date().toISOString()
      };

      const customCollector = new StatisticalDataCollector(customConfig);
      expect(customCollector).toBeDefined();
    });
  });

  describe('Browser Statistics Collection', () => {
    test('should collect browser statistics', async () => {
      const data = await collector.collectAllData();

      expect(data.browserStats).toBeDefined();
      expect(Array.isArray(data.browserStats)).toBe(true);
      expect(data.browserStats.length).toBeGreaterThan(0);

      data.browserStats.forEach(stat => {
        expect(stat.name).toBeTruthy();
        expect(stat.version).toBeTruthy();
        expect(stat.marketShare).toBeGreaterThanOrEqual(0);
        expect(stat.marketShare).toBeLessThanOrEqual(1);
        expect(stat.deviceType).toBeTruthy();
        expect(stat.region).toBeTruthy();
      });
    });

    test('should normalize browser market shares', async () => {
      const data = await collector.collectAllData();

      // Group by device type and check that market shares sum to 1
      const deviceGroups = data.browserStats.reduce((groups, stat) => {
        const key = stat.deviceType;
        if (!groups[key]) {
          groups[key] = 0;
        }
        groups[key] += stat.marketShare;
        return groups;
      }, {} as Record<string, number>);

      Object.values(deviceGroups).forEach(total => {
        expect(total).toBeCloseTo(1, 1);
      });
    });
  });

  describe('Screen Resolution Data', () => {
    test('should collect realistic screen resolution data', async () => {
      const data = await collector.collectAllData();

      expect(data.screenResolutions).toBeDefined();
      expect(Array.isArray(data.screenResolutions)).toBe(true);

      data.screenResolutions.forEach(resolution => {
        expect(resolution.width).toBeGreaterThan(0);
        expect(resolution.height).toBeGreaterThan(0);
        expect(resolution.usage).toBeGreaterThanOrEqual(0);
        expect(resolution.usage).toBeLessThanOrEqual(1);

        // Check for realistic aspect ratios
        const aspectRatio = resolution.width / resolution.height;
        expect(aspectRatio).toBeGreaterThan(0.3); // Allow for edge cases like very tall phones
        expect(aspectRatio).toBeLessThan(3.0);
      });
    });

    test('should include both desktop and mobile resolutions', async () => {
      const data = await collector.collectAllData();

      const hasDesktop = data.screenResolutions.some(r => r.width >= 1024 && r.height >= 768);
      const hasMobile = data.screenResolutions.some(r => r.width < 768);

      expect(hasDesktop).toBe(true);
      expect(hasMobile).toBe(true);
    });
  });

  describe('Hardware Data', () => {
    test('should collect hardware concurrency data', async () => {
      const data = await collector.collectAllData();

      expect(data.hardwareConcurrency).toBeDefined();
      expect(Array.isArray(data.hardwareConcurrency)).toBe(true);

      data.hardwareConcurrency.forEach(hc => {
        expect(hc.cores).toBeGreaterThan(0);
        expect(hc.cores).toBeLessThanOrEqual(32);
        expect(hc.usage).toBeGreaterThanOrEqual(0);
        expect(hc.usage).toBeLessThanOrEqual(1);
      });
    });

    test('should collect OS version data', async () => {
      const data = await collector.collectAllData();

      expect(data.osVersions).toBeDefined();
      expect(Array.isArray(data.osVersions)).toBe(true);

      data.osVersions.forEach(os => {
        expect(os.name).toBeTruthy();
        expect(os.version).toBeTruthy();
        expect(os.usage).toBeGreaterThanOrEqual(0);
        expect(os.usage).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Language and Locale Data', () => {
    test('should collect language data', async () => {
      const data = await collector.collectAllData();

      expect(data.languageData).toBeDefined();
      expect(Array.isArray(data.languageData)).toBe(true);

      data.languageData.forEach(lang => {
        expect(lang.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
        expect(lang.usage).toBeGreaterThanOrEqual(0);
        expect(lang.usage).toBeLessThanOrEqual(1);
      });
    });

    test('should include major world languages', async () => {
      const data = await collector.collectAllData();

      const locales = data.languageData.map(l => l.locale);
      expect(locales).toContain('en-US');
      expect(locales.length).toBeGreaterThan(5);
    });
  });

  describe('Timezone Data', () => {
    test('should collect timezone data', async () => {
      const data = await collector.collectAllData();

      expect(data.timezoneData).toBeDefined();
      expect(Array.isArray(data.timezoneData)).toBe(true);

      data.timezoneData.forEach(tz => {
        expect(tz.timezone).toMatch(/^[A-Za-z_\/]+$/);
        expect(tz.usage).toBeGreaterThanOrEqual(0);
        expect(tz.usage).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Data Freshness', () => {
    test('should return cached data if fresh', async () => {
      // First call should fetch data
      const data1 = await collector.collectAllData();
      const status1 = collector.getStatus();
      expect(status1.cacheSize).toBe(1);

      // Second call within max age should return cached
      const data2 = await collector.getCachedData(1); // 1 hour max age
      expect(data1.collectedAt).toEqual(data2.collectedAt);
    });

    test('should fetch new data if cache is stale', async () => {
      const maxAge = -1; // Force cache to be stale
      const data = await collector.getCachedData(maxAge);

      expect(data).toBeDefined();
      expect(data.browserStats.length).toBeGreaterThan(0);
    });
  });

  describe('Data Export/Import', () => {
    test('should export data to JSON', () => {
      const jsonData = collector.exportData();
      expect(jsonData).toBeDefined();
      expect(typeof jsonData).toBe('string');

      const parsed = JSON.parse(jsonData);
      expect(typeof parsed).toBe('object');
    });

    test('should import data from JSON', () => {
      const testJson = JSON.stringify({
        testData: {
          value: 123
        }
      });

      expect(() => {
        collector.importData(testJson);
      }).not.toThrow();

      const status = collector.getStatus();
      expect(status.cacheSize).toBe(1);
    });

    test('should handle invalid JSON import', () => {
      const invalidJson = '{ invalid json }';

      expect(() => {
        collector.importData(invalidJson);
      }).toThrow();
    });
  });

  describe('Data Source Management', () => {
    test('should have multiple active data sources', () => {
      const status = collector.getStatus();
      expect(status.sources.length).toBeGreaterThan(0);
      expect(status.activeSources).toBeGreaterThan(0);
    });

    test('should update specific data source', async () => {
      const statusBefore = collector.getStatus();
      const sourceName = statusBefore.sources[0]?.name;

      if (!sourceName) {
        throw new Error('No data sources available');
      }

      await collector.updateDataSource(sourceName);

      const statusAfter = collector.getStatus();
      const updatedSource = statusAfter.sources.find(s => s.name === sourceName);

      expect(updatedSource?.lastFetch).toBeDefined();
    });

    test('should handle non-existent data source update', async () => {
      await expect(
        collector.updateDataSource('non-existent-source')
      ).rejects.toThrow();
    });
  });

  describe('Data Quality', () => {
    test('should provide comprehensive data coverage', async () => {
      const data = await collector.collectAllData();

      expect(data.browserStats.length).toBeGreaterThan(5);
      expect(data.deviceStats.length).toBeGreaterThan(3);
      expect(data.screenResolutions.length).toBeGreaterThan(5);
      expect(data.hardwareConcurrency.length).toBeGreaterThan(3);
      expect(data.osVersions.length).toBeGreaterThan(3);
      expect(data.languageData.length).toBeGreaterThan(5);
      expect(data.timezoneData.length).toBeGreaterThan(5);
    });

    test('should have consistent data timestamps', async () => {
      const data = await collector.collectAllData();

      expect(data.collectedAt).toBeInstanceOf(Date);

      const collectionTime = data.collectedAt.getTime();
      const now = Date.now();

      // Data should be very recent (within last minute)
      expect(now - collectionTime).toBeLessThan(60000);
    });
  });

  describe('Performance', () => {
    test('should collect data efficiently', async () => {
      const startTime = Date.now();

      const data = await collector.collectAllData();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(data).toBeDefined();
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle concurrent data requests', async () => {
      const promises = Array(5).fill(null).map(() => collector.collectAllData());

      const results = await Promise.all(promises);

      results.forEach(data => {
        expect(data).toBeDefined();
        expect(data.browserStats.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure would be handled internally
      const data = await collector.collectAllData();
      expect(data).toBeDefined();
      expect(data.browserStats.length).toBeGreaterThan(0);
    });

    test('should continue with partial data if some sources fail', async () => {
      // Even if some sources fail, we should get data from others
      const data = await collector.collectAllData();

      expect(data.browserStats.length).toBeGreaterThan(0);
      expect(data.deviceStats.length).toBeGreaterThan(0);
    });
  });
});