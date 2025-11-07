#!/usr/bin/env node

/**
 * Command Line Interface for Fingerprint Generator
 */

const FingerprintGenerator = require('../src/FingerprintGenerator');
const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log(`
Fingerprint Generator CLI

Usage:
  node cli.js [options]

Options:
  --output, -o <file>     Output file path
  --format, -f <format>   Output format (json|csv|xml) [default: json]
  --no-canvas             Disable canvas fingerprinting
  --no-webgl              Disable WebGL fingerprinting
  --no-fonts              Disable font detection
  --audio                 Enable audio fingerprinting
  --help, -h              Show this help message

Examples:
  node cli.js                                    # Output to console
  node cli.js -o fingerprint.json               # Save to file
  node cli.js -f csv -o fingerprint.csv         # Export as CSV
  node cli.js --no-canvas --audio               # Customize fingerprint collection
  `);
}

function parseArgs(args) {
  const options = {
    output: null,
    format: 'json',
    includeCanvas: true,
    includeWebGL: true,
    includeFonts: true,
    includeAudio: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;

      case '--output':
      case '-o':
        options.output = args[++i];
        break;

      case '--format':
      case '-f':
        options.format = args[++i];
        break;

      case '--no-canvas':
        options.includeCanvas = false;
        break;

      case '--no-webgl':
        options.includeWebGL = false;
        break;

      case '--no-fonts':
        options.includeFonts = false;
        break;

      case '--audio':
        options.includeAudio = true;
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          printUsage();
          process.exit(1);
        }
    }
  }

  return options;
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));

    console.log('🔍 Generating browser fingerprint...');
    console.log('⚠️  Note: Some fingerprinting features require browser environment');

    const generator = new FingerprintGenerator(options);
    const fingerprint = await generator.generate();

    console.log('\n📋 Fingerprint Summary:');
    console.log(`   User Agent: ${fingerprint.userAgent}`);
    console.log(`   Screen: ${fingerprint.screen ? `${fingerprint.screen.width}x${fingerprint.screen.height}` : 'N/A'}`);
    console.log(`   Language: ${fingerprint.language ? fingerprint.language.language : 'N/A'}`);
    console.log(`   Plugins: ${fingerprint.plugins ? fingerprint.plugins.length : 0} detected`);
    console.log(`   Canvas: ${fingerprint.canvas ? '✓' : '✗'}`);
    console.log(`   WebGL: ${fingerprint.webgl ? '✓' : '✗'}`);
    console.log(`   Audio: ${fingerprint.audio ? '✓' : '✗'}`);
    console.log(`   Fonts: ${fingerprint.fonts ? `${fingerprint.fonts.detected.length} detected` : 'N/A'}`);
    console.log(`   Fingerprint Hash: ${fingerprint.hash}`);

    const output = generator.export(fingerprint, options.format);

    if (options.output) {
      fs.writeFileSync(options.output, output);
      console.log(`\n✅ Fingerprint saved to: ${path.resolve(options.output)}`);
    } else {
      console.log('\n📄 Full Fingerprint:');
      console.log(output);
    }

    console.log('\n⚠️  Security Notice:');
    console.log('   This tool is for educational and security research purposes only.');
    console.log('   Do not use for malicious tracking or surveillance.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs };