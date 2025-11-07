/**
 * HTTP Headers Generator with Real-World Statistics
 *
 * Generates statistically accurate HTTP headers based on browser
 * fingerprint data from the Bayesian network and real-world usage patterns.
 */

import {
  HTTPHeaders,
  Fingerprint,
  BrowserName,
  DeviceType,
  FingerprintGenerationResult,
  HeaderGenerationOptions
} from '../types';

export class StatisticalHeaderGenerator {
  private defaultOptions: HeaderGenerationOptions = {
    includeAccept: true,
    includeAcceptLanguage: true,
    includeAcceptEncoding: true,
    includeClientHints: true,
    includeSecFetch: true,
    includeDNT: false,
    httpVersion: '2',
    requestType: 'navigate',
    resourceType: 'document'
  };

  constructor(options?: Partial<HeaderGenerationOptions>) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Generate HTTP headers based on fingerprint
   */
  public generateHeaders(
    fingerprint: Fingerprint,
    options?: Partial<HeaderGenerationOptions>
  ): FingerprintGenerationResult {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    const headers: HTTPHeaders = {
      'user-agent': fingerprint.userAgent
    };

    // Core headers
    if (opts.includeAccept) {
      headers.accept = this.generateAcceptHeader(fingerprint, opts);
    }

    if (opts.includeAcceptLanguage) {
      headers['accept-language'] = this.generateAcceptLanguageHeader(fingerprint);
    }

    if (opts.includeAcceptEncoding) {
      headers['accept-encoding'] = this.generateAcceptEncodingHeader(fingerprint, opts);
    }

    // Modern browser headers
    if (opts.includeClientHints) {
      const clientHints = this.generateClientHintHeaders(fingerprint);
      Object.assign(headers, clientHints);
    }

    // Sec-Fetch headers
    if (opts.includeSecFetch) {
      const secFetch = this.generateSecFetchHeaders(fingerprint, opts);
      Object.assign(headers, secFetch);
    }

    // Optional headers
    if (opts.includeDNT) {
      headers.dnt = this.generateDNTHeader(fingerprint);
    }

    // HTTP/2 specific headers
    if (opts.httpVersion === '2') {
      const http2Headers = this.generateHTTP2Headers(fingerprint, opts);
      Object.assign(headers, http2Headers);
    }

    const generationTime = Date.now() - startTime;

    return {
      fingerprint,
      headers,
      confidence: this.calculateHeaderConsistency(headers, fingerprint),
      uniquenessScore: this.calculateHeaderUniqueness(headers),
      warnings: this.validateHeaders(headers)
    };
  }

  /**
   * Generate Accept header based on browser and request type
   */
  private generateAcceptHeader(
    fingerprint: Fingerprint,
    options: HeaderGenerationOptions
  ): string {
    const { browser } = fingerprint;
    const { requestType, resourceType } = options;

    // Generate accept header based on browser and request type
    switch (browser.name) {
      case 'chrome':
        return this.generateChromeAcceptHeader(requestType, resourceType);
      case 'firefox':
        return this.generateFirefoxAcceptHeader(requestType, resourceType);
      case 'safari':
        return this.generateSafariAcceptHeader(requestType, resourceType);
      case 'edge':
        return this.generateEdgeAcceptHeader(requestType, resourceType);
      default:
        return this.generateChromeAcceptHeader(requestType, resourceType);
    }
  }

  /**
   * Chrome accept headers
   */
  private generateChromeAcceptHeader(requestType: string, resourceType: string): string {
    switch (requestType) {
      case 'navigate':
        if (resourceType === 'document') {
          return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8';
        }
        return '*/*';
      case 'resource':
        switch (resourceType) {
          case 'stylesheet':
            return 'text/css,*/*;q=0.1';
          case 'script':
            return '*/*';
          case 'image':
            return 'image/webp,image/apng,image/*,*/*;q=0.8';
          case 'font':
            return 'font/woff2,font/woff,font/ttf,font/eot,application/font-woff,application/font-woff2;q=0.9,*/*;q=0.1';
          default:
            return '*/*';
        }
      case 'xhr':
      case 'fetch':
        return 'application/json,text/plain,*/*';
      case 'iframe':
        return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
      default:
        return '*/*';
    }
  }

  /**
   * Firefox accept headers
   */
  private generateFirefoxAcceptHeader(requestType: string, resourceType: string): string {
    switch (requestType) {
      case 'navigate':
        if (resourceType === 'document') {
          return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
        }
        return '*/*';
      case 'resource':
        switch (resourceType) {
          case 'stylesheet':
            return 'text/css,*/*;q=0.1';
          case 'script':
            return '*/*';
          case 'image':
            return 'image/webp,*/*;q=0.8';
          case 'font':
            return 'font/woff2,font/woff,font/ttf,font/eot,application/font-woff,application/font-woff2;q=0.9,*/*;q=0.1';
          default:
            return '*/*';
        }
      case 'xhr':
      case 'fetch':
        return 'application/json,text/plain,*/*';
      case 'iframe':
        return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
      default:
        return '*/*';
    }
  }

