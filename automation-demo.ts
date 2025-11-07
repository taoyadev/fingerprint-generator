/**
 * Browser Automation Demo
 *
 * Demonstrates integration with Playwright and Puppeteer using generated fingerprints
 */

import { FingerprintGenerator, generateFingerprint } from './src/index';
import { BrowserAutomation } from './src/automation/BrowserAutomation';

async function runAutomationDemo() {
  console.log('🤖 Browser Automation Integration Demo\n');

  // Initialize generator and automation
  const generator = new FingerprintGenerator({ randomSeed: 12345 });
  const automation = new BrowserAutomation();

  console.log('🎯 Generating fingerprints for automation...\n');

  // Generate fingerprints for different browsers
  const results = [
    await generator.generate(),
    await generator.generate(),
    await generator.generate()
  ];

  // Override browser types manually for demo
  if (results[1]?.fingerprint) {
    results[1].fingerprint.browser = { name: 'firefox' as any, version: '119.0.0.0', majorVersion: 119 };
  }
  if (results[2]?.fingerprint) {
    results[2].fingerprint.browser = { name: 'safari' as any, version: '16.0.0.0', majorVersion: 16 };
  }

  results.forEach((result, index) => {
    console.log(`��� Fingerprint ${index + 1}:`);
    console.log(`   Browser: ${result.fingerprint.browser.name} ${result.fingerprint.browser.version}`);
    console.log(`   Device: ${result.fingerprint.device.type} (${result.fingerprint.device.platform.name})`);
    console.log(`   Screen: ${result.fingerprint.device.screenResolution.width}x${result.fingerprint.device.screenResolution.height}`);
    console.log('');
  });

  // Generate automation configurations
  console.log('⚙️  Generating Playwright and Puppeteer configurations...\n');

  results.forEach((result, index) => {
    const { fingerprint, headers } = result;

    // Playwright configuration
    const playwrightConfig = automation.toPlaywrightConfig(fingerprint, headers);
    console.log(`🎭 Playwright Config ${index + 1}:`);
    console.log(`   User-Agent: ${playwrightConfig.userAgent}`);
    console.log(`   Viewport: ${playwrightConfig.viewport.width}x${playwrightConfig.viewport.height}`);
    console.log(`   Locale: ${playwrightConfig.locale}`);
    console.log(`   Timezone: ${playwrightConfig.timezone}`);
    console.log(`   Mobile: ${playwrightConfig.userAgentData?.mobile || false}`);

    if (playwrightConfig.userAgentData) {
      console.log(`   Client Hints: ${playwrightConfig.userAgentData.brands.map(b => `${b.brand} v${b.version}`).join(', ')}`);
    }

    // Puppeteer configuration
    const puppeteerConfig = automation.toPuppeteerConfig(fingerprint, headers);
    console.log(`\n🎪 Puppeteer Config ${index + 1}:`);
    console.log(`   Arguments: ${puppeteerConfig.args.length} launch args`);
    console.log(`   Key args: ${puppeteerConfig.args.filter(arg => arg.includes('--user-agent') || arg.includes('--window-size')).join(', ')}`);
    console.log(`   Headers: ${Object.keys(puppeteerConfig.headers).length} custom headers`);
    console.log(`   Headless: ${puppeteerConfig.headless}`);
    console.log('');
  });

  // Stealth configurations
  console.log('🕵️  Generating stealth configurations...\n');

  results.forEach((result, index) => {
    const stealthConfig = automation.generateStealthConfig(result.fingerprint);
    console.log(`🔒 Stealth Config ${index + 1}:`);
    console.log(`   Webdriver Hidden: ${stealthConfig.webdriver}`);
    console.log(`   Plugins: ${stealthConfig.plugins.length} fake plugins`);
    console.log(`   Permissions: ${stealthConfig.permissions.length} granted permissions`);

    if (stealthConfig.chrome) {
      console.log(`   Chrome CSI: startE=${stealthConfig.chrome.csi.startE}, onloadT=${stealthConfig.chrome.csi.onloadT.toFixed(0)}ms`);
      console.log(`   Chrome Load Times: finishLoadTime=${stealthConfig.chrome.loadTimes.finishLoadTime.toFixed(2)}`);
    }
    console.log('');
  });

  // Example usage code
  console.log('📚 Example Usage Code:\n');

  console.log('// Playwright Example:');
  console.log(`import { chromium } from 'playwright';`);
  console.log(`import { FingerprintGenerator, BrowserAutomation } from './src/index';`);
  console.log('');
  console.log(`async function automatedScraping() {`);
  console.log(`  const generator = new FingerprintGenerator();`);
  console.log(`  const automation = new BrowserAutomation();`);
  console.log(`  const result = await generator.generate();`);
  console.log(`  const { fingerprint, headers } = result;`);
  console.log('');
  console.log(`  const browser = await chromium.launch({ headless: false });`);
  console.log(`  const context = await automation.createPlaywrightContext(browser, fingerprint, headers);`);
  console.log(`  const page = await context.newPage();`);
  console.log(`  await page.goto('https://example.com');`);
  console.log(`  // Page now has realistic fingerprint`);
  console.log(`  await browser.close();`);
  console.log(`}`);

  console.log('\n// Puppeteer Example:');
  console.log(`import puppeteer from 'puppeteer-extra';`);
  console.log(`import StealthPlugin from 'puppeteer-extra-plugin-stealth';`);
  console.log(`puppeteer.use(StealthPlugin());`);
  console.log('');
  console.log(`async function automatedScraping() {`);
  console.log(`  const generator = new FingerprintGenerator();`);
  console.log(`  const automation = new BrowserAutomation();`);
  console.log(`  const result = await generator.generate();`);
  console.log(`  const { fingerprint, headers } = result;`);
  console.log('');
  console.log(`  const browser = await puppeteer.launch(automation.toPuppeteerConfig(fingerprint, headers));`);
  console.log(`  const page = await automation.createPuppeteerPage(browser, fingerprint, headers);`);
  console.log(`  await automation.injectFingerprint(page, fingerprint, headers);`);
  console.log(`  await page.goto('https://example.com');`);
  console.log(`  // Page now has stealth fingerprint`);
  console.log(`  await browser.close();`);
  console.log(`}`);

  console.log('\n// Batch automation with different fingerprints:');
  console.log(`async function batchScraping(urls: string[]) {`);
  console.log(`  const generator = new FingerprintGenerator();`);
  console.log(`  const automation = new BrowserAutomation();`);
  console.log('');
  console.log(`  const results = await generator.generateBatch(urls.length);`);
  console.log(`  const browser = await puppeteer.launch({ headless: false });`);
  console.log('');
  console.log(`  for (let i = 0; i < urls.length; i++) {`);
  console.log(`    const { fingerprint, headers } = results[i];`);
  console.log(`    const page = await automation.createPuppeteerPage(browser, fingerprint, headers);`);
  console.log(`    await page.goto(urls[i]);`);
  console.log(`    // Extract data with unique fingerprint`);
  console.log(`    await page.close();`);
  console.log(`  }`);
  console.log('');
  console.log(`  await browser.close();`);
  console.log(`}`);

  // Performance metrics
  console.log('\n⚡ Performance Metrics:');
  const startTime = Date.now();

  // Generate configs for 100 fingerprints
  for (let i = 0; i < 100; i++) {
    const result = await generator.generate();
    automation.toPlaywrightConfig(result.fingerprint, result.headers);
    automation.toPuppeteerConfig(result.fingerprint, result.headers);
    automation.generateStealthConfig(result.fingerprint);
  }

  const endTime = Date.now();
  console.log(`   Generated 300 automation configs in ${endTime - startTime}ms`);
  console.log(`   Average: ${((endTime - startTime) / 300).toFixed(2)}ms per config`);

  console.log('\n✨ Automation demo completed successfully!');
  console.log('\n🎯 Automation Features:');
  console.log('   ✅ Playwright context configuration');
  console.log('   ✅ Puppeteer launch arguments');
  console.log('   ✅ Stealth mode configurations');
  console.log('   ✅ User-Agent Client Hints support');
  console.log('   ✅ Geolocation and permissions');
  console.log('   ✅ Chrome-specific API overrides');
  console.log('   ✅ Plugin and navigator property spoofing');
  console.log('   ✅ High-performance batch generation');
}

