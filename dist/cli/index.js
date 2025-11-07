#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const FingerprintGenerator_1 = require("../FingerprintGenerator");
const aliasMap = {
    b: 'browser',
    V: 'version',
    d: 'device',
    p: 'platform',
    o: 'output',
    s: 'seed'
};
const booleanFlags = new Set(['curl', 'validate', 'verbose', 'summary']);
const browserSet = new Set(['chrome', 'firefox', 'safari', 'edge']);
const deviceSet = new Set(['desktop', 'mobile', 'tablet']);
const platformSet = new Set(['windows', 'macos', 'linux', 'android', 'ios']);
async function main() {
    const parsed = parseCommand(process.argv);
    switch (parsed.name) {
        case 'generate':
            await handleGenerate(parsed);
            break;
        case 'batch':
            await handleBatch(parsed);
            break;
        case 'stats':
            await handleStats(parsed);
            break;
        case 'update':
            await handleUpdate(parsed);
            break;
        case 'examples':
            printExamples();
            break;
        case 'help':
        default:
            printUsage();
            process.exit(parsed.name === 'help' ? 0 : 1);
    }
}
function parseCommand(argv) {
    const tokens = argv.slice(2);
    if (tokens.length === 0) {
        return { name: 'help', positional: [], flags: {} };
    }
    const name = tokens.shift().toLowerCase();
    const positional = [];
    const flags = {};
    while (tokens.length > 0) {
        const token = tokens.shift();
        if (token.startsWith('--')) {
            const eqIndex = token.indexOf('=');
            const rawKey = eqIndex >= 0 ? token.slice(2, eqIndex) : token.slice(2);
            const inlineValue = eqIndex >= 0 ? token.slice(eqIndex + 1) : undefined;
            if (rawKey.startsWith('no-')) {
                flags[rawKey.slice(3)] = false;
                continue;
            }
            if (booleanFlags.has(rawKey)) {
                flags[rawKey] = inlineValue ? parseBoolean(inlineValue) : true;
            }
            else {
                const next = inlineValue ?? tokens.shift();
                if (!next) {
                    throw new Error(`Missing value for option --${rawKey}`);
                }
                flags[rawKey] = next;
            }
        }
        else if (token.startsWith('-') && token.length > 1) {
            const aliasKey = token.slice(1);
            const key = aliasMap[aliasKey];
            if (!key) {
                throw new Error(`Unknown option: -${aliasKey}`);
            }
            const next = tokens.shift();
            if (!next) {
                throw new Error(`Missing value for option -${aliasKey}`);
            }
            flags[key] = next;
        }
        else {
            positional.push(token);
        }
    }
    return { name, positional, flags };
}
function parseBoolean(value) {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1';
}
function buildGenerator(flags) {
    const seedValue = flags.seed ? Number(flags.seed) : undefined;
    const generatorOptions = {};
    if (typeof seedValue === 'number' && Number.isFinite(seedValue)) {
        generatorOptions.randomSeed = seedValue;
    }
    return new FingerprintGenerator_1.FingerprintGenerator(generatorOptions);
}
function buildGenerationOptions(flags) {
    const options = {};
    const overrides = {};
    let hasOverride = false;
    const browserFlag = getStringFlag(flags, 'browser');
    if (browserFlag) {
        assertValid('browser', browserFlag, browserSet);
        const version = getStringFlag(flags, 'version') ?? '120';
        const majorToken = version.split('.')[0] || version;
        overrides.browser = {
            name: browserFlag,
            version,
            majorVersion: parseInt(majorToken, 10) || 120
        };
        options.browsers = [browserFlag];
        hasOverride = true;
    }
    const deviceFlag = getStringFlag(flags, 'device');
    if (deviceFlag) {
        assertValid('device', deviceFlag, deviceSet);
        overrides.device = {
            ...(overrides.device ?? {}),
            type: deviceFlag
        };
        options.devices = [deviceFlag];
        hasOverride = true;
    }
    const platformFlag = getStringFlag(flags, 'platform');
    if (platformFlag) {
        assertValid('platform', platformFlag, platformSet);
        overrides.device = {
            ...overrides.device,
            platform: {
                name: platformFlag,
                version: 'latest',
                architecture: 'x64'
            }
        };
        options.operatingSystems = [{ name: platformFlag, version: 'latest', architecture: 'x64' }];
        hasOverride = true;
    }
    if (hasOverride) {
        options.overrides = overrides;
    }
    return options;
}
async function handleGenerate(ctx) {
    const generator = buildGenerator(ctx.flags);
    const options = buildGenerationOptions(ctx.flags);
    const browserFlag = getStringFlag(ctx.flags, 'browser');
    const versionFlag = getStringFlag(ctx.flags, 'version') ?? '120';
    const deviceFlag = getStringFlag(ctx.flags, 'device');
    const platformFlag = getStringFlag(ctx.flags, 'platform');
    let result;
    if (browserFlag) {
        result = await generator.generateForBrowser(browserFlag, versionFlag, options);
    }
    else if (deviceFlag) {
        const platform = platformFlag ?? (deviceFlag === 'mobile' ? 'android' : 'windows');
        result = await generator.generateForDevice(deviceFlag, platform, options);
    }
    else {
        result = await generator.generate(options);
    }
    printFingerprint(result, Boolean(ctx.flags.verbose));
    if (ctx.flags.validate) {
        const report = generator.validate(result);
        printValidation(report);
    }
    if (ctx.flags.curl) {
        const curlConfig = await generator.generateForCurl(result.fingerprint);
        console.log('\nCurl configuration:\n', JSON.stringify(curlConfig, null, 2));
    }
    if (ctx.flags.output) {
        saveOutput(String(ctx.flags.output), result);
    }
}
async function handleBatch(ctx) {
    const count = parseInt(ctx.positional[0] ?? '0', 10);
    if (!Number.isFinite(count) || count <= 0) {
        throw new Error('Please provide a positive number for the batch size.');
    }
    const generator = buildGenerator(ctx.flags);
    const options = buildGenerationOptions(ctx.flags);
    const start = Date.now();
    const results = [];
    for (let i = 0; i < count; i++) {
        const result = await generator.generate(options);
        results.push(result);
        const hash = result.fingerprint.fingerprintHash.slice(0, 12);
        process.stdout.write(`[${i + 1}/${count}] ${result.fingerprint.browser.name} ${result.fingerprint.device.type} ${hash}\n`);
    }
    const summary = buildSummary(results, count, Date.now() - start);
    if (ctx.flags.summary) {
        printBatchSummary(summary);
    }
    else {
        console.log(`Batch complete. Avg quality ${(summary.averageQualityScore * 100).toFixed(1)}%.`);
    }
    if (ctx.flags.output) {
        saveOutput(String(ctx.flags.output), { results, summary });
    }
}
async function handleStats(ctx) {
    const generator = buildGenerator(ctx.flags);
    const stats = generator.getStatistics();
    console.log('Bayesian Engine');
    console.log(`  Nodes: ${stats.bayesianEngine.totalNodes}`);
    console.log(`  Relationships: ${stats.bayesianEngine.totalRelationships}`);
    console.log(`  Browsers: ${stats.bayesianEngine.browserTypes.join(', ')}`);
    console.log(`  Devices: ${stats.bayesianEngine.deviceTypes.join(', ')}`);
    console.log(`  Platforms: ${stats.bayesianEngine.platforms.join(', ')}`);
    console.log('\nTLS Signatures');
    stats.availableTLS.forEach(sig => console.log(`  - ${sig}`));
    console.log('\nGPU Cache');
    console.log(`  Profiles loaded: ${stats.gpuDataLoaded}`);
    if (stats.dataCollectorStats) {
        console.log('\nData Collector');
        console.log(`  Cache size: ${stats.dataCollectorStats.size}`);
        console.log(`  Last updated: ${stats.dataCollectorStats.lastUpdated}`);
    }
}
async function handleUpdate(ctx) {
    const generator = buildGenerator(ctx.flags);
    await generator.updateData();
}
function printFingerprint(result, verbose) {
    console.log('Fingerprint');
    console.log(`  Browser: ${result.fingerprint.browser.name} ${result.fingerprint.browser.version}`);
    console.log(`  Device: ${result.fingerprint.device.type} (${result.fingerprint.device.platform.name})`);
    console.log(`  Screen: ${result.fingerprint.device.screenResolution.width}x${result.fingerprint.device.screenResolution.height}`);
    console.log(`  Hardware: ${result.fingerprint.device.hardwareConcurrency} cores, ${result.fingerprint.device.deviceMemory ?? 0}GB RAM`);
    console.log(`  Languages: ${result.fingerprint.languages.join(', ')}`);
    console.log(`  Hash: ${result.fingerprint.fingerprintHash}`);
    if (verbose) {
        console.log('\nHeaders:');
        Object.entries(result.headers).forEach(([key, value]) => console.log(`  ${key}: ${value}`));
        console.log('\nTLS:');
        console.log(`  Version: ${result.tlsFingerprint.version}`);
        console.log(`  Ciphers: ${result.tlsFingerprint.ciphers.length}`);
        console.log(`  Extensions: ${result.tlsFingerprint.extensions.length}`);
    }
    console.log('\nQuality Metrics');
    console.log(`  Quality: ${(result.metadata.qualityScore * 100).toFixed(1)}%`);
    console.log(`  Uniqueness: ${(result.metadata.uniquenessScore * 100).toFixed(1)}%`);
    console.log(`  Consistency: ${(result.metadata.consistencyScore * 100).toFixed(1)}%`);
    console.log(`  Bypass Confidence: ${(result.metadata.bypassConfidence * 100).toFixed(1)}%`);
}
function printValidation(report) {
    console.log('\nValidation');
    console.log(`  Valid: ${report.isValid ? 'yes' : 'no'}`);
    console.log(`  Score: ${(report.overallScore * 100).toFixed(1)}%`);
    if (report.warnings.length) {
        console.log('  Warnings:');
        report.warnings.forEach((w) => console.log(`    - ${w}`));
    }
}
function printBatchSummary(summary) {
    console.log('Batch Summary');
    console.log(`  Batch ID: ${summary.batchId}`);
    console.log(`  Total: ${summary.totalGenerated}`);
    console.log(`  Avg Quality: ${(summary.averageQualityScore * 100).toFixed(1)}%`);
    console.log(`  Avg Uniqueness: ${(summary.averageUniquenessScore * 100).toFixed(1)}%`);
    console.log(`  Avg Time: ${summary.averageGenerationTime.toFixed(2)}ms`);
    console.log(`  Timestamp: ${summary.timestamp}`);
}
function buildSummary(results, total, totalTimeMs) {
    const quality = results.reduce((sum, r) => sum + r.metadata.qualityScore, 0) / total;
    const uniqueness = results.reduce((sum, r) => sum + r.metadata.uniquenessScore, 0) / total;
    return {
        batchId: `cli_${Date.now().toString(36)}`,
        totalGenerated: total,
        averageQualityScore: quality,
        averageUniquenessScore: uniqueness,
        averageGenerationTime: totalTimeMs / total,
        timestamp: new Date().toISOString()
    };
}
function printExamples() {
    console.log('Examples');
    console.log('  fingerprint-generator generate --browser chrome --version 120');
    console.log('  fingerprint-generator generate --device mobile --platform android');
    console.log('  fingerprint-generator generate --curl --output fingerprint.json');
    console.log('  fingerprint-generator batch 10 --browser firefox --summary');
}
function printUsage() {
    console.log(`Usage:
  fingerprint-generator generate [options]
  fingerprint-generator batch <count> [options]
  fingerprint-generator stats
  fingerprint-generator update
  fingerprint-generator examples`);
}
function saveOutput(target, data) {
    const filePath = (0, path_1.resolve)(process.cwd(), target);
    const dir = (0, path_1.dirname)(filePath);
    if (!(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    }
    (0, fs_1.writeFileSync)(filePath, JSON.stringify(data, null, 2));
    console.log(`\nSaved to ${filePath}`);
}
function getStringFlag(flags, key) {
    const value = flags[key];
    if (typeof value === 'string') {
        return value;
    }
    return undefined;
}
function assertValid(label, value, allowed) {
    if (!allowed.has(value)) {
        throw new Error(`Invalid ${label}: "${value}". Allowed values: ${Array.from(allowed).join(', ')}`);
    }
}
main().catch(error => {
    console.error('CLI error:', error.message || error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map