  /**
   * Safari accept headers
   */
  private generateSafariAcceptHeader(requestType: string, resourceType: string): string {
    switch (requestType) {
      case 'navigate':
        if (resourceType === 'document') {
          return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
        }
        return '*/*';
      case 'resource':
        switch (resourceType) {
          case 'stylesheet':
            return 'text/css,*/*;q=0.1';
          case 'script':
            return '*/*';
          case 'image':
            return 'image/webp,*/*;q=0.8';
          case 'font':
            return 'font/woff2,font/woff,font/ttf,font/eot,application/font-woff,application/font-woff2;q=0.9,*/*;q=0.1';
          default:
            return '*/*';
        }
      case 'xhr':
      case 'fetch':
        return 'application/json,text/plain,*/*';
      case 'iframe':
        return 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
      default:
        return '*/*';
    }
  }

  /**
   * Edge accept headers (similar to Chrome)
   */
  private generateEdgeAcceptHeader(requestType: string, resourceType: string): string {
    return this.generateChromeAcceptHeader(requestType, resourceType);
  }

  /**
   * Generate Accept-Language header
   */
  private generateAcceptLanguageHeader(fingerprint: Fingerprint): string {
    return fingerprint.languages
      .map((lang, index) => {
        const quality = (1.0 - (index * 0.1)).toFixed(1);
        return index === 0 ? lang : `${lang};q=${quality}`;
      })
      .join(',');
  }

  /**
   * Generate Accept-Encoding header
   */
  private generateAcceptEncodingHeader(
    fingerprint: Fingerprint,
    options: HeaderGenerationOptions
  ): string {
    const { browser } = fingerprint;
    const encodings = [];

    // Common encodings
    if (browser.name === 'chrome' || browser.name === 'edge') {
      encodings.push('gzip', 'deflate', 'br'); // Chrome supports Brotli
    } else if (browser.name === 'firefox') {
      encodings.push('gzip', 'deflate', 'br'); // Firefox also supports Brotli now
    } else if (browser.name === 'safari') {
      encodings.push('gzip', 'deflate'); // Safari doesn't support Brotli yet
    }

    return encodings.join(',');
  }

  /**
   * Generate Client Hint headers
   */
  private generateClientHintHeaders(fingerprint: Fingerprint): Partial<HTTPHeaders> {
    const { browser, device } = fingerprint;
    const headers: Partial<HTTPHeaders> = {};

    // Only generate for browsers that support Client Hints
    if (browser.name === 'chrome' || browser.name === 'edge') {
      const majorVersion = browser.majorVersion;

      // Sec-CH-UA
      const brand = browser.name === 'chrome' ? 'Google Chrome' : 'Microsoft Edge';
      const chromiumVersion = majorVersion.toString();

      headers['sec-ch-ua'] = `"${brand}";v="${majorVersion}", "Chromium";v="${chromiumVersion}", "Not=A?Brand";v="99"`;
      headers['sec-ch-ua-mobile'] = device.type === 'mobile' ? '?1' : '?0';
      headers['sec-ch-ua-platform'] = `"${device.platform.name}"`;
    }

    return headers;
  }

  /**
   * Generate Sec-Fetch headers
   */
  private generateSecFetchHeaders(
    fingerprint: Fingerprint,
    options: HeaderGenerationOptions
  ): Partial<HTTPHeaders> {
    const { requestType, resourceType } = options;
    const headers: Partial<HTTPHeaders> = {};

    // Only Chrome/Edge send Sec-Fetch headers consistently
    if (fingerprint.browser.name === 'chrome' || fingerprint.browser.name === 'edge') {
      switch (requestType) {
        case 'navigate':
          headers['sec-fetch-dest'] = 'document';
          headers['sec-fetch-mode'] = 'navigate';
          headers['sec-fetch-site'] = 'none';
          headers['sec-fetch-user'] = '?1';
          break;
        case 'resource':
          headers['sec-fetch-dest'] = resourceType;
          headers['sec-fetch-mode'] = 'no-cors';
          headers['sec-fetch-site'] = 'same-origin';
          break;
        case 'xhr':
        case 'fetch':
          headers['sec-fetch-dest'] = 'empty';
          headers['sec-fetch-mode'] = 'cors';
          headers['sec-fetch-site'] = 'same-origin';
          break;
        case 'iframe':
          headers['sec-fetch-dest'] = 'iframe';
          headers['sec-fetch-mode'] = 'navigate';
          headers['sec-fetch-site'] = 'same-origin';
          break;
      }
    }

    return headers;
  }

