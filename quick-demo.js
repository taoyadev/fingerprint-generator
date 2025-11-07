import { FingerprintGenerator } from './dist/index.js';

async function quickDemo() {
  console.log('🚀 Starting Fingerprint Generator Demo...\n');

  try {
    const generator = new FingerprintGenerator({ randomSeed: 12345 });

    console.log('📊 Generating browser fingerprint...');
    const result = await generator.generate();

    console.log('\n✅ Fingerprint Generated Successfully!');
    console.log('=====================================\n');

    console.log('🌐 Browser Information:');
    console.log(`  Browser: ${result.fingerprint.browser.name} ${result.fingerprint.browser.majorVersion}`);
    console.log(`  Platform: ${result.fingerprint.device.platform.name} ${result.fingerprint.device.platform.version}`);
    console.log(`  Device: ${result.fingerprint.device.type}`);
    console.log(`  Screen: ${result.fingerprint.device.screenResolution.width}x${result.fingerprint.device.screenResolution.height}`);

    console.log('\n🔧 HTTP Headers Sample:');
    const headers = result.headers;
    console.log(`  User-Agent: ${headers['user-agent']?.substring(0, 100)}...`);
    console.log(`  Accept-Language: ${headers['accept-language']}`);
    console.log(`  Sec-CH-UA: ${headers['sec-ch-ua']}`);

    console.log('\n🔒 TLS Fingerprint:');
    console.log(`  JA3 Hash: ${result.metadata.ja3Hash}`);
    console.log(`  JA4 Hash: ${result.metadata.ja4Hash}`);

    console.log('\n📈 Performance Metrics:');
    console.log(`  Generation Time: ${result.metadata.generationTime}ms`);
    console.log(`  Quality Score: ${result.metadata.qualityScore}`);
    console.log(`  Header Uniqueness: ${result.metadata.headerUniqueness}`);

    console.log('\n🎯 curl-impersonate Configuration:');
    const curlConfig = await generator.generateForCurl(result.fingerprint);
    console.log(`  Browser: ${curlConfig.browser} ${curlConfig.version}`);
    console.log(`  Platform: ${curlConfig.platform}`);
    console.log(`  Mobile: ${curlConfig.mobile}`);

    console.log('\n🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Error during demo:', error.message);
    console.error(error.stack);
  }
}

quickDemo();