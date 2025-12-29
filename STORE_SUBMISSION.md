# Chrome Web Store Submission Guide

This guide will help you submit the Experimentation Local Interface extension to the Chrome Web Store.

## Prerequisites

1. **Google Developer Account**: Sign up at https://chrome.google.com/webstore/devconsole
   - One-time $5 registration fee
   - Takes 1-2 business days for approval

2. **Extension Package**: Create a ZIP file of the extension (see below)

3. **Store Assets**: Prepare screenshots, promotional images, and descriptions

## Step 1: Create Extension Icons

You need icons in three sizes: 16x16, 48x48, and 128x128 pixels.

### Option A: Create Icons Manually
1. Create an `icons/` folder in the extension directory
2. Design icons in your preferred tool (Figma, Photoshop, etc.)
3. Export as PNG files:
   - `icons/icon16.png` (16x16)
   - `icons/icon48.png` (48x48)
   - `icons/icon128.png` (128x128)

### Option B: Use Online Tools
- Use tools like https://www.favicon-generator.org/ or https://realfavicongenerator.net/
- Generate icons from a single high-resolution image
- Download and place in the `icons/` folder

### Icon Design Tips
- Use a simple, recognizable design
- Ensure icons are clear at small sizes (16x16)
- Use high contrast colors
- Test icons on different backgrounds

## Step 2: Prepare Store Listing Assets

### Required Assets

1. **Screenshots** (at least 1, recommended 3-5):
   - 1280x800 or 640x400 pixels
   - Show the extension popup, injection in action, etc.
   - PNG or JPEG format

2. **Small Promotional Tile** (440x280 pixels):
   - Used in featured sections
   - PNG or JPEG format

3. **Marquee Promotional Tile** (1400x560 pixels):
   - Optional, for featured placement
   - PNG or JPEG format

### Screenshot Ideas
- Extension popup showing project selection
- Before/after of a page with experiment injected
- Development workflow (editing code → seeing changes)
- Project structure in file explorer

## Step 3: Create Store Listing Content

### Store Listing Details

**Name**: Experimentation Local Interface (or shorter: "ELI - Web Experiments")

**Short Description** (132 characters max):
```
Local development tool for creating and testing web experiments with hot reloading
```

**Detailed Description** (up to 16,000 characters):
```
Experimentation Local Interface (ELI) is a powerful local development tool for web developers and experimenters. Create, test, and iterate on web experiments with instant hot reloading.

KEY FEATURES:
• Flexible project organization - store projects anywhere on your system
• Variant system - organize experiments with multiple variants (v1, v2, etc.)
• Hot reloading - see changes instantly when you save
• Import system - import HTML, SCSS, and JS files directly
• Auto-minification - automatically generate minified files
• Optional utils package - use @briannorman9/eli-utils for helpful utilities

HOW IT WORKS:
1. Install the extension and start the local development server
2. Configure your projects directory
3. Create experiment variants with JS, HTML, and SCSS files
4. Inject experiments into any web page for testing
5. Make changes and see them instantly with hot reloading

PERFECT FOR:
• A/B testing experiments
• Feature flag testing
• UI/UX experiments
• Rapid prototyping
• Development and debugging

PRIVACY:
ELI runs entirely locally. All data stays on your machine. No tracking, no analytics, no data collection.

REQUIREMENTS:
• Node.js (v12 or higher) for the development server
• Local development server running on http://localhost:8000

See the GitHub repository for full documentation and examples.
```

**Category**: Developer Tools

**Language**: English (and any others you support)

## Step 4: Package the Extension

### Create Package Script

Run the packaging script (see `package-extension.sh` or `package-extension.js`):

```bash
npm run package
```

Or manually:
1. Create a new folder (e.g., `eli-extension`)
2. Copy these files/folders:
   - `background.js`
   - `popup.html`
   - `popup.js`
   - `manifest.json`
   - `icons/` (folder with all icon files)
3. **DO NOT include**:
   - `node_modules/`
   - `bin/`
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - `README.md`
   - `.git/`
   - Any test files
4. Create a ZIP file of the folder

### Verify Package
- Unzip and test the extension locally
- Load it in Chrome as an unpacked extension
- Verify all functionality works

## Step 5: Submit to Chrome Web Store

1. **Go to Developer Dashboard**
   - Visit https://chrome.google.com/webstore/devconsole
   - Click "New Item"

2. **Upload Package**
   - Upload your ZIP file
   - Wait for validation (may take a few minutes)

3. **Fill Store Listing**
   - Go to the "Store Listing" tab in the dashboard
   - **Upload Screenshots**: 
     - Click "Add Screenshot" in the Screenshots section
     - Upload 1-5 screenshots (1280x800 or 640x400 pixels)
     - These appear on your extension's store page
   - **Add Promotional Images** (optional):
     - Small promotional tile (440x280) - for featured sections
     - Marquee promotional tile (1400x560) - for featured placement
   - Fill in description (use the template below)
   - Select category: Developer Tools
   - **Add Privacy Policy URL** (REQUIRED - see below):
     - Host PRIVACY_POLICY.md on GitHub Pages or your website
     - Enter the full URL in the "Privacy Policy" field

4. **Distribution**
   - Choose visibility: Public, Unlisted, or Private
   - Select regions (or worldwide)
   - Set pricing (Free)

5. **Submit for Review**
   - Review all information
   - Submit for review
   - Review typically takes 1-3 business days

## Step 6: Post-Submission

### After Approval
- Extension will be live in the Chrome Web Store
- Users can install directly from the store
- You'll receive email notifications for reviews and updates

### Updating the Extension
1. Update version in `manifest.json`
2. Create new package
3. Go to Developer Dashboard → Your Extension → Package
4. Upload new version
5. Submit for review

## Privacy Policy Requirement

**YES, a privacy policy is REQUIRED** for your extension because:

1. **Storage Permission**: Your extension uses the `storage` permission (Chrome Storage API)
2. **Host Permissions**: The `<all_urls>` permission requires disclosure
3. **Chrome Web Store Policy**: Even if data is stored locally, Google requires a privacy policy

### How to Host Your Privacy Policy

**Option 1: GitHub Pages (Recommended - Polished)**
1. The `docs/` folder contains a ready-to-use GitHub Pages site
2. Push to your repository and enable GitHub Pages:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch" → "main" → "/docs"
3. Your privacy policy will be at:
   - `https://[username].github.io/eli/privacy-policy.html`

**Option 2: GitHub Raw File (Simplest - For Open Source)**
- Since this is an open source extension, you can link directly to the file:
- `https://raw.githubusercontent.com/[username]/[repo]/main/PRIVACY_POLICY.md`
- Or the GitHub Pages version: `https://[username].github.io/eli/privacy-policy.html`

**Option 3: Your Website**
- Upload `PRIVACY_POLICY.md` to your website
- Make it accessible via a public URL
- Example: `https://yourwebsite.com/privacy-policy`

**Important**: The privacy policy must be:
- Publicly accessible (no login required)
- A direct link (not a redirect)
- Available before you submit for review

## Common Issues

### Rejection Reasons
- **Missing privacy policy**: REQUIRED for extensions with storage or host permissions
- **Privacy policy not accessible**: Must be publicly accessible URL
- **Vague description**: Be specific about what the extension does
- **Poor screenshots**: Use clear, high-quality images
- **Permission justification**: Ensure permissions are necessary

### Tips for Approval
- Be clear about the extension's purpose
- Provide detailed descriptions
- Use high-quality screenshots
- Ensure privacy policy is accessible
- Test thoroughly before submission

## Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program-policies/)

