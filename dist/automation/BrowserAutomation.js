"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserAutomation = void 0;
class BrowserAutomation {
    toPlaywrightConfig(fingerprint, headers) {
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
    toPuppeteerConfig(fingerprint, headers) {
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
    async createPlaywrightContext(browser, fingerprint, headers) {
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
    async createPuppeteerPage(browser, fingerprint, headers) {
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
    async injectFingerprint(target, fingerprint) {
        const payload = this.buildStealthPayload(fingerprint);
        const script = this.buildStealthScript(payload);
        if (typeof target.addInitScript === 'function') {
            await target.addInitScript({ content: script });
        }
        else if (typeof target.evaluateOnNewDocument === 'function') {
            await target.evaluateOnNewDocument(script);
        }
    }
    buildStealthPayload(fingerprint) {
        const config = {
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
    buildStealthScript(payload) {
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
    filterHeaders(headers) {
        const filtered = {};
        ['accept-language', 'accept-encoding', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-dest'].forEach(name => {
            const value = headers[name];
            if (value) {
                filtered[name] = value;
            }
        });
        return filtered;
    }
    buildExtraHeaders(headers) {
        const extra = {};
        Object.entries(headers).forEach(([key, value]) => {
            if (!value)
                return;
            if (!['user-agent', 'content-length', 'host'].includes(key.toLowerCase())) {
                extra[key] = value;
            }
        });
        return extra;
    }
    generatePermissions(fingerprint) {
        const permissions = ['geolocation', 'notifications'];
        if (fingerprint.device.type !== 'mobile') {
            permissions.push('clipboard-read', 'clipboard-write');
        }
        return permissions;
    }
    generatePuppeteerArgs(fingerprint) {
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
    generateFakePlugins(fingerprint) {
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
exports.BrowserAutomation = BrowserAutomation;
//# sourceMappingURL=BrowserAutomation.js.map