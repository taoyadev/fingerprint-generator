"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalHeaderGenerator = void 0;
class StatisticalHeaderGenerator {
    constructor(options) {
        this.defaultOptions = {
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
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }
    generateHeaders(fingerprint, options) {
        const opts = { ...this.defaultOptions, ...options };
        const startTime = Date.now();
        const headers = {
            'user-agent': fingerprint.userAgent
        };
        if (opts.includeAccept) {
            headers.accept = this.generateAcceptHeader(fingerprint, opts);
        }
        if (opts.includeAcceptLanguage) {
            headers['accept-language'] = this.generateAcceptLanguageHeader(fingerprint);
        }
        if (opts.includeAcceptEncoding) {
            headers['accept-encoding'] = this.generateAcceptEncodingHeader(fingerprint, opts);
        }
        if (opts.includeClientHints) {
            const clientHints = this.generateClientHintHeaders(fingerprint);
            Object.assign(headers, clientHints);
        }
        if (opts.includeSecFetch) {
            const secFetch = this.generateSecFetchHeaders(fingerprint, opts);
            Object.assign(headers, secFetch);
        }
        if (opts.includeDNT) {
            headers.dnt = this.generateDNTHeader(fingerprint);
        }
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
    generateAcceptHeader(fingerprint, options) {
        const { browser } = fingerprint;
        const { requestType, resourceType } = options;
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
    generateChromeAcceptHeader(requestType, resourceType) {
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
    generateFirefoxAcceptHeader(requestType, resourceType) {
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
    generateSafariAcceptHeader(requestType, resourceType) {
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
    generateEdgeAcceptHeader(requestType, resourceType) {
        return this.generateChromeAcceptHeader(requestType, resourceType);
    }
    generateAcceptLanguageHeader(fingerprint) {
        return fingerprint.languages
            .map((lang, index) => {
            const quality = (1.0 - (index * 0.1)).toFixed(1);
            return index === 0 ? lang : `${lang};q=${quality}`;
        })
            .join(',');
    }
    generateAcceptEncodingHeader(fingerprint, options) {
        const { browser } = fingerprint;
        const encodings = [];
        if (browser.name === 'chrome' || browser.name === 'edge') {
            encodings.push('gzip', 'deflate', 'br');
        }
        else if (browser.name === 'firefox') {
            encodings.push('gzip', 'deflate', 'br');
        }
        else if (browser.name === 'safari') {
            encodings.push('gzip', 'deflate');
        }
        return encodings.join(',');
    }
    generateClientHintHeaders(fingerprint) {
        const { browser, device } = fingerprint;
        const headers = {};
        if (browser.name === 'chrome' || browser.name === 'edge') {
            const majorVersion = browser.majorVersion;
            const brand = browser.name === 'chrome' ? 'Google Chrome' : 'Microsoft Edge';
            const chromiumVersion = majorVersion.toString();
            headers['sec-ch-ua'] = `"${brand}";v="${majorVersion}", "Chromium";v="${chromiumVersion}", "Not=A?Brand";v="99"`;
            headers['sec-ch-ua-mobile'] = device.type === 'mobile' ? '?1' : '?0';
            headers['sec-ch-ua-platform'] = `"${device.platform.name}"`;
        }
        return headers;
    }
    generateSecFetchHeaders(fingerprint, options) {
        const { requestType, resourceType } = options;
        const headers = {};
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
    generateDNTHeader(fingerprint) {
        const randomValue = fingerprint.device.hardwareConcurrency % 100;
        return randomValue < 15 ? '1' : '0';
    }
    generateHTTP2Headers(fingerprint, options) {
        const headers = {};
        if (options.httpVersion === '2') {
        }
        return headers;
    }
    calculateHeaderConsistency(headers, fingerprint) {
        let score = 1.0;
        if (!headers['user-agent'] || headers['user-agent'] !== fingerprint.userAgent) {
            score -= 0.3;
        }
        if (headers['sec-ch-ua-mobile'] !== undefined) {
            const isMobile = fingerprint.device.type === 'mobile';
            const expectedValue = isMobile ? '?1' : '?0';
            if (headers['sec-ch-ua-mobile'] !== expectedValue) {
                score -= 0.2;
            }
        }
        if (headers['accept-language']) {
            const headerLangs = headers['accept-language'].split(',').map(l => l.split(';')[0]);
            const hasPrimaryLang = headerLangs.includes(fingerprint.languages[0]);
            if (!hasPrimaryLang) {
                score -= 0.1;
            }
        }
        return Math.max(0, score);
    }
    calculateHeaderUniqueness(headers) {
        const headerString = Object.values(headers).join('|');
        let uniqueness = 0;
        const uniqueChars = new Set(headerString).size;
        uniqueness += uniqueChars / headerString.length;
        const headerCount = Object.keys(headers).length;
        uniqueness += Math.min(headerCount / 15, 0.5);
        return Math.min(uniqueness, 1.0);
    }
    validateHeaders(headers) {
        const warnings = [];
        if (!headers['user-agent']) {
            warnings.push('Missing User-Agent header');
        }
        if (headers['sec-ch-ua'] && !headers['sec-ch-ua-mobile']) {
            warnings.push('Sec-CH-UA present without Sec-CH-UA-Mobile');
        }
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
    generateForUseCase(useCase, fingerprint) {
        const options = this.getOptionsForUseCase(useCase);
        const result = this.generateHeaders(fingerprint, options);
        return result.headers;
    }
    getOptionsForUseCase(useCase) {
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
    generateBatch(fingerprints, options) {
        return fingerprints.map(fp => this.generateHeaders(fp, options));
    }
}
exports.StatisticalHeaderGenerator = StatisticalHeaderGenerator;
//# sourceMappingURL=HeaderGenerator.js.map