/**
 * Working Demo of Statistical Fingerprint Generation System
 */

import { FingerprintGenerator, generateFingerprint, generateFingerprints, BrowserName, DeviceType } from './src/index';

async function runWorkingDemo() {
  console.log('🚀 Statistical Fingerprint Generator - Working Demo\n');

  // Initialize the main generator
  const generator = new FingerprintGenerator({ randomSeed: 12345 });

  console.log('📊 Generating 3 different browser fingerprints...\n');

  // Generate 3 different fingerprints
  for (let i = 1; i <= 3; i++) {
    const result = await generator.generate();

    console.log(`🔍 Fingerprint ${i}:`);
    console.log(`   Browser: ${result.fingerprint.browser.name} ${result.fingerprint.browser.version}`);
    console.log(`   Device: ${result.fingerprint.device.type} (${result.fingerprint.device.platform.name})`);
    console.log(`   Screen: ${result.fingerprint.device.screenResolution.width}x${result.fingerprint.device.screenResolution.height}`);
    console.log(`   Hardware: ${result.fingerprint.device.hardwareConcurrency} cores, ${result.fingerprint.device.deviceMemory}GB RAM`);
    console.log(`   Languages: ${result.fingerprint.languages.join(', ')}`);
    console.log(`   Fingerprint Hash: ${result.fingerprint.fingerprintHash}`);
    console.log('');
  }

  // Generate headers and TLS for a specific fingerprint
  console.log('🌐 Generating HTTP Headers and TLS Fingerprints...\n');

  const result = await generator.generate();

  console.log('📋 HTTP Headers:');
  console.log(`   User-Agent: ${result.headers['user-agent']}`);
  console.log(`   Accept: ${result.headers.accept}`);
  console.log(`   Accept-Language: ${result.headers['accept-language']}`);
  console.log(`   Accept-Encoding: ${result.headers['accept-encoding']}`);

  if (result.headers['sec-ch-ua']) {
    console.log(`   Client-Hints: ${result.headers['sec-ch-ua']}`);
    console.log(`   Client-Hints-Mobile: ${result.headers['sec-ch-ua-mobile']}`);
  }

  console.log('\n🔒 TLS Fingerprint:');
  console.log(`   JA3 Hash: ${result.metadata.ja3Hash}`);
  console.log(`   JA4 Hash: ${result.metadata.ja4Hash}`);
  console.log(`   TLS Version: ${result.tlsFingerprint.version}`);
  console.log(`   Cipher Suites: ${result.tlsFingerprint.ciphers.length}`);
  console.log(`   Extensions: ${result.tlsFingerprint.extensions.length}`);

  console.log('\n🎯 Quality Metrics:');
  console.log(`   Generation Time: ${result.metadata.generationTime}ms`);
  console.log(`   Header Confidence: ${(result.metadata.headerConfidence * 100).toFixed(1)}%`);
  console.log(`   Header Uniqueness: ${(result.metadata.headerUniqueness * 100).toFixed(1)}%`);
  console.log(`   Quality Score: ${(result.metadata.qualityScore * 100).toFixed(1)}%`);

  // Show curl-impersonate compatibility
  console.log('\n🛠️  curl-impersonate Compatible Config:');
  const curlConfig = await generator.generateForCurl(result.fingerprint);
  console.log(JSON.stringify(curlConfig, null, 2));

  // Generate browser-specific fingerprints
  console.log('\n📱 Browser-Specific Generation:\n');

  const chromeFP = await generator.generateForBrowser('chrome' as BrowserName, '120');
  console.log(`Chrome 120: ${chromeFP.userAgent}`);
  console.log(`   Device: ${chromeFP.device.type} (${chromeFP.device.platform.name})`);

  const firefoxFP = await generator.generateForBrowser('firefox' as BrowserName, '119');
  console.log(`Firefox 119: ${firefoxFP.userAgent}`);
  console.log(`   Device: ${firefoxFP.device.type} (${firefoxFP.device.platform.name})`);

  // Performance metrics
  console.log('\n⚡ Performance Test:');
  const startTime = Date.now();
  const batchResults = await generator.generateBatch(10);
  const endTime = Date.now();

  console.log(`   Generated 10 fingerprints in ${endTime - startTime}ms`);
  console.log(`   Average: ${((endTime - startTime) / 10).toFixed(1)}ms per fingerprint`);

  console.log('\n✨ Demo completed successfully!');
  console.log('\n🎯 System Features:');
  console.log('   ✅ Statistical-driven browser fingerprint generation');
  console.log('   ✅ Bayesian network for realistic parameter correlations');
  console.log('   ✅ HTTP Headers with real-world statistics');
  console.log('   ✅ TLS/HTTP2 fingerprints (JA3/JA4)');
  console.log('   ✅ curl-impersonate compatibility');
  console.log('   ✅ Browser-specific generation');
  console.log('   ✅ High performance (~1-5ms per fingerprint)');
  console.log('   ✅ TypeScript support with type safety');
}

// Quick usage demo
console.log('🔧 Quick Usage Examples:\n');
console.log('// Basic generation');
console.log('import { generateFingerprint } from "./src/index";');
console.log('const fp = await generateFingerprint();');
console.log('');

console.log('// Batch generation');
console.log('import { generateFingerprints } from "./src/index";');
console.log('const fps = await generateFingerprints(5);');
console.log('');

console.log('// Advanced usage');
console.log('import { FingerprintGenerator } from "./src/index";');
console.log('const gen = new FingerprintGenerator({ randomSeed: 12345 });');
console.log('const result = await gen.generate();');
console.log('const curlConfig = await gen.generateForCurl();');

// Run the main demo
runWorkingDemo().catch(console.error);