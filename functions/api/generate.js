// Cloudflare Pages Function for /api/generate
import { FingerprintGenerator } from '../../dist/FingerprintGenerator.js';

// Presets configuration
const PRESETS = {
  'chrome-desktop': {
    browser: 'chrome',
    version: '120',
    device: 'desktop',
    platform: 'windows'
  },
  'firefox-linux': {
    browser: 'firefox',
    version: '119',
    device: 'desktop',
    platform: 'linux'
  },
  'mobile-safari': {
    browser: 'safari',
    version: '16.0',
    device: 'mobile',
    platform: 'ios'
  },
  'android-chrome': {
    browser: 'chrome',
    version: '120',
    device: 'mobile',
    platform: 'android'
  }
};

export async function onRequestPost(context) {
  try {
    const { request } = context;

    // Parse request body
    const payload = await request.json().catch(() => ({}));

    // Apply preset if specified
    const presetKey = payload.preset || payload.presetKey;
    if (presetKey && PRESETS[presetKey]) {
      Object.assign(payload, PRESETS[presetKey]);
    }

    // Build generation options
    const options = buildOptions(payload);

    // Generate fingerprint
    const generator = new FingerprintGenerator(options);
    const result = await generator.generate(options);

    // Serialize result
    const response = {
      fingerprint: result.fingerprint,
      metadata: result.metadata,
      headers: result.headers,
      tls: result.tlsFingerprint,
      canvas: result.canvasFingerprint
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Generation failed',
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

function buildOptions(payload = {}) {
  const options = {};
  const overrides = {};

  const browser = payload.browser;
  const version = payload.version || '120';
  const device = payload.device;
  const platform = payload.platform;

  if (browser) {
    options.browsers = [browser];
    overrides.browser = {
      name: browser,
      version,
      majorVersion: parseInt((version || '120').split('.')[0], 10)
    };
  }

  if (device) {
    options.devices = [device];
    overrides.device = { ...(overrides.device || {}), type: device };
  }

  if (platform) {
    options.operatingSystems = [{ name: platform, version: 'latest', architecture: 'x64' }];
    overrides.device = {
      ...(overrides.device || {}),
      platform: { name: platform, version: 'latest', architecture: 'x64' }
    };
  }

  const seed = Number(payload.seed);
  if (Number.isFinite(seed)) {
    options.randomSeed = seed;
  }

  if (Object.keys(overrides).length > 0) {
    options.overrides = overrides;
  }

  return options;
}
