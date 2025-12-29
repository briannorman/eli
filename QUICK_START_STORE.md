# Quick Start: Chrome Web Store Submission

## ✅ Checklist Before Submission

- [ ] Create extension icons (16x16, 48x48, 128x128) in `icons/` folder
- [ ] Update author name in `manifest.json` if needed
- [ ] Host privacy policy online (GitHub Pages, your website, etc.)
- [ ] Take screenshots of the extension (1280x800 or 640x400)
- [ ] Create promotional images (optional but recommended)
- [ ] Test the packaged extension locally

## 🚀 Quick Steps

### 1. Create Icons
Place three PNG files in the `icons/` folder:
- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48)  
- `icons/icon128.png` (128x128)

See `icons/README.md` for design guidelines.

### 2. Package Extension
```bash
npm run package
```

This creates `eli-extension-v1.0.0.zip` in the project root.

### 3. Test Package
1. Unzip the package
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the unzipped folder
6. Verify everything works

### 4. Prepare Store Listing

**Privacy Policy URL** (REQUIRED):
- **Option 1 (Recommended)**: Use GitHub Pages - `docs/` folder is ready to deploy
  - Enable in repo Settings → Pages → Deploy from `/docs` folder
  - URL: `https://[username].github.io/eli/privacy-policy.html`
- **Option 2 (Simplest)**: Link directly to repo file (open source)
  - URL: `https://raw.githubusercontent.com/[username]/eli/main/PRIVACY_POLICY.md`
- Must be publicly accessible before submission
- Required because extension uses `storage` and `host_permissions`

**Screenshots** (at least 1, recommended 3-5):
- Upload in "Store Listing" tab → Screenshots section
- 1280x800 or 640x400 pixels
- Show extension popup
- Show experiment injection in action
- Show development workflow

**Description**: See `STORE_SUBMISSION.md` for a ready-to-use description

### 5. Submit to Chrome Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 registration fee (one-time)
3. Click "New Item"
4. Upload `eli-extension-v1.0.0.zip`
5. Fill in store listing details
6. Add privacy policy URL
7. Submit for review

## 📋 Required Information

- **Name**: Experimentation Local Interface
- **Category**: Developer Tools
- **Short Description**: "Local development tool for creating and testing web experiments with hot reloading"
- **Privacy Policy**: URL to hosted privacy policy
- **Screenshots**: At least 1 (1280x800 or 640x400)

## 🔗 Resources

- Full guide: `STORE_SUBMISSION.md`
- Privacy policy: `PRIVACY_POLICY.md`
- Icon guidelines: `icons/README.md`

## ⚠️ Important Notes

- Review typically takes 1-3 business days
- Ensure all permissions are justified
- Privacy policy is required for extensions with certain permissions
- Test thoroughly before submission

