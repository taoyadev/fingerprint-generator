// Cloudflare Pages Function for /api/presets
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

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // GET /api/presets - list all
  if (pathParts.length === 2) {
    const presetsList = Object.values(PRESETS);
    return new Response(JSON.stringify(presetsList, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // GET /api/presets/:key - get specific preset
  if (pathParts.length === 3) {
    const key = pathParts[2];
    const preset = PRESETS[key];

    if (!preset) {
      return new Response(JSON.stringify({ error: 'Preset not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify(preset, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