  /**
   * Generate Do Not Track header
   */
  private generateDNTHeader(fingerprint: Fingerprint): string {
    // DNT usage statistics: ~15% of users enable DNT
    // Use the device's hardware concurrency as a pseudo-random seed
    const randomValue = fingerprint.device.hardwareConcurrency % 100;
    return randomValue < 15 ? '1' : '0';
  }

  /**
   * Generate HTTP/2 specific headers
   */
  private generateHTTP2Headers(
    fingerprint: Fingerprint,
    options: HeaderGenerationOptions
  ): Partial<HTTPHeaders> {
    const headers: Partial<HTTPHeaders> = {};

    // HTTP/2 specific headers
    if (options.httpVersion === '2') {
      // HTTP/2 doesn't use specific headers for pseudo-headers like :method, :path, etc.
      // Those are handled at the HTTP/2 protocol level
    }

    return headers;
  }

  /**
   * Calculate header consistency score
   */
  public calculateHeaderConsistency(headers: HTTPHeaders, fingerprint: Fingerprint): number {
    let score = 1.0;

    // Check User-Agent consistency
    if (!headers['user-agent'] || headers['user-agent'] !== fingerprint.userAgent) {
      score -= 0.3;
    }

    // Check Client Hint consistency
    if (headers['sec-ch-ua-mobile'] !== undefined) {
      const isMobile = fingerprint.device.type === 'mobile';
      const expectedValue = isMobile ? '?1' : '?0';
      if (headers['sec-ch-ua-mobile'] !== expectedValue) {
        score -= 0.2;
      }
    }

    // Check Accept-Language consistency
    if (headers['accept-language']) {
      const headerLangs = headers['accept-language'].split(',').map(l => l.split(';')[0]);
      const hasPrimaryLang = headerLangs.includes(fingerprint.languages[0]);
      if (!hasPrimaryLang) {
        score -= 0.1;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Calculate header uniqueness score
   */
  private calculateHeaderUniqueness(headers: HTTPHeaders): number {
    // Simple uniqueness calculation based on header entropy
    const headerString = Object.values(headers).join('|');
    let uniqueness = 0;

    // Count unique characters
    const uniqueChars = new Set(headerString).size;
    uniqueness += uniqueChars / headerString.length;

    // Check header combinations
    const headerCount = Object.keys(headers).length;
    uniqueness += Math.min(headerCount / 15, 0.5); // Max 15 common headers

    return Math.min(uniqueness, 1.0);
  }

  /**
   * Validate headers and return warnings
   */
  public validateHeaders(headers: HTTPHeaders): string[] {
    const warnings: string[] = [];

    // Check for required headers
    if (!headers['user-agent']) {
      warnings.push('Missing User-Agent header');
    }

    // Check for header inconsistencies
    if (headers['sec-ch-ua'] && !headers['sec-ch-ua-mobile']) {
      warnings.push('Sec-CH-UA present without Sec-CH-UA-Mobile');
    }

    // Check Accept header format
    if (headers.accept && !headers.accept.includes('*/*')) {
      const acceptParts = headers.accept.split(',');
      const hasValidQValues = acceptParts.every(part => {
        const qMatch = part.match(/q=([0-9.]+)/);
        return !qMatch || (qMatch[1] && parseFloat(qMatch[1]) <= 1.0);
      });
      if (!hasValidQValues) {
        warnings.push('Invalid q-values in Accept header');
      }
    }

    return warnings;
  }

  /**
   * Generate headers for specific use case
   */
  public generateForUseCase(
    useCase: 'browser_automation' | 'api_client' | 'mobile_app' | 'web_crawler',
    fingerprint: Fingerprint
  ): HTTPHeaders {
    const options = this.getOptionsForUseCase(useCase);
    const result = this.generateHeaders(fingerprint, options);
    return result.headers;
  }

  /**
   * Get options for specific use case
   */
  private getOptionsForUseCase(useCase: string): HeaderGenerationOptions {
    switch (useCase) {
      case 'browser_automation':
        return {
          ...this.defaultOptions,
          includeClientHints: true,
          includeSecFetch: true,
          requestType: 'navigate'
        };
      case 'api_client':
        return {
          ...this.defaultOptions,
          includeClientHints: false,
          includeSecFetch: false,
          requestType: 'fetch',
          resourceType: 'api'
        };
      case 'mobile_app':
        return {
          ...this.defaultOptions,
          includeClientHints: true,
          includeSecFetch: false,
          requestType: 'resource',
          resourceType: 'api'
        };
      case 'web_crawler':
        return {
          ...this.defaultOptions,
          includeClientHints: false,
          includeSecFetch: false,
          includeDNT: true,
          requestType: 'navigate'
        };
      default:
        return this.defaultOptions;
    }
  }

  /**
   * Batch generate headers
   */
  public generateBatch(
    fingerprints: Fingerprint[],
    options?: Partial<HeaderGenerationOptions>
  ): FingerprintGenerationResult[] {
    return fingerprints.map(fp => this.generateHeaders(fp, options));
  }
}
