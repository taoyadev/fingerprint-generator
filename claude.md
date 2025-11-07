# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A statistical browser fingerprint generation toolkit using Bayesian networks to create realistic, anti-bot-resistant fingerprints. Generates coherent browser profiles (headers, TLS, Canvas/WebGL, audio) backed by conditional probability distributions trained on real browser telemetry.

## Build & Development Commands

```bash
# Build
npm run build              # Compile TypeScript to dist/

# Development
npm run dev               # Watch mode with ts-node-dev
npm run start:dev         # Run source directly with ts-node

# Testing
npm test                  # Run all tests (100+ unit tests)
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only

# Code Quality
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format with Prettier
npm run format:check      # Check formatting

# Demo & CLI
npm run cli -- generate --browser chrome --device desktop
npm run cli -- batch 20 --browser firefox --summary
node dev-server.js        # Start SSE dev server on :3000

# Cleanup
npm run clean            # Remove dist/
npm run clean:all        # Remove dist/ and node_modules/
```

## Architecture

### Core Components (src/)

1. **BayesianNetwork** (`core/BayesianNetwork.ts`)
   - 47-node Bayesian network with 312 conditional probability edges
   - Enforces browser ↔ OS ↔ device ↔ hardware correlations
   - Seeded RNG for reproducibility
   - `StatisticalFingerprintEngine` is the main class

2. **FingerprintGenerator** (`FingerprintGenerator.ts`)
   - Main orchestrator integrating all modules
   - Constructor accepts `{ randomSeed?, enableDataCollection?, cacheSize? }`
   - `generate(options)` returns `GenerationResult` with fingerprint + headers + TLS + canvas + metadata
   - `generateBatch(count, options)` streams multiple fingerprints

3. **Specialized Generators**
   - `headers/HeaderGenerator.ts` - StatisticalHeaderGenerator for Accept, Client Hints, Sec-Fetch-*, DNT
   - `tls/TLSFingerprintGenerator.ts` - JA3/JA4 signatures mirroring curl-impersonate
   - `canvas/CanvasFingerprintGenerator.ts` - GPU profiles, Canvas/WebGL/Audio fingerprints (no browser needed)

4. **Automation** (`automation/BrowserAutomation.ts`)
   - `createPlaywrightContext(browser, fingerprint, headers)` - injects fingerprint into Playwright
   - `createPuppeteerContext(browser, fingerprint, headers)` - same for Puppeteer
   - Stealth scripts override navigator.webdriver, permissions, plugins

5. **Data Collector** (`data/DataCollector.ts`)
   - Optional telemetry for live probability updates
   - `updateProbabilities(fingerprint)` nudges CPTs based on high-quality samples

### Module Flow

```
GenerationOptions (constraints/overrides)
    ↓
StatisticalFingerprintEngine.sample()
    ↓
Base Fingerprint (browser, OS, device, hardware, locale)
    ↓
Parallel Generation:
  - HeaderGenerator → HTTPHeaders
  - TLSGenerator → TLSFingerprint (JA3/JA4)
  - CanvasGenerator → CanvasModuleResult
    ↓
Quality Scoring (qualityScore, uniquenessScore, consistencyScore, bypassConfidence)
    ↓
GenerationResult
```

## Key Constraints

- **Statistical Correctness**: All attributes must pass conditional probability checks. The Bayesian network prevents impossible combos (e.g., Chrome on iOS, Android Safari).
- **Deterministic Chaos**: Same seed → same fingerprints. Default mode uses `Date.now()` for entropy.
- **Zero Browser Dependencies**: Canvas/WebGL/Audio are synthesized in pure Node. No JSDOM, no Puppeteer overhead.
- **Validation**: Every fingerprint includes quality/uniqueness/consistency scores. Reject low-score samples automatically.

## Common Patterns

### Generate Single Fingerprint

```typescript
import { FingerprintGenerator } from './src/FingerprintGenerator';

const generator = new FingerprintGenerator({ randomSeed: 42 });
const result = await generator.generate({
  browsers: ['chrome'],
  devices: ['desktop'],
  operatingSystems: [{ name: 'windows', version: '11', architecture: 'x64' }]
});

console.log(result.metadata.qualityScore);
console.log(result.headers);
console.log(result.tlsFingerprint.ja3);
```

### Generate Batch

```typescript
const batch = await generator.generateBatch(50, {
  browsers: ['firefox', 'chrome'],
  devices: ['mobile'],
  screenResolutions: [{ width: 390, height: 844 }]
});

console.log(batch.summary.averageQualityScore);
```

### Playwright Integration

```typescript
import { chromium } from 'playwright';
import { BrowserAutomation } from './src/automation/BrowserAutomation';

const automation = new BrowserAutomation();
const context = await automation.createPlaywrightContext(
  browser,
  result.fingerprint,
  result.headers
);
const page = await context.newPage();
```

## Type System

All types defined in `src/types/index.ts`:

- `Fingerprint` - Base profile (browser, OS, device, hardware, locale, timezone)
- `GenerationOptions` - Constraints for sampling (browsers, devices, platforms, overrides)
- `HTTPHeaders` - Accept, User-Agent, Client Hints, Sec-Fetch-*, DNT
- `TLSFingerprint` - JA3, JA4, cipher suites, HTTP/2 settings
- `CanvasModuleResult` - Canvas/WebGL/Audio hashes + GPU info
- `GenerationResult` - Complete output with metadata and scores

## Testing Notes

- Tests live in `tests/unit/` and `tests/integration/`
- Fixture data in `tests/fixtures/`
- Setup in `tests/setup.ts`
- 100+ unit tests validate Bayesian network, header generation, TLS signatures, canvas rendering
- Integration tests confirm end-to-end fingerprint coherence

## Development Server

`dev-server.js` is a standalone Node script (no framework):
- Serves HTML UI at http://localhost:3000
- `/api/generate` - POST JSON, returns single fingerprint
- `/api/batch` - SSE stream, sends NDJSON batches in real-time
- Browser/device dropdowns in UI for interactive testing

## CLI

`src/cli/index.ts` is the entry point:
- Zero-dependency argument parser (no Commander)
- `generate` subcommand for single fingerprints
- `batch` subcommand for streaming N fingerprints with progress `[7/20] firefox desktop 4f3b1c9a`
- `--output file.json` writes full results
- `--summary` prints batch stats

## Important Files

- `ARCHITECTURE.md` - Deep dive into Bayesian network, data flow, failure modes
- `INTEGRATION.md` - Playwright/Puppeteer recipes, stealth techniques
- `PERFORMANCE.md` - Benchmarks, optimization tips
- `SECURITY.md` - Ethical guidelines, anti-detection best practices
- `.env.example` - Sample environment config (no API keys needed by default)

## Notes for Claude Code

- When modifying the Bayesian network, update conditional probability tables (CPTs) in `BayesianNetwork.ts` methods like `getDeviceProbabilities()`, `getPlatformProbabilities()`, etc.
- Adding new fingerprint attributes requires:
  1. Update `types/index.ts` with new field
  2. Add Bayesian node in `BayesianNetwork.ts`
  3. Update appropriate generator (headers/TLS/canvas)
  4. Add validation logic
  5. Write unit tests
- Quality scores are calculated in `FingerprintGenerator.calculateMetadata()` - adjust thresholds there
- TLS signatures mirror curl-impersonate; check `tls/TLSFingerprintGenerator.ts` for JA3/JA4 definitions
- Stealth scripts are injected via `page.evaluateOnNewDocument` in `BrowserAutomation.ts`
- The project avoids external API calls by design - all distributions are baked into the code
