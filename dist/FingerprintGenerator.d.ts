import { Fingerprint, CompleteFingerprint, GenerationOptions, BrowserName, DeviceType, HTTPHeaders, TLSFingerprint, CanvasModuleResult, FingerprintConstraints } from './types';
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
export declare class FingerprintGenerator {
    private bayesianEngine;
    private headerGenerator;
    private tlsGenerator;
    private canvasGenerator;
    private dataCollector;
    private fingerprintCache;
    constructor(options?: {
        randomSeed?: number;
        enableDataCollection?: boolean;
        cacheSize?: number;
    });
    generate(options?: GenerationOptions): Promise<GenerationResult>;
    generateBatch(count: number, options?: GenerationOptions): Promise<BatchResult>;
    generateForBrowser(browserName: BrowserName, version: string, options?: GenerationOptions): Promise<GenerationResult>;
    generateForDevice(deviceType: DeviceType, platform: string, options?: GenerationOptions): Promise<GenerationResult>;
    generateForCurl(fingerprint?: Fingerprint): Promise<any>;
    validate(result: GenerationResult): ValidationReport;
    getStatistics(): {
        bayesianEngine: import("./types").BayesianNetworkStatistics;
        availableTLS: string[];
        gpuDataLoaded: number;
        dataCollectorStats: import("./data/DataCollector").CacheStats;
    };
    updateData(): Promise<void>;
    createCompleteFingerprint(result: GenerationResult): CompleteFingerprint;
    generateWithConstraints(constraints?: FingerprintConstraints): Promise<Fingerprint>;
    generateBatchLegacy(count: number, constraints?: FingerprintConstraints): Promise<Fingerprint[]>;
    updateProbabilities(data: Fingerprint[]): void;
    private initializeDataCollection;
    private extractConstraints;
    private applyOverrides;
    private createEmptyHeaderResult;
    private createEmptyTLSResult;
    private createEmptyCanvasResult;
    private mergeFingerprintModules;
    private calculateQualityScore;
    private calculateUniquenessScore;
    private calculateConsistencyScore;
    private calculateBypassConfidence;
    private normalizeLegacyConstraints;
    private generateBatchId;
    private getDefaultScreenResolution;
    private getDefaultHardwareConcurrency;
    private getDefaultDeviceMemory;
    private validateBrowserCompatibility;
}
export declare function createFingerprintGenerator(options?: {
    randomSeed?: number;
    enableDataCollection?: boolean;
    cacheSize?: number;
}): FingerprintGenerator;
export declare const defaultGenerator: FingerprintGenerator;
export declare function generateFingerprint(options?: GenerationOptions): Promise<GenerationResult>;
export declare function generateFingerprints(count: number, options?: GenerationOptions): Promise<BatchResult>;
//# sourceMappingURL=FingerprintGenerator.d.ts.map