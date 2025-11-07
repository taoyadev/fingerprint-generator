/**
 * Unit tests for Browser Automation Integration
 */

import { BrowserAutomation } from '../../src/automation/BrowserAutomation';
import { Fingerprint, BrowserName, DeviceType } from '../../src/types';

describe('BrowserAutomation', () => {
  let automation: BrowserAutomation;
  let mockFingerprint: Fingerprint;
  let mockHeaders: any;

  beforeEach(() => {
    automation = new BrowserAutomation();

    mockFingerprint = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      browser: {
        name: 'chrome' as BrowserName,
        version: '120.0.0.0',
        majorVersion: 120
      },
      device: {
        type: 'desktop' as DeviceType,
        platform: {
          name: 'windows',
          version: '10.0',
          architecture: 'x64'
        },
        screenResolution: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
          pixelRatio: 1
        },
        hardwareConcurrency: 8,
        deviceMemory: 16
      },
      locale: 'en-US',
      timezone: {
        name: 'America/New_York',
        offset: -300,
        dst: true
      },
      languages: ['en-US', 'en'],
      cookiesEnabled: true,
      plugins: [],
      multimediaDevices: {
        speakers: 2,
        microphones: 1,
        webcams: 0
      },
      headers: {},
      fingerprintHash: 'test123',
      qualityScore: 0.95,
      generationTime: 10,
      timestamp: '2024-01-01T00:00:00.000Z'
    };

    mockHeaders = {
      'user-agent': mockFingerprint.userAgent,
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'sec-ch-ua': '"Google Chrome";v="120", "Chromium";v="120", "Not=A?Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };
  });

  describe('Playwright Configuration', () => {
    test('should generate valid Playwright config', () => {
      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.userAgent).toBe(mockFingerprint.userAgent);
      expect(config.viewport.width).toBe(1920);
      expect(config.viewport.height).toBe(1080);
      expect(config.locale).toBe('en-US');
      expect(config.timezone).toBe('America/New_York');
      expect(config.colorScheme).toBe('light');
      expect(config.reducedMotion).toBe('no-preference');
      expect(config.ignoreHTTPSErrors).toBe(true);
      expect(config.bypassCSP).toBe(true);
    });

    test('should include User-Agent Client Hints for Chrome', () => {
      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.userAgentData).toBeDefined();
      expect(config.userAgentData?.architecture).toBe('x64');
      expect(config.userAgentData?.platform).toBe('Windows');
      expect(config.userAgentData?.mobile).toBe(false);
      expect(config.userAgentData?.brands).toHaveLength(3);
    });

    test('should not include User-Agent Client Hints for Safari', () => {
      mockFingerprint.browser.name = 'safari' as BrowserName;
      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.userAgentData).toBeUndefined();
    });

    test('should include extra HTTP headers', () => {
      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.extraHTTPHeaders).toBeDefined();
      expect(config.extraHTTPHeaders!['sec-ch-ua']).toBe(mockHeaders['sec-ch-ua']);
      expect(config.extraHTTPHeaders!['sec-ch-ua-mobile']).toBe(mockHeaders['sec-ch-ua-mobile']);
      expect(config.extraHTTPHeaders!['sec-ch-ua-platform']).toBe(mockHeaders['sec-ch-ua-platform']);
    });

    test('should generate appropriate permissions', () => {
      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.permissions).toContain('geolocation');
      expect(config.permissions).toContain('notifications');
      expect(config.permissions).toContain('clipboard-read');
      expect(config.permissions).toContain('clipboard-write');
    });

    test('should handle mobile fingerprints', () => {
      mockFingerprint.device.type = 'mobile' as DeviceType;
      mockFingerprint.device.screenResolution = { width: 375, height: 667, colorDepth: 24, pixelRatio: 2 };

      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.viewport.width).toBe(375);
      expect(config.viewport.height).toBe(667);
      expect(config.userAgentData?.mobile).toBe(true);
    });
  });

  describe('Puppeteer Configuration', () => {
    test('should generate valid Puppeteer config', () => {
      const config = automation.toPuppeteerConfig(mockFingerprint, mockHeaders);

      expect(config.userAgent).toBe(mockFingerprint.userAgent);
      expect(config.viewport.width).toBe(1920);
      expect(config.viewport.height).toBe(1080);
      expect(config.locale).toBe('en_US'); // Puppeteer uses underscore
      expect(config.timezone).toBe('America/New_York');
      expect(config.ignoreHTTPSErrors).toBe(true);
      expect(config.headless).toBe(false);
    });

    test('should generate appropriate launch arguments', () => {
      const config = automation.toPuppeteerConfig(mockFingerprint, mockHeaders);

      expect(config.args).toContain('--no-sandbox');
      expect(config.args).toContain('--disable-setuid-sandbox');
      expect(config.args).toContain('--user-agent=' + mockFingerprint.userAgent);
      expect(config.args).toContain('--lang=en-US');
      expect(config.args).toContain('--timezone=America/New_York');
      expect(config.args).toContain('--window-size=1920,1080');
      expect(config.args).toContain('--disable-blink-features=AutomationControlled');
    });

    test('should convert locale format for Puppeteer', () => {
      mockFingerprint.locale = 'zh-CN';
      const config = automation.toPuppeteerConfig(mockFingerprint, mockHeaders);

      expect(config.locale).toBe('zh_CN');
    });

    test('should filter headers appropriately', () => {
      const config = automation.toPuppeteerConfig(mockFingerprint, mockHeaders);

      // Should not include headers that Puppeteer handles automatically
      expect(config.headers['user-agent']).toBeUndefined();
      expect(config.headers['host']).toBeUndefined();

      // Should include other headers
      expect(config.headers.accept).toBe(mockHeaders.accept);
      expect(config.headers['accept-language']).toBe(mockHeaders['accept-language']);
    });
  });

  describe('Stealth Configuration', () => {
    test('should generate stealth config with webdriver hidden', () => {
      const stealthConfig = automation.generateStealthConfig(mockFingerprint);

      expect(stealthConfig.webdriver).toBe(false);
      expect(stealthConfig.plugins).toBeDefined();
      expect(stealthConfig.permissions).toBeDefined();
    });

    test('should include Chrome-specific stealth features', () => {
      const stealthConfig = automation.generateStealthConfig(mockFingerprint);

      expect(stealthConfig.chrome).toBeDefined();
      expect(stealthConfig.chrome?.app.isInstalled).toBe(false);
      expect(stealthConfig.chrome?.csi).toBeDefined();
      expect(stealthConfig.chrome?.loadTimes).toBeDefined();
    });

    test('should not include Chrome features for non-Chrome browsers', () => {
      mockFingerprint.browser.name = 'firefox' as BrowserName;
      const stealthConfig = automation.generateStealthConfig(mockFingerprint);

      expect(stealthConfig.chrome).toBeUndefined();
    });

    test('should generate fake plugins', () => {
      const stealthConfig = automation.generateStealthConfig(mockFingerprint);

      expect(stealthConfig.plugins.length).toBeGreaterThan(0);
      expect(stealthConfig.plugins.some(p => p.name === 'Chrome PDF Plugin')).toBe(true);

      if (mockFingerprint.browser.name === 'chrome' || mockFingerprint.browser.name === 'edge') {
        expect(stealthConfig.plugins.some(p => p.name === 'Google Update')).toBe(true);
      }
    });
  });

  describe('Browser-Specific Features', () => {
    test('should generate Edge user agent data', () => {
      mockFingerprint.browser.name = 'edge' as BrowserName;
      mockFingerprint.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.userAgentData?.brands?.[0]?.brand).toBe('Microsoft Edge');
    });

    test('should handle different platforms', () => {
      const platforms = ['macos', 'linux', 'android'];

      platforms.forEach(platform => {
        mockFingerprint.device.platform.name = platform;
        const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

        expect(config.userAgentData?.platform).toBeDefined();
        expect(config.userAgentData?.platform.length).toBeGreaterThan(0);
      });
    });

    test('should handle different device types', () => {
      const deviceTypes: DeviceType[] = ['desktop', 'mobile', 'tablet'];

      deviceTypes.forEach(deviceType => {
        mockFingerprint.device.type = deviceType;
        const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

        expect(config.viewport.width).toBeGreaterThan(0);
        expect(config.viewport.height).toBeGreaterThan(0);

        if (config.userAgentData) {
          expect(config.userAgentData.mobile).toBe(deviceType === 'mobile');
        }
      });
    });
  });

  describe('Performance and Validation', () => {
    test('should generate configs efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        automation.toPlaywrightConfig(mockFingerprint, mockHeaders);
        automation.toPuppeteerConfig(mockFingerprint, mockHeaders);
        automation.generateStealthConfig(mockFingerprint);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should generate 3000 configs in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should validate viewport dimensions', () => {
      // Test extreme viewport sizes
      mockFingerprint.device.screenResolution = { width: 2560, height: 1440, colorDepth: 32, pixelRatio: 1 };

      const config = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);

      expect(config.viewport.width).toBe(2560);
      expect(config.viewport.height).toBe(1440);
    });

    test('should handle missing optional properties', () => {
      const minimalFingerprint = {
        ...mockFingerprint,
        deviceMemory: undefined as any
      };

      expect(() => {
        automation.toPlaywrightConfig(minimalFingerprint, mockHeaders);
        automation.generateStealthConfig(minimalFingerprint);
      }).not.toThrow();
    });
  });

  describe('Integration Compatibility', () => {
    test('should maintain consistency across config types', () => {
      const playwrightConfig = automation.toPlaywrightConfig(mockFingerprint, mockHeaders);
      const puppeteerConfig = automation.toPuppeteerConfig(mockFingerprint, mockHeaders);

      // Both should have the same user agent
      expect(playwrightConfig.userAgent).toBe(puppeteerConfig.userAgent);

      // Both should have consistent viewport
      expect(playwrightConfig.viewport.width).toBe(puppeteerConfig.viewport.width);
      expect(playwrightConfig.viewport.height).toBe(puppeteerConfig.viewport.height);

      // Both should have same locale (with format difference)
      expect(playwrightConfig.locale).toBe('en-US');
      expect(puppeteerConfig.locale).toBe('en_US');
    });

    test('should generate valid Puppeteer args for different fingerprints', () => {
      const fingerprints = [
        { ...mockFingerprint, browser: { ...mockFingerprint.browser, name: 'chrome' as BrowserName } },
        { ...mockFingerprint, browser: { ...mockFingerprint.browser, name: 'firefox' as BrowserName } },
        { ...mockFingerprint, device: { ...mockFingerprint.device, type: 'mobile' as DeviceType } }
      ];

      fingerprints.forEach(fp => {
        const config = automation.toPuppeteerConfig(fp, mockHeaders);

        expect(config.args).toContain('--user-agent=' + fp.userAgent);
        expect(config.args).toContain('--window-size=' + fp.device.screenResolution.width + ',' + fp.device.screenResolution.height);
        expect(config.args).toContain('--disable-blink-features=AutomationControlled');
      });
    });
  });
});