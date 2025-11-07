# Integration Guide: Make Your Bots Undetectable

**Here's the reality:** Without proper fingerprints, your automation gets blocked in seconds. With them, you blend in with millions of real users. This guide shows you exactly how to integrate fingerprints into Playwright, Puppeteer, or any HTTP client.

---

## Quick Integration (5 Minutes)

Think of browser fingerprints like digital costumes. Your bot needs to look, sound, and act like a real browser. Without fingerprints, websites see this:

```javascript
// What bots look like without fingerprints
navigator.webdriver = true  // "I'm a bot!"
navigator.plugins = []      // "I have no plugins!"
canvas.toDataURL() = ""     // "I can't render graphics!"
```

With fingerprints, websites see a completely normal browser. Here's the before and after:

**Before (Blocked in 2 seconds):**
```javascript
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');  // BLOCKED
```

**After (Works perfectly):**
```javascript
import { FingerprintGenerator } from 'fingerprint-generator';

const generator = new FingerprintGenerator();
const { fingerprint, headers } = await generator.generate({
  browsers: ['chrome'],
  devices: ['desktop']
});

const browser = await chromium.launch();
const context = await browser.newContext({
  userAgent: fingerprint.userAgent,
  viewport: {
    width: fingerprint.device.screenResolution.width,
    height: fingerprint.device.screenResolution.height
  },
  extraHTTPHeaders: headers
});
const page = await context.newPage();
await page.goto('https://example.com');  // WORKS
```

**Key insight:** The fingerprint generator creates a complete identity - headers, TLS signatures, Canvas fingerprints, WebGL data. Everything matches. That's why it works.

---

## Playwright Integration

Here's a complete working example that handles everything:

```javascript
import { chromium } from 'playwright';
import { FingerprintGenerator, BrowserAutomation } from 'fingerprint-generator';

async function runWithFingerprint() {
  // Step 1: Generate a realistic fingerprint
  const generator = new FingerprintGenerator();
  const automation = new BrowserAutomation();

  const result = await generator.generate({
    browsers: ['chrome'],           // Chrome, Firefox, Safari, or Edge
    devices: ['desktop'],            // desktop, mobile, or tablet
    operatingSystems: [{
      name: 'windows',
      version: '11',
      architecture: 'x64'
    }]
  });

  // Step 2: Launch browser and create context with fingerprint
  const browser = await chromium.launch({ headless: false });
  const context = await automation.createPlaywrightContext(
    browser,
    result.fingerprint,
    result.headers
  );

  // Step 3: Use it like normal Playwright
  const page = await context.newPage();
  await page.goto('https://bot-detection-test.com');

  // The page now sees a completely realistic browser fingerprint
  console.log('Quality Score:', result.metadata.qualityScore);
  console.log('Bypass Confidence:', result.metadata.bypassConfidence);

  await page.close();
  await browser.close();
}

runWithFingerprint();
```

**What this code does:**

1. **Generates a statistically realistic fingerprint** - Not random junk. Real Chrome on Windows 11 patterns based on actual browser telemetry.

2. **Creates a Playwright context** - The `BrowserAutomation` helper automatically configures:
   - User-Agent and Client Hints headers
   - Viewport dimensions matching the device
   - Timezone and locale settings
   - Permission policies
   - Stealth scripts that override `navigator.webdriver`

3. **Injects Canvas and WebGL fingerprints** - When websites try to fingerprint your Canvas rendering, they get realistic GPU signatures that match your claimed browser.

**Common mistakes to avoid:**

```javascript
// ❌ DON'T: Reuse the same fingerprint 1000 times
const fp = await generator.generate();
for (let i = 0; i < 1000; i++) {
  // Using same fingerprint = easy to detect pattern
}

// ✅ DO: Generate fresh fingerprints or rotate them intelligently
for (let i = 0; i < 1000; i++) {
  const fp = await generator.generate();  // New fingerprint each time
}
```

**Pro tip:** Check the quality scores before using a fingerprint:

```javascript
const result = await generator.generate();

// Reject low-quality fingerprints
if (result.metadata.qualityScore < 0.9) {
  console.log('Low quality, regenerating...');
  result = await generator.generate();
}

if (result.metadata.bypassConfidence < 0.85) {
  console.log('Low bypass confidence, might get detected');
}
```

---

## Puppeteer Integration

Puppeteer needs a bit more setup than Playwright, but it's the same concept:

```javascript
import puppeteer from 'puppeteer';
import { FingerprintGenerator, BrowserAutomation } from 'fingerprint-generator';

async function runWithPuppeteer() {
  const generator = new FingerprintGenerator();
  const automation = new BrowserAutomation();

  // Generate fingerprint for Firefox (mixing it up)
  const result = await generator.generate({
    browsers: ['firefox'],
    devices: ['desktop'],
    operatingSystems: [{ name: 'macos', version: '13', architecture: 'arm64' }]
  });

  // Launch with stealth args
  const browser = await puppeteer.launch({
    headless: 'new',  // Use new headless mode for better fingerprints
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      `--lang=${result.fingerprint.locale}`,
      '--disable-web-security',  // Only if you need it
    ]
  });

  const page = await browser.newPage();

  // Apply fingerprint
  await page.setUserAgent(result.fingerprint.userAgent);
  await page.setViewport({
    width: result.fingerprint.device.screenResolution.width,
    height: result.fingerprint.device.screenResolution.height
  });
  await page.setExtraHTTPHeaders(result.headers);

  // Inject stealth scripts
  await automation.injectFingerprint(page, result.fingerprint);

  // Now browse normally
  await page.goto('https://example.com');

  await browser.close();
}

runWithPuppeteer();
```

**Why Puppeteer needs extra stealth:**

Puppeteer leaves more traces than Playwright. You need to:

1. **Use `headless: 'new'`** - The old headless mode has different fingerprints than regular Chrome. The new mode is much better.

2. **Disable automation features** - The `--disable-blink-features=AutomationControlled` flag removes obvious bot signals.

3. **Inject stealth scripts early** - Override `navigator.webdriver`, `navigator.plugins`, and other properties before the page loads.

**Difference from Playwright:**

Playwright has better built-in stealth. Puppeteer is more manual. But with the right setup, both work equally well.

---

## Advanced Patterns

### Rotating Fingerprints

Don't reuse the same fingerprint 1000 times. That creates a detectable pattern. Here's how to rotate intelligently:

```javascript
class FingerprintRotator {
  constructor() {
    this.generator = new FingerprintGenerator();
    this.pool = [];
    this.poolSize = 10;
  }

  async initialize() {
    // Pre-generate a pool of high-quality fingerprints
    for (let i = 0; i < this.poolSize; i++) {
      const result = await this.generator.generate({
        browsers: ['chrome', 'firefox', 'edge'],  // Mix browsers
        devices: ['desktop']
      });

      if (result.metadata.qualityScore >= 0.9) {
        this.pool.push(result);
      }
    }
  }

  getNext() {
    // Round-robin through the pool
    return this.pool[Math.floor(Math.random() * this.pool.length)];
  }

  async refresh() {
    // Periodically refresh the pool
    this.pool = [];
    await this.initialize();
  }
}

// Usage
const rotator = new FingerprintRotator();
await rotator.initialize();

for (let i = 0; i < 100; i++) {
  const fp = rotator.getNext();
  // Use fingerprint...

  if (i % 50 === 0) {
    await rotator.refresh();  // Refresh pool every 50 requests
  }
}
```

### Session Management

One fingerprint per session makes sense. Here's why:

```javascript
class BrowserSession {
  constructor(fingerprint) {
    this.fingerprint = fingerprint;
    this.browser = null;
    this.context = null;
  }

  async start() {
    const automation = new BrowserAutomation();
    this.browser = await chromium.launch();
    this.context = await automation.createPlaywrightContext(
      this.browser,
      this.fingerprint.fingerprint,
      this.fingerprint.headers
    );
  }

  async newPage() {
    return this.context.newPage();
  }

  async close() {
    await this.browser.close();
  }
}

// Create session with consistent fingerprint
const generator = new FingerprintGenerator();
const fp = await generator.generate();
const session = new BrowserSession(fp);
await session.start();

// All pages in this session share the same fingerprint
const page1 = await session.newPage();
const page2 = await session.newPage();
// Both pages look like they're from the same "user"

await session.close();
```

### Error Handling

What to do when generation fails:

```javascript
async function generateWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await generator.generate();

      // Validate quality
      if (result.metadata.qualityScore < 0.9) {
        console.log(`Attempt ${i + 1}: Low quality (${result.metadata.qualityScore}), retrying...`);
        continue;
      }

      return result;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
    }
  }

  throw new Error('Failed to generate fingerprint after max retries');
}

// Usage
const fp = await generateWithRetry();
```

---

## HTTP Client Integration (No Browser)

Don't need a browser? Use fingerprints with plain HTTP requests:

