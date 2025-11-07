"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultGenerator = exports.FingerprintGenerator = void 0;
exports.createFingerprintGenerator = createFingerprintGenerator;
exports.generateFingerprint = generateFingerprint;
exports.generateFingerprints = generateFingerprints;
const BayesianNetwork_1 = require("./core/BayesianNetwork");
const HeaderGenerator_1 = require("./headers/HeaderGenerator");
const TLSFingerprintGenerator_1 = require("./tls/TLSFingerprintGenerator");
const CanvasFingerprintGenerator_1 = require("./canvas/CanvasFingerprintGenerator");
const DataCollector_1 = require("./data/DataCollector");
const LRUCache_1 = require("./utils/LRUCache");
class FingerprintGenerator {
    constructor(options = {}) {
        const seed = options.randomSeed || Date.now();
        this.bayesianEngine = new BayesianNetwork_1.StatisticalFingerprintEngine(seed);
        this.headerGenerator = new HeaderGenerator_1.StatisticalHeaderGenerator();
        this.tlsGenerator = new TLSFingerprintGenerator_1.StatisticalTLSFingerprintGenerator(seed);
        this.canvasGenerator = new CanvasFingerprintGenerator_1.StatisticalCanvasFingerprintGenerator(seed);
        this.dataCollector = new DataCollector_1.StatisticalDataCollector();
        this.fingerprintCache = new LRUCache_1.LRUCache(options.cacheSize || 100);
        if (options.enableDataCollection) {
            this.initializeDataCollection();
        }
    }
    async generate(options = {}) {
        const startTime = Date.now();
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
        const constraints = this.extractConstraints(options);
        const baseFingerprint = this.bayesianEngine.generateSample(constraints);
        const fingerprint = this.applyOverrides(baseFingerprint, options.overrides);
        const headerResult = includeHeaders
            ? this.headerGenerator.generateHeaders(fingerprint, options.headerOptions)
            : this.createEmptyHeaderResult(fingerprint);
        const tlsResult = includeTLS
            ? this.tlsGenerator.generateTLSFingerprint(fingerprint)
            : this.createEmptyTLSResult(fingerprint);
        const canvasResult = includeCanvas
            ? this.canvasGenerator.generateFingerprint(fingerprint)
            : this.createEmptyCanvasResult(fingerprint);
        const enrichedFingerprint = this.mergeFingerprintModules(fingerprint, headerResult, tlsResult, canvasResult);
        const generationTime = Date.now() - startTime;
        const qualityScore = this.calculateQualityScore(enrichedFingerprint, headerResult, tlsResult, canvasResult);
        const uniquenessScore = this.calculateUniquenessScore(enrichedFingerprint, headerResult, tlsResult);
        const consistencyScore = this.calculateConsistencyScore(headerResult, tlsResult, canvasResult);
        const bypassConfidence = this.calculateBypassConfidence(qualityScore, uniquenessScore, consistencyScore);
        try {
            this.dataCollector.recordFingerprint(enrichedFingerprint);
        }
        catch {
        }
        const result = {
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
        if (!options.forceRegenerate) {
            const cacheKey = JSON.stringify(options);
            this.fingerprintCache.set(cacheKey, result);
        }
        return result;
    }
    async generateBatch(count, options = {}) {
        const startTime = Date.now();
        const batchId = this.generateBatchId();
        const tasks = Array.from({ length: count }, () => this.generate(options));
        const results = await Promise.all(tasks);
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
    async generateForBrowser(browserName, version, options = {}) {
        const overrides = {
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
    async generateForDevice(deviceType, platform, options = {}) {
        const overrides = {
            ...(options.overrides ?? {}),
            device: {
                ...(options.overrides?.device ?? {}),
                type: deviceType,
                platform: {
                    name: platform,
                    version: options.overrides?.device?.platform?.version ?? 'latest',
                    architecture: options.overrides?.device?.platform?.architecture ?? 'x64'
                },
                screenResolution: options.overrides?.device?.screenResolution ?? this.getDefaultScreenResolution(deviceType),
                hardwareConcurrency: options.overrides?.device?.hardwareConcurrency ?? this.getDefaultHardwareConcurrency(deviceType),
                deviceMemory: options.overrides?.device?.deviceMemory ?? this.getDefaultDeviceMemory(deviceType)
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
    async generateForCurl(fingerprint) {
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
    validate(result) {
        const warnings = [];
        const headerConsistency = this.headerGenerator.calculateHeaderConsistency(result.headers, result.fingerprint);
        const headerWarnings = this.headerGenerator.validateHeaders(result.headers);
        if (headerConsistency < 0.8) {
            warnings.push('Header consistency issues detected');
        }
        if (headerWarnings.length > 0) {
            warnings.push(...headerWarnings);
        }
        const tlsValidation = this.tlsGenerator.validateTLSConsistency(result.tlsFingerprint, result.fingerprint);
        const tlsConsistency = tlsValidation.score;
        if (tlsValidation.warnings.length > 0) {
            warnings.push(...tlsValidation.warnings);
        }
        const canvasValidation = this.canvasGenerator.validateCanvasConsistency(result.canvasFingerprint.canvas, result.fingerprint);
        const canvasConsistency = canvasValidation.score;
        if (canvasValidation.warnings.length > 0) {
            warnings.push(...canvasValidation.warnings);
        }
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
    getStatistics() {
        return {
            bayesianEngine: this.bayesianEngine.getStatistics(),
            availableTLS: this.tlsGenerator.getAvailableSignatures(),
            gpuDataLoaded: this.canvasGenerator.gpuDataCache.size,
            dataCollectorStats: this.dataCollector.getCacheStats()
        };
    }
    async updateData() {
        try {
            await this.dataCollector.collectAllData();
            console.log('✅ Data collection completed successfully');
        }
        catch (error) {
            console.error('❌ Data collection failed:', error);
        }
    }
    createCompleteFingerprint(result) {
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
    async generateWithConstraints(constraints) {
        const result = await this.generate(this.normalizeLegacyConstraints(constraints));
        return result.fingerprint;
    }
    async generateBatchLegacy(count, constraints) {
        const batchResult = await this.generateBatch(count, this.normalizeLegacyConstraints(constraints));
        return batchResult.results.map(result => result.fingerprint);
    }
    updateProbabilities(data) {
        this.bayesianEngine.updateProbabilities(data);
    }
    async initializeDataCollection() {
        try {
            await this.dataCollector.collectAllData();
        }
        catch (error) {
            console.warn('Data collection failed, using cached data:', error);
        }
    }
    extractConstraints(options) {
        const { browsers, devices, operatingSystems, screenResolutions, locales, httpVersion } = options;
        const constraints = {};
        if (browsers)
            constraints.browsers = browsers;
        if (devices)
            constraints.devices = devices;
        if (operatingSystems)
            constraints.operatingSystems = operatingSystems;
        if (screenResolutions)
            constraints.screenResolutions = screenResolutions;
        if (locales)
            constraints.locales = locales;
        if (httpVersion)
            constraints.httpVersion = httpVersion;
        return constraints;
    }
    applyOverrides(baseFingerprint, overrides) {
        if (!overrides) {
            return baseFingerprint;
        }
        const fingerprint = structuredClone(baseFingerprint);
        if (overrides.browser) {
            fingerprint.browser = {
                ...fingerprint.browser,
                ...overrides.browser,
                majorVersion: overrides.browser.majorVersion ?? fingerprint.browser.majorVersion
            };
            fingerprint.userAgent = this.bayesianEngine.generateUserAgent(fingerprint.browser.name, fingerprint.browser.version, fingerprint.device.platform.name, fingerprint.device.type);
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
    createEmptyHeaderResult(fingerprint) {
        return {
            fingerprint,
            headers: {},
            confidence: 0.5,
            uniquenessScore: 0.5,
            warnings: []
        };
    }
    createEmptyTLSResult(fingerprint) {
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
    createEmptyCanvasResult(fingerprint) {
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
    mergeFingerprintModules(fingerprint, headerResult, tlsResult, canvasResult) {
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
    calculateQualityScore(fingerprint, headerResult, tlsResult, canvasResult) {
        const baseQuality = fingerprint.qualityScore ?? 0.9;
        const headerQuality = headerResult.confidence;
        const tlsQuality = tlsResult.tlsFingerprint ? 1 : 0.6;
        const canvasQuality = canvasResult.consistencyScore;
        return (baseQuality + headerQuality + tlsQuality + canvasQuality) / 4;
    }
    calculateUniquenessScore(fingerprint, headerResult, tlsResult) {
        const fingerprintUniqueness = fingerprint.fingerprintHash ? 1 : 0.6;
        const headerUniqueness = headerResult.uniquenessScore;
        const tlsUniqueness = tlsResult.ja3Hash ? 1 : 0.6;
        return (fingerprintUniqueness + headerUniqueness + tlsUniqueness) / 3;
    }
    calculateConsistencyScore(headerResult, tlsResult, canvasResult) {
        const headerConsistency = headerResult.confidence;
        const tlsConsistency = tlsResult.tlsFingerprint ? 1 : 0.5;
        const canvasConsistency = canvasResult.consistencyScore;
        return (headerConsistency + tlsConsistency + canvasConsistency) / 3;
    }
    calculateBypassConfidence(quality, uniqueness, consistency) {
        const qualityWeight = 0.3;
        const uniquenessWeight = 0.4;
        const consistencyWeight = 0.3;
        return (quality * qualityWeight + uniqueness * uniquenessWeight + consistency * consistencyWeight);
    }
    normalizeLegacyConstraints(constraints) {
        if (!constraints) {
            return {};
        }
        return { ...constraints };
    }
    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getDefaultScreenResolution(deviceType) {
        switch (deviceType) {
            case 'mobile':
                return { width: 375, height: 667, colorDepth: 24, pixelRatio: 2 };
            case 'tablet':
                return { width: 768, height: 1024, colorDepth: 24, pixelRatio: 2 };
            default:
                return { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 };
        }
    }
    getDefaultHardwareConcurrency(deviceType) {
        switch (deviceType) {
            case 'mobile':
                return 4;
            case 'tablet':
                return 6;
            default:
                return 8;
        }
    }
    getDefaultDeviceMemory(deviceType) {
        switch (deviceType) {
            case 'mobile':
                return 4;
            case 'tablet':
                return 8;
            default:
                return 16;
        }
    }
    validateBrowserCompatibility(fingerprint) {
        let score = 1.0;
        const { browser, device } = fingerprint;
        if (browser.majorVersion < 50 && device.type === 'mobile') {
            score -= 0.2;
        }
        if (device.platform.name === 'ios' && browser.name !== 'safari') {
            score -= 0.3;
        }
        if (device.platform.name === 'android' && browser.name === 'safari') {
            score -= 0.3;
        }
        return Math.max(0, score);
    }
}
exports.FingerprintGenerator = FingerprintGenerator;
function createFingerprintGenerator(options = {}) {
    return new FingerprintGenerator(options);
}
exports.defaultGenerator = new FingerprintGenerator();
async function generateFingerprint(options = {}) {
    return exports.defaultGenerator.generate(options);
}
async function generateFingerprints(count, options = {}) {
    return exports.defaultGenerator.generateBatch(count, options);
}
//# sourceMappingURL=FingerprintGenerator.js.map