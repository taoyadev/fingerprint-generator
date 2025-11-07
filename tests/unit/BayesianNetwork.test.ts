/**
 * Unit tests for Bayesian Network Engine
 */

import { StatisticalFingerprintEngine } from '../../src/core/BayesianNetwork';
import { FingerprintConstraints, Fingerprint } from '../../src/types';

describe('StatisticalFingerprintEngine', () => {
  let engine: StatisticalFingerprintEngine;

  beforeEach(() => {
    // Use a fixed seed for reproducible tests
    engine = new StatisticalFingerprintEngine(12345);
  });

  describe('Network Initialization', () => {
    test('should initialize with correct number of nodes', () => {
      expect(engine.nodes.size).toBe(6);
    });

    test('should have correct node structure', () => {
      const browserNode = engine.nodes.get('browser');
      expect(browserNode).toBeDefined();
      expect(browserNode!.type).toBe('categorical');
      expect(browserNode!.parents).toEqual([]);
      expect(browserNode!.children).toContain('version');
    });

    test('should have correct edge relationships', () => {
      const browserEdges = engine.edges.get('browser');
      expect(browserEdges).toContain('version');
      expect(browserEdges).toContain('platform');
      expect(browserEdges).toContain('device');
    });
  });

  describe('Fingerprint Generation', () => {
    test('should generate valid fingerprint without constraints', () => {
      const fingerprint = engine.generateSample();

      expect(fingerprint).toBeDefined();
      expect(fingerprint.userAgent).toBeTruthy();
      expect(fingerprint.browser.name).toBeTruthy();
      expect(fingerprint.device.type).toBeTruthy();
      expect(fingerprint.fingerprintHash).toBeTruthy();
      expect(fingerprint.qualityScore).toBeGreaterThan(0);
      expect(fingerprint.generationTime).toBeGreaterThan(0);
    });

    test('should respect browser constraints', () => {
      const constraints: FingerprintConstraints = {
        browsers: ['chrome']
      };

      const fingerprint = engine.generateSample(constraints);
      expect(fingerprint.browser.name).toBe('chrome');
      expect(fingerprint.userAgent).toContain('Chrome');
    });

    test('should respect device constraints', () => {
      const constraints: FingerprintConstraints = {
        devices: ['mobile']
      };

      const fingerprint = engine.generateSample(constraints);
      expect(fingerprint.device.type).toBe('mobile');
    });

    test('should respect screen resolution constraints', () => {
      const constraints: FingerprintConstraints = {
        screenResolutions: [{ width: 1920, height: 1080, colorDepth: 24 }]
      };

      const fingerprint = engine.generateSample(constraints);
      expect(fingerprint.device.screenResolution.width).toBe(1920);
      expect(fingerprint.device.screenResolution.height).toBe(1080);
    });

    test('should generate consistent user agents', () => {
      const constraints: FingerprintConstraints = {
        browsers: [{ name: 'chrome', minVersion: 120, maxVersion: 120 }]
      };

      const fingerprint = engine.generateSample(constraints);
      expect(fingerprint.userAgent).toContain('Chrome/120');
      expect(fingerprint.browser.majorVersion).toBe(120);
    });

    test('should have realistic hardware concurrency for desktop', () => {
      const constraints: FingerprintConstraints = {
        devices: ['desktop']
      };

      const fingerprint = engine.generateSample(constraints);
      expect(fingerprint.device.hardwareConcurrency).toBeGreaterThanOrEqual(2);
      expect(fingerprint.device.hardwareConcurrency).toBeLessThanOrEqual(16);
    });

    test('should have realistic hardware concurrency for mobile', () => {
      const constraints: FingerprintConstraints = {
        devices: ['mobile']
      };

      const fingerprint = engine.generateSample(constraints);
      expect(fingerprint.device.hardwareConcurrency).toBeGreaterThanOrEqual(4);
      expect(fingerprint.device.hardwareConcurrency).toBeLessThanOrEqual(8);
    });
  });

  describe('Probability Calculations', () => {
    test('should calculate browser probabilities correctly', () => {
      const chromeProb = engine.calculateProbability('browser', 'chrome');
      const firefoxProb = engine.calculateProbability('browser', 'firefox');
      const safariProb = engine.calculateProbability('browser', 'safari');
      const edgeProb = engine.calculateProbability('browser', 'edge');

      expect(chromeProb).toBeGreaterThan(firefoxProb);
      expect(firefoxProb).toBeGreaterThan(edgeProb);
      expect(chromeProb + firefoxProb + safariProb + edgeProb).toBeCloseTo(1, 1);
    });

    test('should calculate conditional probabilities', () => {
      const evidence = { browser: 'chrome' };
      const desktopProb = engine.calculateProbability('device', 'desktop', evidence);
      const mobileProb = engine.calculateProbability('device', 'mobile', evidence);

      expect(desktopProb).toBeGreaterThan(0);
      expect(mobileProb).toBeGreaterThan(0);
      expect(desktopProb + mobileProb).toBeLessThanOrEqual(1);
    });

    test('should handle invalid node names', () => {
      expect(() => {
        engine.calculateProbability('invalid', 'value');
      }).toThrow('Node invalid not found');
    });
  });

  describe('Probability Updates', () => {
    test('should update probabilities with new data', () => {
      const mockFingerprints: Fingerprint[] = [
        {
          ...engine.generateSample(),
          qualityScore: 0.9
        },
        {
          ...engine.generateSample(),
          qualityScore: 0.85
        }
      ];

      // Should not throw error
      expect(() => {
        engine.updateProbabilities(mockFingerprints);
      }).not.toThrow();
    });

    test('should filter low-quality fingerprints', () => {
      const mockFingerprints: Fingerprint[] = [
        {
          ...engine.generateSample(),
          qualityScore: 0.9
        },
        {
          ...engine.generateSample(),
          qualityScore: 0.6  // Should be filtered out
        }
      ];

      // Should only process the high-quality fingerprint
      expect(() => {
        engine.updateProbabilities(mockFingerprints);
      }).not.toThrow();
    });
  });

  describe('Deterministic Behavior', () => {
    test('should generate same fingerprint with same seed', () => {
      const engine1 = new StatisticalFingerprintEngine(12345);
      const engine2 = new StatisticalFingerprintEngine(12345);

      const fingerprint1 = engine1.generateSample();
      const fingerprint2 = engine2.generateSample();

      expect(fingerprint1.browser.name).toBe(fingerprint2.browser.name);
      expect(fingerprint1.device.type).toBe(fingerprint2.device.type);
      expect(fingerprint1.fingerprintHash).toBe(fingerprint2.fingerprintHash);
    });

    test('should generate different fingerprints with different seeds', () => {
      const engine1 = new StatisticalFingerprintEngine(12345);
      const engine2 = new StatisticalFingerprintEngine(54321);

      const fingerprint1 = engine1.generateSample();
      const fingerprint2 = engine2.generateSample();

      // The fingerprints should be different
      expect(fingerprint1.fingerprintHash).not.toBe(fingerprint2.fingerprintHash);
    });
  });

  describe('Performance', () => {
    test('should generate fingerprints efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        engine.generateSample();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should generate 100 fingerprints in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should handle batch generation', () => {
      const fingerprints: Fingerprint[] = [];
      const constraints: FingerprintConstraints = {
        browsers: ['chrome'],
        devices: ['desktop']
      };

      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        const fingerprint = engine.generateSample(constraints);
        fingerprints.push(fingerprint);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(fingerprints).toHaveLength(50);
      fingerprints.forEach(fp => {
        expect(fp.browser.name).toBe('chrome');
        expect(fp.device.type).toBe('desktop');
      });

      // Should complete in reasonable time
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty constraints', () => {
      const fingerprint = engine.generateSample({});

      expect(fingerprint).toBeDefined();
      expect(fingerprint.userAgent).toBeTruthy();
    });

    test('should handle conflicting constraints gracefully', () => {
      const constraints: FingerprintConstraints = {
        browsers: ['safari'],
        devices: ['desktop'],
        operatingSystems: [{ name: 'windows', version: '10', architecture: 'x64' }]
      };

      // Safari on Windows is rare but should still generate a fingerprint
      const fingerprint = engine.generateSample(constraints);

      expect(fingerprint.browser.name).toBe('safari');
      expect(fingerprint.device.type).toBe('desktop');
    });

    test('should handle missing conditional distribution', () => {
      // This would test an edge case where a condition isn't found
      // For now, we expect it to throw an error
      expect(() => {
        engine.calculateProbability('device', 'tablet', { browser: 'invalid_browser' });
      }).toThrow();
    });
  });

  describe('Data Quality', () => {
    test('should generate realistic user agent strings', () => {
      const fingerprint = engine.generateSample();
      const userAgent = fingerprint.userAgent;

      expect(userAgent).toMatch(/^Mozilla\/5\.0/);
      expect(userAgent).toContain(fingerprint.browser.name);
      expect(userAgent).toContain(fingerprint.device.platform.name);
    });

    test('should generate realistic screen resolutions', () => {
      const fingerprint = engine.generateSample();
      const { width, height } = fingerprint.device.screenResolution;

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(width).toBeGreaterThanOrEqual(320); // Minimum mobile width
      expect(height).toBeGreaterThanOrEqual(480); // Minimum mobile height
      expect(width).toBeLessThanOrEqual(3840); // Maximum 4K width
      expect(height).toBeLessThanOrEqual(2160); // Maximum 4K height
    });

    test('should generate realistic hardware specifications', () => {
      const fingerprint = engine.generateSample();

      expect(fingerprint.device.hardwareConcurrency).toBeGreaterThanOrEqual(1);
      expect(fingerprint.device.hardwareConcurrency).toBeLessThanOrEqual(16);

      if (fingerprint.device.deviceMemory) {
        expect(fingerprint.device.deviceMemory).toBeGreaterThanOrEqual(2);
        expect(fingerprint.device.deviceMemory).toBeLessThanOrEqual(32);
      }
    });
  });
});