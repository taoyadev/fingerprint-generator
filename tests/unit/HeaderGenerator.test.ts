/**
 * Unit tests for HTTP Header Generator
 */

import { StatisticalHeaderGenerator } from '../../src/headers/HeaderGenerator';
import { Fingerprint, BrowserName, DeviceType } from '../../src/types';

describe('StatisticalHeaderGenerator', () => {
  let generator: StatisticalHeaderGenerator;
  let mockFingerprint: Fingerprint;

  beforeEach(() => {
    generator = new StatisticalHeaderGenerator();

    // Create a mock fingerprint for testing
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
  });

  describe('Header Generation', () => {
    test('should generate basic headers for Chrome', () => {
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.fingerprint).toBe(mockFingerprint);
      expect(result.headers['user-agent']).toBe(mockFingerprint.userAgent);
      expect(result.headers.accept).toBeTruthy();
      expect(result.headers['accept-language']).toBeTruthy();
      expect(result.headers['accept-encoding']).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.uniquenessScore).toBeGreaterThan(0);
    });

    test('should include Client Hint headers for Chrome', () => {
      const result = generator.generateHeaders(mockFingerprint, { includeClientHints: true });

      expect(result.headers['sec-ch-ua']).toContain('Google Chrome');
      expect(result.headers['sec-ch-ua-mobile']).toBe('?0');
      expect(result.headers['sec-ch-ua-platform']).toBe('"windows"');
    });

    test('should include Sec-Fetch headers for navigate request', () => {
      const result = generator.generateHeaders(mockFingerprint, {
        requestType: 'navigate'
      });

      expect(result.headers['sec-fetch-dest']).toBe('document');
      expect(result.headers['sec-fetch-mode']).toBe('navigate');
      expect(result.headers['sec-fetch-site']).toBe('none');
      expect(result.headers['sec-fetch-user']).toBe('?1');
    });

    test('should generate different Accept headers for different resource types', () => {
      const documentResult = generator.generateHeaders(mockFingerprint, {
        requestType: 'resource',
        resourceType: 'stylesheet'
      });

      const scriptResult = generator.generateHeaders(mockFingerprint, {
        requestType: 'resource',
        resourceType: 'script'
      });

      const imageResult = generator.generateHeaders(mockFingerprint, {
        requestType: 'resource',
        resourceType: 'image'
      });

      expect(documentResult.headers.accept).toContain('text/css');
      expect(scriptResult.headers.accept).toBe('*/*');
      expect(imageResult.headers.accept).toContain('image/webp');
    });

    test('should generate correct Accept-Language header', () => {
      mockFingerprint.languages = ['en-US', 'en', 'fr'];
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.headers['accept-language']).toBe('en-US,en;q=0.9,fr;q=0.8');
    });

    test('should generate appropriate Accept-Encoding based on browser', () => {
      // Chrome supports Brotli
      const chromeResult = generator.generateHeaders(mockFingerprint);
      expect(chromeResult.headers['accept-encoding']).toContain('br');

      // Safari doesn't support Brotli in our simulation
      mockFingerprint.browser.name = 'safari' as BrowserName;
      const safariResult = generator.generateHeaders(mockFingerprint);
      expect(safariResult.headers['accept-encoding']).not.toContain('br');
    });

    test('should generate DNT header when requested', () => {
      const result = generator.generateHeaders(mockFingerprint, { includeDNT: true });

      expect(result.headers.dnt).toBeDefined();
      expect(['0', '1']).toContain(result.headers.dnt);
    });
  });

  describe('Browser-Specific Headers', () => {
    test('should generate Chrome-specific headers', () => {
      mockFingerprint.browser.name = 'chrome' as BrowserName;
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.headers.accept).toContain('image/webp');
      expect(result.headers['accept-encoding']).toContain('br');
    });

    test('should generate Firefox-specific headers', () => {
      mockFingerprint.browser.name = 'firefox' as BrowserName;
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.headers.accept).toContain('image/webp');
      expect(result.headers['accept-encoding']).toContain('br');
    });

    test('should generate Safari-specific headers', () => {
      mockFingerprint.browser.name = 'safari' as BrowserName;
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.headers.accept).toContain('image/webp');
      expect(result.headers['accept-encoding']).not.toContain('br');
    });

    test('should generate Edge-specific headers', () => {
      mockFingerprint.browser.name = 'edge' as BrowserName;
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.headers.accept).toContain('image/webp');
      expect(result.headers['accept-encoding']).toContain('br');
    });
  });

  describe('Device-Specific Headers', () => {
    test('should generate mobile-specific Client Hints', () => {
      mockFingerprint.device.type = 'mobile' as DeviceType;
      mockFingerprint.browser.name = 'chrome' as BrowserName;

      const result = generator.generateHeaders(mockFingerprint, { includeClientHints: true });

      expect(result.headers['sec-ch-ua-mobile']).toBe('?1');
    });

    test('should generate desktop-specific Client Hints', () => {
      mockFingerprint.device.type = 'desktop' as DeviceType;
      mockFingerprint.browser.name = 'chrome' as BrowserName;

      const result = generator.generateHeaders(mockFingerprint, { includeClientHints: true });

      expect(result.headers['sec-ch-ua-mobile']).toBe('?0');
    });

    test('should not generate Client Hints for browsers that don\'t support them', () => {
      mockFingerprint.browser.name = 'safari' as BrowserName;

      const result = generator.generateHeaders(mockFingerprint, { includeClientHints: true });

      expect(result.headers['sec-ch-ua']).toBeUndefined();
      expect(result.headers['sec-ch-ua-mobile']).toBeUndefined();
      expect(result.headers['sec-ch-ua-platform']).toBeUndefined();
    });
  });

  describe('Use Case Specific Generation', () => {
    test('should generate headers for browser automation', () => {
      const headers = generator.generateForUseCase('browser_automation', mockFingerprint);

      expect(headers['user-agent']).toBe(mockFingerprint.userAgent);
      expect(headers['sec-fetch-dest']).toBe('document');
      expect(headers['sec-fetch-mode']).toBe('navigate');
    });

    test('should generate headers for API client', () => {
      const headers = generator.generateForUseCase('api_client', mockFingerprint);

      expect(headers.accept).toContain('application/json');
      expect(headers['sec-ch-ua']).toBeUndefined(); // API clients don't send client hints
    });

    test('should generate headers for mobile app', () => {
      mockFingerprint.device.type = 'mobile' as DeviceType;
      const headers = generator.generateForUseCase('mobile_app', mockFingerprint);

      expect(headers['sec-ch-ua-mobile']).toBe('?1');
      expect(headers['sec-fetch-site']).toBeUndefined(); // Mobile apps don't send sec-fetch
    });

    test('should generate headers for web crawler', () => {
      const headers = generator.generateForUseCase('web_crawler', mockFingerprint);

      expect(headers.dnt).toBe('1'); // Web crawlers typically respect privacy
      expect(headers['sec-ch-ua']).toBeUndefined(); // Crawlers don't send client hints
    });
  });

  describe('Header Validation', () => {
    test('should detect missing User-Agent header', () => {
      const invalidFingerprint = {
        ...mockFingerprint,
        userAgent: ''
      };

      const result = generator.generateHeaders(invalidFingerprint);

      expect(result.warnings).toContain('Missing User-Agent header');
    });

    test('should detect inconsistent Client Hints', () => {
      const result = generator.generateHeaders(mockFingerprint, {
        includeClientHints: true
      });

      // Manually create inconsistency for testing
      result.headers['sec-ch-ua'] = '"Google Chrome";v="120"';
      // Remove sec-ch-ua-mobile to trigger warning
      delete result.headers['sec-ch-ua-mobile'];

      // Re-validate with modified headers
      const warnings = generator['validateHeaders'](result.headers);
      expect(warnings).toContain('Sec-CH-UA present without Sec-CH-UA-Mobile');
    });

    test('should detect invalid Accept header q-values', () => {
      // This would be caught during validation
      const result = generator.generateHeaders(mockFingerprint);

      // Normal headers should be valid
      expect(result.warnings.filter(w => w.includes('Invalid q-values'))).toHaveLength(0);
    });
  });

  describe('Consistency and Uniqueness', () => {
    test('should calculate high consistency for valid headers', () => {
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.warnings).toHaveLength(0);
    });

    test('should calculate uniqueness score', () => {
      const result = generator.generateHeaders(mockFingerprint);

      expect(result.uniquenessScore).toBeGreaterThan(0);
      expect(result.uniquenessScore).toBeLessThanOrEqual(1);
    });

    test('should penalize consistency for mismatched headers', () => {
      const invalidFingerprint = {
        ...mockFingerprint,
        userAgent: 'different user agent'
      };

      const result = generator.generateHeaders(invalidFingerprint);

      // Manually change the user agent header to simulate inconsistency
      result.headers['user-agent'] = 'another different user agent';

      // Recalculate consistency
      const consistency = generator['calculateHeaderConsistency'](result.headers, invalidFingerprint);
      expect(consistency).toBeLessThanOrEqual(0.7);
    });
  });

  describe('Batch Generation', () => {
    test('should generate headers for multiple fingerprints', () => {
      const fingerprints = [
        mockFingerprint,
        { ...mockFingerprint, browser: { ...mockFingerprint.browser, name: 'firefox' as BrowserName } },
        { ...mockFingerprint, device: { ...mockFingerprint.device, type: 'mobile' as DeviceType } }
      ];

      const results = generator.generateBatch(fingerprints);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.headers['user-agent']).toBeTruthy();
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.uniquenessScore).toBeGreaterThan(0);
      });
    });

    test('should apply same options to all fingerprints in batch', () => {
      const fingerprints = [mockFingerprint, { ...mockFingerprint }];
      const options = { includeDNT: true, includeClientHints: false };

      const results = generator.generateBatch(fingerprints, options);

      results.forEach(result => {
        expect(result.headers.dnt).toBeDefined();
        expect(result.headers['sec-ch-ua']).toBeUndefined();
      });
    });
  });

  describe('Performance', () => {
    test('should generate headers efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        generator.generateHeaders(mockFingerprint);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should generate 1000 header sets in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should handle batch generation efficiently', () => {
      const fingerprints = Array(100).fill(null).map(() => mockFingerprint);
      const startTime = Date.now();

      const results = generator.generateBatch(fingerprints);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty language list', () => {
      const fingerprintWithNoLanguages = {
        ...mockFingerprint,
        languages: []
      };

      const result = generator.generateHeaders(fingerprintWithNoLanguages);

      expect(result.headers['accept-language']).toBeDefined();
    });

    test('should handle very long language list', () => {
      const manyLanguages = Array.from({ length: 20 }, (_, i) => `lang-${i}`);
      const fingerprintWithManyLanguages = {
        ...mockFingerprint,
        languages: manyLanguages
      };

      const result = generator.generateHeaders(fingerprintWithManyLanguages);

      expect(result.headers['accept-language']).toBeDefined();
      expect(result.headers['accept-language']!.split(',').length).toBeGreaterThan(5);
    });

    test('should handle unknown browser gracefully', () => {
      const unknownBrowserFingerprint = {
        ...mockFingerprint,
        browser: {
          name: 'unknown' as BrowserName,
          version: '1.0',
          majorVersion: 1
        }
      };

      const result = generator.generateHeaders(unknownBrowserFingerprint);

      expect(result.headers['user-agent']).toBeTruthy();
      expect(result.headers.accept).toBeTruthy();
    });

    test('should handle HTTP/1 vs HTTP/2 differences', () => {
      const http1Result = generator.generateHeaders(mockFingerprint, { httpVersion: '1' });
      const http2Result = generator.generateHeaders(mockFingerprint, { httpVersion: '2' });

      expect(http1Result.headers['user-agent']).toBe(http2Result.headers['user-agent']);
      expect(http1Result.headers.accept).toBe(http2Result.headers.accept);
    });
  });
});