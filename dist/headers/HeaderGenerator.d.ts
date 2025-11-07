import { HTTPHeaders, Fingerprint, FingerprintGenerationResult, HeaderGenerationOptions } from '../types';
export declare class StatisticalHeaderGenerator {
    private defaultOptions;
    constructor(options?: Partial<HeaderGenerationOptions>);
    generateHeaders(fingerprint: Fingerprint, options?: Partial<HeaderGenerationOptions>): FingerprintGenerationResult;
    private generateAcceptHeader;
    private generateChromeAcceptHeader;
    private generateFirefoxAcceptHeader;
    private generateSafariAcceptHeader;
    private generateEdgeAcceptHeader;
    private generateAcceptLanguageHeader;
    private generateAcceptEncodingHeader;
    private generateClientHintHeaders;
    private generateSecFetchHeaders;
    private generateDNTHeader;
    private generateHTTP2Headers;
    calculateHeaderConsistency(headers: HTTPHeaders, fingerprint: Fingerprint): number;
    private calculateHeaderUniqueness;
    validateHeaders(headers: HTTPHeaders): string[];
    generateForUseCase(useCase: 'browser_automation' | 'api_client' | 'mobile_app' | 'web_crawler', fingerprint: Fingerprint): HTTPHeaders;
    private getOptionsForUseCase;
    generateBatch(fingerprints: Fingerprint[], options?: Partial<HeaderGenerationOptions>): FingerprintGenerationResult[];
}
//# sourceMappingURL=HeaderGenerator.d.ts.map