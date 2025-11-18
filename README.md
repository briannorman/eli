# Web Experiments Development Tool

A local development interface for creating and testing web experiments. This tool allows you to organize experiments in separate project folders and inject them into any web page via a Chrome extension.

## Features

- 📁 **Project-based organization**: Each experiment lives in its own folder under `projects/`
- 🔄 **Hot reloading**: Changes to your scripts are reflected immediately when you reload the page
- 🎯 **Easy injection**: Select a project from the extension popup and inject it into any page
- ⚡ **Auto-inject**: Optionally auto-inject your selected project on every page load
- 👥 **Team-friendly**: Simple setup that works for everyone on your team

## Setup

### 1. Install Dependencies

This project requires Node.js (v12 or higher). No additional npm packages are needed - it uses only Node.js built-in modules.

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

2. Create a `script.js` file in that folder:
   ```bash
   touch projects/my-experiment/script.js
   ```

3. Add your experiment code to `script.js`:
   ```javascript
   console.log('My experiment is running!');
   // Your code here
   ```

## Usage

### Injecting a Script

1. Navigate to any web page where you want to test your experiment
2. Click the extension icon in your Chrome toolbar
3. Select your project from the dropdown
4. Click "Inject Script"
5. Your script will be injected into the current page

### Hot Reloading

1. Make changes to your `script.js` file
2. In the extension popup, click "Reload Current Page" (or just refresh the page manually)
3. The updated script will be injected automatically (if auto-inject is enabled) or you can click "Inject Script" again

### Auto-Inject

Enable the "Auto-inject on page load" checkbox in the extension popup to automatically inject your selected project whenever you navigate to a new page or reload. This is great for active development!

## Project Structure

```
eli/
├── projects/
│   ├── example-project/
│   │   └── script.js
│   └── my-experiment/
│       └── script.js
├── background.js          # Extension background service worker
├── popup.html            # Extension popup UI
├── popup.js              # Extension popup logic
├── manifest.json         # Chrome extension manifest
├── server.js             # Local development server
├── package.json          # Node.js project file
└── README.md            # This file
```

## API Endpoints

The development server exposes the following endpoints:

- `GET /api/projects` - Returns a list of all available projects
- `GET /api/project/:projectName/script.js` - Returns the script for a specific project (with cache busting)

## Tips

- **Multiple projects**: Create as many project folders as you need. Each should contain a `script.js` file.
- **Cache busting**: The server automatically adds cache-busting parameters to ensure you always get the latest version of your script.
- **Team collaboration**: Share the project folder via git. Each team member runs their own local server.
- **Debugging**: Use Chrome DevTools console to see logs and debug your experiments.

## Troubleshooting

**Extension shows "Could not connect to server"**
- Make sure the development server is running (`npm start`)
- Check that the server is running on port 8000

**Script doesn't update after changes**
- Make sure you're reloading the page after making changes
- Check that your `script.js` file is saved
- Try clicking "Refresh Projects" in the extension popup

**Script doesn't inject**
- Make sure you've selected a project from the dropdown
- Check the browser console for any errors
- Verify that your `script.js` file exists in the project folder

## License

MIT

