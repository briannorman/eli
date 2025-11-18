const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;
const PROJECTS_DIR = path.join(__dirname, 'projects');

// Enable CORS for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Get list of projects
function getProjects() {
  try {
    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    return [];
  }
}

// Get project config (always returns defaults - config files are not required)
function getProjectConfig(projectName) {
  // Config files are optional - always use defaults
  return {
    name: projectName,
    description: '',
    urlPatterns: ['*://*/*'],
    enabled: true
  };
}

// Get list of JS files in a project
function getProjectFiles(projectName) {
  const projectPath = path.join(PROJECTS_DIR, projectName);
  try {
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
      .map(entry => entry.name)
      .sort();
  } catch (error) {
    console.error(`Error reading files for ${projectName}:`, error);
    return [];
  }
}

// Get project script file
function getProjectScript(projectName, filename) {
  const scriptPath = path.join(PROJECTS_DIR, projectName, filename);
  try {
    if (fs.existsSync(scriptPath)) {
      return fs.readFileSync(scriptPath, 'utf8');
    }
  } catch (error) {
    console.error(`Error reading script ${filename} for ${projectName}:`, error);
  }
  return null;
}

// Check if URL matches any pattern
function urlMatchesPattern(url, pattern) {
  // Convert pattern to regex
  // *://*/* matches all URLs
  if (pattern === '*://*/*') return true;
  
  // Simple pattern matching: * matches any sequence
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  
  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  } catch (e) {
    return false;
  }
}

// Check if URL matches any pattern in array
function urlMatchesAnyPattern(url, patterns) {
  if (!patterns || patterns.length === 0) return true;
  return patterns.some(pattern => urlMatchesPattern(url, pattern));
}

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // List projects endpoint
  if (req.url === '/api/projects' && req.method === 'GET') {
    const projectNames = getProjects();
    const projects = projectNames.map(name => {
      const config = getProjectConfig(name);
      const files = getProjectFiles(name);
      return {
        name: name,
        displayName: config.name || name,
        description: config.description || '',
        urlPatterns: config.urlPatterns || ['*://*/*'],
        enabled: config.enabled !== false,
        files: files
      };
    });
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ projects }));
    return;
  }

  // List files in a project endpoint
  const filesMatch = req.url.match(/^\/api\/project\/([^\/]+)\/files$/);
  if (filesMatch && req.method === 'GET') {
    const projectName = filesMatch[1];
    const files = getProjectFiles(projectName);
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ files }));
    return;
  }

  // Get project config endpoint
  const configMatch = req.url.match(/^\/api\/project\/([^\/]+)\/config$/);
  if (configMatch && req.method === 'GET') {
    const projectName = configMatch[1];
    const config = getProjectConfig(projectName);
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }

  // Get project script file endpoint - supports any .js file
  // Format: /api/project/:projectName/:filename.js
  const projectMatch = req.url.match(/^\/api\/project\/([^\/]+)\/([^\/]+\.js)(\?v=(\d+))?$/);
  if (projectMatch && req.method === 'GET') {
    const projectName = projectMatch[1];
    const filename = projectMatch[2];
    
    // Security: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.writeHead(400, corsHeaders);
      res.end('Invalid filename');
      return;
    }
    
    const script = getProjectScript(projectName, filename);
    
    if (script) {
      // Add cache busting timestamp
      res.writeHead(200, {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(script);
    } else {
      res.writeHead(404, corsHeaders);
      res.end(`File ${filename} not found in project ${projectName}`);
    }
    return;
  }

  // Default 404
  res.writeHead(404, corsHeaders);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Development server running on http://localhost:${PORT}`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
  console.log(`\nAvailable projects: ${getProjects().join(', ') || 'none'}`);
  console.log('\nServer ready! Make changes to your project scripts and reload the page.');
});

