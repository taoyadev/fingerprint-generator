/**
 * Tests for Fingerprint Generator
 */

const FingerprintGenerator = require('../src/FingerprintGenerator');

// Mock browser environment
global.window = {
  navigator: {
    userAgent: 'Test User Agent',
    language: 'en-US',
    languages: ['en-US', 'en'],
    cookieEnabled: true,
    plugins: [
      {
        name: 'Test Plugin',
        description: 'A test plugin',
        filename: 'test.so',
        version: '1.0'
      }
    ]
  },
  screen: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24,
    availWidth: 1920,
    availHeight: 1050
  }
};

global.document = {
  cookie: 'test=value',
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        getContext: (type) => {
          if (type === '2d') {
            return {
              textBaseline: 'top',
              font: '',
              fillText: () => {},
              measureText: () => ({ width: 100 }),
              fillRect: () => {},
              toDataURL: () => 'data:image/png;base64,testdata'
            };
          }
          return null;
        },
        width: 200,
        height: 50
      };
    }
    return {};
  }
};

global.Intl = {
  DateTimeFormat: () => ({
    resolvedOptions: () => ({
      timeZone: 'America/New_York'
    })
  })
};

global.AudioContext = class {
  constructor() {
    this.sampleRate = 44100;
  }
  createOscillator() {
    return {
      type: 'triangle',
      frequency: {
        setValueAtTime: () => {}
      },
      start: () => {},
      stop: () => {},
      connect: () => {}
    };
  }
  createAnalyser() {
    return {
      frequencyBinCount: 2048,
      getByteTimeDomainData: (array) => {
        array.fill(128);
      },
      connect: () => {}
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {}
      },
      connect: () => {}
    };
  }
  close() {}
};

// Simple test framework
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test cases
async function runTests() {
  console.log('🧪 Running Fingerprint Generator Tests\n');

  test('FingerprintGenerator should initialize with default options', () => {
    const generator = new FingerprintGenerator();
    assert(generator.options.includeCanvas === true);
    assert(generator.options.includeWebGL === true);
    assert(generator.options.includeAudio === false);
  });

  test('FingerprintGenerator should accept custom options', () => {
    const generator = new FingerprintGenerator({
      includeCanvas: false,
      includeAudio: true
    });
    assert(generator.options.includeCanvas === false);
    assert(generator.options.includeAudio === true);
  });

  test('Should generate fingerprint with basic info', async () => {
    const generator = new FingerprintGenerator({
      includeCanvas: false,
      includeWebGL: false,
      includeAudio: false,
      includeFonts: false
    });

    const fingerprint = await generator.generate();

    assert(fingerprint.timestamp !== undefined);
    assert(fingerprint.userAgent === 'Test User Agent');
    assert(fingerprint.screen !== null);
    assert(fingerprint.screen.width === 1920);
    assert(fingerprint.screen.height === 1080);
    assert(fingerprint.timezone !== null);
    assert(fingerprint.language !== null);
    assert(fingerprint.plugins !== null);
    assert(fingerprint.hash !== undefined);
  });

  test('Should generate canvas fingerprint when enabled', async () => {
    const generator = new FingerprintGenerator({
      includeWebGL: false,
      includeAudio: false,
      includeFonts: false
    });

    const fingerprint = await generator.generate();

    assert(fingerprint.canvas !== null);
    assert(fingerprint.canvas.dataURL !== undefined);
    assert(fingerprint.canvas.hash !== undefined);
  });

  test('Should export fingerprint as JSON', async () => {
    const generator = new FingerprintGenerator({
      includeCanvas: false,
      includeWebGL: false,
      includeAudio: false,
      includeFonts: false
    });

    const fingerprint = await generator.generate();
    const json = generator.export(fingerprint, 'json');

    const parsed = JSON.parse(json);
    assert(parsed.userAgent === 'Test User Agent');
    assert(parsed.hash === fingerprint.hash);
  });

  test('Should export fingerprint as CSV', async () => {
    const generator = new FingerprintGenerator({
      includeCanvas: false,
      includeWebGL: false,
      includeAudio: false,
      includeFonts: false
    });

    const fingerprint = await generator.generate();
    const csv = generator.export(fingerprint, 'csv');

    assert(csv.includes('timestamp'));
    assert(csv.includes('userAgent'));
    assert(csv.includes('Test User Agent'));
  });

  test('Should export fingerprint as XML', async () => {
    const generator = new FingerprintGenerator({
      includeCanvas: false,
      includeWebGL: false,
      includeAudio: false,
      includeFonts: false
    });

    const fingerprint = await generator.generate();
    const xml = generator.export(fingerprint, 'xml');

    assert(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert(xml.includes('<fingerprint>'));
    assert(xml.includes('<userAgent>Test User Agent</userAgent>'));
  });

  test('Should handle invalid export format', async () => {
    const generator = new FingerprintGenerator();
    const fingerprint = await generator.generate();

    try {
      generator.export(fingerprint, 'invalid');
      assert(false, 'Should have thrown error for invalid format');
    } catch (error) {
      assert(error.message.includes('Unsupported format'));
    }
  });

  test('Hash function should be deterministic', () => {
    const generator = new FingerprintGenerator();
    const input = 'test input';
    const hash1 = generator.simpleHash(input);
    const hash2 = generator.simpleHash(input);

    assert(hash1 === hash2);
    assert(hash1.length > 0);
  });

  test('Should detect fonts correctly', async () => {
    const generator = new FingerprintGenerator({
      includeCanvas: false,
      includeWebGL: false,
      includeAudio: false
    });

    const fingerprint = await generator.generate();

    if (fingerprint.fonts) {
      assert(fingerprint.fonts.detected !== undefined);
      assert(fingerprint.fonts.total !== undefined);
      assert(Array.isArray(fingerprint.fonts.detected));
    }
  });

  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };