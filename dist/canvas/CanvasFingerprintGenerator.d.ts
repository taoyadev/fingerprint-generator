import { LRUCache } from '../utils/LRUCache';
import { AudioFingerprint, CanvasFingerprint, CanvasModuleResult, CanvasValidationResult, Fingerprint, FontFingerprint, WebGLFingerprint } from '../types';
interface GPUProfile {
    platform: string;
    vendor: string;
    renderer: string;
    version: string;
    shadingLanguageVersion: string;
    memory: number;
    extensions: string[];
}
export declare class StatisticalCanvasFingerprintGenerator {
    private state;
    private readonly gpuProfiles;
    readonly gpuDataCache: LRUCache<string, GPUProfile>;
    constructor(seed?: number);
    generateFingerprint(fingerprint: Fingerprint): CanvasModuleResult;
    generateCanvasFingerprint(fingerprint: Fingerprint): CanvasFingerprint;
    generateWebGLFingerprint(fingerprint: Fingerprint): WebGLFingerprint;
    generateAudioFingerprint(fingerprint: Fingerprint): AudioFingerprint;
    detectFonts(fingerprint: Fingerprint): FontFingerprint;
    generateBatch(fingerprints: Fingerprint[]): CanvasModuleResult[];
    loadGPUData(): Promise<void>;
    validateCanvasConsistency(canvasFingerprint: CanvasFingerprint, fingerprint: Fingerprint): CanvasValidationResult;
    private buildWebGLParameters;
    private assessCanvasConsistency;
    private getGpuProfile;
    private deriveHardwareAcceleration;
    private createTextRenderingProfile;
    private createShapeRenderingProfile;
    private pickSampleRate;
    private getFontProfiles;
    private sampleSubset;
    private seededRandom;
    private hash;
    private deterministicNumber;
    private pick;
    private buildDefaultGpuProfiles;
    private cacheKey;
    private getFallbackGPUProfile;
}
export {};
//# sourceMappingURL=CanvasFingerprintGenerator.d.ts.map