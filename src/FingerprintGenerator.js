/**
 * Browser Fingerprint Generator
 *
 * Generates comprehensive browser fingerprints for security research
 * and privacy analysis. This tool collects various browser attributes
 * to create a unique identifier.
 */

class FingerprintGenerator {
  constructor(options = {}) {
    this.options = {
      includeCanvas: true,
      includeWebGL: true,
      includeAudio: false,
      includeFonts: true,
      includeScreen: true,
      includeTimezone: true,
      includeLanguage: true,
      includePlugins: true,
      includeLocalStorage: false,
      includeSessionStorage: false,
      ...options
    };
  }

  /**
   * Generate a complete browser fingerprint
   * @returns {Promise<Object>} Comprehensive fingerprint object
   */
  async generate() {
    const fingerprint = {
      timestamp: new Date().toISOString(),
      userAgent: this.getUserAgent(),
      screen: this.getScreenInfo(),
      timezone: this.getTimezone(),
      language: this.getLanguage(),
      plugins: this.getPlugins(),
      cookies: this.getCookieInfo(),
      localStorage: this.getLocalStorageInfo(),
      sessionStorage: this.getSessionStorageInfo()
    };

    if (this.options.includeCanvas) {
      fingerprint.canvas = await this.getCanvasFingerprint();
    }

    if (this.options.includeWebGL) {
      fingerprint.webgl = await this.getWebGLFingerprint();
    }

    if (this.options.includeAudio) {
      fingerprint.audio = await this.getAudioFingerprint();
    }

    if (this.options.includeFonts) {
      fingerprint.fonts = await this.getFontFingerprint();
    }

    // Generate hash of the fingerprint
    fingerprint.hash = this.generateHash(fingerprint);

    return fingerprint;
  }

