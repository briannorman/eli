# GitHub Pages Setup for ELI

This directory contains the GitHub Pages site for the Experimentation Local Interface extension.

## Files

- `index.html` - Main landing page
- `privacy-policy.html` - Privacy policy page (required for Chrome Web Store)

## Setting Up GitHub Pages

1. **Push this directory to your GitHub repository**
   ```bash
   git add docs/
   git commit -m "Add GitHub Pages site"
   git push
   ```

2. **Enable GitHub Pages in repository settings:**
   - Go to your repository on GitHub
   - Click "Settings"
   - Scroll to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Select "main" (or "master") branch
   - Select "/docs" folder
   - Click "Save"

3. **Your site will be available at:**
   - `https://[your-username].github.io/eli/privacy-policy.html`
   - Replace `[your-username]` with your GitHub username

## Privacy Policy URLs

You can use either of these URLs in the Chrome Web Store:

**Option 1: GitHub Pages (Recommended)**
```
https://[your-username].github.io/eli/privacy-policy.html
```

**Option 2: GitHub Raw File (Simpler, but less polished)**
```
https://raw.githubusercontent.com/briannorman/eli/main/PRIVACY_POLICY.md
```

**Option 3: Direct Markdown File (If repo is public)**
```
https://github.com/briannorman/eli/blob/main/PRIVACY_POLICY.md
```

## Customization

- Update the GitHub username in the HTML files
- Customize colors and styling in the `<style>` sections
- Add more pages as needed

