import { BrowserStatistics, DataCollectionConfig, Fingerprint } from '../types';
export interface CacheStats {
    size: number;
    lastUpdated: string;
}
export interface DataSource {
    name: string;
    url: string;
    updateFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    lastFetch?: Date;
    isActive: boolean;
}
export interface FingerprintData {
    browserStats: BrowserStatistics[];
    deviceStats: any[];
    screenResolutions: {
        width: number;
        height: number;
        usage: number;
    }[];
    hardwareConcurrency: {
        cores: number;
        usage: number;
    }[];
    osVersions: {
        name: string;
        version: string;
        usage: number;
    }[];
    languageData: {
        locale: string;
        usage: number;
    }[];
    timezoneData: {
        timezone: string;
        usage: number;
    }[];
    collectedAt: Date;
}
export declare class StatisticalDataCollector {
    private config;
    private dataCache;
    private sources;
    constructor(config?: Partial<DataCollectionConfig>);
    private initializeDataSources;
    collectAllData(): Promise<FingerprintData>;
    private collectBrowserStatistics;
    private collectDeviceStatistics;
    private collectScreenResolutionData;
    private collectHardwareConcurrencyData;
    private collectOSVersionData;
    private collectLanguageData;
    private collectTimezoneData;
    private normalizeBrowserStats;
    getCachedData(maxAgeHours?: number): Promise<FingerprintData>;
    private isDataFresh;
    updateDataSource(sourceName: string): Promise<void>;
    getStatus(): {
        sources: DataSource[];
        lastUpdated: string;
        cacheSize: number;
        activeSources: number;
    };
    exportData(): string;
    importData(jsonData: string): void;
    getCacheStats(): CacheStats;
    recordFingerprint(fingerprint: Fingerprint): void;
}
//# sourceMappingURL=DataCollector.d.ts.map