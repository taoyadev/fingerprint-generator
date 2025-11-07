import { Fingerprint, HTTPHeaders } from '../types';

export interface AutomationConfig {
  userAgent: string;
  viewport: { width: number; height: number };
  headers: Record<string, string>;
  locale: string;
  timezone: string;
  permissions: string[];
  extraHTTPHeaders?: Record<string, string>;
  colorScheme?: 'light' | 'dark' | 'no-preference';
  reducedMotion?: 'reduce' | 'no-preference';
}

export interface PlaywrightConfig extends AutomationConfig {
  userAgentData?: {
    architecture: string;
    platform: string;
    mobile: boolean;
    brands: { brand: string; version: string }[];
  };
  ignoreHTTPSErrors?: boolean;
  bypassCSP?: boolean;
}

export interface PuppeteerConfig extends AutomationConfig {
  args: string[];
  defaultViewport?: { width: number; height: number };
  ignoreHTTPSErrors?: boolean;
  headless?: boolean;
}

interface StealthConfig {
  permissions: string[];
  plugins: { name: string; description: string; filename: string }[];
}

/**
 * Lightweight browser automation helper that converts fingerprints into
 * Playwright/Puppeteer ready configurations. This replaces the previous
 * implementation that depended heavily on DOM APIs which are unavailable
 * in a Node.js environment.
 */
export class BrowserAutomation {
  /**
   * Convert fingerprint information into a Playwright context configuration.
   */
  public toPlaywrightConfig(fingerprint: Fingerprint, headers: HTTPHeaders): PlaywrightConfig {
    return {
      userAgent: fingerprint.userAgent,
      viewport: {
        width: fingerprint.device.screenResolution.width,
        height: fingerprint.device.screenResolution.height
      },
      headers: this.filterHeaders(headers),
      locale: fingerprint.locale,
      timezone: fingerprint.timezone.name,
      permissions: this.generatePermissions(fingerprint),
      extraHTTPHeaders: this.buildExtraHeaders(headers),
      colorScheme: fingerprint.device.type === 'mobile' ? 'light' : 'no-preference',
      reducedMotion: 'no-preference',
      ignoreHTTPSErrors: true,
      bypassCSP: true,
      userAgentData: {
        architecture: fingerprint.device.platform.architecture,
        platform: fingerprint.device.platform.name,
        mobile: fingerprint.device.type !== 'desktop',
        brands: [
          { brand: 'Chromium', version: fingerprint.browser.majorVersion.toString() },
          { brand: fingerprint.browser.name, version: fingerprint.browser.version }
        ]
      }
    };
  }

  /**
   * Convert fingerprint information into a Puppeteer launch/page configuration.
   */
  public toPuppeteerConfig(fingerprint: Fingerprint, headers: HTTPHeaders): PuppeteerConfig {
    return {
      userAgent: fingerprint.userAgent,
      viewport: {
        width: fingerprint.device.screenResolution.width,
        height: fingerprint.device.screenResolution.height
      },
      headers: this.filterHeaders(headers),
      locale: fingerprint.locale.replace('-', '_'),
      timezone: fingerprint.timezone.name,
      permissions: this.generatePermissions(fingerprint),
      args: this.generatePuppeteerArgs(fingerprint),
      defaultViewport: {
        width: fingerprint.device.screenResolution.width,
        height: fingerprint.device.screenResolution.height
      },
      ignoreHTTPSErrors: true,
      headless: false,
      extraHTTPHeaders: this.buildExtraHeaders(headers)
    };
  }

  /**
   * Create a Playwright context pre-configured with the provided fingerprint.
   */
  public async createPlaywrightContext(browser: any, fingerprint: Fingerprint, headers: HTTPHeaders): Promise<any> {
    const config = this.toPlaywrightConfig(fingerprint, headers);
    const context = await browser.newContext({
      userAgent: config.userAgent,
      viewport: config.viewport,
      locale: config.locale,
      timezoneId: config.timezone,
      permissions: config.permissions,
      extraHTTPHeaders: config.extraHTTPHeaders,
      colorScheme: config.colorScheme,
      reducedMotion: config.reducedMotion,
      ignoreHTTPSErrors: config.ignoreHTTPSErrors,
      bypassCSP: config.bypassCSP
    });

    await this.injectFingerprint(context, fingerprint);
    return context;
  }

  /**
   * Create a Puppeteer page pre-configured with the provided fingerprint.
   */
  public async createPuppeteerPage(browser: any, fingerprint: Fingerprint, headers: HTTPHeaders): Promise<any> {
    const config = this.toPuppeteerConfig(fingerprint, headers);
    const page = await browser.newPage();

    if (config.defaultViewport) {
      await page.setViewport(config.defaultViewport);
    }
    await page.setUserAgent(config.userAgent);

    if (config.extraHTTPHeaders) {
      await page.setExtraHTTPHeaders(config.extraHTTPHeaders);
    }

    await this.injectFingerprint(page, fingerprint);
    return page;
  }

