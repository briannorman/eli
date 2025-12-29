# GitHub Pages Setup Guide

## Quick Answer

**Yes, you can link directly to the privacy policy in your repo!** Since this is an open source extension, you have multiple options:

1. **GitHub Raw File** (Simplest): `https://raw.githubusercontent.com/[username]/eli/main/PRIVACY_POLICY.md`
2. **GitHub Pages** (Polished): `https://[username].github.io/eli/privacy-policy.html`
3. **GitHub File View**: `https://github.com/[username]/eli/blob/main/PRIVACY_POLICY.md`

## What I've Created

I've set up a complete GitHub Pages site in the `docs/` folder with:
- `index.html` - Landing page
- `privacy-policy.html` - Styled privacy policy page
- Ready to deploy!

## Setup Options

### Option 1: Use GitHub Raw File (Easiest - 30 seconds)

Just use this URL in Chrome Web Store:
```
https://raw.githubusercontent.com/briannorman/eli/main/PRIVACY_POLICY.md
```

**Pros:**
- No setup needed
- Works immediately
- Chrome Web Store accepts it

**Cons:**
- Shows raw markdown (less polished)
- No navigation or styling

### Option 2: Deploy GitHub Pages (5 minutes - Recommended)

1. **Push the docs folder:**
   ```bash
   git add docs/
   git commit -m "Add GitHub Pages site"
   git push
   ```

2. **Enable GitHub Pages:**
   - Go to your repo on GitHub
   - Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "main" (or "master")
   - Folder: "/docs"
   - Click Save

3. **Wait 1-2 minutes** for deployment

4. **Use this URL in Chrome Web Store:**
   ```
   https://briannorman.github.io/eli/privacy-policy.html
   ```

**Pros:**
- Professional, styled page
- Includes navigation
- Better user experience

**Cons:**
- Takes a few minutes to set up

### Option 3: Use GitHub File View

Use this URL:
```
https://github.com/briannorman/eli/blob/main/PRIVACY_POLICY.md
```

**Pros:**
- Shows formatted markdown
- Includes GitHub navigation
- No setup needed

**Cons:**
- Shows GitHub UI around it
- Less professional for store listing

## Recommendation

For an open source extension, **Option 1 (GitHub Raw)** is perfectly fine and accepted by Chrome Web Store. It's the quickest and requires zero setup.

If you want a more polished look, go with **Option 2 (GitHub Pages)** - I've already created the HTML files for you!

## Testing Your URL

Before submitting to Chrome Web Store, verify:
1. URL is publicly accessible (no login required)
2. URL loads in an incognito/private window
3. Content is readable and complete

## Chrome Web Store Submission

When filling out the store listing:
- **Privacy Policy URL field**: Enter whichever URL you choose above
- The URL must be accessible before you submit
- Chrome Web Store will verify it during review

