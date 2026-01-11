#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Version management script for Brio
 * Handles semantic versioning across VERSION file and package.json
 */

const VERSION_FILE = path.join(__dirname, '..', 'VERSION');
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');

function getCurrentVersion() {
  try {
    return fs.readFileSync(VERSION_FILE, 'utf8').trim();
  } catch (error) {
    console.error('Error reading VERSION file:', error.message);
    process.exit(1);
  }
}

function updateVersionFile(newVersion) {
  try {
    fs.writeFileSync(VERSION_FILE, newVersion + '\n');
    console.log(`✅ Updated VERSION file to ${newVersion}`);
  } catch (error) {
    console.error('Error updating VERSION file:', error.message);
    process.exit(1);
  }
}

function updatePackageJson(newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json version to ${newVersion}`);
  } catch (error) {
    console.error('Error updating package.json:', error.message);
    process.exit(1);
  }
}

function bumpVersion(currentVersion, type) {
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-(\w+))?$/;
  const match = currentVersion.match(versionRegex);

  if (!match) {
    console.error('Invalid version format. Expected: major.minor.patch[-suffix]');
    process.exit(1);
  }

  let [, major, minor, patch, suffix] = match;
  major = parseInt(major);
  minor = parseInt(minor);
  patch = parseInt(patch);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      console.error('Invalid bump type. Use: major, minor, or patch');
      process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`Current version: ${getCurrentVersion()}`);
    console.log('Usage: node scripts/version.js <command>');
    console.log('Commands:');
    console.log('  current        - Show current version');
    console.log('  bump <type>    - Bump version (major|minor|patch)');
    console.log('  set <version>  - Set specific version');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'current':
      console.log(getCurrentVersion());
      break;

    case 'bump': {
      if (args.length < 2) {
        console.error('Usage: node scripts/version.js bump <type>');
        process.exit(1);
      }
      const bumpType = args[1];
      const currentVersion = getCurrentVersion();
      const bumpedVersion = bumpVersion(currentVersion, bumpType);
      updateVersionFile(bumpedVersion);
      updatePackageJson(bumpedVersion);
      console.log(`🚀 Version bumped from ${currentVersion} to ${bumpedVersion}`);
      break;
    }

    case 'set': {
      if (args.length < 2) {
        console.error('Usage: node scripts/version.js set <version>');
        process.exit(1);
      }
      const setVersion = args[1];
      updateVersionFile(setVersion);
      updatePackageJson(setVersion);
      console.log(`✅ Version set to ${setVersion}`);
      break;
    }

    default:
      console.error('Unknown command. Use: current, bump, or set');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}