```javascript
import axios from 'axios';
import https from 'https';
import { FingerprintGenerator } from 'fingerprint-generator';

async function makeRequest() {
  const generator = new FingerprintGenerator();
  const result = await generator.generate({
    browsers: ['chrome'],
    devices: ['desktop']
  });

  // Create TLS agent with fingerprint's cipher suites
  const agent = new https.Agent({
    ciphers: result.tlsFingerprint.ciphers.join(':'),
    honorCipherOrder: true,
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    // Match TLS extensions
    sigalgs: result.tlsFingerprint.signatureAlgorithms.join(':')
  });

  // Make request with fingerprinted headers and TLS
  const response = await axios.get('https://api.example.com', {
    headers: {
      ...result.headers,
      'User-Agent': result.fingerprint.userAgent
    },
    httpsAgent: agent
  });

  console.log('Response:', response.data);
}
```

**Why this matters:**

Websites fingerprint your TLS handshake. Chrome uses different cipher suites than Firefox. Different TLS extensions. This makes your HTTP client look exactly like the browser you're impersonating.

---

## Troubleshooting

### Still Getting Blocked?

Run through this checklist:

**1. Check if fingerprints are actually applied:**

```javascript
const page = await context.newPage();
const userAgent = await page.evaluate(() => navigator.userAgent);
const webdriver = await page.evaluate(() => navigator.webdriver);
const plugins = await page.evaluate(() => navigator.plugins.length);

console.log('User-Agent:', userAgent);
console.log('WebDriver:', webdriver);  // Should be undefined or false
console.log('Plugins:', plugins);      // Should be > 0 for Chrome
```

**2. Verify Canvas fingerprints work:**

```javascript
const canvasHash = await page.evaluate(() => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillText('Test', 10, 10);
  return canvas.toDataURL();
});

console.log('Canvas works:', canvasHash.length > 0);
```

**3. Check quality scores:**

```javascript
console.log('Quality:', result.metadata.qualityScore);        // Should be > 0.9
console.log('Uniqueness:', result.metadata.uniquenessScore);  // Should be > 0.8
console.log('Consistency:', result.metadata.consistencyScore); // Should be > 0.9
console.log('Bypass:', result.metadata.bypassConfidence);     // Should be > 0.85
```

**4. Common issues:**

| Issue | Cause | Fix |
|-------|-------|-----|
| Headers not sent | Playwright/Puppeteer not configured | Use `BrowserAutomation.createPlaywrightContext()` |
| Canvas blank | Stealth scripts not injected | Call `automation.injectFingerprint()` |
| TLS mismatch | HTTP client ignoring TLS config | Use custom `https.Agent` with cipher suites |
| Same fingerprint detected | Reusing fingerprint too many times | Rotate fingerprints every N requests |
| Behavioral detection | Perfect fingerprint but robotic actions | Add realistic delays and mouse movements |

### Debug Mode

Want to see what's happening?

```javascript
const generator = new FingerprintGenerator({
  randomSeed: 42  // Same seed = same fingerprints (for debugging)
});

const result = await generator.generate();
console.log(JSON.stringify(result, null, 2));

// Validate the result
const validation = generator.validate(result);
console.log('Validation:', validation);
console.log('Warnings:', validation.warnings);
```

### Verify Fingerprints Are Working

Visit https://browserleaks.com/canvas or https://pixelscan.net with your fingerprinted browser. Check if:

- User-Agent matches your fingerprint
- Canvas/WebGL fingerprints render correctly
- WebDriver is hidden
- TLS fingerprint looks normal

---

## Real-World Performance

How fast is this?

**Single fingerprint generation:** ~1ms average
**Playwright context creation:** ~35-40ms (includes injecting all stealth scripts)
**Puppeteer page setup:** ~45-50ms (needs more manual config)

**Batch generation:**

```javascript
// Generate 100 fingerprints
const batch = await generator.generateBatch(100, {
  browsers: ['chrome'],
  devices: ['desktop']
});

console.log('Generated 100 in:', batch.summary.averageGenerationTime * 100, 'ms');
// Typical: 100-120ms total (parallel generation)
```

**Memory usage:**

- Generator instance: ~8MB
- Each fingerprint: ~2KB
- LRU cache (default 100 items): ~200KB

---

## Next Steps

You now know how to integrate fingerprints into Playwright, Puppeteer, and HTTP clients. Here's what to do next:

1. **Start simple** - Use the basic Playwright example and verify it works
2. **Add rotation** - Implement fingerprint rotation for production
3. **Monitor quality** - Track quality scores and reject low-quality fingerprints
4. **Scale up** - Generate batches, cache fingerprints, optimize for your use case

**Remember:** Fingerprints handle the technical detection. You still need to act human - add delays, randomize behavior, respect rate limits. Think of fingerprints as the costume and your bot's behavior as the performance.

Now go make some undetectable bots.
