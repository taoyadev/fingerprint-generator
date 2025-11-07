export interface BrowserStatistics {
    name: string;
    version: string;
    marketShare: number;
    region: string;
    deviceType: DeviceType;
    platform: string;
}
export interface DeviceStatistics {
    type: DeviceType;
    brand?: string;
    model?: string;
    screenResolution: ScreenResolution;
    hardwareConcurrency: number;
    deviceMemory?: number;
    platform: Platform;
}
export interface ScreenResolution {
    width: number;
    height: number;
    pixelRatio?: number;
    colorDepth: number;
}
export interface Platform {
    name: string;
    version: string;
    architecture: string;
}
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type BrowserName = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera';
export interface HTTPHeaders {
    'user-agent'?: string;
    accept?: string;
    'accept-language'?: string;
    'accept-encoding'?: string;
    'sec-ch-ua'?: string;
    'sec-ch-ua-mobile'?: string;
    'sec-ch-ua-platform'?: string;
    'sec-fetch-dest'?: string;
    'sec-fetch-mode'?: string;
    'sec-fetch-site'?: string;
    'sec-fetch-user'?: string;
    dnt?: string;
    'upgrade-insecure-requests'?: string;
    [key: string]: string | undefined;
}
export interface HeaderGenerationOptions {
    includeAccept: boolean;
    includeAcceptLanguage: boolean;
    includeAcceptEncoding: boolean;
    includeClientHints: boolean;
    includeSecFetch: boolean;
    includeDNT: boolean;
    httpVersion: '1' | '2';
    requestType: 'navigate' | 'resource' | 'xhr' | 'fetch' | 'iframe';
    resourceType: 'document' | 'script' | 'stylesheet' | 'image' | 'font' | 'api';
}
export interface TLSFingerprint {
    version: string;
    ciphers: string[];
    extensions: string[];
    supportedVersions: string[];
    signatureAlgorithms: string[];
    keyShares: string[];
    compression?: string[];
    alpn?: string[];
}
export interface CanvasRenderingQuality {
    colorDepth: number;
    pixelRatio: number;
    hardwareAcceleration: boolean;
}
export interface CanvasTextRendering {
    font: string;
    textBaseline: 'alphabetic' | 'top' | 'hanging' | 'middle' | 'ideographic' | 'bottom';
    textAlign: 'left' | 'center' | 'right' | 'start' | 'end';
    antialiasing: boolean;
}
export interface CanvasShapeRendering {
    lineJoin: 'bevel' | 'round' | 'miter';
    lineCap: 'butt' | 'round' | 'square';
    miterLimit: number;
}
export interface CanvasFingerprint {
    dataURL: string;
    textHash: string;
    shapesHash: string;
    imageHash: string;
    gradientHash: string;
    compositeHash: string;
    renderingQuality: CanvasRenderingQuality;
    textRendering: CanvasTextRendering;
    shapeRendering: CanvasShapeRendering;
}
export interface WebGLGPUInfo {
    vendor: string;
    renderer: string;
    platform: string;
    memory: number;
}
export interface WebGLFingerprint {
    vendor: string;
    renderer: string;
    version: string;
    shadingLanguageVersion: string;
    extensions: string[];
    parameters: Record<string, number | string>;
    vertexShaderHash: string;
    fragmentShaderHash: string;
    gpuInfo: WebGLGPUInfo;
}
export interface AudioContextFeatures {
    maxChannelsInput: number;
    maxChannelsOutput: number;
    latencyHint: 'interactive' | 'balanced' | 'playback';
    disabled: boolean;
}
export interface AudioFingerprint {
    sampleRate: number;
    oscillatorHash: string;
    noiseHash: string;
    compressorHash: string;
    contextFeatures: AudioContextFeatures;
}
export interface FontSupportMap {
    [font: string]: boolean;
}
export interface FontFingerprint {
    systemFonts: string[];
    webFonts: string[];
    detected: string[];
    total: number;
    fontSignature: string;
    fontSupport: FontSupportMap;
}
export interface CanvasModuleResult {
    canvas: CanvasFingerprint;
    webgl: WebGLFingerprint;
    audio: AudioFingerprint;
    fonts: FontFingerprint;
    warnings: string[];
    consistencyScore: number;
    generationTime: number;
}
export interface CanvasValidationResult {
    isValid: boolean;
    score: number;
    warnings: string[];
}
export interface CompleteFingerprint {
    fingerprint: Fingerprint;
    headers: HTTPHeaders;
    tlsFingerprint: TLSFingerprint;
    canvasFingerprint: CanvasModuleResult;
    qualityScore: number;
    generationTime: number;
    timestamp: string;
}
export interface FingerprintConstraints {
    browsers?: BrowserName[] | {
        name: BrowserName;
        minVersion?: number;
        maxVersion?: number;
    }[];
    devices?: DeviceType[];
    operatingSystems?: Platform[];
    regions?: string[];
    locales?: string[];
    screenResolutions?: ScreenResolution[];
    httpVersion?: '1' | '2';
}
export interface Fingerprint {
    userAgent: string;
    browser: {
        name: BrowserName;
        version: string;
        majorVersion: number;
    };
    device: {
        type: DeviceType;
        platform: Platform;
        screenResolution: ScreenResolution;
        hardwareConcurrency: number;
        deviceMemory?: number;
        vendor?: string;
        model?: string;
    };
    locale: string;
    timezone: {
        name: string;
        offset: number;
        dst: boolean;
    };
    languages: string[];
    cookiesEnabled: boolean;
    plugins: PluginInfo[];
    multimediaDevices: {
        speakers: number;
        microphones: number;
        webcams: number;
    };
    canvas?: CanvasFingerprint;
    webgl?: WebGLFingerprint;
    audio?: AudioFingerprint;
    fonts?: FontFingerprint;
    tls?: TLSFingerprint;
    headers: HTTPHeaders;
    fingerprintHash: string;
    qualityScore: number;
    generationTime: number;
    timestamp: string;
}
export interface PluginInfo {
    name: string;
    description: string;
    filename: string;
    version?: string;
}
export interface BayesianNetworkNode {
    name: string;
    type: 'categorical' | 'numerical' | 'binary';
    parents: string[];
    children: string[];
    probabilityDistribution: ProbabilityDistribution;
}
export interface ConditionalProbability {
    [condition: string]: ProbabilityDistribution | any;
}
export interface ProbabilityDistribution {
    type: 'categorical' | 'gaussian' | 'conditional';
    values?: (string | number)[];
    probabilities?: number[];
    mean?: number;
    variance?: number;
    conditions?: Record<string, ConditionalProbability>;
}
export interface BayesianNetwork {
    nodes: Map<string, BayesianNetworkNode>;
    edges: Map<string, string[]>;
    generateSample(constraints?: FingerprintConstraints): Fingerprint;
    calculateProbability(nodeName: string, value: string | number, evidence?: Record<string, string | number>): number;
    updateProbabilities(data: Fingerprint[]): void;
    getStatistics(): BayesianNetworkStatistics;
    generateUserAgent(browser: BrowserName, version: string, platform: string, device: DeviceType): string;
}
export interface BayesianNetworkStatistics {
    totalNodes: number;
    totalRelationships: number;
    browserTypes: BrowserName[];
    deviceTypes: DeviceType[];
    platforms: string[];
}
export interface DataCollectionConfig {
    sources: {
        browserStats: string[];
        deviceStats: string[];
        geoData: string[];
        tlsSignatures: string[];
    };
    updateFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    lastUpdated: string;
}
export interface FingerprintOverrides {
    browser?: {
        name?: BrowserName;
        version?: string;
        majorVersion?: number;
    };
    device?: Partial<Fingerprint['device']>;
    locale?: string;
    languages?: string[];
    timezone?: Partial<Fingerprint['timezone']>;
}
export interface GenerationOptions extends FingerprintConstraints {
    includeHeaders?: boolean;
    includeTLS?: boolean;
    includeCanvas?: boolean;
    includeWebGL?: boolean;
    includeAudio?: boolean;
    includeFonts?: boolean;
    format?: 'full' | 'headers_only' | 'browser_profile';
    quality?: 'low' | 'medium' | 'high';
    headerOptions?: Partial<HeaderGenerationOptions>;
    overrides?: FingerprintOverrides;
    forceRegenerate?: boolean;
}
export interface BatchGenerationOptions extends FingerprintConstraints {
    batchSize: number;
    outputFormat: 'json' | 'csv' | 'xml';
    options?: Partial<GenerationOptions>;
}
export interface FingerprintGenerationResult {
    fingerprint: Fingerprint;
    headers: HTTPHeaders;
    confidence: number;
    uniquenessScore: number;
    warnings: string[];
}
export interface QualityMetrics {
    consistency: number;
    realism: number;
    uniqueness: number;
    detectionResistance: number;
    overall: number;
}
export interface BrowserAutomationIntegration {
    playwright?: boolean;
    puppeteer?: boolean;
    selenium?: boolean;
}
export interface FingerprintInjectorOptions {
    fingerprint: Fingerprint;
    stealthMode: boolean;
    randomizedBehavior: boolean;
    mouseMovement: boolean;
    typingPattern: boolean;
    scrollBehavior: boolean;
}
export declare class FingerprintGenerationError extends Error {
    readonly code: string;
    readonly details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class DataCollectionError extends Error {
    readonly source: string;
    readonly details?: any | undefined;
    constructor(message: string, source: string, details?: any | undefined);
}
export declare class BayesianNetworkError extends Error {
    readonly node?: string | undefined;
    readonly details?: any | undefined;
    constructor(message: string, node?: string | undefined, details?: any | undefined);
}
//# sourceMappingURL=index.d.ts.map