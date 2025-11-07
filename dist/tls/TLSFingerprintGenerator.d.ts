import { TLSFingerprint, Fingerprint } from '../types';
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
export declare class StatisticalTLSFingerprintGenerator {
    private browserSignatures;
    private randomSeed;
    constructor(randomSeed?: number);
    private initializeBrowserSignatures;
    generateTLSFingerprint(fingerprint: Fingerprint): TLSFingerprintResult;
    private getBrowserKey;
    private randomizeSignature;
    private randomizeHTTP2Settings;
    private variateValue;
    private shuffleArray;
    private calculateJA3Hash;
    private calculateJA4Hash;
    private hashMD5;
    private getSSLVersion;
    private getPrimaryCipherSuite;
    generateBatch(fingerprints: Fingerprint[]): TLSFingerprintResult[];
    getCurlImpersonateConfig(fingerprint: Fingerprint): any;
    validateTLSConsistency(tlsFingerprint: TLSFingerprint, fingerprint: Fingerprint): {
        isValid: boolean;
        score: number;
        warnings: string[];
    };
    private seededRandom;
    updateBrowserSignatures(newSignatures: Record<string, any>): void;
    getAvailableSignatures(): string[];
}
//# sourceMappingURL=TLSFingerprintGenerator.d.ts.map