  /**
   * Get user agent string
   */
  getUserAgent() {
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator.userAgent;
    }
    return 'Node.js Environment';
  }

  /**
   * Get screen information
   */
  getScreenInfo() {
    if (typeof window !== 'undefined' && window.screen) {
      return {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      };
    }
    return null;
  }

  /**
   * Get timezone information
   */
  getTimezone() {
    if (typeof Intl !== 'undefined') {
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: new Date().getTimezoneOffset(),
        dst: this.isDSTObserved()
      };
    }
    return null;
  }

  /**
   * Check if Daylight Saving Time is observed
   */
  isDSTObserved() {
    const jan = new Date(new Date().getFullYear(), 0, 1);
    const jul = new Date(new Date().getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset()) !==
           Math.min(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }

  /**
   * Get language information
   */
  getLanguage() {
    if (typeof window !== 'undefined' && window.navigator) {
      return {
        language: window.navigator.language,
        languages: Array.from(window.navigator.languages || []),
        languagePreference: window.navigator.language || 'en-US'
      };
    }
    return null;
  }

  /**
   * Get browser plugins
   */
  getPlugins() {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.plugins) {
      const plugins = [];
      for (let i = 0; i < window.navigator.plugins.length; i++) {
        const plugin = window.navigator.plugins[i];
        plugins.push({
          name: plugin.name,
          description: plugin.description,
          filename: plugin.filename,
          version: plugin.version
        });
      }
      return plugins;
    }
    return [];
  }

  /**
   * Get cookie information
   */
  getCookieInfo() {
    if (typeof document !== 'undefined') {
      return {
        enabled: navigator.cookieEnabled,
        count: document.cookie ? document.cookie.split(';').length : 0
      };
    }
    return { enabled: false, count: 0 };
  }

  /**
   * Get localStorage information
   */
  getLocalStorageInfo() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return {
          available: true,
          size: JSON.stringify(window.localStorage).length,
          itemCount: Object.keys(window.localStorage).length
        };
      } catch (e) {
        return { available: false, error: e.message };
      }
    }
    return { available: false };
  }

  /**
   * Get sessionStorage information
   */
  getSessionStorageInfo() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        return {
          available: true,
          size: JSON.stringify(window.sessionStorage).length,
          itemCount: Object.keys(window.sessionStorage).length
        };
      } catch (e) {
        return { available: false, error: e.message };
      }
    }
    return { available: false };
  }

  /**
   * Get canvas fingerprint
   */
  async getCanvasFingerprint() {
    if (typeof document === 'undefined') return null;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Draw text with various styles
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprinting canvas', 2, 2);

      // Draw some shapes
      ctx.fillStyle = '#f60';
      ctx.fillRect(100, 2, 62, 20);

      // Get canvas data
      const dataURL = canvas.toDataURL();

      return {
        dataURL: dataURL.substring(0, 100) + '...', // Truncated for storage
        hash: this.simpleHash(dataURL)
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Get WebGL fingerprint
   */
  async getWebGLFingerprint() {
    if (typeof document === 'undefined') return null;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return { error: 'WebGL not supported' };

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Get audio fingerprint
   */
  async getAudioFingerprint() {
    if (typeof AudioContext === 'undefined') return null;

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

      oscillator.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);

      const fingerprint = await new Promise((resolve) => {
        setTimeout(() => {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteTimeDomainData(dataArray);

          oscillator.stop();
          audioContext.close();

          resolve({
            sampleRate: audioContext.sampleRate,
            dataHash: this.simpleHash(Array.from(dataArray).join(','))
          });
        }, 100);
      });

      return fingerprint;
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Get font fingerprint
   */
  async getFontFingerprint() {
    if (typeof document === 'undefined') return null;

    try {
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testFonts = [
        'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
        'Helvetica', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana'
      ];

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const detectedFonts = [];

      for (const font of testFonts) {
        for (const baseFont of baseFonts) {
          const width = this.measureTextWidth(font, baseFont, ctx);
          const baseWidth = this.measureTextWidth(baseFont, baseFont, ctx);

          if (width !== baseWidth) {
            detectedFonts.push(font);
            break;
          }
        }
      }

      return {
        detected: detectedFonts,
        total: detectedFonts.length
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Measure text width for font detection
   */
  measureTextWidth(font, baseFont, ctx) {
    const testString = 'mmmmmmmmmmlli';
    ctx.font = `72px ${font}, ${baseFont}`;
    return ctx.measureText(testString).width;
  }

  /**
   * Generate a simple hash from fingerprint data
   */
  generateHash(fingerprint) {
    const stringified = JSON.stringify(fingerprint);
    return this.simpleHash(stringified);
  }

  /**
   * Simple hash function for fingerprint generation
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Export fingerprint to different formats
   */
  export(fingerprint, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(fingerprint, null, 2);
      case 'csv':
        return this.toCSV(fingerprint);
      case 'xml':
        return this.toXML(fingerprint);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert fingerprint to CSV format
   */
  toCSV(fingerprint) {
    const flatten = (obj, prefix = '') => {
      const flattened = {};

      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(flattened, flatten(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }

      return flattened;
    };

    const flat = flatten(fingerprint);
    const headers = Object.keys(flat);
    const values = headers.map(header => flat[header]);

    return [headers.join(','), values.join(',')].join('\n');
  }

  /**
   * Convert fingerprint to XML format
   */
  toXML(fingerprint) {
    const convertToXML = (obj, indent = 0) => {
      const spaces = '  '.repeat(indent);
      let xml = '';

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          xml += `${spaces}<${key}>\n`;
          xml += convertToXML(value, indent + 1);
          xml += `${spaces}</${key}>\n`;
        } else {
          xml += `${spaces}<${key}>${this.escapeXML(value ? value.toString() : 'null')}</${key}>\n`;
        }
      }

      return xml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<fingerprint>\n${convertToXML(fingerprint, 1)}</fingerprint>`;
  }

  /**
   * Escape XML special characters
   */
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

module.exports = FingerprintGenerator;