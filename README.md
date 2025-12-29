# Experimentation Local Interface

A local development interface for creating and testing web experiments. This tool allows you to organize experiments in separate project folders and inject them into any web page via a Chrome extension.

## Features

- 📁 **Flexible project organization**: Configure your projects directory anywhere on your system - no longer tied to the extension folder
- 🎨 **Variant system**: Organize experiments with variant folders (v1, v2, etc.) containing JS, HTML, and SCSS files
- 📦 **Import system**: Import HTML, SCSS, and JS files directly in your code
- 🔄 **Hot reloading**: Changes to your scripts are reflected immediately when you reload the page
- 🎯 **Easy injection**: Select a project and variant from the extension popup and inject it into any page
- ⚡ **Auto-inject**: Optionally auto-inject your selected variant on every page load
- 🗜️ **Auto-minification**: Minified files are automatically generated whenever you save your code
- 🛠️ **Built-in utils**: Optimizely-style utility functions available via `@eli/utils`
- 👥 **Team-friendly**: Simple setup that works for everyone on your team

## Setup

### 1. Install Dependencies

This project requires Node.js (v12 or higher). Install dependencies with:

```bash
npm install
```

This will install the required packages:
- `sass` - For SCSS compilation
- `terser` - For JavaScript minification
- `chokidar` - For file watching and auto-minification

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

### 4. Configure Projects Directory

The extension is decoupled from the projects folder. You can store your projects anywhere on your system.

**Option A: Set via Extension UI (Recommended)**
1. Click the extension icon in your Chrome toolbar
2. In the "Projects Directory" field at the top, enter the full path to your projects folder (e.g., `/Users/username/my-experiments` or `C:\Users\username\my-experiments`)
3. Click "Set"
4. The extension will validate the directory and load projects from that location

**Option B: Set via Environment Variable**
```bash
PROJECTS_DIR=/path/to/your/projects node bin/eli
```

**Note:** If no directory is configured, the server defaults to `./projects` (relative to where the server is run) for backward compatibility.

### 5. Create Your First Project

1. Create a new folder in your configured projects directory:
   ```bash
   mkdir /path/to/your/projects/my-experiment
   ```

2. Create variant folders (e.g., `v1`, `v2`) inside your project:
   ```bash
   mkdir /path/to/your/projects/my-experiment/v1
   mkdir /path/to/your/projects/my-experiment/v2
   ```

3. Create a JavaScript file in each variant folder:
   ```bash
   touch /path/to/your/projects/my-experiment/v1/v1.js
   touch /path/to/your/projects/my-experiment/v2/v2.js
   ```

4. Optionally add HTML and SCSS files to your variants:
   ```bash
   touch /path/to/your/projects/my-experiment/v1/v1.html
   touch /path/to/your/projects/my-experiment/v1/v1.scss
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
   - **Note:** Changing the variant will automatically refresh the page
5. Click "Inject Script"
6. Your script will be injected into the current page

### Hot Reloading

1. Make changes to your variant files (JS, HTML, or SCSS)
2. Refresh the page manually (or change the variant in the dropdown to automatically refresh)
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

### Built-in Utils

ELI provides a built-in utils object with Optimizely-style utility functions. Import it using:

```javascript
import utils from '@eli/utils';

// Wait for an element to appear
utils.waitForElement('#myElement').then(element => {
  console.log('Element found:', element);
});

// Wait until a condition is met
utils.waitUntil(() => document.readyState === 'complete');

// DOM manipulation
utils.addClass('#myButton', 'active');
utils.removeClass('#myButton', 'inactive');

// Event handling
utils.on('#myButton', 'click', () => console.log('Clicked!'));

// Cookies
const userId = utils.getCookie('userId');
utils.setCookie('userId', '12345', 30);

// Query parameters
const campaign = utils.getQueryParam('campaign');

