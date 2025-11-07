/**
 * Jest test setup file
 */

// Mock browser environment for Node.js tests
Object.defineProperty(global, 'window', {
  value: {
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
      ],
      hardwareConcurrency: 4,
      deviceMemory: 8,
      platform: 'TestPlatform',
      vendor: 'TestVendor',
      mimeTypes: []
    },
    screen: {
      width: 1920,
      height: 1080,
      colorDepth: 24,
      pixelDepth: 24,
      availWidth: 1920,
      availHeight: 1050
    },
    devicePixelRatio: 1,
    document: {
      createElement: jest.fn(() => ({
        getContext: jest.fn(),
        width: 200,
        height: 50,
        toDataURL: jest.fn(() => 'data:image/png;base64,test')
      })),
      cookie: 'test=value'
    }
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(() => ({
      getContext: jest.fn(),
      width: 200,
      height: 50,
      toDataURL: jest.fn(() => 'data:image/png;base64,test')
    })),
    cookie: 'test=value'
  },
  writable: true
});

Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: jest.fn(() => ({
      resolvedOptions: () => ({
        timeZone: 'America/New_York'
      })
    }))
  },
  writable: true
});

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set up test timeout
jest.setTimeout(10000);