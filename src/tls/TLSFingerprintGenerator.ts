/**
 * TLS and HTTP2 Fingerprint Generator
 *
 * Generates realistic TLS fingerprints and HTTP2 settings based on
 * real browser signatures from curl-impersonate and other sources.
 */

import { createHash } from 'crypto';

import {
  TLSFingerprint,
  Fingerprint,
  BrowserName,
  DeviceType
} from '../types';

export interface HTTP2Settings {
  headerTableSize: number;
  enablePush: boolean;
  maxConcurrentStreams: number;
  initialWindowSize: number;
  maxFrameSize: number;
  maxHeaderListSize: number;
}

export interface TLSFingerprintResult {
  tlsFingerprint: TLSFingerprint;
  http2Settings: HTTP2Settings;
  ja3Hash: string;
  ja4Hash: string;
  sslVersion: string;
  cipherSuite: string;
  extensions: string;
}

export class StatisticalTLSFingerprintGenerator {
  private browserSignatures: Map<string, any> = new Map();
  private randomSeed: number;

  constructor(randomSeed?: number) {
    this.randomSeed = randomSeed || Date.now();
    this.initializeBrowserSignatures();
  }

  /**
   * Initialize browser TLS signatures based on curl-impersonate data
   */
  private initializeBrowserSignatures(): void {
    // Chrome TLS signatures (based on curl-impersonate)
    this.browserSignatures.set('chrome_120', {
      tlsVersion: '771', // TLS 1.2
      ciphers: '4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53',
      extensions: '0-5-10-11-13-16-21-22-23-35-43-45-51-65281',
      supportedVersions: '772-771', // TLS 1.3, TLS 1.2
      signatureAlgorithms: '1027-1283-1539-2052-2053-2054-1281-1282-2055-2056-2057-2058-2059-2060-2061',
      keyShares: '4588-29-23',
      compression: '0', // No compression
      applicationLayerProtocolNegotiation: 'h2,h3-29,h3-32',
      http2Settings: {
        headerTableSize: 65536,
        enablePush: false,
        maxConcurrentStreams: 1000,
        initialWindowSize: 6291456,
        maxFrameSize: 16777215,
        maxHeaderListSize: 262144
      }
    });

    // Firefox TLS signatures
    this.browserSignatures.set('firefox_119', {
      tlsVersion: '771',
      ciphers: '4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53-57-56',
      extensions: '0-5-10-11-13-16-21-22-23-35-43-45-51-65281',
      supportedVersions: '772-771',
      signatureAlgorithms: '1027-1283-1539-2052-2053-2054-1281-1282-2055-2056-2057-2058-2059-2060-2061',
      keyShares: '4588-29-23',
      compression: '0',
      applicationLayerProtocolNegotiation: 'h2',
      http2Settings: {
        headerTableSize: 4096,
        enablePush: false,
        maxConcurrentStreams: 100,
        initialWindowSize: 1048576,
        maxFrameSize: 16384,
        maxHeaderListSize: 262144
      }
    });

    // Safari TLS signatures
    this.browserSignatures.set('safari_16', {
      tlsVersion: '771',
      ciphers: '4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53',
      extensions: '0-5-10-11-13-16-21-22-23-35-43-45-51-65281',
      supportedVersions: '772-771',
      signatureAlgorithms: '1027-1283-1539-2052-2053-2054-1281-1282-2055-2056-2057-2058-2059-2060-2061',
      keyShares: '4588-29-23',
      compression: '0',
      applicationLayerProtocolNegotiation: 'h2,h3-29',
      http2Settings: {
        headerTableSize: 4096,
        enablePush: false,
        maxConcurrentStreams: 200,
        initialWindowSize: 1048576,
        maxFrameSize: 16384,
        maxHeaderListSize: 65536
      }
    });

    // Edge TLS signatures (similar to Chrome)
    this.browserSignatures.set('edge_120', {
      tlsVersion: '771',
      ciphers: '4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53',
      extensions: '0-5-10-11-13-16-21-22-23-35-43-45-51-65281',
      supportedVersions: '772-771',
      signatureAlgorithms: '1027-1283-1539-2052-2053-2054-1281-1282-2055-2056-2057-2058-2059-2060-2061',
      keyShares: '4588-29-23',
      compression: '0',
      applicationLayerProtocolNegotiation: 'h2,h3-29,h3-32',
      http2Settings: {
        headerTableSize: 65536,
        enablePush: false,
        maxConcurrentStreams: 1000,
        initialWindowSize: 6291456,
        maxFrameSize: 16777215,
        maxHeaderListSize: 262144
      }
    });

    // Mobile-specific signatures
    this.browserSignatures.set('chrome_mobile_120', {
      tlsVersion: '771',
      ciphers: '4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53',
      extensions: '0-5-10-11-13-16-21-22-23-35-43-45-51-65037-65281',
      supportedVersions: '772-771',
      signatureAlgorithms: '1027-1283-1539-2052-2053-2054-1281-1282-2055-2056-2057-2058-2059-2060-2061',
      keyShares: '4588-29-23',
      compression: '0',
      applicationLayerProtocolNegotiation: 'h2,h3-29,h3-32',
      http2Settings: {
        headerTableSize: 65536,
        enablePush: false,
        maxConcurrentStreams: 256,
        initialWindowSize: 2097152,
        maxFrameSize: 16777215,
        maxHeaderListSize: 262144
      }
    });
  }

  /**
   * Generate TLS fingerprint based on browser fingerprint
   */
  public generateTLSFingerprint(fingerprint: Fingerprint): TLSFingerprintResult {
    const browserKey = this.getBrowserKey(fingerprint);
    const signature = this.browserSignatures.get(browserKey) || this.browserSignatures.get('chrome_120')!;

    // Add some randomization while maintaining consistency
    const randomizedSignature = this.randomizeSignature(signature, fingerprint);

    const tlsFingerprint: TLSFingerprint = {
      version: randomizedSignature.tlsVersion,
      ciphers: randomizedSignature.ciphers.split('-'),
      extensions: randomizedSignature.extensions.split('-'),
      supportedVersions: randomizedSignature.supportedVersions.split('-'),
      signatureAlgorithms: randomizedSignature.signatureAlgorithms.split('-'),
      keyShares: randomizedSignature.keyShares.split('-'),
      compression: randomizedSignature.compression ? randomizedSignature.compression.split('-') : undefined,
      alpn: randomizedSignature.applicationLayerProtocolNegotiation ?
        randomizedSignature.applicationLayerProtocolNegotiation.split(',') : undefined
    };

    const http2Settings = { ...randomizedSignature.http2Settings };

    // Add some realistic variation
    this.randomizeHTTP2Settings(http2Settings, fingerprint);

    return {
      tlsFingerprint,
      http2Settings,
      ja3Hash: this.calculateJA3Hash(tlsFingerprint),
      ja4Hash: this.calculateJA4Hash(tlsFingerprint, fingerprint),
      sslVersion: this.getSSLVersion(tlsFingerprint.version),
      cipherSuite: this.getPrimaryCipherSuite(tlsFingerprint.ciphers),
      extensions: tlsFingerprint.extensions.join(',')
    };
  }

  /**
   * Get browser key for signature lookup
   */
  private getBrowserKey(fingerprint: Fingerprint): string {
    const { browser, device } = fingerprint;
    const baseKey = `${browser.name}_${browser.majorVersion}`;

    // Use mobile-specific signature for mobile devices
    if (device.type === 'mobile' && (browser.name === 'chrome' || browser.name === 'edge')) {
      return `${baseKey}_mobile`;
    }

    return baseKey;
  }

  /**
   * Add realistic randomization to TLS signature
   */
  private randomizeSignature(signature: any, fingerprint: Fingerprint): any {
    const randomized = { ...signature };

    // Randomize extension order slightly
    if (this.seededRandom() < 0.3) {
      const extensions = signature.extensions.split('-');
      this.shuffleArray(extensions, 0.1); // Small chance of shuffle
      randomized.extensions = extensions.join('-');
    }

    // Randomize cipher order slightly
    if (this.seededRandom() < 0.2) {
      const ciphers = signature.ciphers.split('-');
      this.shuffleArray(ciphers, 0.1); // Small chance of shuffle
      randomized.ciphers = ciphers.join('-');
    }

    return randomized;
  }

  /**
   * Randomize HTTP2 settings with realistic variations
   */
  private randomizeHTTP2Settings(settings: HTTP2Settings, fingerprint: Fingerprint): void {
    // Add slight variations to make fingerprints more unique
    if (settings.headerTableSize > 10000) {
      settings.headerTableSize = this.variateValue(settings.headerTableSize, 0.1);
    }

    if (settings.maxConcurrentStreams > 100) {
      settings.maxConcurrentStreams = this.variateValue(settings.maxConcurrentStreams, 0.2);
    }

    settings.initialWindowSize = this.variateValue(settings.initialWindowSize, 0.1);
    settings.maxHeaderListSize = this.variateValue(settings.maxHeaderListSize, 0.1);
  }

  /**
   * Add variation to a value while keeping it in realistic bounds
   */
  private variateValue(value: number, variation: number): number {
    const factor = 1 + (this.seededRandom() - 0.5) * variation;
    const varied = Math.round(value * factor);

    // Keep within reasonable bounds
    const min = Math.round(value * 0.7);
    const max = Math.round(value * 1.3);

    return Math.max(min, Math.min(max, varied));
  }

  /**
   * Fisher-Yates shuffle with probability
   */
  private shuffleArray(array: string[], probability: number): void {
    if (this.seededRandom() > probability) return;

    for (let i = array.length - 1; i > 0; i--) {
      if (this.seededRandom() < 0.1) { // Only swap 10% of the time
        const j = Math.floor(this.seededRandom() * (i + 1));
        const temp = array[i];
        if (temp !== undefined && array[j] !== undefined) {
          array[i] = array[j];
          array[j] = temp;
        }
      }
    }
  }

