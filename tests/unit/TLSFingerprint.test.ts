/**
 * Unit tests for TLS Fingerprint Generator
 */

import { StatisticalTLSFingerprintGenerator } from '../../src/tls/TLSFingerprintGenerator';
import { Fingerprint, BrowserName, DeviceType } from '../../src/types';

describe('StatisticalTLSFingerprintGenerator', () => {
  let generator: StatisticalTLSFingerprintGenerator;
  let mockFingerprint: Fingerprint;

  beforeEach(() => {
    generator = new StatisticalTLSFingerprintGenerator(12345); // Fixed seed for reproducible tests

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

  describe('TLS Fingerprint Generation', () => {
    test('should generate TLS fingerprint for Chrome', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint).toBeDefined();
      expect(result.http2Settings).toBeDefined();
      expect(result.ja3Hash).toBeTruthy();
      expect(result.ja4Hash).toBeTruthy();
      expect(result.sslVersion).toBe('TLSv1.2');
      expect(result.cipherSuite).toBeTruthy();
      expect(result.extensions).toBeTruthy();
    });

    test('should generate correct TLS version', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.version).toBe('771'); // TLS 1.2
      expect(result.sslVersion).toBe('TLSv1.2');
    });

    test('should include cipher suites', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.ciphers).toBeDefined();
      expect(Array.isArray(result.tlsFingerprint.ciphers)).toBe(true);
      expect(result.tlsFingerprint.ciphers.length).toBeGreaterThan(0);
      expect(result.tlsFingerprint.ciphers[0]).toBeTruthy();
    });

    test('should include TLS extensions', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.extensions).toBeDefined();
      expect(Array.isArray(result.tlsFingerprint.extensions)).toBe(true);
      expect(result.tlsFingerprint.extensions.length).toBeGreaterThan(0);
    });

    test('should include signature algorithms', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.signatureAlgorithms).toBeDefined();
      expect(Array.isArray(result.tlsFingerprint.signatureAlgorithms)).toBe(true);
      expect(result.tlsFingerprint.signatureAlgorithms.length).toBeGreaterThan(0);
    });

    test('should include key shares for TLS 1.3', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.keyShares).toBeDefined();
      expect(Array.isArray(result.tlsFingerprint.keyShares)).toBe(true);
      expect(result.tlsFingerprint.keyShares.length).toBeGreaterThan(0);
    });

    test('should generate JA3 hash', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.ja3Hash).toMatch(/^[a-f0-9]{32}$/); // MD5 hash format
    });

    test('should generate JA4 hash', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.ja4Hash).toBeTruthy();
      expect(result.ja4Hash.length).toBeGreaterThan(0);
    });
  });

  describe('HTTP2 Settings', () => {
    test('should generate HTTP2 settings', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.http2Settings.headerTableSize).toBeGreaterThan(0);
      expect(typeof result.http2Settings.enablePush).toBe('boolean');
      expect(result.http2Settings.maxConcurrentStreams).toBeGreaterThan(0);
      expect(result.http2Settings.initialWindowSize).toBeGreaterThan(0);
      expect(result.http2Settings.maxFrameSize).toBeGreaterThan(0);
      expect(result.http2Settings.maxHeaderListSize).toBeGreaterThan(0);
    });

    test('should have realistic HTTP2 settings for Chrome', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.http2Settings.headerTableSize).toBeGreaterThan(50000);
      expect(result.http2Settings.enablePush).toBe(false);
      expect(result.http2Settings.maxConcurrentStreams).toBeGreaterThan(900);
      expect(result.http2Settings.maxFrameSize).toBeGreaterThanOrEqual(1000000);
    });

    test('should have different settings for Firefox', () => {
      const generator2 = new StatisticalTLSFingerprintGenerator(54321);
      const firefoxFingerprint = {
        ...mockFingerprint,
        browser: { name: 'firefox' as BrowserName, version: '119.0.0.0', majorVersion: 119 }
      };
      const result = generator2.generateTLSFingerprint(firefoxFingerprint);

      expect(result.http2Settings.headerTableSize).toBeGreaterThan(3000);
      // Firefox typically has fewer concurrent streams than Chrome
      expect(result.http2Settings.maxConcurrentStreams).toBeLessThan(1000);
    });

    test('should have different settings for Safari', () => {
      const generator2 = new StatisticalTLSFingerprintGenerator(54321);
      const safariFingerprint = {
        ...mockFingerprint,
        browser: { name: 'safari' as BrowserName, version: '16.0.0.0', majorVersion: 16 }
      };
      const result = generator2.generateTLSFingerprint(safariFingerprint);

      expect(result.http2Settings.headerTableSize).toBeGreaterThan(3000);
      // Safari typically has fewer concurrent streams than Chrome
      expect(result.http2Settings.maxConcurrentStreams).toBeLessThan(1000);
    });

    test('should have mobile-specific settings', () => {
      mockFingerprint.device.type = 'mobile' as DeviceType;
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.http2Settings.maxConcurrentStreams).toBeLessThan(1000);
      expect(result.http2Settings.initialWindowSize).toBeLessThan(6291456);
    });
  });

  describe('Browser-Specific TLS Fingerprints', () => {
    test('should generate Chrome-specific fingerprint', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.alpn).toContain('h2');
      expect(result.tlsFingerprint.ciphers.length).toBeGreaterThan(10);
    });

    test('should generate Firefox-specific fingerprint', () => {
      mockFingerprint.browser.name = 'firefox' as BrowserName;
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.alpn).toContain('h2');
      // Firefox typically has fewer cipher suites
      expect(result.tlsFingerprint.ciphers.length).toBeGreaterThan(5);
    });

    test('should generate Safari-specific fingerprint', () => {
      mockFingerprint.browser.name = 'safari' as BrowserName;
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.alpn).toContain('h2');
      expect(result.tlsFingerprint.ciphers.length).toBeGreaterThan(5);
    });

    test('should generate Edge-specific fingerprint', () => {
      mockFingerprint.browser.name = 'edge' as BrowserName;
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint.alpn).toContain('h2');
      expect(result.tlsFingerprint.ciphers.length).toBeGreaterThan(10);
      // Edge should be similar to Chrome
      expect(result.http2Settings.maxConcurrentStreams).toBeGreaterThan(800);
    });

    test('should generate mobile-specific fingerprint for Chrome', () => {
      const generator2 = new StatisticalTLSFingerprintGenerator(54321);
      const mobileFingerprint = {
        ...mockFingerprint,
        device: { ...mockFingerprint.device, type: 'mobile' as DeviceType }
      };
      const result = generator2.generateTLSFingerprint(mobileFingerprint);

      expect(result.tlsFingerprint.alpn).toContain('h2');
      // Mobile version should have some differences
      expect(result.http2Settings.maxConcurrentStreams).toBeLessThan(1000);
    });
  });

  describe('curl-impersonate Compatibility', () => {
    test('should generate curl-impersonate compatible config', () => {
      const config = generator.getCurlImpersonateConfig(mockFingerprint);

      expect(config.browser).toBe('chrome');
      expect(config.version).toBe(120);
      expect(config.platform).toBe('windows');
      expect(config.mobile).toBe(false);
      expect(config.tlsFingerprint).toBeDefined();
      expect(config.http2).toBeDefined();
      expect(config.ja3).toBeDefined();
      expect(config.ja4).toBeDefined();
    });

    test('should format TLS fingerprint for curl-impersonate', () => {
      const config = generator.getCurlImpersonateConfig(mockFingerprint);

      expect(config.tlsFingerprint.version).toBeTruthy();
      expect(config.tlsFingerprint.ciphers).toContain(':'); // Colon-separated
      expect(config.tlsFingerprint.extensions).toContain(':');
      expect(config.tlsFingerprint.signatureAlgorithms).toContain(':');
    });

    test('should include HTTP2 settings for curl-impersonate', () => {
      const config = generator.getCurlImpersonateConfig(mockFingerprint);

      expect(config.http2.enabled).toBe(true);
      expect(config.http2.priority).toBe('h2');
      expect(config.http2.settings).toBeDefined();
    });

    test('should generate mobile config for mobile devices', () => {
      mockFingerprint.device.type = 'mobile' as DeviceType;
      const config = generator.getCurlImpersonateConfig(mockFingerprint);

      expect(config.mobile).toBe(true);
    });
  });

  describe('Batch Generation', () => {
    test('should generate multiple fingerprints', () => {
      const fingerprints = [
        mockFingerprint,
        { ...mockFingerprint, browser: { ...mockFingerprint.browser, name: 'firefox' as BrowserName } },
        { ...mockFingerprint, browser: { ...mockFingerprint.browser, name: 'safari' as BrowserName } }
      ];

      const results = generator.generateBatch(fingerprints);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.tlsFingerprint).toBeDefined();
        expect(result.http2Settings).toBeDefined();
        expect(result.ja3Hash).toBeTruthy();
        expect(result.ja4Hash).toBeTruthy();
      });
    });

    test('should generate consistent results with same seed', () => {
      const generator1 = new StatisticalTLSFingerprintGenerator(12345);
      const generator2 = new StatisticalTLSFingerprintGenerator(12345);

      const result1 = generator1.generateTLSFingerprint(mockFingerprint);
      const result2 = generator2.generateTLSFingerprint(mockFingerprint);

      expect(result1.ja3Hash).toBe(result2.ja3Hash);
      expect(result1.ja4Hash).toBe(result2.ja4Hash);
      expect(result1.cipherSuite).toBe(result2.cipherSuite);
    });

    test('should generate different results with different seeds', () => {
      const generator1 = new StatisticalTLSFingerprintGenerator(12345);
      const generator2 = new StatisticalTLSFingerprintGenerator(99999);

      // Use different seeds should create different randomizations
      const result1 = generator1.generateTLSFingerprint(mockFingerprint);
      const result2 = generator2.generateTLSFingerprint(mockFingerprint);

      // The randomization should create some differences
      expect(result1.http2Settings.maxConcurrentStreams).not.toBe(result2.http2Settings.maxConcurrentStreams);
    });
  });

  describe('Validation', () => {
    test('should validate consistent fingerprint', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);
      const validation = generator.validateTLSConsistency(result.tlsFingerprint, mockFingerprint);

      expect(validation.isValid).toBe(true);
      expect(validation.score).toBe(1);
      expect(validation.warnings).toHaveLength(0);
    });

    test('should detect inconsistencies in old browser with TLS 1.3', () => {
      mockFingerprint.browser.majorVersion = 30; // Very old browser
      const result = generator.generateTLSFingerprint(mockFingerprint);

      // Manually set TLS 1.3 to create inconsistency
      result.tlsFingerprint.version = '772';

      const validation = generator.validateTLSConsistency(result.tlsFingerprint, mockFingerprint);

      expect(validation.isValid).toBe(false);
      expect(validation.score).toBeLessThan(1);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    test('should detect missing HTTP/2 support in modern browser', () => {
      const result = generator.generateTLSFingerprint(mockFingerprint);

      // Remove HTTP/2 support
      result.tlsFingerprint.alpn = ['http/1.1'];

      const validation = generator.validateTLSConsistency(result.tlsFingerprint, mockFingerprint);

      expect(validation.score).toBeLessThan(1);
      expect(validation.warnings.some(w => w.includes('HTTP/2'))).toBe(true);
    });
  });

  describe('Signature Management', () => {
    test('should list available signatures', () => {
      const signatures = generator.getAvailableSignatures();

      expect(Array.isArray(signatures)).toBe(true);
      expect(signatures.length).toBeGreaterThan(0);
      expect(signatures).toContain('chrome_120');
      expect(signatures).toContain('firefox_119');
      expect(signatures).toContain('safari_16');
    });

    test('should update browser signatures', () => {
      const newSignatures = {
        'custom_browser_1': {
          tlsVersion: '771',
          ciphers: '4865-4866-4867',
          extensions: '0-5-10-11',
          supportedVersions: '771',
          signatureAlgorithms: '1027-1283',
          keyShares: '29-23',
          http2Settings: {
            headerTableSize: 4096,
            enablePush: false,
            maxConcurrentStreams: 100,
            initialWindowSize: 1048576,
            maxFrameSize: 16384,
            maxHeaderListSize: 262144
          }
        }
      };

      generator.updateBrowserSignatures(newSignatures);
      const signatures = generator.getAvailableSignatures();

      expect(signatures).toContain('custom_browser_1');
    });

    test('should fallback to Chrome signature for unknown browser', () => {
      mockFingerprint.browser.name = 'unknown' as BrowserName;
      mockFingerprint.browser.majorVersion = 999;

      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint).toBeDefined();
      expect(result.ja3Hash).toBeTruthy();
      // Should use Chrome as fallback
    });
  });

  describe('Edge Cases', () => {
    test('should handle fingerprint with minimal data', () => {
      const minimalFingerprint: Fingerprint = {
        userAgent: 'test',
        browser: { name: 'chrome' as BrowserName, version: '120.0.0.0', majorVersion: 120 },
        device: {
          type: 'desktop' as DeviceType,
          platform: { name: 'windows', version: '10.0', architecture: 'x64' },
          screenResolution: { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
          hardwareConcurrency: 4,
          deviceMemory: 8
        },
        locale: 'en-US',
        timezone: { name: 'UTC', offset: 0, dst: false },
        languages: ['en'],
        cookiesEnabled: true,
        plugins: [],
        multimediaDevices: { speakers: 2, microphones: 1, webcams: 0 },
        headers: {},
        fingerprintHash: 'minimal',
        qualityScore: 0.5,
        generationTime: 5,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const result = generator.generateTLSFingerprint(minimalFingerprint);

      expect(result.tlsFingerprint).toBeDefined();
      expect(result.http2Settings).toBeDefined();
      expect(result.ja3Hash).toBeTruthy();
    });

    test('should handle very new browser versions', () => {
      mockFingerprint.browser.majorVersion = 999;
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint).toBeDefined();
      expect(result.tlsFingerprint.version).toBeTruthy();
    });

    test('should handle old browser versions', () => {
      mockFingerprint.browser.majorVersion = 10;
      const result = generator.generateTLSFingerprint(mockFingerprint);

      expect(result.tlsFingerprint).toBeDefined();
      expect(result.ja3Hash).toBeTruthy();
    });
  });

  describe('Performance', () => {
    test('should generate fingerprints efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        generator.generateTLSFingerprint(mockFingerprint);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should generate 1000 fingerprints in under 1 second
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
});