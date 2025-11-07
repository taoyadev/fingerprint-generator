// Vercel Serverless Function for /api/generate
const { FingerprintGenerator } = require('../dist/FingerprintGenerator.js');

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

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const payload = req.body || {};

    // Apply preset if specified
    const presetKey = payload.preset || payload.presetKey;
    if (presetKey && PRESETS[presetKey]) {
      Object.assign(payload, PRESETS[presetKey]);
    }

    // Build generation options
    const options = buildOptions(payload);

    // Generate fingerprint using real FingerprintGenerator
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

    res.status(200).json(response);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: error.message || 'Generation failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

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
