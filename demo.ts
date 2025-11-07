/**
 * Demo script for fingerprint generation
 */

import { StatisticalFingerprintEngine } from './src/core/BayesianNetwork';

async function runDemo() {
  console.log('🔍 Generating statistical browser fingerprint...\n');

  const engine = new StatisticalFingerprintEngine();
  const fingerprint = engine.generateSample();

  console.log('📋 Fingerprint Summary:');
  console.log(`   User Agent: ${fingerprint.userAgent}`);
  console.log(`   Browser: ${fingerprint.browser.name} ${fingerprint.browser.version}`);
  console.log(`   Device: ${fingerprint.device.type} (${fingerprint.device.platform.name})`);
  console.log(`   Screen: ${fingerprint.device.screenResolution.width}x${fingerprint.device.screenResolution.height}`);
  console.log(`   Hardware: ${fingerprint.device.hardwareConcurrency} cores, ${fingerprint.device.deviceMemory}GB RAM`);
  console.log(`   Languages: ${fingerprint.languages.join(', ')}`);
  console.log(`   Fingerprint Hash: ${fingerprint.fingerprintHash}`);
  console.log(`   Generation Time: ${fingerprint.generationTime}ms`);
  console.log(`   Quality Score: ${fingerprint.qualityScore}`);

  console.log('\n🌐 Generated Headers:');
  Object.entries(fingerprint.headers).forEach(([key, value]) => {
    if (value) {
      console.log(`   ${key}: ${value}`);
    }
  });

  console.log('\n✨ Demo completed successfully!');
}

runDemo().catch(console.error);