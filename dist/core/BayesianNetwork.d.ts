import { BayesianNetwork, BayesianNetworkNode, Fingerprint, FingerprintConstraints, BrowserName, DeviceType, BayesianNetworkStatistics } from '../types';
export declare class StatisticalFingerprintEngine implements BayesianNetwork {
    readonly nodes: Map<string, BayesianNetworkNode>;
    readonly edges: Map<string, string[]>;
    private initialized;
    private randomSeed;
    private cachedTopologicalOrder;
    constructor(randomSeed?: number);
    private initializeNetwork;
    private getDeviceProbabilities;
    private getPlatformProbabilities;
    private getScreenResolutionProbabilities;
    private getHardwareConcurrencyProbabilities;
    private getVersionProbabilities;
    private addNode;
    generateSample(constraints?: FingerprintConstraints): Fingerprint;
    private sampleNode;
    private getConditionalDistribution;
    private getConditionKey;
    private sampleCategorical;
    private sampleGaussian;
    private seededRandom;
    private getTopologicalOrder;
    private applyConstraints;
    private resolveVersionConstraint;
    private convertToFingerprint;
    generateUserAgent(browser: BrowserName, version: string, platform: string, device: DeviceType): string;
    private calculateHash;
    private getPlatformVersion;
    private getDeviceMemory;
    calculateProbability(nodeName: string, value: any, evidence?: Record<string, any>): number;
    updateProbabilities(data: Fingerprint[]): void;
    private updateFromFingerprint;
    private extractFeatures;
    private validateEvidenceForNode;
    getStatistics(): BayesianNetworkStatistics;
}
//# sourceMappingURL=BayesianNetwork.d.ts.map