  /**
   * Inject stealth overrides into the automation target.
   *
   * We rely on addInitScript/evaluateOnNewDocument so the code runs in the
   * browser context without TypeScript trying to inspect DOM globals.
   */
  public async injectFingerprint(target: any, fingerprint: Fingerprint): Promise<void> {
    const payload = this.buildStealthPayload(fingerprint);
    const script = this.buildStealthScript(payload);

    if (typeof target.addInitScript === 'function') {
      await target.addInitScript({ content: script });
    } else if (typeof target.evaluateOnNewDocument === 'function') {
      await target.evaluateOnNewDocument(script);
    }
  }

  /**
   * Build init script payload that mimics real browser behaviour.
   */
  private buildStealthPayload(fingerprint: Fingerprint): { config: StealthConfig; device: any } {
    const config: StealthConfig = {
      permissions: this.generatePermissions(fingerprint),
      plugins: this.generateFakePlugins(fingerprint)
    };

    return {
      config,
      device: {
        hardwareConcurrency: fingerprint.device.hardwareConcurrency,
        deviceMemory: fingerprint.device.deviceMemory ?? 4,
        screen: fingerprint.device.screenResolution
      }
    };
  }

  /**
   * Build a stringified script executed inside the browser context.
   */
  private buildStealthScript(payload: { config: StealthConfig; device: any }): string {
    const serialised = JSON.stringify(payload);
    return `(() => {
      const payload = ${serialised};
      const config = payload.config;
      const device = payload.device;
      try {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });

        if (navigator.permissions && navigator.permissions.query) {
          const originalQuery = navigator.permissions.query.bind(navigator.permissions);
          navigator.permissions.query = parameters => {
            if (config.permissions.includes(parameters.name)) {
              return Promise.resolve({ state: 'granted' });
            }
            return originalQuery(parameters);
          };
        }

        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => device.hardwareConcurrency
        });

        if ('deviceMemory' in navigator) {
          Object.defineProperty(navigator, 'deviceMemory', {
            get: () => device.deviceMemory
          });
        }

        if (config.plugins.length) {
          const plugins = config.plugins.map(plugin => ({
            name: plugin.name,
            description: plugin.description,
            filename: plugin.filename,
            length: 1
          }));
          Object.defineProperty(navigator, 'plugins', { get: () => plugins });
        }

        if (typeof screen !== 'undefined') {
          Object.defineProperties(screen, {
            width: { get: () => device.screen.width },
            height: { get: () => device.screen.height },
            colorDepth: { get: () => device.screen.colorDepth },
            pixelDepth: { get: () => device.screen.colorDepth }
          });
        }
      } catch (error) {
        console.warn('[fingerprint-generator] stealth injection failed', error);
      }
    })();`;
  }

  private filterHeaders(headers: HTTPHeaders): Record<string, string> {
    const filtered: Record<string, string> = {};
    ['accept-language', 'accept-encoding', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-dest'].forEach(name => {
      const value = headers[name];
      if (value) {
        filtered[name] = value;
      }
    });
    return filtered;
  }

  private buildExtraHeaders(headers: HTTPHeaders): Record<string, string> {
    const extra: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (!value) return;
      if (!['user-agent', 'content-length', 'host'].includes(key.toLowerCase())) {
        extra[key] = value;
      }
    });
    return extra;
  }

  private generatePermissions(fingerprint: Fingerprint): string[] {
    const permissions = ['geolocation', 'notifications'];
    if (fingerprint.device.type !== 'mobile') {
      permissions.push('clipboard-read', 'clipboard-write');
    }
    return permissions;
  }

  private generatePuppeteerArgs(fingerprint: Fingerprint): string[] {
    const args = [
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      `--lang=${fingerprint.locale}`
    ];

    if (fingerprint.device.type === 'mobile') {
      args.push('--enable-features=NetworkService,NetworkServiceInProcess');
    }

    return args;
  }

  private generateFakePlugins(fingerprint: Fingerprint): StealthConfig['plugins'] {
    if (fingerprint.browser.name === 'safari') {
      return [];
    }

    return [
      {
        name: 'Chrome PDF Plugin',
        description: 'Portable Document Format',
        filename: 'internal-pdf-viewer'
      },
      {
        name: 'Chrome PDF Viewer',
        description: '',
        filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai'
      }
    ];
  }
}