// Helper functions for actual usage examples

export async function createPlaywrightSession() {
  const generator = new FingerprintGenerator();
  const automation = new BrowserAutomation();

  const result = await generator.generate();
  console.log('Generated fingerprint for Playwright automation');

  // Return the configuration for actual use
  return {
    fingerprint: result.fingerprint,
    headers: result.headers,
    playwrightConfig: automation.toPlaywrightConfig(result.fingerprint, result.headers),
    stealthConfig: automation.generateStealthConfig(result.fingerprint)
  };
}

export async function createPuppeteerSession() {
  const generator = new FingerprintGenerator();
  const automation = new BrowserAutomation();

  const result = await generator.generate();
  console.log('Generated fingerprint for Puppeteer automation');

  // Return the configuration for actual use
  return {
    fingerprint: result.fingerprint,
    headers: result.headers,
    puppeteerConfig: automation.toPuppeteerConfig(result.fingerprint, result.headers),
    stealthConfig: automation.generateStealthConfig(result.fingerprint)
  };
}

export async function createBatchAutomationSessions(count: number) {
  const generator = new FingerprintGenerator();
  const automation = new BrowserAutomation();

  const results = await generator.generateBatch(count);
  const sessions = results.map(result => ({
    fingerprint: result.fingerprint,
    headers: result.headers,
    playwrightConfig: automation.toPlaywrightConfig(result.fingerprint, result.headers),
    puppeteerConfig: automation.toPuppeteerConfig(result.fingerprint, result.headers),
    stealthConfig: automation.generateStealthConfig(result.fingerprint)
  }));

  console.log(`Generated ${count} automation sessions`);
  return sessions;
}

// Run the demo
runAutomationDemo().catch(console.error);