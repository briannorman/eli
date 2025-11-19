const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sass = require('sass');
const { minify } = require('terser');
const chokidar = require('chokidar');

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

// Get list of variant folders in a project
function getProjectVariants(projectName) {
  const projectPath = path.join(PROJECTS_DIR, projectName);
  try {
    const entries = fs.readdirSync(projectPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();
  } catch (error) {
    console.error(`Error reading variants for ${projectName}:`, error);
    return [];
  }
}

// Process HTML imports in JS code
function processHtmlImports(jsContent, variantPath) {
  // Match: import variableName from './filename.html';
  const importRegex = /import\s+(\w+)\s+from\s+['"](\.\/)?([^'"]+\.html)['"];?/g;
  
  let processedContent = jsContent;
  let match;
  const originalContent = jsContent; // Store original for regex reset
  
  while ((match = importRegex.exec(originalContent)) !== null) {
    const [fullMatch, varName, relativePath, htmlFileName] = match;
    const htmlPath = path.join(variantPath, htmlFileName);
    
    try {
      if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        // Escape the HTML for use in a JavaScript string
        const escapedHtml = htmlContent
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\${/g, '\\${')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');
        
        // Replace import with const declaration using template literal
        const replacement = `const ${varName} = \`${escapedHtml}\`;`;
        processedContent = processedContent.replace(fullMatch, replacement);
        console.log(`[ELI] Processed HTML import: ${htmlFileName} -> ${varName}`);
      } else {
        console.warn(`[ELI] HTML file not found: ${htmlPath}`);
        // Replace with empty string if file not found
        processedContent = processedContent.replace(fullMatch, `const ${varName} = '';`);
      }
    } catch (error) {
      console.error(`[ELI] Error processing HTML import ${htmlFileName}:`, error);
      processedContent = processedContent.replace(fullMatch, `const ${varName} = '';`);
    }
  }
  
  return processedContent;
}

// Process SCSS imports in JS code
function processScssImports(jsContent, variantPath) {
  // Match: import variableName from './filename.scss';
  const importRegex = /import\s+(\w+)\s+from\s+['"](\.\/)?([^'"]+\.scss)['"];?/g;
  
  let processedContent = jsContent;
  let match;
  const originalContent = jsContent; // Store original for regex reset
  
  while ((match = importRegex.exec(originalContent)) !== null) {
    const [fullMatch, varName, relativePath, scssFileName] = match;
    const scssPath = path.join(variantPath, scssFileName);
    
    try {
      if (fs.existsSync(scssPath)) {
        // Compile SCSS to CSS
        const result = sass.compile(scssPath, {
          style: 'expanded',
          sourceMap: false
        });
        
        const cssContent = result.css;
        
        // Escape the CSS for use in a JavaScript string
        const escapedCss = cssContent
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\${/g, '\\${')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');
        
        // Replace import with code that injects the CSS as a style tag
        const replacement = `const ${varName} = \`${escapedCss}\`; (function() { const style = document.createElement('style'); style.textContent = ${varName}; document.head.appendChild(style); })();`;
        processedContent = processedContent.replace(fullMatch, replacement);
        console.log(`[ELI] Processed SCSS import: ${scssFileName} -> ${varName} (compiled to CSS)`);
      } else {
        console.warn(`[ELI] SCSS file not found: ${scssPath}`);
        // Replace with no-op if file not found
        processedContent = processedContent.replace(fullMatch, '');
      }
    } catch (error) {
      console.error(`[ELI] Error processing SCSS import ${scssFileName}:`, error);
      processedContent = processedContent.replace(fullMatch, '');
    }
  }
  
  return processedContent;
}

