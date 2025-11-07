// Cloudflare Pages Function for /api/generate
// Mock version - returns sample fingerprint data

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
  }
};

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const payload = await request.json().catch(() => ({}));

    // Select sample based on browser
    const browser = payload.browser || 'chrome';
    const sample = SAMPLE_FINGERPRINTS[browser] || SAMPLE_FINGERPRINTS.chrome;

    // Add note about mock data
    const response = {
      ...sample,
      _note: 'This is mock data for demonstration. Full API requires server-side deployment.',
      _requested: payload
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
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

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
