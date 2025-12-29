# Privacy Policy FAQ

## Is a Privacy Policy Required?

**YES** - A privacy policy is **mandatory** for your extension because:

1. ✅ Your extension uses the `storage` permission (Chrome Storage API)
2. ✅ Your extension uses `host_permissions` with `<all_urls>`
3. ✅ Chrome Web Store requires a privacy policy for any extension that:
   - Uses storage APIs
   - Accesses user data
   - Has host permissions

**Even if your extension only stores data locally**, Google still requires a privacy policy that explains:
- What data is collected/stored
- How it's used
- Who has access to it

## Where Do I Upload Screenshots?

Screenshots are uploaded **directly in the Chrome Web Store Developer Dashboard**:

1. Go to https://chrome.google.com/webstore/devconsole
2. Create or edit your extension listing
3. Click on the **"Store Listing"** tab
4. Scroll to the **"Screenshots"** section
5. Click **"Add Screenshot"** button
6. Upload your images (1-5 screenshots allowed)

**Screenshot Requirements:**
- Dimensions: 1280x800 or 640x400 pixels
- Format: PNG or JPEG
- Minimum: 1 screenshot (recommended: 3-5)
- Content: Should clearly show your extension's features

## Where Do I Add the Privacy Policy URL?

The privacy policy URL is added in the **"Store Listing"** tab:

1. Go to your extension in Developer Dashboard
2. Click **"Store Listing"** tab
3. Scroll to **"Privacy Practices"** section
4. Enter your privacy policy URL in the **"Privacy Policy"** field

**Important**: The URL must be:
- Publicly accessible (no login required)
- A direct link (not a redirect)
- Available before submission

## How to Host Privacy Policy (Free Options)

### Option 1: GitHub Pages (Easiest)
1. Create a GitHub repository (or use existing)
2. Add `PRIVACY_POLICY.md` to the repo
3. Go to Settings → Pages
4. Enable GitHub Pages
5. Your URL will be: `https://[username].github.io/[repo]/PRIVACY_POLICY.md`

### Option 2: GitHub Raw File
- Use: `https://raw.githubusercontent.com/[username]/[repo]/main/PRIVACY_POLICY.md`
- No setup needed, but less polished

### Option 3: Your Website
- Upload to your existing website
- Make it accessible at a public URL

## What Happens If I Don't Provide a Privacy Policy?

Your extension will be **rejected** during review if:
- No privacy policy URL is provided
- The privacy policy URL is not accessible
- The privacy policy doesn't adequately describe data practices

## Quick Checklist

Before submitting:
- [ ] Privacy policy is written (`PRIVACY_POLICY.md`)
- [ ] Privacy policy is hosted online (publicly accessible)
- [ ] Privacy policy URL is added in Developer Dashboard
- [ ] Screenshots are prepared (1-5 images)
- [ ] Screenshots are uploaded in "Store Listing" tab