// Custom events
utils.triggerEvent('experimentLoaded', { variant: 'v1' });
```

**Available utils functions:**
- `waitForElement(selector)` - Wait for element to appear (waits indefinitely)
- `waitUntil(condition, interval)` - Wait until condition is true (waits indefinitely, checks every `interval` ms, default: 100ms)
- `getCookie(name)` - Get cookie value
- `setCookie(name, value, days, path)` - Set cookie
- `getQueryParam(name, url)` - Get URL query parameter
- `triggerEvent(eventName, data, target)` - Trigger custom event
- `select(selector, context)` - Select single element
- `selectAll(selector, context)` - Select multiple elements
- `addClass(element, className)` - Add class to element
- `removeClass(element, className)` - Remove class from element
- `toggleClass(element, className)` - Toggle class on element
- `hasClass(element, className)` - Check if element has class
- `on(element, event, handler)` - Add event listener
- `off(element, event, handler)` - Remove event listener
- `delegate(parent, selector, event, handler)` - Event delegation
- `getViewport()` - Get viewport dimensions
- `isInViewport(element, threshold)` - Check if element is in viewport
- `scrollIntoView(element, options)` - Scroll element into view

## Project Structure

### Extension Structure

```
eli/
├── background.js          # Extension background service worker
├── popup.html            # Extension popup UI
├── popup.js              # Extension popup logic
├── manifest.json         # Chrome extension manifest
├── server.js             # Local development server
├── utils.js              # Built-in utility functions
├── bin/
│   └── eli               # CLI command script
├── package.json          # Node.js project file
└── README.md            # This file
```

### Example Projects Directory Structure

Your projects can be stored anywhere on your system. Here's an example structure:

```
/path/to/your/projects/
├── example-project/
│   ├── v1/
│   │   ├── v1.js              # Main variant script
│   │   ├── v1.html            # HTML template (optional)
│   │   ├── v1.scss            # Styles (optional)
│   │   ├── v1.min.js          # Auto-generated minified file
│   │   └── v1.min.css         # Auto-generated minified CSS
│   ├── v2/
│   │   ├── v2.js
│   │   ├── v2.html
│   │   ├── v2.scss
│   │   ├── v2.min.js          # Auto-generated
│   │   └── v2.min.css         # Auto-generated
│   ├── control/
│   │   └── control.js          # Control variant (minimal example)
│   └── shared.js               # Shared code for all variants
│
├── checkout-experiment/
│   ├── v1/
│   │   ├── v1.js
│   │   ├── components/
│   │   │   ├── button.js       # Imported JS module
│   │   │   └── modal.html      # Imported HTML template
│   │   └── styles/
│   │       └── checkout.scss   # Imported SCSS
│   └── v2/
│       └── v2.js
│
└── homepage-banner/
    ├── variant-a/
    │   ├── variant-a.js
    │   ├── banner.html
    │   └── banner.scss
    └── variant-b/
        ├── variant-b.js
        ├── banner.html
        └── banner.scss
