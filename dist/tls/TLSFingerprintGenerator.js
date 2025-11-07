"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalTLSFingerprintGenerator = void 0;
const crypto_1 = require("crypto");
class StatisticalTLSFingerprintGenerator {
    constructor(randomSeed) {
        this.browserSignatures = new Map();
        this.randomSeed = randomSeed || Date.now();
        this.initializeBrowserSignatures();
    }
    initializeBrowserSignatures() {
        this.browserSignatures.set('chrome_120', {
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
    generateTLSFingerprint(fingerprint) {
        const browserKey = this.getBrowserKey(fingerprint);
        const signature = this.browserSignatures.get(browserKey) || this.browserSignatures.get('chrome_120');
        const randomizedSignature = this.randomizeSignature(signature, fingerprint);
        const tlsFingerprint = {
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
    getBrowserKey(fingerprint) {
        const { browser, device } = fingerprint;
        const baseKey = `${browser.name}_${browser.majorVersion}`;
        if (device.type === 'mobile' && (browser.name === 'chrome' || browser.name === 'edge')) {
            return `${baseKey}_mobile`;
        }
        return baseKey;
    }
    randomizeSignature(signature, fingerprint) {
        const randomized = { ...signature };
        if (this.seededRandom() < 0.3) {
            const extensions = signature.extensions.split('-');
            this.shuffleArray(extensions, 0.1);
            randomized.extensions = extensions.join('-');
        }
        if (this.seededRandom() < 0.2) {
            const ciphers = signature.ciphers.split('-');
            this.shuffleArray(ciphers, 0.1);
            randomized.ciphers = ciphers.join('-');
        }
        return randomized;
    }
    randomizeHTTP2Settings(settings, fingerprint) {
        if (settings.headerTableSize > 10000) {
            settings.headerTableSize = this.variateValue(settings.headerTableSize, 0.1);
        }
        if (settings.maxConcurrentStreams > 100) {
            settings.maxConcurrentStreams = this.variateValue(settings.maxConcurrentStreams, 0.2);
        }
        settings.initialWindowSize = this.variateValue(settings.initialWindowSize, 0.1);
        settings.maxHeaderListSize = this.variateValue(settings.maxHeaderListSize, 0.1);
    }
    variateValue(value, variation) {
        const factor = 1 + (this.seededRandom() - 0.5) * variation;
        const varied = Math.round(value * factor);
        const min = Math.round(value * 0.7);
        const max = Math.round(value * 1.3);
        return Math.max(min, Math.min(max, varied));
    }
    shuffleArray(array, probability) {
        if (this.seededRandom() > probability)
            return;
        for (let i = array.length - 1; i > 0; i--) {
            if (this.seededRandom() < 0.1) {
                const j = Math.floor(this.seededRandom() * (i + 1));
                const temp = array[i];
                if (temp !== undefined && array[j] !== undefined) {
                    array[i] = array[j];
                    array[j] = temp;
                }
            }
        }
    }
    calculateJA3Hash(tlsFingerprint) {
        const ja3String = [
            tlsFingerprint.version,
            tlsFingerprint.ciphers.join('-'),
            tlsFingerprint.extensions.join('-'),
            '23-24-25',
            '0',
            tlsFingerprint.signatureAlgorithms.join('-')
        ].join(',');
        return this.hashMD5(ja3String);
    }
    calculateJA4Hash(tlsFingerprint, fingerprint) {
        const ja4String = [
            't13',
            tlsFingerprint.ciphers.length.toString(16),
            tlsFingerprint.extensions.join('')
        ].join('_');
        return this.hashMD5(ja4String).substring(0, 12);
    }
    hashMD5(input) {
        return (0, crypto_1.createHash)('md5').update(input).digest('hex');
    }
    getSSLVersion(version) {
        const versionMap = {
            '771': 'TLSv1.2',
            '772': 'TLSv1.3',
            '768': 'TLSv1.0',
            '769': 'TLSv1.1'
        };
        return versionMap[version] || 'TLSv1.2';
    }
    getPrimaryCipherSuite(ciphers) {
        if (ciphers.length === 0)
            return '';
        return ciphers[0] || '';
    }
    generateBatch(fingerprints) {
        return fingerprints.map(fp => this.generateTLSFingerprint(fp));
    }
    getCurlImpersonateConfig(fingerprint) {
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
    validateTLSConsistency(tlsFingerprint, fingerprint) {
        const warnings = [];
        let score = 1.0;
        const browserVersion = fingerprint.browser.majorVersion;
        if (tlsFingerprint.version === '772' && browserVersion < 100) {
            warnings.push('TLS 1.3 detected in older browser version');
            score -= 0.2;
        }
        if (tlsFingerprint.ciphers.includes('4865') && browserVersion < 50) {
            warnings.push('Modern cipher suite detected in older browser');
            score -= 0.1;
        }
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
    seededRandom() {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280;
    }
    updateBrowserSignatures(newSignatures) {
        Object.entries(newSignatures).forEach(([key, signature]) => {
            this.browserSignatures.set(key, signature);
        });
    }
    getAvailableSignatures() {
        return Array.from(this.browserSignatures.keys());
    }
}
exports.StatisticalTLSFingerprintGenerator = StatisticalTLSFingerprintGenerator;
//# sourceMappingURL=TLSFingerprintGenerator.js.map