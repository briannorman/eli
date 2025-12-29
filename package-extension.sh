#!/bin/bash

# Package extension for Chrome Web Store submission
# This script creates a clean ZIP file with only the necessary files

set -e

EXTENSION_NAME="eli-extension"
PACKAGE_NAME="eli-extension-v1.0.0.zip"
TEMP_DIR=$(mktemp -d)

echo "📦 Packaging extension for Chrome Web Store..."

# Create temporary directory structure
mkdir -p "$TEMP_DIR/$EXTENSION_NAME"

# Copy required files
echo "Copying extension files..."
cp manifest.json "$TEMP_DIR/$EXTENSION_NAME/"
cp background.js "$TEMP_DIR/$EXTENSION_NAME/"
cp popup.html "$TEMP_DIR/$EXTENSION_NAME/"
cp popup.js "$TEMP_DIR/$EXTENSION_NAME/"

# Copy icons if they exist
if [ -d "icons" ]; then
    echo "Copying icons..."
    cp -r icons "$TEMP_DIR/$EXTENSION_NAME/"
else
    echo "⚠️  Warning: icons/ directory not found!"
    echo "   You need to create icons before submitting to the store."
    echo "   Required: icons/icon16.png, icons/icon48.png, icons/icon128.png"
fi

# Create ZIP file
cd "$TEMP_DIR"
echo "Creating ZIP file..."
zip -r "$PACKAGE_NAME" "$EXTENSION_NAME" > /dev/null

# Move to original directory
mv "$PACKAGE_NAME" "$OLDPWD/"

# Cleanup
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

echo "✅ Package created: $PACKAGE_NAME"
echo ""
echo "Next steps:"
echo "1. Verify the package by unzipping and testing locally"
echo "2. Upload to Chrome Web Store Developer Dashboard"
echo "3. Complete store listing with screenshots and description"