  /**
   * Calculate JA3 hash for TLS fingerprint
   */
  private calculateJA3Hash(tlsFingerprint: TLSFingerprint): string {
    // JA3 format: SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats,SignatureAlgorithms
    const ja3String = [
      tlsFingerprint.version,
      tlsFingerprint.ciphers.join('-'),
      tlsFingerprint.extensions.join('-'),
      '23-24-25', // Common elliptic curves
      '0', // Point formats
      tlsFingerprint.signatureAlgorithms.join('-')
    ].join(',');

    return this.hashMD5(ja3String);
  }

  /**
   * Calculate JA4 hash (simplified version)
   */
  private calculateJA4Hash(tlsFingerprint: TLSFingerprint, fingerprint: Fingerprint): string {
    // JA4 is more complex, this is a simplified version
    const ja4String = [
      't13', // TLS 1.3
      tlsFingerprint.ciphers.length.toString(16),
      tlsFingerprint.extensions.join('')
    ].join('_');

    return this.hashMD5(ja4String).substring(0, 12);
  }

  /**
   * Simple MD5 hash implementation (for demonstration)
   */
  private hashMD5(input: string): string {
    return createHash('md5').update(input).digest('hex');
  }

  /**
   * Get SSL version string
   */
  private getSSLVersion(version: string): string {
    const versionMap: Record<string, string> = {
      '771': 'TLSv1.2',
      '772': 'TLSv1.3',
      '768': 'TLSv1.0',
      '769': 'TLSv1.1'
    };
    return versionMap[version] || 'TLSv1.2';
  }

  /**
   * Get primary cipher suite
   */
  private getPrimaryCipherSuite(ciphers: string[]): string {
    if (ciphers.length === 0) return '';
    return ciphers[0] || '';
  }

  /**
   * Generate multiple TLS fingerprints for batch processing
   */
  public generateBatch(fingerprints: Fingerprint[]): TLSFingerprintResult[] {
    return fingerprints.map(fp => this.generateTLSFingerprint(fp));
  }

  /**
   * Get TLS fingerprint as JSON for curl-impersonate compatibility
   */
  public getCurlImpersonateConfig(fingerprint: Fingerprint): any {
    const result = this.generateTLSFingerprint(fingerprint);

    return {
      browser: fingerprint.browser.name,
      version: fingerprint.browser.majorVersion,
      platform: fingerprint.device.platform.name,
      mobile: fingerprint.device.type === 'mobile',
      tlsFingerprint: {
        version: result.tlsFingerprint.version,
        ciphers: result.tlsFingerprint.ciphers.join(':'),
        extensions: result.tlsFingerprint.extensions.join(':'),
        supportedVersions: result.tlsFingerprint.supportedVersions.join(':'),
        signatureAlgorithms: result.tlsFingerprint.signatureAlgorithms.join(':'),
        keyShares: result.tlsFingerprint.keyShares.join(':')
      },
      http2: {
        settings: result.http2Settings,
        enabled: true,
        priority: 'h2'
      },
      ja3: result.ja3Hash,
      ja4: result.ja4Hash
    };
  }

  /**
   * Validate TLS fingerprint consistency
   */
  public validateTLSConsistency(tlsFingerprint: TLSFingerprint, fingerprint: Fingerprint): {
    isValid: boolean;
    score: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let score = 1.0;

    // Check if TLS version is appropriate for browser version
    const browserVersion = fingerprint.browser.majorVersion;
    if (tlsFingerprint.version === '772' && browserVersion < 100) {
      warnings.push('TLS 1.3 detected in older browser version');
      score -= 0.2;
    }

    // Check for modern cipher suites in old browsers
    if (tlsFingerprint.ciphers.includes('4865') && browserVersion < 50) {
      warnings.push('Modern cipher suite detected in older browser');
      score -= 0.1;
    }

    // Check for HTTP/2 support consistency
    if (!tlsFingerprint.alpn || !tlsFingerprint.alpn.includes('h2')) {
      if (fingerprint.browser.majorVersion > 50) {
        warnings.push('HTTP/2 support missing in modern browser');
        score -= 0.1;
      }
    }

    return {
      isValid: warnings.length === 0,
      score: Math.max(0, score),
      warnings
    };
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(): number {
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
    return this.randomSeed / 233280;
  }

  /**
   * Update browser signatures with new data
   */
  public updateBrowserSignatures(newSignatures: Record<string, any>): void {
    Object.entries(newSignatures).forEach(([key, signature]) => {
      this.browserSignatures.set(key, signature);
    });
  }

  /**
   * Get available browser signatures
   */
  public getAvailableSignatures(): string[] {
    return Array.from(this.browserSignatures.keys());
  }
}