// Process JS imports in JS code
function processJsImports(jsContent, variantPath, projectPath, processingUtils = false) {
  // Match: import variableName from './filename.js' or '../filename.js' or '@eli/utils'
  const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g;
  
  let processedContent = jsContent;
  let match;
  const originalContent = jsContent; // Store original for regex reset
  
  while ((match = importRegex.exec(originalContent)) !== null) {
    const [fullMatch, varName, importPath] = match;
    
    // Handle special @eli/utils import
    if (importPath === '@eli/utils' || importPath === '@eli/utils.js') {
      // Prevent infinite recursion - if we're already processing utils, skip
      if (processingUtils) {
        console.warn(`[ELI] Skipping recursive @eli/utils import`);
        processedContent = processedContent.replace(fullMatch, `const ${varName} = {};`);
        continue;
      }
      
      const utilsPath = path.join(__dirname, 'utils.js');
      try {
        if (fs.existsSync(utilsPath)) {
          let utilsContent = fs.readFileSync(utilsPath, 'utf8');
          // Process any imports in utils.js (though it shouldn't have any)
          // Pass processingUtils=true to prevent infinite recursion
          const utilsDir = path.dirname(utilsPath);
          utilsContent = processHtmlImports(utilsContent, utilsDir);
          utilsContent = processScssImports(utilsContent, utilsDir);
          utilsContent = processJsImports(utilsContent, utilsDir, projectPath, true);
          
          // Check for export default (handle multiline - match everything after "export default" to end of file)
          const exportDefaultMatch = utilsContent.match(/export\s+default\s+([\s\S]*)$/);
          if (exportDefaultMatch) {
            const exportedValue = exportDefaultMatch[1].trim();
            // Remove trailing semicolon if present
            const cleanValue = exportedValue.replace(/;?\s*$/, '');
            processedContent = processedContent.replace(fullMatch, `const ${varName} = ${cleanValue};`);
            console.log(`[ELI] Processed @eli/utils import -> ${varName}`);
          } else {
            processedContent = processedContent.replace(fullMatch, `const ${varName} = {};`);
          }
        } else {
          console.warn(`[ELI] Utils file not found: ${utilsPath}`);
          processedContent = processedContent.replace(fullMatch, `const ${varName} = {};`);
        }
      } catch (error) {
        console.error(`[ELI] Error processing @eli/utils import:`, error);
        processedContent = processedContent.replace(fullMatch, `const ${varName} = {};`);
      }
      continue;
    }
    
    // Skip if not a .js file (might be HTML or SCSS)
    if (!importPath.endsWith('.js') && !importPath.startsWith('./') && !importPath.startsWith('../')) {
      continue;
    }
    
    // Resolve the path relative to the variant folder
    let jsPath;
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Relative path - resolve from variant folder
      jsPath = path.resolve(variantPath, importPath);
    } else {
      // Absolute path from project root
      jsPath = path.join(projectPath, importPath);
    }
    
    // Security: ensure the resolved path is within the project directory
    const normalizedPath = path.normalize(jsPath);
    if (!normalizedPath.startsWith(projectPath)) {
      console.warn(`[ELI] JS import path outside project: ${importPath}`);
      processedContent = processedContent.replace(fullMatch, '');
      continue;
    }
    
    try {
      if (fs.existsSync(jsPath)) {
        let jsFileContent = fs.readFileSync(jsPath, 'utf8');
        
        // Recursively process imports in the imported file
        const importedFileDir = path.dirname(jsPath);
        jsFileContent = processHtmlImports(jsFileContent, importedFileDir);
        jsFileContent = processScssImports(jsFileContent, importedFileDir);
        jsFileContent = processJsImports(jsFileContent, importedFileDir, projectPath);
        
        // Check if the file exports a default value (handle multiline)
        const exportDefaultMatch = jsFileContent.match(/export\s+default\s+([\s\S]*)$/);
        
        let replacement;
        if (exportDefaultMatch) {
          // File exports a value - use it
          const exportedValue = exportDefaultMatch[1].trim();
          // Remove trailing semicolon if present
          const cleanValue = exportedValue.replace(/;?\s*$/, '');
          replacement = `const ${varName} = ${cleanValue};`;
        } else {
          // File doesn't export - wrap code in a function
          // This allows the imported code to be called as a function
          replacement = `const ${varName} = function() { ${jsFileContent} };`;
        }
        
        processedContent = processedContent.replace(fullMatch, replacement);
        console.log(`[ELI] Processed JS import: ${jsPath} -> ${varName}`);
      } else {
        console.warn(`[ELI] JS file not found: ${jsPath}`);
        // Replace with undefined variable if file not found
        processedContent = processedContent.replace(fullMatch, `const ${varName} = undefined;`);
      }
    } catch (error) {
      console.error(`[ELI] Error processing JS import ${jsPath}:`, error);
      processedContent = processedContent.replace(fullMatch, `const ${varName} = undefined;`);
    }
  }
  
  return processedContent;
}

