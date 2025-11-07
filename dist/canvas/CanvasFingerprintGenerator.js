"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticalCanvasFingerprintGenerator = void 0;
const crypto_1 = require("crypto");
const LRUCache_1 = require("../utils/LRUCache");
const LATENCY_HINTS = ['interactive', 'balanced', 'playback'];
class StatisticalCanvasFingerprintGenerator {
    constructor(seed) {
        const initial = seed ?? Date.now();
        this.state = initial % 2147483647 || 1;
        this.gpuProfiles = this.buildDefaultGpuProfiles();
        this.gpuDataCache = new LRUCache_1.LRUCache(50);
    }
    generateFingerprint(fingerprint) {
        const startedAt = Date.now();
        const canvas = this.generateCanvasFingerprint(fingerprint);
        const webgl = this.generateWebGLFingerprint(fingerprint);
        const audio = this.generateAudioFingerprint(fingerprint);
        const fonts = this.detectFonts(fingerprint);
        const assessment = this.assessCanvasConsistency(canvas, fingerprint);
        return {
            canvas,
            webgl,
            audio,
            fonts,
            warnings: assessment.warnings,
            consistencyScore: assessment.score,
            generationTime: Date.now() - startedAt
        };
    }
    generateCanvasFingerprint(fingerprint) {
        const baseKey = [
            fingerprint.browser.name,
            fingerprint.browser.majorVersion,
            fingerprint.device.platform.name,
            fingerprint.device.type
        ].join('|');
        const primaryHash = this.hash('canvas', baseKey);
        const dataURL = `data:image/png;base64,${Buffer.from(primaryHash, 'hex').toString('base64')}`;
        const renderingQuality = {
            colorDepth: fingerprint.device.screenResolution.colorDepth ?? 24,
            pixelRatio: fingerprint.device.screenResolution.pixelRatio ?? (fingerprint.device.type === 'mobile' ? 2 : 1),
            hardwareAcceleration: this.deriveHardwareAcceleration(fingerprint)
        };
        return {
            dataURL,
            textHash: this.hash('canvas:text', baseKey),
            shapesHash: this.hash('canvas:shapes', baseKey),
            imageHash: this.hash('canvas:image', baseKey),
            gradientHash: this.hash('canvas:gradient', baseKey),
            compositeHash: this.hash('canvas:composite', baseKey),
            renderingQuality,
            textRendering: this.createTextRenderingProfile(fingerprint),
            shapeRendering: this.createShapeRenderingProfile(fingerprint)
        };
    }
    generateWebGLFingerprint(fingerprint) {
        const profile = this.getGpuProfile(fingerprint);
        const baseKey = [
            profile.vendor,
            profile.renderer,
            fingerprint.browser.name,
            fingerprint.browser.majorVersion
        ].join('|');
        return {
            vendor: profile.vendor,
            renderer: profile.renderer,
            version: profile.version,
            shadingLanguageVersion: profile.shadingLanguageVersion,
            extensions: profile.extensions,
            parameters: this.buildWebGLParameters(profile, baseKey),
            vertexShaderHash: this.hash('webgl:vertex', baseKey),
            fragmentShaderHash: this.hash('webgl:fragment', baseKey),
            gpuInfo: {
                vendor: profile.vendor,
                renderer: profile.renderer,
                platform: profile.platform,
                memory: profile.memory
            }
        };
    }
    generateAudioFingerprint(fingerprint) {
        const baseKey = [
            fingerprint.device.platform.name,
            fingerprint.device.type,
            fingerprint.browser.name,
            fingerprint.browser.majorVersion
        ].join('|');
        const disabled = fingerprint.browser.majorVersion < 60;
        return {
            sampleRate: this.pickSampleRate(fingerprint),
            oscillatorHash: this.hash('audio:oscillator', baseKey),
            noiseHash: this.hash('audio:noise', baseKey),
            compressorHash: this.hash('audio:compressor', baseKey),
            contextFeatures: {
                maxChannelsInput: disabled ? 0 : this.deterministicNumber(baseKey, 1, 4),
                maxChannelsOutput: disabled ? 0 : this.deterministicNumber(baseKey, 2, 8),
                latencyHint: LATENCY_HINTS[this.deterministicNumber(baseKey, 0, LATENCY_HINTS.length - 1)],
                disabled
            }
        };
    }
    detectFonts(fingerprint) {
        const platformFonts = this.getFontProfiles(fingerprint.device.platform.name);
        const systemFonts = platformFonts.system;
        const webFonts = platformFonts.web;
        const detectedSystemFonts = this.sampleSubset(systemFonts, 0.8);
        const detectedWebFonts = this.sampleSubset(webFonts, 0.5);
        const detected = [...detectedSystemFonts, ...detectedWebFonts];
        const fontSupport = {};
        [...systemFonts, ...webFonts].forEach(font => {
            fontSupport[font] = detected.includes(font);
        });
        return {
            systemFonts: detectedSystemFonts,
            webFonts: detectedWebFonts,
            detected,
            total: detected.length,
            fontSignature: this.hash('fonts:signature', detected.sort().join('|')),
            fontSupport
        };
    }
    generateBatch(fingerprints) {
        return fingerprints.map(fp => this.generateFingerprint(fp));
    }
    async loadGPUData() {
        this.gpuProfiles.forEach(profile => {
            const key = this.cacheKey(profile);
            if (!this.gpuDataCache.has(key)) {
                this.gpuDataCache.set(key, profile);
            }
        });
    }
    validateCanvasConsistency(canvasFingerprint, fingerprint) {
        return this.assessCanvasConsistency(canvasFingerprint, fingerprint);
    }
    buildWebGLParameters(profile, baseKey) {
        return {
            VENDOR: profile.vendor,
            RENDERER: profile.renderer,
            VERSION: profile.version,
            SHADING_LANGUAGE_VERSION: profile.shadingLanguageVersion,
            MAX_TEXTURE_SIZE: this.deterministicNumber(baseKey, 2048, 16384),
            MAX_VIEWPORT_DIMS: this.deterministicNumber(baseKey, 2048, 8192),
            MAX_VERTEX_ATTRIBS: this.deterministicNumber(baseKey, 8, 32),
            MAX_COMBINED_TEXTURE_IMAGE_UNITS: this.deterministicNumber(baseKey, 16, 80)
        };
    }
    assessCanvasConsistency(canvasFingerprint, fingerprint) {
        let score = 1;
        const warnings = [];
        const expectedColorDepth = fingerprint.device.screenResolution.colorDepth ?? 24;
        if (canvasFingerprint.renderingQuality.colorDepth !== expectedColorDepth) {
            score -= 0.25;
            warnings.push(`Canvas color depth ${canvasFingerprint.renderingQuality.colorDepth} does not match device ${expectedColorDepth}.`);
        }
        const expectedPixelRatio = fingerprint.device.screenResolution.pixelRatio ?? (fingerprint.device.type === 'mobile' ? 2 : 1);
        if (Math.abs(canvasFingerprint.renderingQuality.pixelRatio - expectedPixelRatio) > 0.5) {
            score -= 0.2;
            warnings.push(`Canvas pixel ratio ${canvasFingerprint.renderingQuality.pixelRatio} is unusual for device ratio ${expectedPixelRatio}.`);
        }
        if (fingerprint.device.type === 'mobile' && canvasFingerprint.renderingQuality.hardwareAcceleration) {
            score -= 0.1;
            warnings.push('Hardware acceleration rarely reports true on low-end mobile devices.');
        }
        score = Math.max(0, Math.min(1, score));
        return {
            isValid: warnings.length === 0,
            score,
            warnings
        };
    }
    getGpuProfile(fingerprint) {
        const platformKey = `${fingerprint.device.platform.name}:${fingerprint.device.type}`;
        if (this.gpuDataCache.has(platformKey)) {
            return this.gpuDataCache.get(platformKey);
        }
        const candidates = this.gpuProfiles.filter(profile => profile.platform === fingerprint.device.platform.name ||
            profile.platform === platformKey);
        const source = candidates.length > 0 ? candidates : this.gpuProfiles;
        let selected;
        if (source.length > 0) {
            const index = this.deterministicNumber(platformKey, 0, source.length - 1);
            const safeIndex = Math.max(0, Math.min(index, source.length - 1));
            selected = source[safeIndex];
        }
        const finalSelection = selected ?? this.getFallbackGPUProfile();
        this.gpuDataCache.set(platformKey, finalSelection);
        return finalSelection;
    }
    deriveHardwareAcceleration(fingerprint) {
        if (fingerprint.device.type === 'mobile') {
            return fingerprint.device.deviceMemory ? fingerprint.device.deviceMemory >= 4 : false;
        }
        return true;
    }
    createTextRenderingProfile(fingerprint) {
        const browserFonts = {
            chrome: ['Segoe UI', 'Roboto', 'Noto Sans', 'Arial'],
            firefox: ['Segoe UI', 'Helvetica Neue', 'Calibri', 'Arial'],
            safari: ['SF Pro Text', 'Helvetica Neue', 'Arial', 'Georgia'],
            edge: ['Segoe UI', 'Calibri', 'Arial', 'Times New Roman'],
            opera: ['Segoe UI', 'Roboto', 'Arial', 'Tahoma']
        };
        const fonts = browserFonts[fingerprint.browser.name] ?? browserFonts.chrome;
        const baselines = ['alphabetic', 'top', 'middle', 'ideographic'];
        const aligns = ['left', 'center', 'right', 'start', 'end'];
        return {
            font: this.pick(fonts),
            textBaseline: this.pick(baselines),
            textAlign: this.pick(aligns),
            antialiasing: true
        };
    }
    createShapeRenderingProfile(fingerprint) {
        const joins = ['miter', 'round', 'bevel'];
        const caps = ['butt', 'round', 'square'];
        const baseKey = `${fingerprint.browser.name}|${fingerprint.device.platform.name}`;
        return {
            lineJoin: this.pick(joins),
            lineCap: this.pick(caps),
            miterLimit: this.deterministicNumber(baseKey, 5, 15)
        };
    }
    pickSampleRate(fingerprint) {
        const options = fingerprint.device.type === 'mobile'
            ? [44100, 48000]
            : [44100, 48000, 96000];
        const versionKey = fingerprint.browser.version || String(fingerprint.browser.majorVersion);
        const index = this.deterministicNumber(versionKey, 0, options.length - 1);
        const safeIndex = Math.max(0, Math.min(index, options.length - 1));
        return options[safeIndex];
    }
    getFontProfiles(platform) {
        const lower = platform.toLowerCase();
        if (lower.includes('mac')) {
            return {
                system: ['SF Pro Text', 'Helvetica Neue', 'Menlo', 'Monaco', 'Gill Sans'],
                web: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat']
            };
        }
        if (lower.includes('linux')) {
            return {
                system: ['Ubuntu', 'DejaVu Sans', 'Noto Sans', 'Liberation Sans', 'Cantarell'],
                web: ['Inter', 'Roboto', 'Noto Sans', 'Fira Sans', 'Source Sans Pro']
            };
        }
        if (lower.includes('android')) {
            return {
                system: ['Roboto', 'Noto Sans', 'Droid Sans', 'Droid Serif'],
                web: ['Montserrat', 'Poppins', 'Nunito', 'Lato', 'Oswald']
            };
        }
        if (lower.includes('ios') || lower.includes('iphone')) {
            return {
                system: ['SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Courier New'],
                web: ['Avenir Next', 'Open Sans', 'Roboto', 'Lato', 'Montserrat']
            };
        }
        return {
            system: ['Segoe UI', 'Calibri', 'Arial', 'Tahoma', 'Times New Roman'],
            web: ['Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Inter']
        };
    }
    sampleSubset(fonts, probability) {
        const selected = fonts.filter(font => this.seededRandom() < probability);
        if (selected.length === 0 && fonts.length > 0) {
            const fallback = fonts[0];
            if (fallback) {
                selected.push(fallback);
            }
        }
        return Array.from(new Set(selected));
    }
    seededRandom() {
        this.state = (this.state * 48271) % 2147483647;
        return this.state / 2147483647;
    }
    hash(namespace, value) {
        return (0, crypto_1.createHash)('sha256').update(`${namespace}:${value}`).digest('hex');
    }
    deterministicNumber(key, min, max) {
        if (max < min) {
            [min, max] = [max, min];
        }
        if (min === max)
            return min;
        const buffer = (0, crypto_1.createHash)('sha256').update(key).digest();
        const value = buffer.readUInt32BE(0);
        const range = max - min;
        return min + (value % (range + 1));
    }
    pick(list) {
        if (list.length === 0) {
            throw new Error('Attempted to pick from an empty list');
        }
        const index = Math.floor(this.seededRandom() * list.length);
        const safeIndex = Math.max(0, Math.min(index, list.length - 1));
        return list[safeIndex];
    }
    buildDefaultGpuProfiles() {
        return [
            {
                platform: 'windows',
                vendor: 'NVIDIA Corporation',
                renderer: 'NVIDIA GeForce RTX 3080/PCIe/SSE2',
                version: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
                shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
                memory: 10240,
                extensions: ['OES_texture_float', 'EXT_color_buffer_float', 'OES_element_index_uint']
            },
            {
                platform: 'windows:mobile',
                vendor: 'Qualcomm',
                renderer: 'Adreno (TM) 640',
                version: 'OpenGL ES 3.2 (Adreno)',
                shadingLanguageVersion: 'OpenGL ES GLSL ES 3.20',
                memory: 2048,
                extensions: ['OES_texture_half_float', 'EXT_color_buffer_half_float', 'OES_element_index_uint']
            },
            {
                platform: 'macos',
                vendor: 'Apple',
                renderer: 'Apple M2',
                version: 'WebGL 2.0 (Metal - 83)',
                shadingLanguageVersion: 'WebGL GLSL ES 3.00 (Metal - 83)',
                memory: 8192,
                extensions: ['OES_texture_float_linear', 'EXT_color_buffer_float', 'EXT_texture_filter_anisotropic']
            },
            {
                platform: 'linux',
                vendor: 'Intel Open Source Technology Center',
                renderer: 'Mesa Intel(R) UHD Graphics 620 (KBL GT2)',
                version: '3.0 Mesa 23.1.0',
                shadingLanguageVersion: '1.30',
                memory: 1024,
                extensions: ['EXT_color_buffer_float', 'OES_standard_derivatives', 'EXT_texture_filter_anisotropic']
            },
            {
                platform: 'android',
                vendor: 'ARM',
                renderer: 'Mali-G78',
                version: 'OpenGL ES 3.2 v1.r22p0-01rel0',
                shadingLanguageVersion: 'OpenGL ES GLSL ES 3.20',
                memory: 4096,
                extensions: ['OES_depth24', 'OES_texture_half_float', 'EXT_texture_rg']
            },
            {
                platform: 'ios',
                vendor: 'Apple',
                renderer: 'Apple GPU',
                version: 'OpenGL ES 3.2 Metal',
                shadingLanguageVersion: 'OpenGL ES GLSL ES 3.00 Metal',
                memory: 4096,
                extensions: ['OES_depth24', 'APPLE_texture_format_BGRA8888', 'EXT_blend_minmax']
            }
        ];
    }
    cacheKey(profile) {
        return `${profile.platform}|${profile.vendor}|${profile.renderer}`;
    }
    getFallbackGPUProfile() {
        return this.gpuProfiles[0] ?? {
            platform: 'windows',
            vendor: 'Generic GPU',
            renderer: 'Generic Renderer',
            version: 'WebGL 2.0',
            shadingLanguageVersion: 'WebGL GLSL ES 3.00',
            memory: 2048,
            extensions: []
        };
    }
}
exports.StatisticalCanvasFingerprintGenerator = StatisticalCanvasFingerprintGenerator;
//# sourceMappingURL=CanvasFingerprintGenerator.js.map