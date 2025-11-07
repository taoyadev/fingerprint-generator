import { createServer } from 'http';
import { FingerprintGenerator } from './dist/index.js';

const PORT = Number(process.env.PORT || 3000);
const generator = new FingerprintGenerator();

const PRESETS = {
  'chrome-desktop': {
    label: 'Chrome · Desktop · Windows',
    description: 'Corporate workstation baseline with HTTP/2 and high-resolution canvas.',
    payload: { browser: 'chrome', version: '120', device: 'desktop', platform: 'windows' }
  },
  'firefox-linux': {
    label: 'Firefox · Desktop · Linux',
    description: 'Engineering workstation with dual monitors and privacy-first headers.',
    payload: { browser: 'firefox', version: '119', device: 'desktop', platform: 'linux' }
  },
  'mobile-safari': {
    label: 'Safari · Mobile · iOS',
    description: 'Premium iPhone profile with aggressive battery settings.',
    payload: { browser: 'safari', version: '16.0', device: 'mobile', platform: 'ios' }
  },
  'android-chrome': {
    label: 'Chrome · Mobile · Android',
    description: 'High-volume Android traffic for field-data simulations.',
    payload: { browser: 'chrome', version: '120', device: 'mobile', platform: 'android' }
  }
};

const server = createServer(async (req, res) => {
  enableCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  try {
    if (req.method === 'GET' && url.pathname === '/') {
      renderApp(res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      respondJSON(res, { ok: true, time: Date.now() });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/presets') {
      respondJSON(res, listPresets());
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/presets/')) {
      const key = url.pathname.split('/').pop();
      const preset = listPresets().find(item => item.key === key);
      if (!preset) {
        respondJSON(res, { error: 'Preset not found' }, 404);
        return;
      }
      respondJSON(res, preset);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      const payload = applyPreset(await readJSON(req));
      const options = buildOptions(payload);
      logEvent('generate.start', { options: summarizeOptions(options) });
      const result = await generator.generate(options);
      logEvent('generate.complete', {
        fingerprintHash: result.fingerprint.fingerprintHash,
        metadata: result.metadata
      });
      respondJSON(res, serializeResult(result));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/generate-stream') {
      await streamSingle(url, res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/batch') {
      await streamBatch(url, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    logEvent('server.error', { message: error.message, stack: error.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Unexpected error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Dev server listening on http://localhost:${PORT}`);
});

function enableCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readJSON(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}

function applyPreset(payload = {}) {
  const presetKey = payload.preset || payload.presetKey;
  if (presetKey && PRESETS[presetKey]) {
    return { ...PRESETS[presetKey].payload, ...payload, preset: presetKey };
  }
  return payload;
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

function serializeResult(result) {
  return {
    fingerprint: result.fingerprint,
    metadata: result.metadata,
    headers: result.headers,
    tls: result.tlsFingerprint,
    canvas: result.canvasFingerprint
  };
}

async function streamSingle(url, res) {
  const params = applyPreset(Object.fromEntries(url.searchParams.entries()));
  const options = buildOptions(params);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  logEvent('generate.stream.start', { options: summarizeOptions(options) });
  const result = await generator.generate(options);
  res.write(`data: ${JSON.stringify(serializeResult(result))}\n\n`);
  res.write('event: done\ndata: {}\n\n');
  res.end();
  logEvent('generate.stream.complete', { fingerprintHash: result.fingerprint.fingerprintHash });
}

async function streamBatch(url, res) {
  const params = applyPreset(Object.fromEntries(url.searchParams.entries()));
  const options = buildOptions(params);
  const count = clamp(Number(params.count) || 5, 1, 100);
  const startedAt = Date.now();
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  logEvent('batch.start', { total: count, options: summarizeOptions(options) });

  for (let i = 0; i < count; i++) {
    const result = await generator.generate(options);
    res.write(`data: ${JSON.stringify({ index: i + 1, total: count, result: serializeResult(result) })}\n\n`);
    logEvent('batch.item', {
      index: i + 1,
      total: count,
      fingerprintHash: result.fingerprint.fingerprintHash,
      quality: result.metadata.qualityScore
    });
  }

  res.write('event: done\ndata: {}\n\n');
  res.end();
  logEvent('batch.complete', { total: count, elapsedMs: Date.now() - startedAt });
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function respondJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function listPresets() {
  return Object.entries(PRESETS).map(([key, value]) => ({
    key,
    label: value.label,
    description: value.description,
    payload: value.payload
  }));
}

function summarizeOptions(options) {
  return {
    browsers: options.browsers || [],
    devices: options.devices || [],
    operatingSystems: options.operatingSystems || [],
    randomSeed: options.randomSeed ?? null
  };
}

function logEvent(event, payload) {
  console.log(JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }));
}

function renderApp(res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>[ FINGERPRINT_GEN ] :: Anonymous Terminal</title>
  <meta name="description" content="Stream statistically accurate browser fingerprints, test anti-bot defenses, and explore presets for Chrome, Firefox, Edge, and Safari." />
  <meta name="keywords" content="browser fingerprint generator, anti bot testing, security research, automation stealth, canvas fingerprint" />
  <meta property="og:title" content="Fingerprint Generator Dev Console" />
  <meta property="og:description" content="Generate and stream realistic browser fingerprints with presets, SSE, and CLI parity." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="http://localhost:${PORT}" />
  <link rel="canonical" href="http://localhost:${PORT}" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');

    :root {
      --bg-primary: #0a0e27;
      --bg-secondary: #0f1420;
      --glass-bg: rgba(15, 20, 32, 0.7);
      --glass-border: rgba(0, 255, 136, 0.15);
      --neon-green: #00ff88;
      --neon-pink: #ff006e;
      --neon-cyan: #00d9ff;
      --text-primary: #e0e7ff;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --glow-green: 0 0 20px rgba(0, 255, 136, 0.5);
      --glow-pink: 0 0 20px rgba(255, 0, 110, 0.5);
      --glow-cyan: 0 0 20px rgba(0, 217, 255, 0.5);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      background: var(--bg-primary);
      background-image:
        radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 0, 110, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(0, 217, 255, 0.05) 0%, transparent 50%);
      background-attachment: fixed;
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.6;
    }

    /* Cyberpunk Header */
    header {
      background: var(--glass-bg);
      border-bottom: 2px solid var(--neon-green);
      box-shadow: var(--glow-green);
      backdrop-filter: blur(10px);
      padding: 1rem 5vw;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .logo {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--neon-green);
      text-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
      letter-spacing: 2px;
    }

    .nav-items {
      display: flex;
      gap: 1.5rem;
      font-size: 0.85rem;
    }

    .nav-items a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.3s ease;
      position: relative;
    }

    .nav-items a::before {
      content: '>';
      position: absolute;
      left: -12px;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: var(--neon-cyan);
    }

    .nav-items a:hover {
      color: var(--neon-cyan);
      text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
    }

    .nav-items a:hover::before {
      opacity: 1;
    }

    /* Hero Section */
    .cyber-hero {
      padding: 4rem 5vw 3rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .glitch {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 700;
      color: var(--neon-green);
      text-shadow:
        0 0 10px rgba(0, 255, 136, 0.8),
        0 0 20px rgba(0, 255, 136, 0.5),
        0 0 40px rgba(0, 255, 136, 0.3);
      margin-bottom: 1rem;
      letter-spacing: -1px;
      animation: flicker 3s infinite alternate;
    }

    @keyframes flicker {
      0%, 100% { opacity: 1; }
      41%, 43% { opacity: 0.9; }
      45%, 47% { opacity: 0.95; }
    }

    .subtitle {
      font-size: clamp(1rem, 2.5vw, 1.3rem);
      color: var(--text-secondary);
      margin-bottom: 2rem;
      font-weight: 400;
    }

    .subtitle span {
      color: var(--neon-pink);
      font-weight: 600;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .stat-card {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 1.25rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--neon-green), transparent);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }

    .stat-card:hover::before {
      transform: translateX(100%);
    }

    .stat-card:hover {
      border-color: var(--neon-green);
      box-shadow: var(--glow-green);
      transform: translateY(-4px);
    }

    .stat-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .stat-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.1rem;
      color: var(--neon-cyan);
      font-weight: 600;
    }

    /* Main Container */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 5vw 4rem;
    }

    /* Grid Layout */
    .terminal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    /* Glass Panel */
    .glass-panel {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      padding: 1.5rem;
      transition: all 0.3s ease;
      position: relative;
    }

    .glass-panel:hover {
      border-color: var(--neon-green);
      box-shadow: var(--glow-green);
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--neon-green);
      text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
    }

    .panel-icon {
      font-size: 1.2rem;
    }

    /* Form Styling */
    .control-group {
      margin-bottom: 1rem;
    }

    .control-label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.4rem;
    }

    .control-input,
    .control-select {
      width: 100%;
      padding: 0.7rem 1rem;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .control-input:focus,
    .control-select:focus {
      outline: none;
      border-color: var(--neon-cyan);
      box-shadow: 0 0 10px rgba(0, 217, 255, 0.3);
    }

    .control-input::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
    }

    /* Cyber Button */
    .cyber-btn {
      width: 100%;
      padding: 0.9rem 1.5rem;
      background: transparent;
      border: 2px solid var(--neon-green);
      border-radius: 6px;
      color: var(--neon-green);
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      margin-bottom: 0.75rem;
    }

    .cyber-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: var(--neon-green);
      transition: left 0.3s ease;
      z-index: -1;
    }

    .cyber-btn:hover::before {
      left: 0;
    }

    .cyber-btn:hover {
      color: var(--bg-primary);
      box-shadow: var(--glow-green);
      transform: translateY(-2px);
    }

    .cyber-btn:active {
      transform: translateY(0);
    }

    .cyber-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .cyber-btn.secondary {
      border-color: var(--neon-pink);
      color: var(--neon-pink);
    }

    .cyber-btn.secondary::before {
      background: var(--neon-pink);
    }

    .cyber-btn.secondary:hover {
      box-shadow: var(--glow-pink);
    }

    /* Status Bar */
    .status-bar {
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-bar::before {
      content: '●';
      color: var(--neon-cyan);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .status-bar.success::before {
      color: var(--neon-green);
    }

    .status-bar.error::before {
      color: var(--neon-pink);
    }

    /* Preset Cards */
    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .preset-card {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .preset-card::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 40px 40px 0;
      border-color: transparent var(--neon-green) transparent transparent;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .preset-card:hover {
      border-color: var(--neon-green);
      box-shadow: var(--glow-green);
      transform: translateY(-3px);
    }

    .preset-card:hover::after {
      opacity: 0.3;
    }

    .preset-card.active {
      border-color: var(--neon-green);
      background: rgba(0, 255, 136, 0.05);
    }

    .preset-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .preset-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Terminal Output */
    .terminal-output {
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid var(--neon-green);
      border-radius: 8px;
      padding: 1rem;
      font-size: 0.8rem;
      color: var(--neon-green);
      max-height: 500px;
      overflow-y: auto;
      font-family: 'JetBrains Mono', monospace;
      box-shadow: inset 0 0 20px rgba(0, 255, 136, 0.1);
      position: relative;
    }

    .terminal-output::before {
      content: '$ ';
      color: var(--neon-cyan);
      position: sticky;
      top: 0;
      left: 0;
    }

    .terminal-output::-webkit-scrollbar {
      width: 8px;
    }

    .terminal-output::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.5);
    }

    .terminal-output::-webkit-scrollbar-thumb {
      background: var(--neon-green);
      border-radius: 4px;
    }

    .terminal-output pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    /* Results Panel */
    .results-panel {
      grid-column: 1 / -1;
    }

    .results-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .tab-btn {
      padding: 0.6rem 1.2rem;
      background: transparent;
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tab-btn:hover {
      border-color: var(--neon-cyan);
      color: var(--neon-cyan);
    }

    .tab-btn.active {
      border-color: var(--neon-green);
      color: var(--neon-green);
      box-shadow: var(--glow-green);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    /* Copy Button */
    .copy-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid var(--neon-cyan);
      border-radius: 4px;
      color: var(--neon-cyan);
      font-family: inherit;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 10;
    }

    .copy-btn:hover {
      background: var(--neon-cyan);
      color: var(--bg-primary);
      box-shadow: var(--glow-cyan);
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--glass-bg);
      border: 2px solid var(--neon-green);
      border-radius: 8px;
      padding: 1rem 1.5rem;
      color: var(--text-primary);
      backdrop-filter: blur(10px);
      box-shadow: var(--glow-green);
      animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
      z-index: 1000;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    /* Footer */
    footer {
      background: var(--glass-bg);
      border-top: 1px solid var(--glass-border);
      padding: 2rem 5vw;
      margin-top: 4rem;
      backdrop-filter: blur(10px);
    }

    footer .footer-grid {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    footer h3 {
      font-size: 0.9rem;
      color: var(--neon-green);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    footer a {
      display: block;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
    }

    footer a:hover {
      color: var(--neon-cyan);
      text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
      padding-left: 8px;
    }

    footer .disclaimer {
      grid-column: 1 / -1;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--glass-border);
      font-size: 0.8rem;
      color: var(--text-muted);
      text-align: center;
    }

    /* Loading Animation */
    .loading {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--neon-green);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-items {
        display: none;
      }

      .terminal-grid {
        grid-template-columns: 1fr;
      }

      .presets-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Keyboard Shortcuts Hint */
    .shortcuts-hint {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-size: 0.7rem;
      color: var(--text-muted);
      backdrop-filter: blur(10px);
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }

    .shortcuts-hint:hover {
      opacity: 1;
    }

    .shortcuts-hint kbd {
      background: rgba(0, 0, 0, 0.6);
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      border: 1px solid var(--glass-border);
      font-family: inherit;
      color: var(--neon-cyan);
    }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Fingerprint Generator Dev Console",
    "operatingSystem": "Cross-platform",
    "applicationCategory": "SecurityApplication",
    "author": { "@type": "Organization", "name": "Fingerprint Generator" },
    "offers": { "@type": "Offer", "price": 0, "priceCurrency": "USD" },
    "softwareVersion": "1.0.0"
  }
  </script>
</head>
<body>
  <header>
    <div class="logo">[ FINGERPRINT_GEN ]</div>
    <nav class="nav-items">
      <a href="https://github.com/your-org/fingerprint-generator" target="_blank" rel="noreferrer">GitHub</a>
      <a href="#docs">Docs</a>
      <a href="https://github.com/your-org/fingerprint-generator/blob/main/SECURITY.md" target="_blank" rel="noreferrer">Security</a>
    </nav>
  </header>

  <section class="cyber-hero">
    <h1 class="glitch">BROWSER FINGERPRINT GENERATOR</h1>
    <p class="subtitle">Statistically perfect. <span>Undetectable</span>. Fast.</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-title">Live SSE</div>
        <div class="stat-value">Real-time</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-title">Bayesian</div>
        <div class="stat-value">47-Node Network</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔒</div>
        <div class="stat-title">Anonymous</div>
        <div class="stat-value">Zero Trace</div>
      </div>
    </div>
  </section>

  <div class="container">
    <div class="terminal-grid">
      <!-- Control Panel -->
      <div class="glass-panel">
        <div class="panel-header">
          <span class="panel-icon">⚙️</span>
          <h2 class="panel-title">CONTROL CENTER</h2>
        </div>

        <form id="controls">
          <input type="hidden" name="preset" id="presetField" value="" />

          <div class="control-group">
            <label class="control-label">Browser</label>
            <select name="browser" class="control-select">
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
              <option value="edge">Edge</option>
            </select>
          </div>

          <div class="control-group">
            <label class="control-label">Version</label>
            <input name="version" value="120" class="control-input" />
          </div>

          <div class="control-group">
            <label class="control-label">Device</label>
            <select name="device" class="control-select">
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          <div class="control-group">
            <label class="control-label">Platform</label>
            <select name="platform" class="control-select">
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="linux">Linux</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
          </div>

          <div class="control-group">
            <label class="control-label">Batch Size</label>
            <input type="number" name="count" value="5" min="1" max="100" class="control-input" />
          </div>

          <div class="control-group">
            <label class="control-label">Seed (optional)</label>
            <input name="seed" placeholder="random entropy" class="control-input" />
          </div>
        </form>

        <button class="cyber-btn" id="generateBtn">▶ Generate Single</button>
        <button class="cyber-btn secondary" id="batchBtn">▶▶ Stream Batch</button>

        <div class="status-bar" id="status">Idle. Select preset or configure parameters.</div>
      </div>

      <!-- Presets Panel -->
      <div class="glass-panel">
        <div class="panel-header">
          <span class="panel-icon">🎯</span>
          <h2 class="panel-title">QUICK PRESETS</h2>
        </div>

        <div class="presets-grid" id="presetGrid">
          <div class="preset-card">
            <div class="preset-title">Loading...</div>
            <div class="preset-desc">Fetching preset catalog from API...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Panel -->
    <div class="glass-panel results-panel">
      <div class="panel-header">
        <span class="panel-icon">📡</span>
        <h2 class="panel-title">TERMINAL OUTPUT</h2>
      </div>

      <div class="results-tabs">
        <button class="tab-btn active" data-tab="single">Single Result</button>
        <button class="tab-btn" data-tab="batch">Batch Stream</button>
      </div>

      <div class="tab-content active" id="tab-single">
        <div style="position: relative;">
          <button class="copy-btn" data-target="singleResult">Copy JSON</button>
          <div class="terminal-output" id="singleResult">// Click "Generate Single" to see output...</div>
        </div>
      </div>

      <div class="tab-content" id="tab-batch">
        <div style="position: relative;">
          <button class="copy-btn" data-target="batchResult">Copy JSON</button>
          <div class="terminal-output" id="batchResult">// Click "Stream Batch" to see output...</div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div class="footer-grid">
      <div>
        <h3>Resources</h3>
        <a href="https://github.com/your-org/fingerprint-generator/blob/main/README.md" target="_blank" rel="noreferrer">README</a>
        <a href="https://github.com/your-org/fingerprint-generator/blob/main/ARCHITECTURE.md" target="_blank" rel="noreferrer">Architecture</a>
        <a href="https://github.com/your-org/fingerprint-generator/blob/main/PERFORMANCE.md" target="_blank" rel="noreferrer">Performance</a>
      </div>
      <div>
        <h3>Documentation</h3>
        <a href="https://github.com/your-org/fingerprint-generator/blob/main/INTEGRATION.md" target="_blank" rel="noreferrer">Integration Guide</a>
        <a href="https://github.com/your-org/fingerprint-generator/blob/main/SECURITY.md" target="_blank" rel="noreferrer">Security Best Practices</a>
        <a href="https://github.com/your-org/fingerprint-generator#quick-start" target="_blank" rel="noreferrer">Quick Start</a>
      </div>
      <div>
        <h3>Community</h3>
        <a href="https://github.com/your-org/fingerprint-generator" target="_blank" rel="noreferrer">GitHub Repository</a>
        <a href="https://github.com/your-org/fingerprint-generator/issues" target="_blank" rel="noreferrer">Report Issues</a>
        <a href="https://github.com/your-org/fingerprint-generator/discussions" target="_blank" rel="noreferrer">Discussions</a>
      </div>
    </div>

    <div class="disclaimer">
      Built for security researchers, ethical hackers, and privacy engineers. Use responsibly. Respect local laws. Keep the web safer than you found it.
    </div>
  </footer>

  <div class="shortcuts-hint">
    <kbd>Ctrl</kbd> + <kbd>Enter</kbd> = Generate | <kbd>Esc</kbd> = Clear
  </div>

  <script>
    // === DOM Elements ===
    const form = document.getElementById('controls');
    const statusEl = document.getElementById('status');
    const singleResultEl = document.getElementById('singleResult');
    const batchResultEl = document.getElementById('batchResult');
    const generateBtn = document.getElementById('generateBtn');
    const batchBtn = document.getElementById('batchBtn');
    const presetGrid = document.getElementById('presetGrid');
    const presetField = document.getElementById('presetField');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const copyBtns = document.querySelectorAll('.copy-btn');

    // === Utilities ===
    const formData = () => Object.fromEntries(new FormData(form).entries());

    const showToast = (message) => {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    };

    const setStatus = (text, type = 'default') => {
      statusEl.textContent = text;
      statusEl.className = 'status-bar ' + type;
    };

    // === Tab Switching ===
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById('tab-' + targetTab).classList.add('active');
      });
    });

    // === Copy to Clipboard ===
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const text = document.getElementById(targetId).textContent;
        navigator.clipboard.writeText(text).then(() => {
          showToast('Copied to clipboard!');
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy JSON', 2000);
        }).catch(() => {
          showToast('Failed to copy');
        });
      });
    });

    // === Preset Management ===
    form.addEventListener('input', () => {
      presetField.value = '';
      document.querySelectorAll('.preset-card').forEach(card => {
        card.classList.remove('active');
      });
    });

    async function loadPresets() {
      try {
        const response = await fetch('/api/presets');
        const data = await response.json();
        renderPresets(data);
      } catch (error) {
        presetGrid.innerHTML = '<div class="preset-card"><div class="preset-title">Error</div><div class="preset-desc">Unable to load presets. Check console.</div></div>';
      }
    }

    function renderPresets(presets) {
      presetGrid.innerHTML = '';
      presets.forEach(preset => {
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.innerHTML = '<div class="preset-title">' + preset.label + '</div><div class="preset-desc">' + preset.description + '</div>';
        card.addEventListener('click', () => applyPreset(preset, card));
        presetGrid.appendChild(card);
      });
    }

    function applyPreset(preset, cardElement) {
      form.browser.value = preset.payload.browser || 'chrome';
      form.version.value = preset.payload.version || '120';
      form.device.value = preset.payload.device || 'desktop';
      form.platform.value = preset.payload.platform || 'windows';
      presetField.value = preset.key;

      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      cardElement.classList.add('active');

      setStatus('Preset "' + preset.label + '" loaded. Ready to generate.', 'success');
    }

    // === Single Generation ===
    generateBtn.addEventListener('click', async () => {
      setStatus('Generating fingerprint...');
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="loading"></span> Generating...';

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData())
        });
        const data = await response.json();
        singleResultEl.textContent = JSON.stringify(data, null, 2);
        setStatus('Fingerprint ready. Hash: ' + (data.fingerprint?.fingerprintHash || 'N/A'), 'success');
        showToast('Generation complete!');

        // Switch to single result tab
        tabBtns[0].click();
      } catch (error) {
        singleResultEl.textContent = 'ERROR: ' + (error.message || String(error));
        setStatus('Generation failed. Check terminal output.', 'error');
        showToast('Generation failed!');
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '▶ Generate Single';
      }
    });

    // === Batch Streaming ===
    batchBtn.addEventListener('click', () => {
      batchResultEl.textContent = '';
      const payload = formData();
      const qs = new URLSearchParams(payload).toString();
      const stream = new EventSource('/api/batch?' + qs);

      batchBtn.disabled = true;
      batchBtn.innerHTML = '<span class="loading"></span> Streaming...';
      setStatus('Streaming batch...');

      let count = 0;

      stream.onmessage = event => {
        const data = JSON.parse(event.data);
        count++;
        batchResultEl.textContent += JSON.stringify(data, null, 2) + '\\n\\n';
        batchResultEl.scrollTop = batchResultEl.scrollHeight;
        setStatus('Received ' + count + ' fingerprints...');
      };

      stream.addEventListener('done', () => {
        stream.close();
        batchBtn.disabled = false;
        batchBtn.innerHTML = '▶▶ Stream Batch';
        setStatus('Batch complete. ' + count + ' fingerprints generated.', 'success');
        showToast('Batch streaming complete!');

        // Switch to batch result tab
        tabBtns[1].click();
      });

      stream.onerror = () => {
        stream.close();
        batchBtn.disabled = false;
        batchBtn.innerHTML = '▶▶ Stream Batch';
        setStatus('Stream interrupted. Check connection.', 'error');
        showToast('Stream failed!');
      };
    });

    // === Keyboard Shortcuts ===
    document.addEventListener('keydown', (e) => {
      // Ctrl+Enter = Generate Single
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!generateBtn.disabled) {
          generateBtn.click();
        }
      }

      // Escape = Clear results
      if (e.key === 'Escape') {
        singleResultEl.textContent = '// Click "Generate Single" to see output...';
        batchResultEl.textContent = '// Click "Stream Batch" to see output...';
        setStatus('Results cleared. Ready for new generation.');
      }
    });

    // === Initialize ===
    loadPresets();
  </script>
</body>
</html>`);
}
