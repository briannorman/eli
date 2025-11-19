# Experimentation Local Interface

A local development interface for creating and testing web experiments. This tool allows you to organize experiments in separate project folders and inject them into any web page via a Chrome extension.

## Features

- 📁 **Project-based organization**: Each experiment lives in its own folder under `projects/`
- 🎨 **Variant system**: Organize experiments with variant folders (v1, v2, etc.) containing JS, HTML, and SCSS files
- 📦 **Import system**: Import HTML, SCSS, and JS files directly in your code
- 🔄 **Hot reloading**: Changes to your scripts are reflected immediately when you reload the page
- 🎯 **Easy injection**: Select a project and variant from the extension popup and inject it into any page
- ⚡ **Auto-inject**: Optionally auto-inject your selected variant on every page load
- 👥 **Team-friendly**: Simple setup that works for everyone on your team

## Setup

### 1. Install Dependencies

This project requires Node.js (v12 or higher). Install dependencies with:

```bash
npm install
```

This will install the `sass` package for SCSS compilation.

### 2. Start the Development Server

You can start the server in several ways:

**Option A: Install globally and use the `eli` command**
```bash
npm install -g .
eli
```

**Option B: Use npx (no installation needed)**
```bash
npx eli
```

**Option C: Use npm scripts**
```bash
npm start
```

**Option D: Run directly**
```bash
node bin/eli
```

The server will start on `http://localhost:8000` and serve your project scripts.

### 3. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `eli` folder (the folder containing this README)
5. The extension icon should appear in your toolbar

### 4. Create Your First Project

1. Create a new folder in the `projects/` directory:
   ```bash
   mkdir projects/my-experiment
   ```

2. Create variant folders (e.g., `v1`, `v2`) inside your project:
   ```bash
   mkdir projects/my-experiment/v1
   mkdir projects/my-experiment/v2
   ```

3. Create a JavaScript file in each variant folder:
   ```bash
   touch projects/my-experiment/v1/v1.js
   touch projects/my-experiment/v2/v2.js
   ```

4. Optionally add HTML and SCSS files to your variants:
   ```bash
   touch projects/my-experiment/v1/v1.html
   touch projects/my-experiment/v1/v1.scss
   ```

5. Add your experiment code to the JS file:
   ```javascript
   import v1Html from './v1.html';
   import v1Scss from './v1.scss';
   
   document.body.insertAdjacentHTML('afterbegin', v1Html);
   console.log('My experiment is running!');
   ```

   **Note:** Config files are not required. Projects work with variant folders containing JS files. HTML and SCSS files are optional and can be imported as needed.

## Usage

### Injecting a Script

1. Navigate to any web page where you want to test your experiment
2. Click the extension icon in your Chrome toolbar
3. Select your project from the "Select Project" dropdown
4. Select a variant from the "Select Variant" dropdown (e.g., v1, v2)
5. Click "Inject Script"
6. Your script will be injected into the current page

### Hot Reloading

1. Make changes to your variant files (JS, HTML, or SCSS)
2. In the extension popup, click "Reload Current Page" (or just refresh the page manually)
3. The updated script will be injected automatically (if auto-inject is enabled) or you can click "Inject Script" again

### Auto-Inject

Enable the "Auto-inject on page load" checkbox in the extension popup to automatically inject your selected variant whenever you navigate to a new page or reload. This is great for active development!

## Import System

ELI supports importing HTML, SCSS, and JavaScript files directly in your variant JS files.

### HTML Imports

Import HTML files and use them as strings:

```javascript
import myHtml from './my.html';

document.body.insertAdjacentHTML('afterbegin', myHtml);
```

The HTML content is automatically inlined as a template literal.

### SCSS Imports

Import SCSS files - they're automatically compiled to CSS and injected into the page:

```javascript
import myStyles from './my.scss';
// CSS is automatically injected - no need to do anything else!
```

The SCSS is compiled to CSS and added as a `<style>` tag in the document head.

### JavaScript Imports

Import JavaScript files from your project:

```javascript
import shared from '../shared.js';

// If shared.js doesn't export, it becomes a callable function
shared(); // Executes the code in shared.js

// If shared.js exports a value:
// export default '<div>Hello</div>';
// Then shared will contain that value
```

**Path resolution:**
- `./file.js` - Same directory
- `../file.js` - Parent directory
- `../../file.js` - Grandparent directory

**Export support:**
- If a JS file has `export default value;`, the imported variable will contain that value
- If a JS file has no export, it becomes a callable function that executes the code when called

## Project Structure

```
eli/
├── projects/
│   ├── example-project-one/
│   │   ├── v1/
│   │   │   ├── v1.js
│   │   │   ├── v1.html
│   │   │   └── v1.scss
│   │   ├── v2/
│   │   │   ├── v2.js
│   │   │   ├── v2.html
│   │   │   └── v2.scss
│   │   └── shared.js
│   └── my-experiment/
│       ├── v1/
│       │   └── v1.js
│       └── v2/
│           └── v2.js
├── background.js          # Extension background service worker
├── popup.html            # Extension popup UI
├── popup.js              # Extension popup logic
├── manifest.json         # Chrome extension manifest
├── server.js             # Local development server
├── bin/
│   └── eli               # CLI command script
├── package.json          # Node.js project file
└── README.md            # This file
```

**Project Structure:**
- Each project folder contains **variant folders** (e.g., `v1/`, `v2/`)
- Each variant folder must contain at least one `.js` file
- HTML (`.html`) and SCSS (`.scss`) files are optional
- You can have a `shared.js` file at the project root level to share code between variants
- No config files are required

## API Endpoints

The development server exposes the following endpoints:

- `GET /api/projects` - Returns a list of all available projects with their variants
- `GET /api/project/:projectName/variants` - Returns a list of all variants in a project
- `GET /api/project/:projectName/:variantName/script.js` - Returns the processed JS file from a variant (with imports processed and cache busting)
- `GET /api/project/:projectName/config` - Returns project configuration (defaults)

## Tips

- **Multiple projects**: Create as many project folders as you need
- **Multiple variants**: Each project can have multiple variant folders (v1, v2, test, production, etc.)
- **Shared code**: Use a `shared.js` file at the project root to share code between variants
- **Import organization**: Import HTML, SCSS, and JS files to keep your code organized
- **SCSS compilation**: SCSS files are automatically compiled to CSS and injected
- **Cache busting**: The server automatically adds cache-busting parameters to ensure you always get the latest version
- **Team collaboration**: Share the project folder via git. Each team member runs their own local server
- **Debugging**: Use Chrome DevTools console to see logs and debug your experiments

## Troubleshooting

**Extension shows "Could not connect to server"**
- Make sure the development server is running (`npm start`)
- Check that the server is running on port 8000

**Script doesn't update after changes**
- Make sure you're reloading the page after making changes
- Check that your JS file is saved
- Try clicking "Refresh Projects" in the extension popup

**Script doesn't inject**
- Make sure you've selected both a project and a variant from the dropdowns
- Check the browser console for any errors
- Verify that your variant folder contains a `.js` file
- Make sure the development server is running
- Check the server console for import processing errors

**Import errors**
- Verify that imported file paths are correct (relative to the importing file)
- Check that HTML/SCSS/JS files exist at the specified paths
- For SCSS imports, ensure the `sass` package is installed (`npm install`)
- Check the server console for detailed error messages about failed imports

## License

MIT