```

**Project Structure Rules:**
- Each project folder contains **variant folders** (e.g., `v1/`, `v2/`, `control/`, `variant-a/`)
- Each variant folder must contain at least one `.js` file (the main entry point)
- HTML (`.html`) and SCSS (`.scss`) files are optional and can be imported
- `.min.js` and `.min.css` files are automatically generated when you save your code
- You can have a `shared.js` file at the project root level to share code between variants
- You can organize files in subdirectories within variant folders (e.g., `components/`, `styles/`)
- No config files are required - just organize your files in folders

## API Endpoints

The development server exposes the following endpoints:

- `GET /api/projects` - Returns a list of all available projects with their variants
- `GET /api/project/:projectName/variants` - Returns a list of all variants in a project
- `GET /api/project/:projectName/:variantName/script.js` - Returns the processed JS file from a variant (with imports processed and cache busting)
- `GET /api/project/:projectName/:variantName/script.min.js` - Returns the minified version of the processed JS file (minified files are auto-generated on save)
- `GET /api/project/:projectName/config` - Returns project configuration (defaults)
- `GET /api/config/projects-dir` - Returns the current projects directory path
- `POST /api/config/projects-dir` - Sets a new projects directory path (body: `{ "path": "/path/to/projects" }`)

## Minification

ELI automatically compiles and minifies your variant code whenever you save any file in your project. The minified code includes all processed imports (HTML, SCSS, JS) and is ready to use.

### Automatic Minification

**Minified files are automatically generated** when you save:
- Any `.js` file in a variant folder
- Any `.html` file in a variant folder
- Any `.css` file in a variant folder
- Any `.scss` file in a variant folder
- `shared.js` at the project root (minifies all variants in that project)

The minified file is saved as `{variantName}.min.js` in the variant folder (e.g., `projects/example-project/v1/v1.min.js`).

### Getting Minified Code

**The minified file is automatically created/updated** whenever you save any relevant file. Just check the variant folder for the `.min.js` file - it's ready to copy/paste into other tools!

You can also fetch it via the API endpoint:
```bash
# Get minified code (already saved automatically)
curl "http://localhost:8000/api/project/example-project/v1/script.min.js"
```

**Note:** The file watcher runs automatically when the server starts. You'll see `[ELI] File watcher active - minified files will be auto-generated on save` in the server console.

### Minification Settings

The minifier is configured to:
- Keep `console.log` statements (useful for debugging)
- Remove comments
- Remove debugger statements
- Preserve variable and function names (no mangling)
- Compress whitespace and optimize code structure

## Tips

- **Flexible project location**: Store your projects anywhere on your system - configure the path in the extension UI
- **Multiple projects**: Create as many project folders as you need in your projects directory
- **Multiple variants**: Each project can have multiple variant folders (v1, v2, test, production, etc.)
- **Shared code**: Use a `shared.js` file at the project root to share code between variants
- **Import organization**: Import HTML, SCSS, and JS files to keep your code organized
- **SCSS compilation**: SCSS files are automatically compiled to CSS and injected
- **Cache busting**: The server automatically adds cache-busting parameters to ensure you always get the latest version
- **Auto-minification**: Minified files are automatically generated on save - no manual steps needed
- **File watching**: The server watches for file changes and automatically regenerates minified files
- **Team collaboration**: Share the project folder via git. Each team member runs their own local server and configures their own projects directory path
- **Debugging**: Use Chrome DevTools console to see logs and debug your experiments
- **Changing projects directory**: Update the projects directory path in the extension UI - the server will automatically reload projects from the new location

## Troubleshooting

**Extension shows "Could not connect to server"**
- Make sure the development server is running (`npm start`)
- Check that the server is running on port 8000

**No projects showing in dropdown**
- Verify that you've configured the projects directory path in the extension UI
- Check that the projects directory path is correct and the directory exists
- Ensure the projects directory contains at least one project folder
- Check the server console for any errors when reading the projects directory

**Projects directory not setting**
- Make sure the path you enter is an absolute path (e.g., `/Users/username/projects` or `C:\Users\username\projects`)
- Verify that the directory exists and is accessible
- Check that the directory is actually a folder, not a file
- Look at the status message in the extension popup for specific error details

**Script doesn't update after changes**
- Make sure you're reloading the page after making changes
- Check that your JS, HTML, CSS, or SCSS file is saved
- The minified file will automatically update when you save any project file

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

**Minified files not being generated**
- Make sure the development server is running (file watcher only works when server is active)
- Check the server console for the message: `[ELI] File watcher active for: /path/to/projects`
- Verify you're saving files in variant folders (not at the project root, unless it's `shared.js`)
- Minified files are automatically generated when you save any `.js`, `.html`, `.css`, or `.scss` file in a variant folder
- Check the variant folder for `.min.js` files after saving - they should appear automatically
- Look for console messages like `[ELI] File changed: ... - triggering minification` to verify the file watcher is working
- If the projects directory doesn't exist, the file watcher won't start - set a valid projects directory path first

## License

MIT

