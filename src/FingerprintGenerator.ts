/**
 * Main Fingerprint Generator
 *
 * This is the primary generator interface that integrates all statistical
 * fingerprint generation modules into a cohesive system for creating
 * realistic browser fingerprints that bypass modern anti-bot detection.
 */

import { StatisticalFingerprintEngine } from './core/BayesianNetwork';
import { StatisticalHeaderGenerator } from './headers/HeaderGenerator';
import { StatisticalTLSFingerprintGenerator, TLSFingerprintResult } from './tls/TLSFingerprintGenerator';
import { StatisticalCanvasFingerprintGenerator } from './canvas/CanvasFingerprintGenerator';
import { StatisticalDataCollector } from './data/DataCollector';
import { LRUCache } from './utils/LRUCache';
import {
  Fingerprint,
  CompleteFingerprint,
  GenerationOptions,
  BrowserName,
  DeviceType,
  HTTPHeaders,
  TLSFingerprint,
  CanvasModuleResult,
  FingerprintConstraints,
  FingerprintGenerationResult,
  FingerprintOverrides
} from './types';

export interface GenerationResult {
  fingerprint: Fingerprint;
  headers: HTTPHeaders;
  tlsFingerprint: TLSFingerprint;
  canvasFingerprint: CanvasModuleResult;
  metadata: {
    generationTime: number;
    qualityScore: number;
    uniquenessScore: number;
    consistencyScore: number;
    bypassConfidence: number;
  };
}

export interface BatchResult {
  results: GenerationResult[];
  summary: {
    totalGenerated: number;
    averageQualityScore: number;
    averageUniquenessScore: number;
    averageGenerationTime: number;
    batchId: string;
    timestamp: string;
  };
}

export interface ValidationReport {
  isValid: boolean;
  overallScore: number;
  warnings: string[];
  details: {
    headerConsistency: number;
    tlsConsistency: number;
    canvasConsistency: number;
    browserCompatibility: number;
  };
}

/**
 * Main FingerprintGenerator class
 *
 * This is the primary entry point for generating statistical browser fingerprints.
 * It combines all sub-modules into a unified interface.
 */
export class FingerprintGenerator {
  private bayesianEngine: StatisticalFingerprintEngine;
  private headerGenerator: StatisticalHeaderGenerator;
  private tlsGenerator: StatisticalTLSFingerprintGenerator;
  private canvasGenerator: StatisticalCanvasFingerprintGenerator;
  private dataCollector: StatisticalDataCollector;
  private fingerprintCache: LRUCache<string, GenerationResult>;

  constructor(options: {
    randomSeed?: number;
    enableDataCollection?: boolean;
    cacheSize?: number;
  } = {}) {
    // Initialize all modules with consistent seed for reproducible results
    const seed = options.randomSeed || Date.now();

    this.bayesianEngine = new StatisticalFingerprintEngine(seed);
    this.headerGenerator = new StatisticalHeaderGenerator();
    this.tlsGenerator = new StatisticalTLSFingerprintGenerator(seed);
    this.canvasGenerator = new StatisticalCanvasFingerprintGenerator(seed);
    this.dataCollector = new StatisticalDataCollector();
    this.fingerprintCache = new LRUCache(options.cacheSize || 100);

    // Optionally enable real-world data collection
    if (options.enableDataCollection) {
      this.initializeDataCollection();
    }
  }

