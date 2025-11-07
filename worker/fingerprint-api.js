// Cloudflare Worker for Fingerprint Generator API
// Standalone API service

const SAMPLE_FINGERPRINTS = {
  chrome: {
    fingerprint: {
      browser: { name: 'chrome', version: '120.0.0', majorVersion: 120 },
      operatingSystem: { name: 'windows', version: '10', architecture: 'x64' },
      device: { type: 'desktop', vendor: 'Generic', model: 'Desktop' },
      screen: { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
      hardware: { concurrency: 8, memory: 8, gpu: 'ANGLE (NVIDIA GeForce GTX 1060)' },
      locale: 'en-US',
      timezone: 'America/New_York',
      fingerprintHash: 'a1b2c3d4e5f6'
    },
    metadata: {
      qualityScore: 0.95,
      uniquenessScore: 0.87,
      consistencyScore: 0.98,
      bypassConfidence: 0.92,
      generatedAt: new Date().toISOString()
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-CH-UA': '"Chromium";v="120", "Google Chrome";v="120", "Not_A Brand";v="99"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"'
    },
    tls: {
      ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0',
      ja4: 't13d1516h2_8daaf6152771_02713d6af862',
      cipherSuites: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256']
    },
    canvas: {
      canvasHash: 'cf83e1357eefb8bd',
      webglVendor: 'Google Inc. (NVIDIA)',
      webglRenderer: 'ANGLE (NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0)',
      audioHash: 'a9f51c1b0d8c4e2f'
    }
  },
  firefox: {
    fingerprint: {
      browser: { name: 'firefox', version: '119.0', majorVersion: 119 },
      operatingSystem: { name: 'linux', version: 'Ubuntu 22.04', architecture: 'x64' },
      device: { type: 'desktop', vendor: 'Generic', model: 'Desktop' },
      screen: { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
      hardware: { concurrency: 8, memory: 16, gpu: 'Mesa DRI Intel(R) UHD Graphics 620' },
      locale: 'en-US',
      timezone: 'America/Los_Angeles',
      fingerprintHash: 'f9e8d7c6b5a4'
    },
    metadata: {
      qualityScore: 0.94,
      uniquenessScore: 0.89,
      consistencyScore: 0.96,
      bypassConfidence: 0.91,
      generatedAt: new Date().toISOString()
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:119.0) Gecko/20100101 Firefox/119.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br'
    },
    tls: {
      ja3: '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-51-43-13-45-28-21,29-23-24-25-256-257,0',
      ja4: 't13d1516h2_8daaf6152771_02713d6af862',
      cipherSuites: ['TLS_AES_128_GCM_SHA256', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_256_GCM_SHA384']
    },
    canvas: {
      canvasHash: 'd1e2f3a4b5c6',
      webglVendor: 'Intel Open Source Technology Center',
      webglRenderer: 'Mesa DRI Intel(R) UHD Graphics 620 (Kabylake GT2)',
      audioHash: 'b8e7d6c5a4f3'
    }
  },
  safari: {
    fingerprint: {
      browser: { name: 'safari', version: '16.0', majorVersion: 16 },
      operatingSystem: { name: 'ios', version: '16.0', architecture: 'arm64' },
      device: { type: 'mobile', vendor: 'Apple', model: 'iPhone 14 Pro' },
      screen: { width: 393, height: 852, colorDepth: 24, pixelRatio: 3 },
      hardware: { concurrency: 6, memory: 6, gpu: 'Apple A16 GPU' },
      locale: 'en-US',
      timezone: 'America/New_York',
      fingerprintHash: 'c7d8e9f0a1b2'
    },
    metadata: {
      qualityScore: 0.97,
      uniquenessScore: 0.91,
      consistencyScore: 0.99,
      bypassConfidence: 0.94,
      generatedAt: new Date().toISOString()
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br'
    },
    tls: {
      ja3: '771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49162-49161-49172-49171-157-156-53-47,0-23-65281-10-11-16-5-13,29-23-24,0',
      ja4: 't13i190900_9e7e9ab8ead5_d85e8ac7c48c',
      cipherSuites: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256']
    },
    canvas: {
      canvasHash: 'e9f0a1b2c3d4',
      webglVendor: 'Apple Inc.',
      webglRenderer: 'Apple A16 GPU',
      audioHash: 'f0a1b2c3d4e5'
    }
  }
};

const PRESETS = {
  'chrome-desktop': {
    key: 'chrome-desktop',
    label: 'Chrome · Desktop · Windows',
    description: 'Corporate workstation baseline with HTTP/2 and high-resolution canvas.',
    payload: { browser: 'chrome', version: '120', device: 'desktop', platform: 'windows' }
  },
  'firefox-linux': {
    key: 'firefox-linux',
    label: 'Firefox · Desktop · Linux',
    description: 'Engineering workstation with dual monitors and privacy-first headers.',
    payload: { browser: 'firefox', version: '119', device: 'desktop', platform: 'linux' }
  },
  'mobile-safari': {
    key: 'mobile-safari',
    label: 'Safari · Mobile · iOS',
    description: 'Premium iPhone profile with aggressive battery settings.',
    payload: { browser: 'safari', version: '16.0', device: 'mobile', platform: 'ios' }
  },
  'android-chrome': {
    key: 'android-chrome',
    label: 'Chrome · Mobile · Android',
    description: 'High-volume Android traffic for field-data simulations.',
    payload: { browser: 'chrome', version: '120', device: 'mobile', platform: 'android' }
  }
};

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Router
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Health check
  if (path === '/health' || path === '/') {
    return jsonResponse({
      status: 'ok',
      message: 'Fingerprint Generator API Worker',
      version: '1.0.0',
      timestamp: Date.now(),
      endpoints: {
        generate: 'POST /api/generate',
        presets: 'GET /api/presets',
        health: 'GET /health'
      }
    });
  }

  // GET /api/presets - List all presets
  if (path === '/api/presets' && request.method === 'GET') {
    const presetsList = Object.values(PRESETS);
    return jsonResponse(presetsList);
  }

  // GET /api/presets/:key - Get specific preset
  if (path.startsWith('/api/presets/') && request.method === 'GET') {
    const key = path.split('/')[3];
    const preset = PRESETS[key];

    if (!preset) {
      return jsonResponse({ error: 'Preset not found' }, 404);
    }

    return jsonResponse(preset);
  }

  // POST /api/generate - Generate fingerprint
  if (path === '/api/generate' && request.method === 'POST') {
    try {
      const payload = await request.json().catch(() => ({}));
      const browser = payload.browser || 'chrome';
      const sample = SAMPLE_FINGERPRINTS[browser] || SAMPLE_FINGERPRINTS.chrome;

      // Add random variation to make it look more realistic
      const response = {
        ...sample,
        fingerprint: {
          ...sample.fingerprint,
          fingerprintHash: generateRandomHash()
        },
        metadata: {
          ...sample.metadata,
          generatedAt: new Date().toISOString()
        },
        _note: 'Mock data for demonstration. Deploy full stack for production.',
        _requested: payload
      };

      return jsonResponse(response);
    } catch (error) {
      return jsonResponse({
        error: error.message || 'Generation failed',
        stack: error.stack
      }, 500);
    }
  }

  // 404
  return jsonResponse({ error: 'Not found', path }, 404);
}

// Helper: JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: CORS_HEADERS
  });
}

// Helper: Generate random hash
function generateRandomHash() {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 16; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Export for Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  }
};
