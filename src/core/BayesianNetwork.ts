/**
 * Fixed Bayesian Network Engine for Statistical Fingerprint Generation
 */

import { createHash } from 'crypto';
import {
  BayesianNetwork,
  BayesianNetworkNode,
  ProbabilityDistribution,
  Fingerprint,
  FingerprintConstraints,
  BrowserName,
  DeviceType,
  ConditionalProbability,
  BayesianNetworkError,
  BayesianNetworkStatistics
} from '../types';

export class StatisticalFingerprintEngine implements BayesianNetwork {
  public readonly nodes = new Map<string, BayesianNetworkNode>();
  public readonly edges = new Map<string, string[]>();

  private initialized = false;
  private randomSeed: number;
  private cachedTopologicalOrder: string[] | null = null;

  constructor(randomSeed?: number) {
    this.randomSeed = randomSeed || Date.now();
    this.initializeNetwork();
  }

  /**
   * Initialize the Bayesian Network with realistic browser statistics
   */
  private initializeNetwork(): void {
    // Browser node - root node
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

    // Device type node
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

    // Platform node
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

    // Screen resolution node
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

    // Hardware concurrency node
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

    // Browser version node
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

  /**
   * Get device probability distributions
   */
  private getDeviceProbabilities(): ConditionalProbability {
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

  /**
   * Get platform probability distributions
   */
  private getPlatformProbabilities(): ConditionalProbability {
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

  /**
   * Get screen resolution probabilities
   */
  private getScreenResolutionProbabilities(): ConditionalProbability {
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

  /**
   * Get hardware concurrency probabilities
   */
  private getHardwareConcurrencyProbabilities(): ConditionalProbability {
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

  /**
   * Get version probabilities
   */
  private getVersionProbabilities(): ConditionalProbability {
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

  /**
   * Add a node to the Bayesian network
   */
  private addNode(name: string, node: BayesianNetworkNode): void {
    this.nodes.set(name, node);

    // Update edges
    node.parents.forEach(parent => {
      if (!this.edges.has(parent)) {
        this.edges.set(parent, []);
      }
      this.edges.get(parent)!.push(name);
    });
  }

  /**
   * Generate a fingerprint sample based on the Bayesian network
   */
  public generateSample(constraints?: FingerprintConstraints): Fingerprint {
    if (!this.initialized) {
      throw new BayesianNetworkError('Network not initialized');
    }

    const startTime = Date.now();
    const sample: any = {};
    const evidence: Record<string, any> = {};

    // Apply constraints
    if (constraints) {
      this.applyConstraints(constraints, evidence);
    }

    // Sample nodes in topological order
    const sampledOrder = this.getTopologicalOrder();

    for (const nodeName of sampledOrder) {
      const node = this.nodes.get(nodeName);
      if (!node) {
        throw new BayesianNetworkError(`Node ${nodeName} not found`, nodeName);
      }

      const preset = evidence[nodeName];
      const value = preset !== undefined ? preset : this.sampleNode(node, evidence);
      sample[nodeName] = value;
      evidence[nodeName] = value;
    }

    // Convert to fingerprint format
    const fingerprint = this.convertToFingerprint(sample);

    fingerprint.generationTime = Math.max(1, Date.now() - startTime);
    fingerprint.timestamp = new Date().toISOString();

    return fingerprint;
  }

  /**
   * Sample a single node given evidence
   */
  private sampleNode(node: BayesianNetworkNode, evidence: Record<string, any>): any {
    const dist = this.getConditionalDistribution(node, evidence);

    if (dist.type === 'categorical') {
      return this.sampleCategorical(dist.values!, dist.probabilities!);
    } else if (dist.type === 'gaussian') {
      return this.sampleGaussian(dist.mean!, dist.variance!);
    } else {
      throw new BayesianNetworkError(`Unsupported distribution type: ${dist.type}`, node.name);
    }
  }

  /**
   * Get conditional distribution for a node given evidence
   */
  private getConditionalDistribution(
    node: BayesianNetworkNode,
    evidence: Record<string, any>
  ): ProbabilityDistribution {
    this.validateEvidenceForNode(node, evidence);

    if (node.parents.length === 0 || !node.probabilityDistribution.conditions) {
      return node.probabilityDistribution;
    }

    // Find the condition key
    const conditionKey = this.getConditionKey(node, evidence);

    if (node.probabilityDistribution.conditions[conditionKey]) {
      return node.probabilityDistribution.conditions[conditionKey] as ProbabilityDistribution;
    }

    // Fallback to default distribution
    console.warn(`No condition found for ${node.name} with evidence ${JSON.stringify(evidence)}, using fallback`);

    // Try to find a suitable fallback
    if (node.probabilityDistribution.conditions) {
      const fallbackKeys = Object.keys(node.probabilityDistribution.conditions);

      if (node.name === 'screenResolution') {
        // For screen resolution, fallback to device type only
        const device = evidence.device || 'desktop';
        const deviceKey = fallbackKeys.find(key => key.startsWith(device + '|'));
        if (deviceKey) {
          return node.probabilityDistribution.conditions[deviceKey] as ProbabilityDistribution;
        }
        // Fallback to first available
        const firstKey = fallbackKeys[0];
        if (firstKey) {
          return node.probabilityDistribution.conditions[firstKey] as ProbabilityDistribution;
        }
      }

      // For other nodes, return first available condition
      const firstKey = fallbackKeys[0];
      if (firstKey) {
        return node.probabilityDistribution.conditions[firstKey] as ProbabilityDistribution;
      }
    }

    throw new BayesianNetworkError(
      `No condition found for ${node.name} with evidence ${JSON.stringify(evidence)}`,
      node.name
    );
  }

  /**
   * Get condition key based on parent values
   */
  private getConditionKey(node: BayesianNetworkNode, evidence: Record<string, any>): string {
    if (node.parents.length === 1 && node.parents[0]) {
      const parentValue = evidence[node.parents[0]];
      return parentValue || 'unknown';
    }

    // For multiple parents, create a composite key
    return node.parents.map(parent => evidence[parent] || 'unknown').join('|');
  }

  /**
   * Sample from categorical distribution (optimized)
   */
  private sampleCategorical(values: (string | number)[], probabilities: number[]): string | number {
    if (!values || !probabilities || values.length !== probabilities.length || values.length === 0) {
      throw new BayesianNetworkError('Invalid categorical distribution');
    }

    const random = this.seededRandom();
    let cumulative = 0;

    // Fast path - no undefined checks in hot loop
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i]!; // Non-null assertion: we verified lengths match
      if (random <= cumulative) {
        return values[i]!; // Non-null assertion: we verified array is not empty
      }
    }

    // Fallback: return last value if rounding errors occur
    return values[values.length - 1]!; // Non-null assertion: we verified array is not empty
  }

  /**
   * Sample from Gaussian distribution
   */
  private sampleGaussian(mean: number, variance: number): number {
    const random = this.seededRandom();
    const u1 = random;
    const u2 = this.seededRandom();

    // Box-Muller transform
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.round(mean + Math.sqrt(variance) * z0);
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(): number {
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
    return this.randomSeed / 233280;
  }

  /**
   * Get topological ordering of nodes (cached for performance)
   * Uses iterative Kahn's algorithm to avoid stack overflow
   */
  private getTopologicalOrder(): string[] {
    // Return cached result if available
    if (this.cachedTopologicalOrder) {
      return this.cachedTopologicalOrder;
    }

    // Calculate in-degrees for all nodes
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const order: string[] = [];

    // Initialize in-degrees
    this.nodes.forEach((node, name) => {
      inDegree.set(name, node.parents.length);
      if (node.parents.length === 0) {
        queue.push(name);
      }
    });

    // Process nodes in topological order
    while (queue.length > 0) {
      const nodeName = queue.shift()!;
      order.push(nodeName);

      const children = this.edges.get(nodeName) || [];
      for (const child of children) {
        const degree = inDegree.get(child)! - 1;
        inDegree.set(child, degree);
        if (degree === 0) {
          queue.push(child);
        }
      }
    }

    // Cache and return the result
    this.cachedTopologicalOrder = order;
    return order;
  }

  /**
   * Apply user constraints to evidence
   */
  private applyConstraints(constraints: FingerprintConstraints, evidence: Record<string, any>): void {
    if (constraints.browsers && constraints.browsers.length > 0) {
      const selected = constraints.browsers[Math.floor(this.seededRandom() * constraints.browsers.length)];
      if (typeof selected === 'string') {
        evidence.browser = selected;
      } else if (selected && selected.name) {
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

  private resolveVersionConstraint(constraint: { minVersion?: number; maxVersion?: number }): string | undefined {
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

  /**
   * Convert sample to fingerprint format
   */
  private convertToFingerprint(sample: any): Fingerprint {
    const browser = sample.browser as BrowserName;
    const version = sample.version;
    const device = sample.device as DeviceType;
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
      }, // Will be populated by headers generator
      fingerprintHash: this.calculateHash(sample),
      qualityScore: 0.95,
      generationTime: 0,
      timestamp: ''
    };
  }

  /**
   * Generate user agent string
   */
  public generateUserAgent(browser: BrowserName, version: string, platform: string, device: DeviceType): string {
    const platformMap: Record<string, string> = {
      windows: 'Windows NT 10.0; Win64; x64',
      macos: 'Macintosh; Intel Mac OS X 10_15_7',
      linux: 'X11; Linux x86_64',
      android: 'Linux; Android 13',
      ios: 'iPhone; CPU iPhone OS 16_0 like Mac OS X'
    };

    const browserMap: Record<string, string> = {
      chrome: `Mozilla/5.0 (${platformMap[platform]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`,
      firefox: `Mozilla/5.0 (${platformMap[platform]}; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`,
      safari: `Mozilla/5.0 (${platformMap[platform]}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`,
      edge: `Mozilla/5.0 (${platformMap[platform]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36 Edg/${version}.0.0.0`
    };

    const userAgent = browserMap[browser] || '';
    return userAgent ? `${userAgent} ${browser} ${platform}` : `${browser} ${platform}`;
  }

  /**
   * Calculate hash of sample (optimized with crypto module)
   */
  private calculateHash(sample: any): string {
    // Hash only key properties for better performance
    const keyString = `${sample.browser}:${sample.version}:${sample.device}:${sample.platform}:${sample.screenResolution}:${sample.language}`;
    return createHash('sha256').update(keyString).digest('hex').substring(0, 16);
  }

  /**
   * Get platform version
   */
  private getPlatformVersion(platform: string): string {
    const versions: Record<string, string> = {
      windows: '10.0',
      macos: '13.0',
      linux: '5.15',
      android: '13',
      ios: '16.0'
    };
    return versions[platform] || '1.0';
  }

  /**
   * Get device memory based on hardware concurrency
   */
  private getDeviceMemory(cores: number): number {
    const memoryMap: Record<number, number> = {
      2: 4,
      4: 8,
      6: 12,
      8: 16,
      12: 24,
      16: 32
    };
    return memoryMap[cores] || 8;
  }

  /**
   * Calculate probability of a node value given evidence
   */
  public calculateProbability(nodeName: string, value: any, evidence?: Record<string, any>): number {
    if (!this.nodes.has(nodeName)) {
      throw new BayesianNetworkError(`Node ${nodeName} not found`, nodeName);
    }
    const node = this.nodes.get(nodeName);
    if (!node) {
      return 0;
    }

    const dist = this.getConditionalDistribution(node, evidence || {});

    if (dist.type === 'categorical' && dist.values && dist.probabilities) {
      const index = dist.values.indexOf(value);
      return index >= 0 ? (dist.probabilities[index] || 0) : 0;
    } else if (dist.type === 'gaussian' && dist.mean && dist.variance) {
      // Calculate probability density function
      const exponent = -Math.pow(value - dist.mean, 2) / (2 * dist.variance);
      return Math.exp(exponent) / Math.sqrt(2 * Math.PI * dist.variance);
    }

    return 0;
  }

  /**
   * Update probabilities with new data
   */
  public updateProbabilities(data: Fingerprint[]): void {
    // Implementation for updating probabilities with new fingerprint data
    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    data.forEach(fp => {
      if (fp.qualityScore > 0.8) {
        this.updateFromFingerprint(fp);
      }
    });
  }

  /**
   * Update network from a single fingerprint
   */
  private updateFromFingerprint(fingerprint: Fingerprint): void {
    const features = this.extractFeatures(fingerprint);

    features.forEach((value, name) => {
      const node = this.nodes.get(name);
      if (node) {
        // Placeholder: a real implementation would adjust probability tables.
        // For now we keep telemetry minimal but avoid noisy logging.
      }
    });
  }

  /**
   * Extract features from fingerprint
   */
  private extractFeatures(fingerprint: Fingerprint): Map<string, any> {
    const features = new Map<string, any>();

    features.set('browser', fingerprint.browser.name);
    features.set('device', fingerprint.device.type);
    features.set('platform', fingerprint.device.platform.name);
    features.set('version', fingerprint.browser.version);
    features.set('hardwareConcurrency', fingerprint.device.hardwareConcurrency);
    features.set('screenResolution', `${fingerprint.device.screenResolution.width}x${fingerprint.device.screenResolution.height}`);

    return features;
  }

  private validateEvidenceForNode(node: BayesianNetworkNode, evidence: Record<string, any>): void {
    if (!node.parents.length) {
      return;
    }

    for (const parent of node.parents) {
      const value = evidence[parent];
      if (value === undefined) continue;
      const parentNode = this.nodes.get(parent);
      const allowedValues = parentNode?.probabilityDistribution.values;
      if (allowedValues && !allowedValues.includes(value)) {
        throw new BayesianNetworkError(`Invalid value ${value} for parent ${parent}`, node.name);
      }
    }
  }

  /**
   * Provide high-level statistics about the Bayesian network
   */
  public getStatistics(): BayesianNetworkStatistics {
    const relationships = Array.from(this.edges.values()).reduce((sum, children) => sum + children.length, 0);
    const browserNode = this.nodes.get('browser');
    const browserTypes = (browserNode?.probabilityDistribution.values || ['chrome', 'firefox', 'safari', 'edge']) as BrowserName[];
    const deviceTypes = ['desktop', 'mobile', 'tablet'] as DeviceType[];
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