// Get JS file in a variant folder (finds any .js file in the variant folder)
function getVariantScript(projectName, variantName) {
  const variantPath = path.join(PROJECTS_DIR, projectName, variantName);
  try {
    const entries = fs.readdirSync(variantPath, { withFileTypes: true });
    const jsFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
      .map(entry => entry.name)
      .sort();
    
    if (jsFiles.length > 0) {
      // Return the first JS file found (or prefer one matching the variant name)
      const preferredFile = jsFiles.find(f => f === `${variantName}.js`) || jsFiles[0];
      const scriptPath = path.join(variantPath, preferredFile);
      const projectPath = path.join(PROJECTS_DIR, projectName);
      let content = fs.readFileSync(scriptPath, 'utf8');
      
      // Process HTML imports
      try {
        content = processHtmlImports(content, variantPath);
      } catch (error) {
        console.error(`[ELI] Error processing HTML imports:`, error);
        throw error;
      }
      
      // Process SCSS imports
      try {
        content = processScssImports(content, variantPath);
      } catch (error) {
        console.error(`[ELI] Error processing SCSS imports:`, error);
        throw error;
      }
      
      // Process JS imports (must be last to handle nested imports)
      try {
        content = processJsImports(content, variantPath, projectPath);
      } catch (error) {
        console.error(`[ELI] Error processing JS imports:`, error);
        throw error;
      }
      
      return {
        filename: preferredFile,
        content: content
      };
    } else {
      console.warn(`[ELI] No JS files found in variant ${variantName} for project ${projectName}`);
    }
  } catch (error) {
    console.error(`[ELI] Error reading variant ${variantName} for ${projectName}:`, error);
    throw error; // Re-throw to see the error in the endpoint handler
  }
  return null;
}

// Minify JavaScript code
async function minifyScript(code) {
  try {
    const result = await minify(code, {
      compress: {
        drop_console: false, // Keep console.log statements
        drop_debugger: true,
        pure_funcs: [], // Don't remove any functions
      },
      mangle: {
        reserved: [], // Don't mangle any names
      },
      format: {
        comments: false, // Remove comments
      },
    });
    return result.code || code; // Fallback to original if minification fails
  } catch (error) {
    console.error(`[ELI] Minification error:`, error);
    return code; // Return original code if minification fails
  }
}

