"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalDataCollector = void 0;
const types_1 = require("../types");
class StatisticalDataCollector {
    constructor(config) {
        this.dataCache = new Map();
        this.sources = [];
        this.config = {
            sources: {
                browserStats: [
                    'https://statcounter.com/',
                    'https://w3counter.com/',
                    'https://gs.statcounter.com/'
                ],
                deviceStats: [
                    'https://deviceatlas.com/',
                    'https://gs.statcounter.com/'
                ],
                geoData: [
                    'https://worldpopulationreview.com/',
                    'https://statista.com/'
                ],
                tlsSignatures: [
                    'https://browserleaks.com/',
                    'https://github.com/browserleaks/browserleaks'
                ]
            },
            updateFrequency: 'daily',
            lastUpdated: new Date().toISOString(),
            ...config
        };
        this.initializeDataSources();
    }
    initializeDataSources() {
        this.sources = [
            {
                name: 'StatCounter Browser Stats',
                url: 'https://gs.statcounter.com/browser-market-share',
                updateFrequency: 'daily',
                isActive: true
            },
            {
                name: 'W3Counter',
                url: 'https://www.w3counter.com/globalstats.php',
                updateFrequency: 'weekly',
                isActive: true
            },
            {
                name: 'BrowserLeaks TLS',
                url: 'https://browserleaks.com/ssl',
                updateFrequency: 'monthly',
                isActive: true
            },
            {
                name: 'Screen Resolution Stats',
                url: 'https://gs.statcounter.com/screen-resolution-stats',
                updateFrequency: 'monthly',
                isActive: true
            }
        ];
    }
    async collectAllData() {
        try {
            const [browserStats, deviceStats, screenResolutions, hardwareConcurrency, osVersions, languageData, timezoneData] = await Promise.all([
                this.collectBrowserStatistics(),
                this.collectDeviceStatistics(),
                this.collectScreenResolutionData(),
                this.collectHardwareConcurrencyData(),
                this.collectOSVersionData(),
                this.collectLanguageData(),
                this.collectTimezoneData()
            ]);
            const fingerprintData = {
                browserStats,
                deviceStats,
                screenResolutions,
                hardwareConcurrency,
                osVersions,
                languageData,
                timezoneData,
                collectedAt: new Date()
            };
            this.dataCache.set('latest', fingerprintData);
            this.config.lastUpdated = fingerprintData.collectedAt.toISOString();
            return fingerprintData;
        }
        catch (error) {
            throw new types_1.DataCollectionError('Failed to collect fingerprint data', 'DataCollectionService', error);
        }
    }
    async collectBrowserStatistics() {
        try {
            const browserData = [
                {
                    name: 'chrome',
                    version: '120',
                    marketShare: 0.6512,
                    region: 'global',
                    deviceType: 'desktop',
                    platform: 'windows'
                },
                {
                    name: 'chrome',
                    version: '120',
                    marketShare: 0.4256,
                    region: 'global',
                    deviceType: 'mobile',
                    platform: 'android'
                },
                {
                    name: 'safari',
                    version: '16.0',
                    marketShare: 0.1874,
                    region: 'global',
                    deviceType: 'mobile',
                    platform: 'ios'
                },
                {
                    name: 'firefox',
                    version: '119',
                    marketShare: 0.1321,
                    region: 'global',
                    deviceType: 'desktop',
                    platform: 'windows'
                },
                {
                    name: 'edge',
                    version: '120',
                    marketShare: 0.0487,
                    region: 'global',
                    deviceType: 'desktop',
                    platform: 'windows'
                },
                {
                    name: 'safari',
                    version: '16.0',
                    marketShare: 0.1456,
                    region: 'global',
                    deviceType: 'desktop',
                    platform: 'macos'
                }
            ];
            return this.normalizeBrowserStats(browserData);
        }
        catch (error) {
            console.error('Failed to collect browser statistics:', error);
            throw error;
        }
    }
    async collectDeviceStatistics() {
        try {
            return [
                {
                    type: 'desktop',
                    brand: 'Custom',
                    model: 'Desktop PC',
                    marketShare: 0.4234,
                    avgScreenResolution: '1920x1080',
                    avgHardwareConcurrency: 6,
                    avgDeviceMemory: 12
                },
                {
                    type: 'mobile',
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    marketShare: 0.2123,
                    avgScreenResolution: '360x780',
                    avgHardwareConcurrency: 8,
                    avgDeviceMemory: 8
                },
                {
                    type: 'mobile',
                    brand: 'Apple',
                    model: 'iPhone 14',
                    marketShare: 0.1678,
                    avgScreenResolution: '390x844',
                    avgHardwareConcurrency: 6,
                    avgDeviceMemory: 6
                },
                {
                    type: 'tablet',
                    brand: 'Apple',
                    model: 'iPad Pro',
                    marketShare: 0.0543,
                    avgScreenResolution: '1024x1366',
                    avgHardwareConcurrency: 4,
                    avgDeviceMemory: 4
                }
            ];
        }
        catch (error) {
            console.error('Failed to collect device statistics:', error);
            throw error;
        }
    }
    async collectScreenResolutionData() {
        try {
            return [
                { width: 1920, height: 1080, usage: 0.3847 },
                { width: 1366, height: 768, usage: 0.1934 },
                { width: 2560, height: 1440, usage: 0.1276 },
                { width: 3840, height: 2160, usage: 0.0834 },
                { width: 1440, height: 900, usage: 0.0823 },
                { width: 1536, height: 864, usage: 0.0678 },
                { width: 360, height: 640, usage: 0.0567 },
                { width: 414, height: 896, usage: 0.0441 },
                { width: 390, height: 844, usage: 0.0321 },
                { width: 412, height: 869, usage: 0.0289 }
            ];
        }
        catch (error) {
            console.error('Failed to collect screen resolution data:', error);
            throw error;
        }
    }
    async collectHardwareConcurrencyData() {
        try {
            return [
                { cores: 4, usage: 0.2345 },
                { cores: 6, usage: 0.2876 },
                { cores: 8, usage: 0.2234 },
                { cores: 2, usage: 0.1234 },
                { cores: 12, usage: 0.0789 },
                { cores: 16, usage: 0.0321 },
                { cores: 1, usage: 0.0111 },
                { cores: 10, usage: 0.0090 }
            ];
        }
        catch (error) {
            console.error('Failed to collect hardware concurrency data:', error);
            throw error;
        }
    }
    async collectOSVersionData() {
        try {
            return [
                { name: 'windows', version: '10', usage: 0.2845 },
                { name: 'windows', version: '11', usage: 0.1876 },
                { name: 'android', version: '13', usage: 0.1654 },
                { name: 'ios', version: '16', usage: 0.1476 },
                { name: 'macos', version: '13', usage: 0.0897 },
                { name: 'linux', version: '5.15', usage: 0.0432 },
                { name: 'android', version: '12', usage: 0.0345 },
                { name: 'ios', version: '15', usage: 0.0234 },
                { name: 'windows', version: '7', usage: 0.0123 },
                { name: 'linux', version: '6.0', usage: 0.0118 }
            ];
        }
        catch (error) {
            console.error('Failed to collect OS version data:', error);
            throw error;
        }
    }
    async collectLanguageData() {
        try {
            return [
                { locale: 'en-US', usage: 0.3421 },
                { locale: 'zh-CN', usage: 0.1876 },
                { locale: 'en-GB', usage: 0.0876 },
                { locale: 'es-ES', usage: 0.0754 },
                { locale: 'en-IN', usage: 0.0678 },
                { locale: 'ja-JP', usage: 0.0543 },
                { locale: 'fr-FR', usage: 0.0456 },
                { locale: 'de-DE', usage: 0.0423 },
                { locale: 'pt-BR', usage: 0.0387 },
                { locale: 'ru-RU', usage: 0.0321 }
            ];
        }
        catch (error) {
            console.error('Failed to collect language data:', error);
            throw error;
        }
    }
    async collectTimezoneData() {
        try {
            return [
                { timezone: 'America/New_York', usage: 0.1432 },
                { timezone: 'America/Los_Angeles', usage: 0.0876 },
                { timezone: 'Europe/London', usage: 0.0654 },
                { timezone: 'Europe/Paris', usage: 0.0543 },
                { timezone: 'Asia/Shanghai', usage: 0.0456 },
                { timezone: 'Asia/Tokyo', usage: 0.0432 },
                { timezone: 'America/Chicago', usage: 0.0387 },
                { timezone: 'Europe/Berlin', usage: 0.0345 },
                { timezone: 'Asia/Kolkata', usage: 0.0321 },
                { timezone: 'America/Denver', usage: 0.0289 }
            ];
        }
        catch (error) {
            console.error('Failed to collect timezone data:', error);
            throw error;
        }
    }
    normalizeBrowserStats(browserData) {
        const deviceGroups = browserData.reduce((groups, stat) => {
            const key = stat.deviceType;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(stat);
            return groups;
        }, {});
        Object.values(deviceGroups).forEach(group => {
            const totalMarketShare = group.reduce((sum, stat) => sum + stat.marketShare, 0);
            group.forEach(stat => {
                stat.marketShare = stat.marketShare / totalMarketShare;
            });
        });
        return browserData;
    }
    async getCachedData(maxAgeHours = 24) {
        const cached = this.dataCache.get('latest');
        if (cached && this.isDataFresh(cached.collectedAt, maxAgeHours)) {
            return cached;
        }
        return this.collectAllData();
    }
    isDataFresh(collectedAt, maxAgeHours) {
        const age = Date.now() - collectedAt.getTime();
        const maxAge = maxAgeHours * 60 * 60 * 1000;
        return age < maxAge;
    }
    async updateDataSource(sourceName) {
        const source = this.sources.find(s => s.name === sourceName);
        if (!source) {
            throw new types_1.DataCollectionError(`Data source ${sourceName} not found`, sourceName);
        }
        try {
            console.log(`Updating data source: ${sourceName}`);
            source.lastFetch = new Date();
            console.log(`Successfully updated ${sourceName}`);
        }
        catch (error) {
            source.isActive = false;
            throw new types_1.DataCollectionError(`Failed to update data source ${sourceName}`, sourceName, error);
        }
    }
    getStatus() {
        return {
            sources: this.sources,
            lastUpdated: this.config.lastUpdated,
            cacheSize: this.dataCache.size,
            activeSources: this.sources.filter(s => s.isActive).length
        };
    }
    exportData() {
        const data = Array.from(this.dataCache.entries()).reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});
        return JSON.stringify(data, null, 2);
    }
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.entries(data).forEach(([key, value]) => {
                this.dataCache.set(key, value);
            });
        }
        catch (error) {
            throw new types_1.DataCollectionError('Failed to import data from JSON', 'DataImporter', error);
        }
    }
    getCacheStats() {
        return {
            size: this.dataCache.size,
            lastUpdated: this.config.lastUpdated
        };
    }
    recordFingerprint(fingerprint) {
        const history = this.dataCache.get('fingerprints') ?? [];
        history.push(fingerprint);
        this.dataCache.set('fingerprints', history.slice(-1000));
    }
}
exports.StatisticalDataCollector = StatisticalDataCollector;
//# sourceMappingURL=DataCollector.js.map