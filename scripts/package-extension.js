#!/usr/bin/env node

/**
 * Package extension for Chrome Web Store submission
 * Creates a clean ZIP file with only the necessary files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_NAME = 'eli-extension';
const VERSION = require('../package.json').version || '1.0.0';
const PACKAGE_NAME = `eli-extension-v${VERSION}.zip`;
const TEMP_DIR = path.join(__dirname, '..', '.package-temp');

// Files to include in the package
const FILES_TO_INCLUDE = [
  'manifest.json',
  'background.js',
  'popup.html',
  'popup.js'
];

// Directories to include
const DIRS_TO_INCLUDE = [
  'icons'
];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  'bin',
  'server.js',
  'package.json',
  'package-lock.json',
  'README.md',
  'PRIVACY_POLICY.md',
  'STORE_SUBMISSION.md',
  '.git',
  '.package-temp',
  'scripts',
  '.DS_Store'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  ensureDir(destDir);
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
  return true;
}

function shouldExclude(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return EXCLUDE_PATTERNS.some(pattern => 
    relativePath.includes(pattern) || path.basename(filePath) === pattern
  );
}

function createPackage() {
  console.log('📦 Packaging extension for Chrome Web Store...\n');
  
  const projectRoot = path.join(__dirname, '..');
  const packageDir = path.join(TEMP_DIR, EXTENSION_NAME);
  
  // Clean up any existing temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  ensureDir(packageDir);
  
  // Copy required files
  console.log('Copying extension files...');
  for (const file of FILES_TO_INCLUDE) {
    const src = path.join(projectRoot, file);
    if (fs.existsSync(src)) {
      const dest = path.join(packageDir, file);
      copyFile(src, dest);
      console.log(`  ✓ ${file}`);
    } else {
      console.warn(`  ⚠  ${file} not found`);
    }
  }
  
  // Copy required directories
  console.log('\nCopying directories...');
  for (const dir of DIRS_TO_INCLUDE) {
    const src = path.join(projectRoot, dir);
    if (fs.existsSync(src)) {
      const dest = path.join(packageDir, dir);
      if (copyDir(src, dest)) {
        console.log(`  ✓ ${dir}/`);
      }
    } else {
      console.warn(`  ⚠  ${dir}/ not found`);
      if (dir === 'icons') {
        console.warn('     You need to create icons before submitting to the store.');
        console.warn('     Required: icons/icon16.png, icons/icon48.png, icons/icon128.png');
      }
    }
  }
  
  // Create ZIP file
  console.log('\nCreating ZIP file...');
  const zipPath = path.join(projectRoot, PACKAGE_NAME);
  
  try {
    // Use zip command if available (Unix/Mac)
    if (process.platform !== 'win32') {
      execSync(`cd "${TEMP_DIR}" && zip -r "${zipPath}" "${EXTENSION_NAME}" > /dev/null 2>&1`, {
        stdio: 'inherit'
      });
    } else {
      // Windows: try PowerShell Compress-Archive
      try {
        execSync(`powershell -Command "Compress-Archive -Path '${packageDir}\\*' -DestinationPath '${zipPath}' -Force"`, {
          stdio: 'inherit'
        });
      } catch (e) {
        console.error('Error: Could not create ZIP file. Please install a ZIP utility or create the ZIP manually.');
        console.error('Package directory:', packageDir);
        process.exit(1);
      }
    }
    
    console.log(`  ✓ ${PACKAGE_NAME}`);
  } catch (error) {
    console.error('Error creating ZIP file:', error.message);
    console.log('\nPackage directory created at:', packageDir);
    console.log('Please create the ZIP file manually.');
    process.exit(1);
  }
  
  // Cleanup
  console.log('\nCleaning up...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  
  console.log(`\n✅ Package created: ${PACKAGE_NAME}`);
  console.log('\nNext steps:');
  console.log('1. Verify the package by unzipping and testing locally');
  console.log('2. Upload to Chrome Web Store Developer Dashboard');
  console.log('3. Complete store listing with screenshots and description');
  console.log('\nSee STORE_SUBMISSION.md for detailed instructions.');
}

// Run
createPackage();

