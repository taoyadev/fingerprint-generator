# API Reference

This is every method you can call, every option you can set, and every result you can expect. No fluff, no guessing. Just the complete API surface.

This document assumes you've read the main README and understand what this tool does. If you haven't, start there. This is the reference manual, not the tutorial.

---

## Table of Contents

1. [Overview](#overview)
2. [FingerprintGenerator Class](#fingerprintgenerator-class)
3. [Generation Options](#generation-options)
4. [Result Objects](#result-objects)
5. [Advanced Usage](#advanced-usage)
6. [Type Definitions](#type-definitions)

---

## Overview

The fingerprint generator is built around a main `FingerprintGenerator` class that orchestrates four specialized modules:

- **Bayesian Engine:** Samples statistically coherent browser profiles from a 47-node network
- **Header Generator:** Creates realistic HTTP headers matching the browser profile
- **TLS Generator:** Produces JA3/JA4 signatures and cipher configurations
- **Canvas Generator:** Synthesizes Canvas, WebGL, Audio, and font fingerprints without a browser

All modules work together to create fingerprints that pass modern anti-bot detection. The API is designed to be simple for common cases and flexible for complex scenarios.

### Quick Navigation

Need something specific? Jump to:
- [Constructor options](#constructor) - Set up the generator
- [generate()](#generate) - Create a single fingerprint
- [generateBatch()](#generatebatch) - Create multiple fingerprints
- [generateForBrowser()](#generateforbrowser) - Target specific browsers
- [generateForDevice()](#generatefordevice) - Target specific devices
- [generateForCurl()](#generateforcurl) - Get curl-impersonate configs
- [validate()](#validate) - Check fingerprint quality

---

## FingerprintGenerator Class

The main entry point for all fingerprint generation.

### Constructor

```typescript
new FingerprintGenerator(options?: {
  randomSeed?: number;
  enableDataCollection?: boolean;
  cacheSize?: number;
})
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `randomSeed` | `number` | `Date.now()` | Seed for deterministic generation. Same seed = same fingerprints. |
| `enableDataCollection` | `boolean` | `false` | Enable telemetry collection for probability updates. |
| `cacheSize` | `number` | `100` | Number of generated fingerprints to cache (LRU). |

#### Examples

**Default configuration (random seed, no telemetry):**
```typescript
import { FingerprintGenerator } from 'fingerprint-generator';

const generator = new FingerprintGenerator();
```

**Deterministic generation (same results every time):**
```typescript
const generator = new FingerprintGenerator({ randomSeed: 42 });

// These will always produce identical fingerprints
const result1 = await generator.generate();
const result2 = await generator.generate(); // Same as result1
```

**Enable telemetry for probability updates:**
```typescript
const generator = new FingerprintGenerator({
  enableDataCollection: true,
  cacheSize: 1000
});
```

---

### generate()

Generate a complete browser fingerprint with all modules.

```typescript
async generate(options?: GenerationOptions): Promise<GenerationResult>
```

#### Parameters

See [Generation Options](#generation-options) for complete details.

#### Returns

A `GenerationResult` object containing:

| Field | Type | Description |
|-------|------|-------------|
| `fingerprint` | `Fingerprint` | Complete browser profile (browser, OS, device, hardware, locale) |
| `headers` | `HTTPHeaders` | HTTP headers matching the profile |
| `tlsFingerprint` | `TLSFingerprint` | TLS configuration with JA3/JA4 hashes |
| `canvasFingerprint` | `CanvasModuleResult` | Canvas, WebGL, Audio, Font fingerprints |
| `metadata` | `object` | Quality metrics and generation stats |

#### Examples

**Generate random desktop Chrome fingerprint:**
```typescript
const result = await generator.generate({
  browsers: ['chrome'],
  devices: ['desktop']
});

console.log(result.fingerprint.userAgent);
// Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...

console.log(result.headers);
// {
//   'user-agent': 'Mozilla/5.0...',
//   'accept': 'text/html,application/xhtml+xml...',
//   'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120"',
//   ...
// }

console.log(result.metadata.qualityScore);
// 0.97
```

**Generate mobile Safari on iOS:**
```typescript
const result = await generator.generate({
  browsers: ['safari'],
  devices: ['mobile'],
  operatingSystems: [{ name: 'ios', version: '17', architecture: 'arm64' }]
});

console.log(result.fingerprint.device.type);
// 'mobile'

console.log(result.fingerprint.device.platform.name);
// 'ios'
```

**Generate with specific screen resolution:**
```typescript
const result = await generator.generate({
  screenResolutions: [{ width: 1920, height: 1080, colorDepth: 24 }]
});

console.log(result.fingerprint.device.screenResolution);
// { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 }
```

**Headers-only generation (fast):**
```typescript
const result = await generator.generate({
  includeHeaders: true,
  includeTLS: false,
  includeCanvas: false
});

// Only fingerprint + headers generated, ~5x faster
```

---

### generateBatch()

Generate multiple fingerprints efficiently with parallel execution.

```typescript
async generateBatch(count: number, options?: GenerationOptions): Promise<BatchResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `count` | `number` | Number of fingerprints to generate |
| `options` | `GenerationOptions` | Same options as `generate()` |

#### Returns

A `BatchResult` object containing:

| Field | Type | Description |
|-------|------|-------------|
| `results` | `GenerationResult[]` | Array of all generated fingerprints |
| `summary` | `object` | Batch statistics (quality scores, timing, batch ID) |

#### Example

```typescript
const batch = await generator.generateBatch(50, {
  browsers: ['chrome', 'firefox'],
  devices: ['desktop', 'mobile']
});

console.log(batch.summary);
// {
//   totalGenerated: 50,
//   averageQualityScore: 0.96,
//   averageUniquenessScore: 0.94,
//   averageGenerationTime: 1.2,
//   batchId: 'batch_1704067200000_abc123',
//   timestamp: '2025-01-01T00:00:00.000Z'
// }

// Process each fingerprint
batch.results.forEach((result, index) => {
  console.log(`[${index}] ${result.fingerprint.browser.name} on ${result.fingerprint.device.platform.name}`);
});
```

---

### generateForBrowser()

Generate a fingerprint for a specific browser and version while keeping other attributes realistic.

```typescript
async generateForBrowser(
  browserName: BrowserName,
  version: string,
  options?: GenerationOptions
): Promise<GenerationResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `browserName` | `'chrome' \| 'firefox' \| 'safari' \| 'edge' \| 'opera'` | Browser to generate |
| `version` | `string` | Browser version (e.g., '120.0.6099.109') |
| `options` | `GenerationOptions` | Additional constraints |

#### Example

```typescript
const result = await generator.generateForBrowser('firefox', '121.0', {
  devices: ['desktop']
});

console.log(result.fingerprint.browser);
// { name: 'firefox', version: '121.0', majorVersion: 121 }
```

---

### generateForDevice()

Generate a fingerprint for a specific device type and platform.

```typescript
async generateForDevice(
  deviceType: DeviceType,
  platform: string,
  options?: GenerationOptions
): Promise<GenerationResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceType` | `'desktop' \| 'mobile' \| 'tablet'` | Device type |
| `platform` | `string` | Platform name (e.g., 'windows', 'android', 'ios') |
| `options` | `GenerationOptions` | Additional constraints |

#### Example

```typescript
const result = await generator.generateForDevice('mobile', 'android', {
  browsers: ['chrome']
});

console.log(result.fingerprint.device);
// {
//   type: 'mobile',
//   platform: { name: 'android', version: '14', architecture: 'arm64' },
//   screenResolution: { width: 390, height: 844, colorDepth: 24, pixelRatio: 3 },
//   hardwareConcurrency: 8,
//   deviceMemory: 6
// }
```

---

### generateForCurl()

Generate a curl-impersonate compatible configuration.

```typescript
async generateForCurl(fingerprint?: Fingerprint): Promise<CurlConfig>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fingerprint` | `Fingerprint` (optional) | Existing fingerprint to convert. If omitted, generates new one. |

#### Returns

A curl-impersonate configuration object:

```typescript
{
  browser: string;          // 'chrome'
  version: number;          // 120
  platform: string;         // 'windows'
  mobile: boolean;          // false
  user_agent: string;       // Full User-Agent string
  headers: HTTPHeaders;     // HTTP headers object
  tls: {
    version: string;        // '771' (TLS 1.3)
    ciphers: string;        // Colon-separated cipher list
    ...
  };
  ja3: string;              // JA3 hash
  ja4: string;              // JA4 hash
}
```

#### Example

```typescript
const curlConfig = await generator.generateForCurl();

console.log(curlConfig);
// {
//   browser: 'chrome',
//   version: 120,
//   platform: 'windows',
//   mobile: false,
//   user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
//   headers: { accept: '...', 'sec-ch-ua': '...' },
//   tls: { version: '771', ciphers: '4865:4866:4867:...' },
//   ja3: '771,4865-4866-4867...',
//   ja4: 't13d1516h2_8daaf6152771_...'
// }

// Use with curl-impersonate
const command = `curl-impersonate-chrome120 \\
  -H "User-Agent: ${curlConfig.user_agent}" \\
  --ciphers "${curlConfig.tls.ciphers}" \\
  https://example.com`;
```

---

### validate()

Validate a generated fingerprint for consistency and quality.

```typescript
validate(result: GenerationResult): ValidationReport
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `result` | `GenerationResult` | The fingerprint to validate |

#### Returns

A `ValidationReport` object:

| Field | Type | Description |
|-------|------|-------------|
| `isValid` | `boolean` | Overall validation result |
| `overallScore` | `number` | Combined score (0-1) |
| `warnings` | `string[]` | List of validation warnings |
| `details` | `object` | Per-module consistency scores |

#### Example

```typescript
const result = await generator.generate();
const validation = generator.validate(result);

console.log(validation);
// {
//   isValid: true,
//   overallScore: 0.95,
//   warnings: [],
//   details: {
//     headerConsistency: 0.98,
//     tlsConsistency: 0.96,
//     canvasConsistency: 0.94,
//     browserCompatibility: 0.92
//   }
// }

if (!validation.isValid) {
  console.warn('Validation warnings:', validation.warnings);
  // ['Modern cipher suite detected in older browser version']
}
```

---

### getStatistics()

Get statistics about the generator's internal state.

```typescript
getStatistics(): object
```

#### Returns

```typescript
{
  bayesianEngine: {
    totalNodes: number;
    totalRelationships: number;
    browserTypes: BrowserName[];
    deviceTypes: DeviceType[];
    platforms: string[];
  };
  availableTLS: Array<{
    browser: string;
    version: number;
    ja3: string;
    ja4: string;
  }>;
  gpuDataLoaded: number;
  dataCollectorStats: {
    cacheSize: number;
    lastUpdated: string;
  };
}
```

#### Example

```typescript
const stats = generator.getStatistics();

console.log(stats.bayesianEngine);
// { totalNodes: 47, totalRelationships: 312, browserTypes: [...], ... }

console.log(stats.availableTLS.length);
// 150 (number of TLS signature templates)

console.log(stats.gpuDataLoaded);
// 427 (number of GPU profiles)
```

---

### updateData()

Update the generator with fresh real-world data (if data collection is enabled).

```typescript
async updateData(): Promise<void>
```

#### Example

```typescript
const generator = new FingerprintGenerator({ enableDataCollection: true });

// Update with fresh data
await generator.updateData();

// Future generations will use updated probabilities
const result = await generator.generate();
```

---

## Generation Options

Complete reference for `GenerationOptions` object passed to `generate()` and `generateBatch()`.

### Constraint Options

| Option | Type | Description |
|--------|------|-------------|
| `browsers` | `BrowserName[]` | Allowed browsers: `['chrome', 'firefox', 'safari', 'edge', 'opera']` |
| `devices` | `DeviceType[]` | Allowed device types: `['desktop', 'mobile', 'tablet']` |
| `operatingSystems` | `Platform[]` | Allowed OS platforms (see example below) |
| `screenResolutions` | `ScreenResolution[]` | Allowed screen resolutions |
| `locales` | `string[]` | Allowed locales (e.g., `['en-US', 'en-GB']`) |
| `httpVersion` | `'1' \| '2'` | HTTP version to use |

### Module Toggle Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeHeaders` | `boolean` | `true` | Generate HTTP headers |
| `includeTLS` | `boolean` | `true` | Generate TLS fingerprint |
| `includeCanvas` | `boolean` | `true` | Generate Canvas/WebGL/Audio |

### Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headerOptions` | `HeaderGenerationOptions` | `{}` | Fine-tune header generation (see below) |
| `overrides` | `FingerprintOverrides` | `{}` | Override specific fingerprint attributes |
| `forceRegenerate` | `boolean` | `false` | Skip cache and generate fresh fingerprint |

### Examples

**Generate Chrome on Windows only:**
```typescript
const result = await generator.generate({
  browsers: ['chrome'],
  devices: ['desktop'],
  operatingSystems: [
    { name: 'windows', version: '11', architecture: 'x64' }
  ]
});
```

**Generate random mobile browser:**
```typescript
const result = await generator.generate({
  devices: ['mobile']
  // Browser will be randomly selected from mobile-compatible browsers
});
```

**Constrain to specific screen resolutions:**
```typescript
const result = await generator.generate({
  screenResolutions: [
    { width: 1920, height: 1080, colorDepth: 24 },
    { width: 2560, height: 1440, colorDepth: 24 }
  ]
  // Will randomly select one of these resolutions
});
```

**Override specific attributes:**
```typescript
const result = await generator.generate({
  overrides: {
    browser: {
      name: 'chrome',
      version: '120.0.6099.109',
      majorVersion: 120
    },
    locale: 'en-GB',
    languages: ['en-GB', 'en-US'],
    timezone: {
      name: 'Europe/London',
      offset: 0,
      dst: false
    }
  }
});
```

### Header Generation Options

Fine-tune which headers are generated:

```typescript
const result = await generator.generate({
  headerOptions: {
    includeAccept: true,            // Accept header
    includeAcceptLanguage: true,    // Accept-Language
    includeAcceptEncoding: true,    // Accept-Encoding
    includeClientHints: true,       // Sec-CH-UA-* headers
    includeSecFetch: true,          // Sec-Fetch-* headers
    includeDNT: false,              // Do Not Track
    httpVersion: '2',               // HTTP/1.1 or HTTP/2
    requestType: 'navigate',        // navigate | resource | xhr | fetch
    resourceType: 'document'        // document | script | stylesheet | image
  }
});
```

---

## Result Objects

### GenerationResult

The primary result object from `generate()` and `generateBatch()`.

```typescript
interface GenerationResult {
  fingerprint: Fingerprint;         // Base browser profile
  headers: HTTPHeaders;             // HTTP headers
  tlsFingerprint: TLSFingerprint;   // TLS configuration
  canvasFingerprint: CanvasModuleResult; // Canvas/WebGL/Audio
  metadata: {
    generationTime: number;         // Generation time in ms
    qualityScore: number;           // 0-1, overall quality
    uniquenessScore: number;        // 0-1, uniqueness rating
    consistencyScore: number;       // 0-1, cross-module consistency
    bypassConfidence: number;       // 0-1, detection bypass likelihood
  };
}
```

### Fingerprint

The core browser profile:

```typescript
interface Fingerprint {
  // Browser info
  userAgent: string;
  browser: {
    name: BrowserName;
    version: string;              // Full version: '120.0.6099.109'
    majorVersion: number;         // Major version: 120
  };

  // Device info
  device: {
    type: DeviceType;             // 'desktop' | 'mobile' | 'tablet'
    platform: Platform;           // OS info
    screenResolution: ScreenResolution;
    hardwareConcurrency: number;  // CPU cores
    deviceMemory?: number;        // RAM in GB
    vendor?: string;              // e.g., 'Samsung'
    model?: string;               // e.g., 'Galaxy S21'
  };

  // Geographic/Language
  locale: string;                 // e.g., 'en-US'
  timezone: {
    name: string;                 // e.g., 'America/New_York'
    offset: number;               // Minutes from UTC
    dst: boolean;                 // Daylight saving time active
  };
  languages: string[];            // e.g., ['en-US', 'en']

  // Capabilities
  cookiesEnabled: boolean;
  plugins: PluginInfo[];
  multimediaDevices: {
    speakers: number;
    microphones: number;
    webcams: number;
  };

  // Advanced fingerprints (included if enabled)
  canvas?: CanvasFingerprint;
  webgl?: WebGLFingerprint;
  audio?: AudioFingerprint;
  fonts?: FontFingerprint;
  tls?: TLSFingerprint;

  // HTTP headers
  headers: HTTPHeaders;

  // Metadata
  fingerprintHash: string;        // Unique hash of fingerprint
  qualityScore: number;           // 0-1
  generationTime: number;         // ms
  timestamp: string;              // ISO 8601
}
```

### HTTPHeaders

Generated HTTP headers matching the browser profile:

```typescript
interface HTTPHeaders {
  'user-agent'?: string;
  'accept'?: string;
  'accept-language'?: string;
  'accept-encoding'?: string;
  'sec-ch-ua'?: string;                    // Client Hints
  'sec-ch-ua-mobile'?: string;             // Client Hints
  'sec-ch-ua-platform'?: string;           // Client Hints
  'sec-fetch-dest'?: string;               // Fetch metadata
  'sec-fetch-mode'?: string;               // Fetch metadata
  'sec-fetch-site'?: string;               // Fetch metadata
  'sec-fetch-user'?: string;               // Fetch metadata
  'dnt'?: string;                          // Do Not Track
  'upgrade-insecure-requests'?: string;
  [key: string]: string | undefined;
}
```

**Example:**
```typescript
const result = await generator.generate({ browsers: ['chrome'] });

console.log(result.headers);
// {
//   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
//   'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//   'accept-language': 'en-US,en;q=0.9',
//   'accept-encoding': 'gzip, deflate, br',
//   'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120", "Not:A-Brand";v="99"',
//   'sec-ch-ua-mobile': '?0',
//   'sec-ch-ua-platform': '"Windows"',
//   'sec-fetch-dest': 'document',
//   'sec-fetch-mode': 'navigate',
//   'sec-fetch-site': 'none',
//   'sec-fetch-user': '?1',
//   'upgrade-insecure-requests': '1'
// }
```

### TLSFingerprint

TLS/SSL configuration with JA3 and JA4 hashes:

```typescript
interface TLSFingerprint {
  version: string;                  // TLS version: '771' (TLS 1.3)
  ciphers: string[];                // Cipher suite IDs
  extensions: string[];             // TLS extension IDs
  supportedVersions: string[];      // Supported TLS versions
  signatureAlgorithms: string[];    // Signature algorithm IDs
  keyShares: string[];              // Key share groups
  compression?: string[];           // Compression methods (usually empty)
  alpn?: string[];                  // ALPN protocols: ['h2', 'http/1.1']
}
```

**Example:**
```typescript
const result = await generator.generate();

console.log(result.tlsFingerprint);
// {
//   version: '771',
//   ciphers: ['4865', '4866', '4867', '49195', '49199', '49196', ...],
//   extensions: ['0', '23', '65281', '10', '11', '35', '16', '5', '13', '18', '51', '45', '43', '27', '21'],
//   supportedVersions: ['771', '770', '769'],
//   signatureAlgorithms: ['1027', '2052', '1025', '1283', '2053', ...],
//   keyShares: ['29', '23', '24'],
//   alpn: ['h2', 'http/1.1']
// }

// JA3 and JA4 hashes available on the result object
console.log(result.tlsFingerprint.ja3Hash);  // '771,4865-4866-4867...'
console.log(result.tlsFingerprint.ja4Hash);  // 't13d1516h2_8daaf6152771_...'
```

### CanvasModuleResult

Canvas, WebGL, Audio, and Font fingerprints:

```typescript
interface CanvasModuleResult {
  canvas: CanvasFingerprint;        // Canvas rendering hashes
  webgl: WebGLFingerprint;          // WebGL info + GPU data
  audio: AudioFingerprint;          // Audio context hashes
  fonts: FontFingerprint;           // Available fonts
  warnings: string[];               // Validation warnings
  consistencyScore: number;         // 0-1
  generationTime: number;           // ms
}
```

**Example:**
```typescript
const result = await generator.generate();

console.log(result.canvasFingerprint.canvas.textHash);
// '5d7c3f8a9b2e1d4c'

console.log(result.canvasFingerprint.webgl.vendor);
// 'Google Inc. (NVIDIA)'

console.log(result.canvasFingerprint.webgl.renderer);
// 'ANGLE (NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)'

console.log(result.canvasFingerprint.audio.oscillatorHash);
// 'a3b7f2c8d1e5f9a2'

console.log(result.canvasFingerprint.fonts.total);
// 87
```

---

## Advanced Usage

### Using the Cache

The generator automatically caches results based on generation options. This speeds up repeated calls with identical constraints.

```typescript
const generator = new FingerprintGenerator({ cacheSize: 500 });

// First call: generates from scratch (~2ms)
const result1 = await generator.generate({ browsers: ['chrome'] });

// Second call with same options: returns cached result (~0.01ms)
const result2 = await generator.generate({ browsers: ['chrome'] });

// Force regeneration (skip cache)
const result3 = await generator.generate({
  browsers: ['chrome'],
  forceRegenerate: true
});
```

### Batch Generation Best Practices

For large batches, use `generateBatch()` instead of calling `generate()` in a loop:

```typescript
// Good: Parallel generation with statistics
const batch = await generator.generateBatch(1000, {
  browsers: ['chrome', 'firefox'],
  devices: ['desktop']
});

console.log(`Generated ${batch.summary.totalGenerated} fingerprints`);
console.log(`Average quality: ${batch.summary.averageQualityScore}`);

// Bad: Sequential generation (slower)
const results = [];
for (let i = 0; i < 1000; i++) {
  results.push(await generator.generate());
}
```

### Integration with Automation

Use with Playwright:

```typescript
import { chromium } from 'playwright';
import { FingerprintGenerator } from 'fingerprint-generator';

const generator = new FingerprintGenerator();
const result = await generator.generate({ browsers: ['chrome'] });

const browser = await chromium.launch();
const context = await browser.newContext({
  userAgent: result.fingerprint.userAgent,
  viewport: {
    width: result.fingerprint.device.screenResolution.width,
    height: result.fingerprint.device.screenResolution.height
  },
  locale: result.fingerprint.locale,
  timezoneId: result.fingerprint.timezone.name,
  extraHTTPHeaders: result.headers
});

const page = await context.newPage();
await page.goto('https://example.com');
```

Use with Puppeteer:

```typescript
import puppeteer from 'puppeteer';
import { FingerprintGenerator } from 'fingerprint-generator';

const generator = new FingerprintGenerator();
const result = await generator.generate({ browsers: ['chrome'] });

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.setUserAgent(result.fingerprint.userAgent);
await page.setViewport({
  width: result.fingerprint.device.screenResolution.width,
  height: result.fingerprint.device.screenResolution.height
});
await page.setExtraHTTPHeaders(result.headers);

await page.goto('https://example.com');
```

### Deterministic Fingerprints for Testing

Use seeds for reproducible test suites:

```typescript
// test/fingerprint.test.ts
import { FingerprintGenerator } from 'fingerprint-generator';

describe('Fingerprint Generation', () => {
  it('should generate consistent fingerprints with same seed', async () => {
    const gen1 = new FingerprintGenerator({ randomSeed: 12345 });
    const gen2 = new FingerprintGenerator({ randomSeed: 12345 });

    const result1 = await gen1.generate();
    const result2 = await gen2.generate();

    expect(result1.fingerprint.fingerprintHash)
      .toBe(result2.fingerprint.fingerprintHash);
  });
});
```

### Updating Probabilities with Real Data

Feed real fingerprints back to improve the Bayesian network:

```typescript
const generator = new FingerprintGenerator({ enableDataCollection: true });

// Collect real fingerprints from successful requests
const realFingerprints = [
  // ... fingerprints that bypassed detection
];

// Update probabilities
realFingerprints.forEach(fp => {
  generator.updateProbabilities([fp]);
});

// Future generations will favor these distributions
const result = await generator.generate();
```

---

## Type Definitions

All TypeScript types are exported from the main module. Import them for type safety:

```typescript
import type {
  Fingerprint,
  GenerationResult,
  GenerationOptions,
  HTTPHeaders,
  TLSFingerprint,
  CanvasModuleResult,
  BrowserName,
  DeviceType,
  Platform,
  ScreenResolution
} from 'fingerprint-generator';
```

### Key Types

**BrowserName:** `'chrome' | 'firefox' | 'safari' | 'edge' | 'opera'`

**DeviceType:** `'desktop' | 'mobile' | 'tablet'`

**Platform:**
```typescript
interface Platform {
  name: string;         // 'windows' | 'macos' | 'linux' | 'android' | 'ios'
  version: string;      // '11', '14', '17.1', etc.
  architecture: string; // 'x64' | 'arm64' | 'x86'
}
```

**ScreenResolution:**
```typescript
interface ScreenResolution {
  width: number;        // e.g., 1920
  height: number;       // e.g., 1080
  colorDepth: number;   // 24 or 32
  pixelRatio?: number;  // 1, 2, or 3
}
```

### Where to Find Full Types

The complete type definitions are in `src/types/index.ts`. This includes:

- All fingerprint component interfaces
- Bayesian network types
- Validation result types
- Error types
- Internal module types

Browse the types file for comprehensive interface definitions:
```bash
cat node_modules/fingerprint-generator/dist/types/index.d.ts
```

---

## Complete Usage Example

Here's a full example combining multiple features:

```typescript
import { FingerprintGenerator } from 'fingerprint-generator';

async function main() {
  // Create generator with deterministic seed
  const generator = new FingerprintGenerator({
    randomSeed: 42,
    enableDataCollection: true,
    cacheSize: 200
  });

  // Generate a mobile Chrome fingerprint on Android
  const result = await generator.generate({
    browsers: ['chrome'],
    devices: ['mobile'],
    operatingSystems: [
      { name: 'android', version: '14', architecture: 'arm64' }
    ],
    screenResolutions: [
      { width: 390, height: 844, colorDepth: 24 }
    ],
    locales: ['en-US'],
    includeHeaders: true,
    includeTLS: true,
    includeCanvas: true
  });

  // Validate the fingerprint
  const validation = generator.validate(result);
  if (!validation.isValid) {
    console.warn('Validation warnings:', validation.warnings);
  }

  // Log key information
  console.log('User-Agent:', result.fingerprint.userAgent);
  console.log('Quality Score:', result.metadata.qualityScore);
  console.log('Bypass Confidence:', result.metadata.bypassConfidence);
  console.log('JA3 Hash:', result.tlsFingerprint.ja3Hash);

  // Use with HTTP client
  const response = await fetch('https://httpbin.org/headers', {
    headers: result.headers
  });

  const data = await response.json();
  console.log('Request headers:', data.headers);

  // Generate a batch for testing
  const batch = await generator.generateBatch(100, {
    browsers: ['chrome', 'firefox', 'safari'],
    devices: ['desktop', 'mobile']
  });

  console.log(`Generated ${batch.summary.totalGenerated} fingerprints`);
  console.log(`Average quality: ${(batch.summary.averageQualityScore * 100).toFixed(1)}%`);
  console.log(`Average time: ${batch.summary.averageGenerationTime.toFixed(2)}ms`);

  // Get generator statistics
  const stats = generator.getStatistics();
  console.log(`Bayesian network: ${stats.bayesianEngine.totalNodes} nodes`);
  console.log(`TLS signatures: ${stats.availableTLS.length}`);
  console.log(`GPU profiles: ${stats.gpuDataLoaded}`);
}

main().catch(console.error);
```

---

**Word Count:** 4,200+ words

You now have complete documentation of every public method, every option, and every result type. This is everything the API can do. If you hit an edge case or find behavior that contradicts this doc, open an issue.
