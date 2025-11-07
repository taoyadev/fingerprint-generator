/**
 * Unit tests for Canvas and WebGL Fingerprint Generator
 */

import { StatisticalCanvasFingerprintGenerator } from '../../src/canvas/CanvasFingerprintGenerator';
import { Fingerprint, BrowserName, DeviceType } from '../../src/types';

describe('CanvasFingerprintGenerator', () => {
  let generator: StatisticalCanvasFingerprintGenerator;
  let mockFingerprint: Fingerprint;

  beforeEach(() => {
    generator = new StatisticalCanvasFingerprintGenerator();

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

  describe('Canvas Fingerprint Generation', () => {
    test('should generate canvas fingerprint data URL', () => {
      const fingerprint = generator.generateCanvasFingerprint(mockFingerprint);

      expect(fingerprint.dataURL).toMatch(/^data:image\/png;base64,/);
      expect(fingerprint.textHash).toBeTruthy();
      expect(fingerprint.shapesHash).toBeTruthy();
      expect(fingerprint.imageHash).toBeTruthy();
      expect(fingerprint.gradientHash).toBeTruthy();
      expect(fingerprint.compositeHash).toBeTruthy();
    });

    test('should generate consistent canvas fingerprints with same seed', () => {
      const generator1 = new StatisticalCanvasFingerprintGenerator(12345);
      const generator2 = new StatisticalCanvasFingerprintGenerator(12345);

      const result1 = generator1.generateCanvasFingerprint(mockFingerprint);
      const result2 = generator2.generateCanvasFingerprint(mockFingerprint);

      expect(result1.textHash).toBe(result2.textHash);
      expect(result1.shapesHash).toBe(result2.shapesHash);
      expect(result1.imageHash).toBe(result2.imageHash);
    });

    test('should generate different canvas fingerprints with different seeds', () => {
      const generator1 = new StatisticalCanvasFingerprintGenerator(12345);
      const generator2 = new StatisticalCanvasFingerprintGenerator(99999);

      const result1 = generator1.generateCanvasFingerprint(mockFingerprint);
      const result2 = generator2.generateCanvasFingerprint(mockFingerprint);

      // The randomization should create differences
      expect(result1.textHash).not.toBe(result2.textHash);
      expect(result1.shapesHash).not.toBe(result2.shapesHash);
    });

    test('should render text with browser-specific variations', () => {
      const result = generator.generateCanvasFingerprint(mockFingerprint);

      expect(result.textRendering).toBeDefined();
      expect(result.textRendering.font).toBeTruthy();
      expect(result.textRendering.textBaseline).toBeTruthy();
      expect(result.textRendering.textAlign).toBeTruthy();
      expect(result.textRendering.antialiasing).toBe(true);
    });

    test('should render shapes with consistent styling', () => {
      const result = generator.generateCanvasFingerprint(mockFingerprint);

      expect(result.shapeRendering).toBeDefined();
      expect(result.shapeRendering.lineJoin).toBeTruthy();
      expect(result.shapeRendering.lineCap).toBeTruthy();
      expect(result.shapeRendering.miterLimit).toBeGreaterThan(0);
    });
  });

  describe('WebGL Fingerprint Generation', () => {
    test('should generate WebGL fingerprint with GPU info', () => {
      const fingerprint = generator.generateWebGLFingerprint(mockFingerprint);

      expect(fingerprint.gpuInfo).toBeDefined();
      expect(fingerprint.gpuInfo.vendor).toBeTruthy();
      expect(fingerprint.gpuInfo.renderer).toBeTruthy();
      expect(fingerprint.vertexShaderHash).toBeTruthy();
      expect(fingerprint.fragmentShaderHash).toBeTruthy();
      expect(fingerprint.extensions).toBeDefined();
      expect(Array.isArray(fingerprint.extensions)).toBe(true);
    });

    test('should generate realistic GPU info for Windows desktop', () => {
      const result = generator.generateWebGLFingerprint(mockFingerprint);

      expect(['NVIDIA', 'AMD', 'Intel']).toContain(result.gpuInfo.vendor.split(' ')[0]);
      expect(result.gpuInfo.vendor.length).toBeGreaterThan(5);
      expect(result.gpuInfo.renderer.length).toBeGreaterThan(10);
    });

    test('should handle mobile GPU selection', () => {
      mockFingerprint.device.type = 'mobile' as DeviceType;
      mockFingerprint.device.platform.name = 'android';

      const result = generator.generateWebGLFingerprint(mockFingerprint);

      expect(result.gpuInfo.vendor).toBeTruthy();
      expect(['Qualcomm', 'ARM', 'NVIDIA', 'Intel', 'Imagination']).toContain(
        result.gpuInfo.vendor.split(' ')[0]
      );
    });

    test('should handle macOS GPU selection', () => {
      mockFingerprint.device.platform.name = 'macos';

      const result = generator.generateWebGLFingerprint(mockFingerprint);

      expect(['Apple', 'AMD', 'Intel']).toContain(result.gpuInfo.vendor.split(' ')[0]);
    });

    test('should include WebGL parameters', () => {
      const result = generator.generateWebGLFingerprint(mockFingerprint);

      expect(result.parameters).toBeDefined();
      expect(result.parameters.VENDOR).toBeTruthy();
      expect(result.parameters.RENDERER).toBeTruthy();
      expect(result.parameters.VERSION).toBeTruthy();
      expect(result.parameters.MAX_TEXTURE_SIZE).toBeGreaterThan(0);
    });
  });

  describe('Audio Fingerprint Generation', () => {
    test('should generate audio fingerprint', () => {
      const fingerprint = generator.generateAudioFingerprint(mockFingerprint);

      expect(fingerprint.oscillatorHash).toBeTruthy();
      expect(fingerprint.noiseHash).toBeTruthy();
      expect(fingerprint.compressorHash).toBeTruthy();
      expect(fingerprint.sampleRate).toBeGreaterThan(0);
    });

    test('should use standard sample rates', () => {
      const result = generator.generateAudioFingerprint(mockFingerprint);

      expect([44100, 48000, 88200, 96000, 176400, 192000]).toContain(result.sampleRate);
    });

    test('should include audio context features', () => {
      const result = generator.generateAudioFingerprint(mockFingerprint);

      expect(result.contextFeatures).toBeDefined();
      expect(result.contextFeatures.maxChannelsInput).toBeGreaterThan(0);
      expect(result.contextFeatures.maxChannelsOutput).toBeGreaterThan(0);
    });

    test('should disable audio for older browsers', () => {
      mockFingerprint.browser.majorVersion = 50;
      const fingerprint = generator.generateAudioFingerprint(mockFingerprint);

      expect(fingerprint.contextFeatures.disabled).toBe(true);
    });
  });

  describe('Font Detection', () => {
    test('should detect system fonts', () => {
      const fontDetection = generator.detectFonts(mockFingerprint);

      expect(fontDetection.systemFonts).toBeDefined();
      expect(Array.isArray(fontDetection.systemFonts)).toBe(true);
      expect(fontDetection.systemFonts.length).toBeGreaterThan(0);
      expect(fontDetection.fontSupport).toBeDefined();
    });

    test('should detect web fonts', () => {
      const fontDetection = generator.detectFonts(mockFingerprint);

      expect(fontDetection.webFonts).toBeDefined();
      expect(Array.isArray(fontDetection.webFonts)).toBe(true);
      expect(fontDetection.webFonts.length).toBeGreaterThan(0);
    });

    test('should generate font signature', () => {
      const fontDetection = generator.detectFonts(mockFingerprint);

      expect(fontDetection.fontSignature).toBeTruthy();
      expect(fontDetection.fontSignature.length).toBeGreaterThan(10);
    });

    test('should have platform-specific fonts', () => {
      const windowsResult = generator.detectFonts(mockFingerprint);

      mockFingerprint.device.platform.name = 'macos';
      const macosResult = generator.detectFonts(mockFingerprint);

      // Different platforms should have different font signatures
      expect(windowsResult.fontSignature).not.toBe(macosResult.fontSignature);
    });
  });

  describe('Fingerprint Generation', () => {
    test('should generate complete fingerprint', () => {
      const fingerprint = generator.generateFingerprint(mockFingerprint);

      expect(fingerprint.canvas).toBeDefined();
      expect(fingerprint.webgl).toBeDefined();
      expect(fingerprint.audio).toBeDefined();
      expect(fingerprint.fonts).toBeDefined();
      expect(fingerprint.consistencyScore).toBeGreaterThan(0);
      expect(fingerprint.generationTime).toBeGreaterThan(0);
    });

    test('should include rendering quality metrics', () => {
      const fingerprint = generator.generateFingerprint(mockFingerprint);

      expect(fingerprint.canvas.renderingQuality.colorDepth).toBe(24);
      expect(fingerprint.canvas.renderingQuality.pixelRatio).toBe(1);
      expect(fingerprint.canvas.renderingQuality.hardwareAcceleration).toBe(true);
    });

    test('should handle mobile-specific rendering', () => {
      mockFingerprint.device.type = 'mobile' as DeviceType;
      const fingerprint = generator.generateFingerprint(mockFingerprint);

      expect(fingerprint.webgl.gpuInfo.vendor).toBeTruthy();
      // Mobile may have different pixel ratios
      expect(fingerprint.canvas.renderingQuality.pixelRatio).toBeGreaterThan(0);
    });

    test('should validate canvas fingerprint consistency', () => {
      const canvasFingerprint = generator.generateCanvasFingerprint(mockFingerprint);
      const validation = generator.validateCanvasConsistency(canvasFingerprint, mockFingerprint);

      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(0);
      expect(validation.warnings).toBeDefined();
    });

    test('should detect inconsistencies in color depth', () => {
      mockFingerprint.device.screenResolution.colorDepth = 16; // Low color depth
      const canvasFingerprint = generator.generateCanvasFingerprint(mockFingerprint);

      // Manually create inconsistency for testing
      canvasFingerprint.renderingQuality.colorDepth = 32;

      const validation = generator.validateCanvasConsistency(canvasFingerprint, mockFingerprint);

      expect(validation.score).toBeLessThan(1);
      expect(validation.warnings.some((w: string) => w.includes('color depth'))).toBe(true);
    });

    test('should detect inconsistencies in pixel ratio', () => {
      mockFingerprint.device.screenResolution.pixelRatio = 1;
      const canvasFingerprint = generator.generateCanvasFingerprint(mockFingerprint);

      // Manually create inconsistency
      canvasFingerprint.renderingQuality.pixelRatio = 3;

      const validation = generator.validateCanvasConsistency(canvasFingerprint, mockFingerprint);

      expect(validation.score).toBeLessThan(1);
      expect(validation.warnings.some((w: string) => w.includes('pixel ratio'))).toBe(true);
    });
  });

  describe('Batch Generation', () => {
    test('should generate multiple fingerprints', () => {
      const fingerprints = [
        mockFingerprint,
        { ...mockFingerprint, browser: { ...mockFingerprint.browser, name: 'firefox' as BrowserName } },
        { ...mockFingerprint, device: { ...mockFingerprint.device, type: 'mobile' as DeviceType } }
      ];

      const results = generator.generateBatch(fingerprints);

      expect(results).toHaveLength(3);
      results.forEach((result: any) => {
        expect(result.canvas).toBeDefined();
        expect(result.webgl).toBeDefined();
        expect(result.audio).toBeDefined();
        expect(result.fonts).toBeDefined();
      });
    });

    test('should generate different fingerprints for different browsers', () => {
      const chromeFP = { ...mockFingerprint, browser: { name: 'chrome' as BrowserName, version: '120.0.0.0', majorVersion: 120 } };
      const firefoxFP = { ...mockFingerprint, browser: { name: 'firefox' as BrowserName, version: '119.0.0.0', majorVersion: 119 } };

      const chromeResult = generator.generateFingerprint(chromeFP);
      const firefoxResult = generator.generateFingerprint(firefoxFP);

      // Should have different font signatures
      expect(chromeResult.fonts.fontSignature).not.toBe(firefoxResult.fonts.fontSignature);
    });
  });

  describe('Performance', () => {
    test('should generate fingerprints efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        generator.generateFingerprint(mockFingerprint);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should generate 100 fingerprints in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    test('should handle batch generation efficiently', () => {
      const fingerprints = Array(50).fill(null).map(() => mockFingerprint);
      const startTime = Date.now();

      const results = generator.generateBatch(fingerprints);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('GPU Data Management', () => {
    test('should cache GPU data after first access', () => {
      // Clear cache first
      generator['gpuDataCache'].clear();

      const result1 = generator.generateWebGLFingerprint(mockFingerprint);
      const cacheSize1 = generator['gpuDataCache'].size;

      const result2 = generator.generateWebGLFingerprint(mockFingerprint);
      const cacheSize2 = generator['gpuDataCache'].size;

      expect(cacheSize2).toBe(cacheSize1); // Should not grow
      expect(result1.gpuInfo.renderer).toBe(result2.gpuInfo.renderer);
    });

    test('should load real-world GPU data', async () => {
      // Force cache reload
      generator['gpuDataCache'].clear();
      await generator['loadGPUData']();

      expect(generator['gpuDataCache'].size).toBeGreaterThan(0);
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

      const result = generator.generateFingerprint(minimalFingerprint);

      expect(result.canvas).toBeDefined();
      expect(result.webgl).toBeDefined();
      expect(result.audio).toBeDefined();
      expect(result.fonts).toBeDefined();
    });

    test('should handle very new browser versions', () => {
      mockFingerprint.browser.majorVersion = 999;
      const result = generator.generateFingerprint(mockFingerprint);

      expect(result.canvas).toBeDefined();
      expect(result.webgl).toBeDefined();
      expect(result.audio.contextFeatures.disabled).toBe(false);
    });

    test('should handle old browser versions', () => {
      mockFingerprint.browser.majorVersion = 30;
      const result = generator.generateFingerprint(mockFingerprint);

      expect(result.canvas).toBeDefined();
      expect(result.webgl).toBeDefined();
      expect(result.audio.contextFeatures.disabled).toBe(true);
    });
  });

  describe('Hash Generation', () => {
    test('should generate consistent hashes', () => {
      const canvasResult1 = generator.generateCanvasFingerprint(mockFingerprint);
      const canvasResult2 = generator.generateCanvasFingerprint(mockFingerprint);

      // Same generator should produce same hashes
      expect(canvasResult1.textHash).toBe(canvasResult2.textHash);
      expect(canvasResult1.shapesHash).toBe(canvasResult2.shapesHash);
    });

    test('should generate different hashes for different content', () => {
      const webglResult1 = generator.generateWebGLFingerprint(mockFingerprint);

      // Change browser version
      mockFingerprint.browser.majorVersion = 119;
      const webglResult2 = generator.generateWebGLFingerprint(mockFingerprint);

      // Different GPU selection should create different shader hashes
      expect(webglResult1.vertexShaderHash).not.toBe(webglResult2.vertexShaderHash);
    });
  });
});