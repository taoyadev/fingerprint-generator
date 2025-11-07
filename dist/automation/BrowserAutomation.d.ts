import { Fingerprint, HTTPHeaders } from '../types';
export interface AutomationConfig {
    userAgent: string;
    viewport: {
        width: number;
        height: number;
    };
    headers: Record<string, string>;
    locale: string;
    timezone: string;
    permissions: string[];
    extraHTTPHeaders?: Record<string, string>;
    colorScheme?: 'light' | 'dark' | 'no-preference';
    reducedMotion?: 'reduce' | 'no-preference';
}
export interface PlaywrightConfig extends AutomationConfig {
    userAgentData?: {
        architecture: string;
        platform: string;
        mobile: boolean;
        brands: {
            brand: string;
            version: string;
        }[];
    };
    ignoreHTTPSErrors?: boolean;
    bypassCSP?: boolean;
}
export interface PuppeteerConfig extends AutomationConfig {
    args: string[];
    defaultViewport?: {
        width: number;
        height: number;
    };
    ignoreHTTPSErrors?: boolean;
    headless?: boolean;
}
export declare class BrowserAutomation {
    toPlaywrightConfig(fingerprint: Fingerprint, headers: HTTPHeaders): PlaywrightConfig;
    toPuppeteerConfig(fingerprint: Fingerprint, headers: HTTPHeaders): PuppeteerConfig;
    createPlaywrightContext(browser: any, fingerprint: Fingerprint, headers: HTTPHeaders): Promise<any>;
    createPuppeteerPage(browser: any, fingerprint: Fingerprint, headers: HTTPHeaders): Promise<any>;
    injectFingerprint(target: any, fingerprint: Fingerprint): Promise<void>;
    private buildStealthPayload;
    private buildStealthScript;
    private filterHeaders;
    private buildExtraHeaders;
    private generatePermissions;
    private generatePuppeteerArgs;
    private generateFakePlugins;
}
//# sourceMappingURL=BrowserAutomation.d.ts.map