// Save minified script to disk
async function saveMinifiedScript(projectName, variantName, minifiedCode, silent = false) {
  try {
    const variantPath = path.join(PROJECTS_DIR, projectName, variantName);
    const minifiedPath = path.join(variantPath, `${variantName}.min.js`);
    fs.writeFileSync(minifiedPath, minifiedCode, 'utf8');
    if (!silent) {
      console.log(`[ELI] Saved minified script: ${projectName}/${variantName}.min.js`);
    }
    return minifiedPath;
  } catch (error) {
    console.error(`[ELI] Error saving minified script:`, error);
    throw error;
  }
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
      const variants = getProjectVariants(name);
      return {
        name: name,
        displayName: config.name || name,
        description: config.description || '',
        urlPatterns: config.urlPatterns || ['*://*/*'],
        enabled: config.enabled !== false,
        variants: variants
      };
    });
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ projects }));
    return;
  }

  // Get project config endpoint (check before variant routes)
  const configMatch = req.url.match(/^\/api\/project\/([^\/]+)\/config$/);
  if (configMatch && req.method === 'GET') {
    const projectName = configMatch[1];
    const config = getProjectConfig(projectName);
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }

  // List variants in a project endpoint (check before variant script route)
  const variantsMatch = req.url.match(/^\/api\/project\/([^\/]+)\/variants$/);
  if (variantsMatch && req.method === 'GET') {
    const projectName = variantsMatch[1];
    const variants = getProjectVariants(projectName);
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ variants }));
    return;
  }

  // Get minified variant script endpoint (check before regular script endpoint)
  // Format: /api/project/:projectName/:variantName/script.min.js?save=true (optional save param)
  const minifiedMatch = req.url.match(/^\/api\/project\/([^\/]+)\/([^\/]+)\/script\.min\.js(\?save=(true|false))?$/);
  if (minifiedMatch && req.method === 'GET') {
    const projectName = minifiedMatch[1];
    const variantName = minifiedMatch[2];
    const shouldSave = minifiedMatch[3] === '?save=true';
    
    // Security: ensure variant name doesn't contain path traversal
    if (variantName.includes('..') || variantName.includes('/') || variantName.includes('\\')) {
      res.writeHead(400, corsHeaders);
      res.end('Invalid variant name');
      return;
    }
    
    (async () => {
      try {
        const scriptData = getVariantScript(projectName, variantName);
        
        if (scriptData && scriptData.content) {
          // Minify the script
          const minifiedCode = await minifyScript(scriptData.content);
          
          // Save to disk if requested
          if (shouldSave) {
            await saveMinifiedScript(projectName, variantName, minifiedCode);
          }
          
          res.writeHead(200, {
            ...corsHeaders,
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          res.end(minifiedCode);
        } else {
          console.error(`[ELI] Failed to get script for ${projectName}/${variantName}`);
          res.writeHead(404, corsHeaders);
          res.end(`Variant ${variantName} not found in project ${projectName} or no JS file found`);
        }
      } catch (error) {
        console.error(`[ELI] Error serving minified variant script:`, error);
        res.writeHead(500, corsHeaders);
        res.end(`Error: ${error.message}`);
      }
    })();
    return;
  }

  // Get variant script endpoint
  // Format: /api/project/:projectName/:variantName/script.js?saveMin=true (optional saveMin param)
  const variantMatch = req.url.match(/^\/api\/project\/([^\/]+)\/([^\/]+)\/script\.js(\?.*)?$/);
  if (variantMatch && req.method === 'GET') {
    const projectName = variantMatch[1];
    const variantName = variantMatch[2];
    const queryString = variantMatch[3] || '';
    const shouldSaveMin = queryString.includes('saveMin=true');
    
    // Security: ensure variant name doesn't contain path traversal
    if (variantName.includes('..') || variantName.includes('/') || variantName.includes('\\')) {
      res.writeHead(400, corsHeaders);
      res.end('Invalid variant name');
      return;
    }
    
    (async () => {
      try {
        const scriptData = getVariantScript(projectName, variantName);
        
        if (scriptData && scriptData.content) {
          // Optionally save minified version when regular script is requested
          if (shouldSaveMin) {
            const minifiedCode = await minifyScript(scriptData.content);
            await saveMinifiedScript(projectName, variantName, minifiedCode);
          }
          
          // Add cache busting timestamp
          res.writeHead(200, {
            ...corsHeaders,
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          res.end(scriptData.content);
        } else {
          console.error(`[ELI] Failed to get script for ${projectName}/${variantName}`);
          res.writeHead(404, corsHeaders);
          res.end(`Variant ${variantName} not found in project ${projectName} or no JS file found`);
        }
      } catch (error) {
        console.error(`[ELI] Error serving variant script:`, error);
        res.writeHead(500, corsHeaders);
        res.end(`Error: ${error.message}`);
      }
    })();
    return;
  }

  // Default 404
  res.writeHead(404, corsHeaders);
  res.end('Not found');
});

// Auto-minify on file save
async function autoMinifyOnSave(filePath) {
  // Only process files in variant folders or shared.js at project root
  const relativePath = path.relative(PROJECTS_DIR, filePath);
  const pathParts = relativePath.split(path.sep);
  
  // Check if it's a shared.js at project root
  if (pathParts.length === 2 && pathParts[1] === 'shared.js') {
    const projectName = pathParts[0];
    // Minify all variants in this project
    const variants = getProjectVariants(projectName);
    for (const variantName of variants) {
      await minifyVariant(projectName, variantName);
    }
    return;
  }
  
  // Check if it's in a variant folder (project/variant/file)
  if (pathParts.length === 3) {
    const projectName = pathParts[0];
    const variantName = pathParts[1];
    const fileName = pathParts[2];
    
    // Only process if it's a relevant file type
    if (fileName.endsWith('.js') || fileName.endsWith('.html') || fileName.endsWith('.scss')) {
      // Skip if it's already a minified file
      if (fileName.endsWith('.min.js')) {
        return;
      }
      
      await minifyVariant(projectName, variantName);
    }
  }
}

// Minify a specific variant
async function minifyVariant(projectName, variantName, silent = true) {
  try {
    const scriptData = getVariantScript(projectName, variantName);
    if (scriptData && scriptData.content) {
      const minifiedCode = await minifyScript(scriptData.content);
      await saveMinifiedScript(projectName, variantName, minifiedCode, silent);
    }
  } catch (error) {
    // Silently fail for auto-minification (don't spam console)
    if (!silent) {
      console.error(`[ELI] Auto-minify failed for ${projectName}/${variantName}:`, error.message);
    }
  }
}

// Set up file watcher for auto-minification
function setupFileWatcher() {
  const watcher = chokidar.watch(PROJECTS_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // Don't process existing files on startup
  });

  // Watch for file changes
  watcher.on('change', (filePath) => {
    autoMinifyOnSave(filePath);
  });

  // Watch for new files
  watcher.on('add', (filePath) => {
    autoMinifyOnSave(filePath);
  });

  console.log('[ELI] File watcher active - minified files will be auto-generated on save');
}

server.listen(PORT, () => {
  console.log(`Development server running on http://localhost:${PORT}`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
  console.log(`\nAvailable projects: ${getProjects().join(', ') || 'none'}`);
  console.log('\nServer ready! Make changes to your project scripts and reload the page.');
  
  // Start file watcher for auto-minification
  setupFileWatcher();
});

