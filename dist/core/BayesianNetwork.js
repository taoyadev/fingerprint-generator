"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalFingerprintEngine = void 0;
const crypto_1 = require("crypto");
const types_1 = require("../types");
class StatisticalFingerprintEngine {
    constructor(randomSeed) {
        this.nodes = new Map();
        this.edges = new Map();
        this.initialized = false;
        this.cachedTopologicalOrder = null;
        this.randomSeed = randomSeed || Date.now();
        this.initializeNetwork();
    }
    initializeNetwork() {
        this.addNode('browser', {
            name: 'browser',
            type: 'categorical',
            parents: [],
            children: ['version', 'platform', 'device', 'httpVersion'],
            probabilityDistribution: {
                type: 'categorical',
                values: ['chrome', 'firefox', 'safari', 'edge'],
                probabilities: [0.65, 0.13, 0.19, 0.03]
            }
        });
        this.addNode('device', {
            name: 'device',
            type: 'categorical',
            parents: ['browser'],
            children: ['screenResolution', 'hardwareConcurrency'],
            probabilityDistribution: {
                type: 'conditional',
                conditions: this.getDeviceProbabilities()
            }
        });
        this.addNode('platform', {
            name: 'platform',
            type: 'categorical',
            parents: ['browser'],
            children: ['screenResolution', 'hardwareConcurrency'],
            probabilityDistribution: {
                type: 'conditional',
                conditions: this.getPlatformProbabilities()
            }
        });
        this.addNode('screenResolution', {
            name: 'screenResolution',
            type: 'categorical',
            parents: ['device', 'platform'],
            children: [],
            probabilityDistribution: {
                type: 'conditional',
                conditions: this.getScreenResolutionProbabilities()
            }
        });
        this.addNode('hardwareConcurrency', {
            name: 'hardwareConcurrency',
            type: 'numerical',
            parents: ['device'],
            children: [],
            probabilityDistribution: {
                type: 'conditional',
                conditions: this.getHardwareConcurrencyProbabilities()
            }
        });
        this.addNode('version', {
            name: 'version',
            type: 'categorical',
            parents: ['browser'],
            children: [],
            probabilityDistribution: {
                type: 'conditional',
                conditions: this.getVersionProbabilities()
            }
        });
        this.initialized = true;
    }
    getDeviceProbabilities() {
        return {
            chrome: {
                type: 'categorical',
                values: ['desktop', 'mobile', 'tablet'],
                probabilities: [0.70, 0.28, 0.02]
            },
            firefox: {
                type: 'categorical',
                values: ['desktop', 'mobile', 'tablet'],
                probabilities: [0.85, 0.13, 0.02]
            },
            safari: {
                type: 'categorical',
                values: ['desktop', 'mobile', 'tablet'],
                probabilities: [0.35, 0.60, 0.05]
            },
            edge: {
                type: 'categorical',
                values: ['desktop', 'mobile', 'tablet'],
                probabilities: [0.90, 0.08, 0.02]
            }
        };
    }
    getPlatformProbabilities() {
        return {
            chrome: {
                type: 'categorical',
                values: ['windows', 'macos', 'linux', 'android', 'ios'],
                probabilities: [0.44, 0.15, 0.02, 0.35, 0.04]
            },
            firefox: {
                type: 'categorical',
                values: ['windows', 'macos', 'linux', 'android', 'ios'],
                probabilities: [0.45, 0.20, 0.15, 0.12, 0.08]
            },
            safari: {
                type: 'categorical',
                values: ['windows', 'macos', 'linux', 'android', 'ios'],
                probabilities: [0.05, 0.55, 0.01, 0.01, 0.38]
            },
            edge: {
                type: 'categorical',
                values: ['windows', 'macos', 'linux', 'android', 'ios'],
                probabilities: [0.85, 0.10, 0.02, 0.02, 0.01]
            }
        };
    }
    getScreenResolutionProbabilities() {
        return {
            'desktop|windows': {
                type: 'categorical',
                values: ['1920x1080', '1366x768', '2560x1440', '3840x2160', '1440x900'],
                probabilities: [0.45, 0.20, 0.15, 0.05, 0.15]
            },
            'desktop|macos': {
                type: 'categorical',
                values: ['2560x1440', '1920x1080', '1680x1050', '3840x2160', '1440x900'],
                probabilities: [0.35, 0.25, 0.20, 0.10, 0.10]
            },
            'mobile|android': {
                type: 'categorical',
                values: ['360x640', '414x896', '375x667', '412x869', '360x780'],
                probabilities: [0.30, 0.25, 0.20, 0.15, 0.10]
            },
            'mobile|ios': {
                type: 'categorical',
                values: ['390x844', '414x896', '375x812', '428x926', '320x568'],
                probabilities: [0.35, 0.30, 0.20, 0.10, 0.05]
            }
        };
    }
    getHardwareConcurrencyProbabilities() {
        return {
            desktop: {
                type: 'gaussian',
                mean: 6,
                variance: 4
            },
            mobile: {
                type: 'gaussian',
                mean: 8,
                variance: 1
            },
            tablet: {
                type: 'gaussian',
                mean: 4,
                variance: 1
            }
        };
    }
    getVersionProbabilities() {
        return {
            chrome: {
                type: 'categorical',
                values: ['120', '119', '118', '117', '116'],
                probabilities: [0.35, 0.25, 0.20, 0.15, 0.05]
            },
            firefox: {
                type: 'categorical',
                values: ['119', '118', '117', '116', '115'],
                probabilities: [0.30, 0.25, 0.20, 0.15, 0.10]
            },
            safari: {
                type: 'categorical',
                values: ['16.0', '15.6', '15.5', '15.4', '15.3'],
                probabilities: [0.25, 0.20, 0.20, 0.20, 0.15]
            },
            edge: {
                type: 'categorical',
                values: ['120', '119', '118', '117', '116'],
                probabilities: [0.30, 0.25, 0.20, 0.15, 0.10]
            }
        };
    }
    addNode(name, node) {
        this.nodes.set(name, node);
        node.parents.forEach(parent => {
            if (!this.edges.has(parent)) {
                this.edges.set(parent, []);
            }
            this.edges.get(parent).push(name);
        });
    }
    generateSample(constraints) {
        if (!this.initialized) {
            throw new types_1.BayesianNetworkError('Network not initialized');
        }
        const startTime = Date.now();
        const sample = {};
        const evidence = {};
        if (constraints) {
            this.applyConstraints(constraints, evidence);
        }
        const sampledOrder = this.getTopologicalOrder();
        for (const nodeName of sampledOrder) {
            const node = this.nodes.get(nodeName);
            if (!node) {
                throw new types_1.BayesianNetworkError(`Node ${nodeName} not found`, nodeName);
            }
            const preset = evidence[nodeName];
            const value = preset !== undefined ? preset : this.sampleNode(node, evidence);
            sample[nodeName] = value;
            evidence[nodeName] = value;
        }
        const fingerprint = this.convertToFingerprint(sample);
        fingerprint.generationTime = Math.max(1, Date.now() - startTime);
        fingerprint.timestamp = new Date().toISOString();
        return fingerprint;
    }
    sampleNode(node, evidence) {
        const dist = this.getConditionalDistribution(node, evidence);
        if (dist.type === 'categorical') {
            return this.sampleCategorical(dist.values, dist.probabilities);
        }
        else if (dist.type === 'gaussian') {
            return this.sampleGaussian(dist.mean, dist.variance);
        }
        else {
            throw new types_1.BayesianNetworkError(`Unsupported distribution type: ${dist.type}`, node.name);
        }
    }
    getConditionalDistribution(node, evidence) {
        this.validateEvidenceForNode(node, evidence);
        if (node.parents.length === 0 || !node.probabilityDistribution.conditions) {
            return node.probabilityDistribution;
        }
        const conditionKey = this.getConditionKey(node, evidence);
        if (node.probabilityDistribution.conditions[conditionKey]) {
            return node.probabilityDistribution.conditions[conditionKey];
        }
        console.warn(`No condition found for ${node.name} with evidence ${JSON.stringify(evidence)}, using fallback`);
        if (node.probabilityDistribution.conditions) {
            const fallbackKeys = Object.keys(node.probabilityDistribution.conditions);
            if (node.name === 'screenResolution') {
                const device = evidence.device || 'desktop';
                const deviceKey = fallbackKeys.find(key => key.startsWith(device + '|'));
                if (deviceKey) {
                    return node.probabilityDistribution.conditions[deviceKey];
                }
                const firstKey = fallbackKeys[0];
                if (firstKey) {
                    return node.probabilityDistribution.conditions[firstKey];
                }
            }
            const firstKey = fallbackKeys[0];
            if (firstKey) {
                return node.probabilityDistribution.conditions[firstKey];
            }
        }
        throw new types_1.BayesianNetworkError(`No condition found for ${node.name} with evidence ${JSON.stringify(evidence)}`, node.name);
    }
    getConditionKey(node, evidence) {
        if (node.parents.length === 1 && node.parents[0]) {
            const parentValue = evidence[node.parents[0]];
            return parentValue || 'unknown';
        }
        return node.parents.map(parent => evidence[parent] || 'unknown').join('|');
    }
    sampleCategorical(values, probabilities) {
        if (!values || !probabilities || values.length !== probabilities.length || values.length === 0) {
            throw new types_1.BayesianNetworkError('Invalid categorical distribution');
        }
        const random = this.seededRandom();
        let cumulative = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (random <= cumulative) {
                return values[i];
            }
        }
        return values[values.length - 1];
    }
    sampleGaussian(mean, variance) {
        const random = this.seededRandom();
        const u1 = random;
        const u2 = this.seededRandom();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return Math.round(mean + Math.sqrt(variance) * z0);
    }
    seededRandom() {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280;
    }
    getTopologicalOrder() {
        if (this.cachedTopologicalOrder) {
            return this.cachedTopologicalOrder;
        }
        const inDegree = new Map();
        const queue = [];
        const order = [];
        this.nodes.forEach((node, name) => {
            inDegree.set(name, node.parents.length);
            if (node.parents.length === 0) {
                queue.push(name);
            }
        });
        while (queue.length > 0) {
            const nodeName = queue.shift();
            order.push(nodeName);
            const children = this.edges.get(nodeName) || [];
            for (const child of children) {
                const degree = inDegree.get(child) - 1;
                inDegree.set(child, degree);
                if (degree === 0) {
                    queue.push(child);
                }
            }
        }
        this.cachedTopologicalOrder = order;
        return order;
    }
    applyConstraints(constraints, evidence) {
        if (constraints.browsers && constraints.browsers.length > 0) {
            const selected = constraints.browsers[Math.floor(this.seededRandom() * constraints.browsers.length)];
            if (typeof selected === 'string') {
                evidence.browser = selected;
            }
            else if (selected && selected.name) {
                evidence.browser = selected.name;
                const versionTarget = this.resolveVersionConstraint(selected);
                if (versionTarget) {
                    evidence.version = versionTarget;
                }
            }
        }
        if (constraints.devices) {
            evidence.device = constraints.devices[Math.floor(this.seededRandom() * constraints.devices.length)];
        }
        if (constraints.operatingSystems && constraints.operatingSystems.length > 0) {
            const selectedOS = constraints.operatingSystems[Math.floor(this.seededRandom() * constraints.operatingSystems.length)];
            if (selectedOS && selectedOS.name) {
                evidence.platform = selectedOS.name;
            }
        }
        if (constraints.screenResolutions && constraints.screenResolutions.length > 0) {
            const resolution = constraints.screenResolutions[Math.floor(this.seededRandom() * constraints.screenResolutions.length)];
            if (resolution) {
                evidence.screenResolution = `${resolution.width}x${resolution.height}`;
            }
        }
    }
    resolveVersionConstraint(constraint) {
        if (constraint.minVersion !== undefined && constraint.maxVersion !== undefined) {
            if (constraint.minVersion === constraint.maxVersion) {
                return constraint.minVersion.toString();
            }
            const min = Math.min(constraint.minVersion, constraint.maxVersion);
            const max = Math.max(constraint.minVersion, constraint.maxVersion);
            const range = max - min;
            const offset = Math.round(this.seededRandom() * range);
            return (min + offset).toString();
        }
        if (constraint.minVersion !== undefined) {
            return constraint.minVersion.toString();
        }
        if (constraint.maxVersion !== undefined) {
            return constraint.maxVersion.toString();
        }
        return undefined;
    }
    convertToFingerprint(sample) {
        const browser = sample.browser;
        const version = sample.version;
        const device = sample.device;
        const platform = sample.platform;
        const screenResolution = sample.screenResolution ? sample.screenResolution.split('x') : ['1920', '1080'];
        return {
            userAgent: this.generateUserAgent(browser, version, platform, device),
            browser: {
                name: browser,
                version: version.toString(),
                majorVersion: parseInt(version.split('.')[0])
            },
            device: {
                type: device,
                platform: {
                    name: platform,
                    version: this.getPlatformVersion(platform),
                    architecture: 'x64'
                },
                screenResolution: {
                    width: parseInt(screenResolution[0]),
                    height: parseInt(screenResolution[1]),
                    colorDepth: 24,
                    pixelRatio: 1
                },
                hardwareConcurrency: sample.hardwareConcurrency || 4,
                deviceMemory: this.getDeviceMemory(sample.hardwareConcurrency || 4),
            },
            locale: 'en-US',
            timezone: {
                name: 'America/New_York',
                offset: -300,
                dst: true
            },
            languages: ['en-US', 'en'],
            cookiesEnabled: true,
            plugins: [],
            multimediaDevices: {
                speakers: 2,
                microphones: 1,
                webcams: 0
            },
            headers: {
                'user-agent': '',
                'accept': '',
                'accept-language': '',
                'accept-encoding': ''
            },
            fingerprintHash: this.calculateHash(sample),
            qualityScore: 0.95,
            generationTime: 0,
            timestamp: ''
        };
    }
    generateUserAgent(browser, version, platform, device) {
        const platformMap = {
            windows: 'Windows NT 10.0; Win64; x64',
            macos: 'Macintosh; Intel Mac OS X 10_15_7',
            linux: 'X11; Linux x86_64',
            android: 'Linux; Android 13',
            ios: 'iPhone; CPU iPhone OS 16_0 like Mac OS X'
        };
        const browserMap = {
            chrome: `Mozilla/5.0 (${platformMap[platform]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`,
            firefox: `Mozilla/5.0 (${platformMap[platform]}; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`,
            safari: `Mozilla/5.0 (${platformMap[platform]}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`,
            edge: `Mozilla/5.0 (${platformMap[platform]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36 Edg/${version}.0.0.0`
        };
        const userAgent = browserMap[browser] || '';
        return userAgent ? `${userAgent} ${browser} ${platform}` : `${browser} ${platform}`;
    }
    calculateHash(sample) {
        const keyString = `${sample.browser}:${sample.version}:${sample.device}:${sample.platform}:${sample.screenResolution}:${sample.language}`;
        return (0, crypto_1.createHash)('sha256').update(keyString).digest('hex').substring(0, 16);
    }
    getPlatformVersion(platform) {
        const versions = {
            windows: '10.0',
            macos: '13.0',
            linux: '5.15',
            android: '13',
            ios: '16.0'
        };
        return versions[platform] || '1.0';
    }
    getDeviceMemory(cores) {
        const memoryMap = {
            2: 4,
            4: 8,
            6: 12,
            8: 16,
            12: 24,
            16: 32
        };
        return memoryMap[cores] || 8;
    }
    calculateProbability(nodeName, value, evidence) {
        if (!this.nodes.has(nodeName)) {
            throw new types_1.BayesianNetworkError(`Node ${nodeName} not found`, nodeName);
        }
        const node = this.nodes.get(nodeName);
        if (!node) {
            return 0;
        }
        const dist = this.getConditionalDistribution(node, evidence || {});
        if (dist.type === 'categorical' && dist.values && dist.probabilities) {
            const index = dist.values.indexOf(value);
            return index >= 0 ? (dist.probabilities[index] || 0) : 0;
        }
        else if (dist.type === 'gaussian' && dist.mean && dist.variance) {
            const exponent = -Math.pow(value - dist.mean, 2) / (2 * dist.variance);
            return Math.exp(exponent) / Math.sqrt(2 * Math.PI * dist.variance);
        }
        return 0;
    }
    updateProbabilities(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return;
        }
        data.forEach(fp => {
            if (fp.qualityScore > 0.8) {
                this.updateFromFingerprint(fp);
            }
        });
    }
    updateFromFingerprint(fingerprint) {
        const features = this.extractFeatures(fingerprint);
        features.forEach((value, name) => {
            const node = this.nodes.get(name);
            if (node) {
            }
        });
    }
    extractFeatures(fingerprint) {
        const features = new Map();
        features.set('browser', fingerprint.browser.name);
        features.set('device', fingerprint.device.type);
        features.set('platform', fingerprint.device.platform.name);
        features.set('version', fingerprint.browser.version);
        features.set('hardwareConcurrency', fingerprint.device.hardwareConcurrency);
        features.set('screenResolution', `${fingerprint.device.screenResolution.width}x${fingerprint.device.screenResolution.height}`);
        return features;
    }
    validateEvidenceForNode(node, evidence) {
        if (!node.parents.length) {
            return;
        }
        for (const parent of node.parents) {
            const value = evidence[parent];
            if (value === undefined)
                continue;
            const parentNode = this.nodes.get(parent);
            const allowedValues = parentNode?.probabilityDistribution.values;
            if (allowedValues && !allowedValues.includes(value)) {
                throw new types_1.BayesianNetworkError(`Invalid value ${value} for parent ${parent}`, node.name);
            }
        }
    }
    getStatistics() {
        const relationships = Array.from(this.edges.values()).reduce((sum, children) => sum + children.length, 0);
        const browserNode = this.nodes.get('browser');
        const browserTypes = (browserNode?.probabilityDistribution.values || ['chrome', 'firefox', 'safari', 'edge']);
        const deviceTypes = ['desktop', 'mobile', 'tablet'];
        const platforms = ['windows', 'macos', 'linux', 'android', 'ios'];
        return {
            totalNodes: this.nodes.size,
            totalRelationships: relationships,
            browserTypes,
            deviceTypes,
            platforms
        };
    }
}
exports.StatisticalFingerprintEngine = StatisticalFingerprintEngine;
//# sourceMappingURL=BayesianNetwork.js.map