  /**
   * Generate a complete browser fingerprint with all modules
  */
  public async generate(options: GenerationOptions = {}): Promise<GenerationResult> {
    const startTime = Date.now();

    // Check cache if not forcing regeneration
    if (!options.forceRegenerate) {
      const cacheKey = JSON.stringify(options);
      const cached = this.fingerprintCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const includeHeaders = options.includeHeaders ?? true;
    const includeTLS = options.includeTLS ?? true;
    const includeCanvas = options.includeCanvas ?? true;

    // Step 1: Generate base statistical fingerprint with constraints
    const constraints = this.extractConstraints(options);
    const baseFingerprint = this.bayesianEngine.generateSample(constraints);
    const fingerprint = this.applyOverrides(baseFingerprint, options.overrides);

    // Step 2: Generate headers
    const headerResult = includeHeaders
      ? this.headerGenerator.generateHeaders(fingerprint, options.headerOptions)
      : this.createEmptyHeaderResult(fingerprint);

    // Step 3: Generate TLS fingerprint
    const tlsResult = includeTLS
      ? this.tlsGenerator.generateTLSFingerprint(fingerprint)
      : this.createEmptyTLSResult(fingerprint);

    // Step 4: Generate canvas/WebGL fingerprint
    const canvasResult = includeCanvas
      ? this.canvasGenerator.generateFingerprint(fingerprint)
      : this.createEmptyCanvasResult(fingerprint);

    const enrichedFingerprint = this.mergeFingerprintModules(fingerprint, headerResult, tlsResult, canvasResult);

    const generationTime = Date.now() - startTime;

    // Step 5: Calculate quality metrics
    const qualityScore = this.calculateQualityScore(enrichedFingerprint, headerResult, tlsResult, canvasResult);
    const uniquenessScore = this.calculateUniquenessScore(enrichedFingerprint, headerResult, tlsResult);
    const consistencyScore = this.calculateConsistencyScore(headerResult, tlsResult, canvasResult);
    const bypassConfidence = this.calculateBypassConfidence(qualityScore, uniquenessScore, consistencyScore);

    try {
      this.dataCollector.recordFingerprint(enrichedFingerprint);
    } catch {
      // Data collection is best-effort; failures should not break generation.
    }

    const result: GenerationResult = {
      fingerprint: enrichedFingerprint,
      headers: headerResult.headers,
      tlsFingerprint: tlsResult.tlsFingerprint,
      canvasFingerprint: canvasResult,
      metadata: {
        generationTime,
        qualityScore,
        uniquenessScore,
        consistencyScore,
        bypassConfidence
      }
    };

    // Cache the result
    if (!options.forceRegenerate) {
      const cacheKey = JSON.stringify(options);
      this.fingerprintCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Generate multiple fingerprints with high efficiency
   */
  public async generateBatch(count: number, options: GenerationOptions = {}): Promise<BatchResult> {
    const startTime = Date.now();
    const batchId = this.generateBatchId();
    const tasks = Array.from({ length: count }, () => this.generate(options));
    const results = await Promise.all(tasks);

    // Calculate batch statistics
    const totalTime = Date.now() - startTime;
    const averageQualityScore = results.reduce((sum, r) => sum + r.metadata.qualityScore, 0) / count;
    const averageUniquenessScore = results.reduce((sum, r) => sum + r.metadata.uniquenessScore, 0) / count;
    const averageGenerationTime = totalTime / count;

    return {
      results,
      summary: {
        totalGenerated: count,
        averageQualityScore,
        averageUniquenessScore,
        averageGenerationTime,
        batchId,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate fingerprint for specific browser
   */
  public async generateForBrowser(
    browserName: BrowserName,
    version: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const overrides: FingerprintOverrides = {
      ...(options.overrides ?? {}),
      browser: {
        ...(options.overrides?.browser ?? {}),
        name: browserName,
        version,
        majorVersion: parseInt(version.split('.')[0] || version, 10)
      }
    };

    return this.generate({
      ...options,
      browsers: [browserName],
      overrides
    });
  }

  /**
   * Generate fingerprint for specific device type
   */
  public async generateForDevice(
    deviceType: DeviceType,
    platform: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const overrides: FingerprintOverrides = {
      ...(options.overrides ?? {}),
      device: {
        ...(options.overrides?.device ?? {}),
        type: deviceType,
        platform: {
          name: platform,
          version: options.overrides?.device?.platform?.version ?? 'latest',
          architecture: options.overrides?.device?.platform?.architecture ?? 'x64'
        },
        screenResolution:
          options.overrides?.device?.screenResolution ?? this.getDefaultScreenResolution(deviceType),
        hardwareConcurrency:
          options.overrides?.device?.hardwareConcurrency ?? this.getDefaultHardwareConcurrency(deviceType),
        deviceMemory:
          options.overrides?.device?.deviceMemory ?? this.getDefaultDeviceMemory(deviceType)
      }
    };

    return this.generate({
      ...options,
      devices: [deviceType],
      operatingSystems: [
        { name: platform, version: 'latest', architecture: overrides.device?.platform?.architecture ?? 'x64' }
      ],
      overrides
    });
  }

  /**
   * Generate curl-impersonate compatible configuration
   */
  public async generateForCurl(fingerprint?: Fingerprint): Promise<any> {
    const result = fingerprint ? { fingerprint } : await this.generate();
    const targetFingerprint = result.fingerprint;
    const headerResult = this.headerGenerator.generateHeaders(targetFingerprint);
    const tlsResult = this.tlsGenerator.generateTLSFingerprint(targetFingerprint);

    const curlConfig = {
      browser: targetFingerprint.browser.name,
      version: targetFingerprint.browser.majorVersion,
      platform: targetFingerprint.device.platform.name,
      mobile: targetFingerprint.device.type === 'mobile',
      user_agent: targetFingerprint.userAgent,
      headers: headerResult.headers,
      tls: this.tlsGenerator.getCurlImpersonateConfig(targetFingerprint),
      ja3: tlsResult.ja3Hash,
      ja4: tlsResult.ja4Hash
    };

    return curlConfig;
  }

  /**
   * Validate fingerprint consistency and quality
   */
  public validate(result: GenerationResult): ValidationReport {
    const warnings: string[] = [];

    // Validate header consistency
    const headerConsistency = this.headerGenerator.calculateHeaderConsistency(result.headers, result.fingerprint);
    const headerWarnings = this.headerGenerator.validateHeaders(result.headers);
    if (headerConsistency < 0.8) {
      warnings.push('Header consistency issues detected');
    }
    if (headerWarnings.length > 0) {
      warnings.push(...headerWarnings);
    }

    // Validate TLS consistency
    const tlsValidation = this.tlsGenerator.validateTLSConsistency(result.tlsFingerprint, result.fingerprint);
    const tlsConsistency = tlsValidation.score;
    if (tlsValidation.warnings.length > 0) {
      warnings.push(...tlsValidation.warnings);
    }

    // Validate canvas consistency
    const canvasValidation = this.canvasGenerator.validateCanvasConsistency(result.canvasFingerprint.canvas, result.fingerprint);
    const canvasConsistency = canvasValidation.score;
    if (canvasValidation.warnings.length > 0) {
      warnings.push(...canvasValidation.warnings);
    }

    // Validate browser compatibility
    const browserCompatibility = this.validateBrowserCompatibility(result.fingerprint);

    const overallScore = (headerConsistency + tlsConsistency + canvasConsistency + browserCompatibility) / 4;

    return {
      isValid: warnings.length === 0 && overallScore > 0.8,
      overallScore,
      warnings,
      details: {
        headerConsistency,
        tlsConsistency,
        canvasConsistency,
        browserCompatibility
      }
    };
  }

  /**
   * Get statistics about generated fingerprints
   */
  public getStatistics() {
    return {
      bayesianEngine: this.bayesianEngine.getStatistics(),
      availableTLS: this.tlsGenerator.getAvailableSignatures(),
      gpuDataLoaded: this.canvasGenerator.gpuDataCache.size,
      dataCollectorStats: this.dataCollector.getCacheStats()
    };
  }

  /**
   * Update with new real-world data
   */
  public async updateData() {
    try {
      await this.dataCollector.collectAllData();
      console.log('✅ Data collection completed successfully');
    } catch (error) {
      console.error('❌ Data collection failed:', error);
    }
  }

  /**
   * Create CompleteFingerprint object for legacy compatibility
   */
  public createCompleteFingerprint(result: GenerationResult): CompleteFingerprint {
    return {
      fingerprint: result.fingerprint,
      headers: result.headers,
      tlsFingerprint: result.tlsFingerprint,
      canvasFingerprint: result.canvasFingerprint,
      qualityScore: result.metadata.qualityScore,
      generationTime: result.metadata.generationTime,
      timestamp: result.fingerprint.timestamp
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateWithConstraints(constraints?: FingerprintConstraints): Promise<Fingerprint> {
    const result = await this.generate(this.normalizeLegacyConstraints(constraints));
    return result.fingerprint;
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateBatchLegacy(count: number, constraints?: FingerprintConstraints): Promise<Fingerprint[]> {
    const batchResult = await this.generateBatch(count, this.normalizeLegacyConstraints(constraints));
    return batchResult.results.map(result => result.fingerprint);
  }

  /**
   * Legacy method for backward compatibility
   */
  updateProbabilities(data: Fingerprint[]): void {
    this.bayesianEngine.updateProbabilities(data);
  }

  // Private helper methods

  private async initializeDataCollection() {
    try {
      await this.dataCollector.collectAllData();
    } catch (error) {
      console.warn('Data collection failed, using cached data:', error);
    }
  }

  private extractConstraints(options: GenerationOptions): FingerprintConstraints {
    const { browsers, devices, operatingSystems, screenResolutions, locales, httpVersion } = options;
    const constraints: FingerprintConstraints = {};

    if (browsers) constraints.browsers = browsers;
    if (devices) constraints.devices = devices;
    if (operatingSystems) constraints.operatingSystems = operatingSystems;
    if (screenResolutions) constraints.screenResolutions = screenResolutions;
    if (locales) constraints.locales = locales;
    if (httpVersion) constraints.httpVersion = httpVersion;

    return constraints;
  }

  private applyOverrides(baseFingerprint: Fingerprint, overrides?: FingerprintOverrides): Fingerprint {
    if (!overrides) {
      return baseFingerprint;
    }

    // Use structuredClone for better performance (Node 17+)
    const fingerprint: Fingerprint = structuredClone(baseFingerprint);

    if (overrides.browser) {
      fingerprint.browser = {
        ...fingerprint.browser,
        ...overrides.browser,
        majorVersion: overrides.browser.majorVersion ?? fingerprint.browser.majorVersion
      };
      fingerprint.userAgent = this.bayesianEngine.generateUserAgent(
        fingerprint.browser.name,
        fingerprint.browser.version,
        fingerprint.device.platform.name,
        fingerprint.device.type
      );
    }

    if (overrides.device) {
      fingerprint.device = {
        ...fingerprint.device,
        ...overrides.device,
        platform: {
          ...fingerprint.device.platform,
          ...(overrides.device.platform ?? {})
        },
        screenResolution: {
          ...fingerprint.device.screenResolution,
          ...(overrides.device.screenResolution ?? {})
        }
      };
    }

    if (overrides.locale) {
      fingerprint.locale = overrides.locale;
    }

    if (overrides.languages) {
      fingerprint.languages = overrides.languages;
    }

    if (overrides.timezone) {
      fingerprint.timezone = {
        ...fingerprint.timezone,
        ...overrides.timezone
      };
    }

    return fingerprint;
  }

  private createEmptyHeaderResult(fingerprint: Fingerprint): FingerprintGenerationResult {
    return {
      fingerprint,
      headers: {},
      confidence: 0.5,
      uniquenessScore: 0.5,
      warnings: []
    };
  }

  private createEmptyTLSResult(fingerprint: Fingerprint): TLSFingerprintResult {
    return {
      tlsFingerprint: {
        version: '',
        ciphers: [],
        extensions: [],
        supportedVersions: [],
        signatureAlgorithms: [],
        keyShares: []
      },
      http2Settings: {
        headerTableSize: 0,
        enablePush: false,
        maxConcurrentStreams: 0,
        initialWindowSize: 0,
        maxFrameSize: 0,
        maxHeaderListSize: 0
      },
      ja3Hash: '',
      ja4Hash: '',
      sslVersion: '',
      cipherSuite: '',
      extensions: ''
    };
  }

  private createEmptyCanvasResult(fingerprint: Fingerprint): CanvasModuleResult {
    return {
      canvas: {
        dataURL: '',
        textHash: '',
        shapesHash: '',
        imageHash: '',
        gradientHash: '',
        compositeHash: '',
        renderingQuality: {
          colorDepth: fingerprint.device.screenResolution.colorDepth,
          pixelRatio: fingerprint.device.screenResolution.pixelRatio ?? 1,
          hardwareAcceleration: false
        },
        textRendering: {
          font: 'Arial',
          textBaseline: 'alphabetic',
          textAlign: 'left',
          antialiasing: true
        },
        shapeRendering: {
          lineJoin: 'miter',
          lineCap: 'butt',
          miterLimit: 10
        }
      },
      webgl: {
        vendor: '',
        renderer: '',
        version: '',
        shadingLanguageVersion: '',
        extensions: [],
        parameters: {},
        vertexShaderHash: '',
        fragmentShaderHash: '',
        gpuInfo: {
          vendor: '',
          renderer: '',
          platform: fingerprint.device.platform.name,
          memory: 0
        }
      },
      audio: {
        sampleRate: 0,
        oscillatorHash: '',
        noiseHash: '',
        compressorHash: '',
        contextFeatures: {
          maxChannelsInput: 0,
          maxChannelsOutput: 0,
          latencyHint: 'interactive',
          disabled: true
        }
      },
      fonts: {
        systemFonts: [],
        webFonts: [],
        detected: [],
        total: 0,
        fontSignature: '',
        fontSupport: {}
      },
      warnings: [],
      consistencyScore: 0.5,
      generationTime: 0
    };
  }

  private mergeFingerprintModules(
    fingerprint: Fingerprint,
    headerResult: FingerprintGenerationResult,
    tlsResult: TLSFingerprintResult,
    canvasResult: CanvasModuleResult
  ): Fingerprint {
    return {
      ...fingerprint,
      headers: headerResult.headers,
      tls: tlsResult.tlsFingerprint,
      canvas: canvasResult.canvas,
      webgl: canvasResult.webgl,
      audio: canvasResult.audio,
      fonts: canvasResult.fonts
    };
  }

  private calculateQualityScore(
    fingerprint: Fingerprint,
    headerResult: any,
    tlsResult: any,
    canvasResult: any
  ): number {
    const baseQuality = fingerprint.qualityScore ?? 0.9;
    const headerQuality = headerResult.confidence;
    const tlsQuality = tlsResult.tlsFingerprint ? 1 : 0.6;
    const canvasQuality = canvasResult.consistencyScore;

    return (baseQuality + headerQuality + tlsQuality + canvasQuality) / 4;
  }

  private calculateUniquenessScore(fingerprint: Fingerprint, headerResult: any, tlsResult: any): number {
    const fingerprintUniqueness = fingerprint.fingerprintHash ? 1 : 0.6;
    const headerUniqueness = headerResult.uniquenessScore;
    const tlsUniqueness = tlsResult.ja3Hash ? 1 : 0.6;

    return (fingerprintUniqueness + headerUniqueness + tlsUniqueness) / 3;
  }

  private calculateConsistencyScore(
    headerResult: any,
    tlsResult: any,
    canvasResult: any
  ): number {
    const headerConsistency = headerResult.confidence;
    const tlsConsistency = tlsResult.tlsFingerprint ? 1 : 0.5;
    const canvasConsistency = canvasResult.consistencyScore;

    return (headerConsistency + tlsConsistency + canvasConsistency) / 3;
  }

  private calculateBypassConfidence(quality: number, uniqueness: number, consistency: number): number {
    // Weight factors based on importance for bypassing anti-bot detection
    const qualityWeight = 0.3;
    const uniquenessWeight = 0.4;
    const consistencyWeight = 0.3;

    return (quality * qualityWeight + uniqueness * uniquenessWeight + consistency * consistencyWeight);
  }

  private normalizeLegacyConstraints(constraints?: FingerprintConstraints): GenerationOptions {
    if (!constraints) {
      return {};
    }
    return { ...constraints };
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultScreenResolution(deviceType: DeviceType) {
    switch (deviceType) {
      case 'mobile':
        return { width: 375, height: 667, colorDepth: 24, pixelRatio: 2 };
      case 'tablet':
        return { width: 768, height: 1024, colorDepth: 24, pixelRatio: 2 };
      default: // desktop
        return { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 };
    }
  }

  private getDefaultHardwareConcurrency(deviceType: DeviceType): number {
    switch (deviceType) {
      case 'mobile':
        return 4;
      case 'tablet':
        return 6;
      default: // desktop
        return 8;
    }
  }

  private getDefaultDeviceMemory(deviceType: DeviceType): number {
    switch (deviceType) {
      case 'mobile':
        return 4;
      case 'tablet':
        return 8;
      default: // desktop
        return 16;
    }
  }

  private validateBrowserCompatibility(fingerprint: Fingerprint): number {
    let score = 1.0;

    // Check browser version consistency
    const { browser, device } = fingerprint;

    // Very old browsers with modern features
    if (browser.majorVersion < 50 && device.type === 'mobile') {
      score -= 0.2;
    }

    // Check platform consistency
    if (device.platform.name === 'ios' && browser.name !== 'safari') {
      score -= 0.3;
    }

    if (device.platform.name === 'android' && browser.name === 'safari') {
      score -= 0.3;
    }

    return Math.max(0, score);
  }
}

/**
 * Factory function for easy instantiation
 */
export function createFingerprintGenerator(options: {
  randomSeed?: number;
  enableDataCollection?: boolean;
  cacheSize?: number;
} = {}): FingerprintGenerator {
  return new FingerprintGenerator(options);
}

/**
 * Default instance for convenience
 */
export const defaultGenerator = new FingerprintGenerator();

/**
 * Quick generation function
 */
export async function generateFingerprint(options: GenerationOptions = {}): Promise<GenerationResult> {
  return defaultGenerator.generate(options);
}

/**
 * Quick batch generation function
 */
export async function generateFingerprints(count: number, options: GenerationOptions = {}): Promise<BatchResult> {
  return defaultGenerator.generateBatch(count, options);
}
