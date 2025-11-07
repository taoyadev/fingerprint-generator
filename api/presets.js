// Vercel Serverless Function for /api/presets

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

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // List all presets
  const presetsList = Object.values(PRESETS);
  res.status(200).json(presetsList);
};
