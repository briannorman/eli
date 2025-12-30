const API_BASE = 'http://localhost:8000/api';

let projects = [];
let selectedProject = null;
let selectedVariant = null;

// Load saved preferences
async function loadSavedPreferences() {
  const result = await chrome.storage.local.get(['selectedProject', 'selectedVariant', 'autoInject', 'projectsDir', 'extensionEnabled']);
  return {
    project: result.selectedProject || null,
    variant: result.selectedVariant || null,
    autoInject: result.autoInject || false,
    projectsDir: result.projectsDir || null,
    extensionEnabled: result.extensionEnabled !== undefined ? result.extensionEnabled : true
  };
}

// Save extension enabled state
async function saveExtensionEnabled(enabled) {
  await chrome.storage.local.set({ extensionEnabled: enabled });
}

// Save projects directory preference
async function saveProjectsDir(projectsDir) {
  await chrome.storage.local.set({ projectsDir: projectsDir });
}

// Fetch current projects directory from server
async function fetchProjectsDir() {
  try {
    const response = await fetch(`${API_BASE}/config/projects-dir`);
    if (response.ok) {
      const data = await response.json();
      return data.projectsDir || null;
    }
  } catch (error) {
    console.error('Failed to fetch projects directory:', error);
  }
  return null;
}

// Set projects directory on server
async function setProjectsDirOnServer(projectsDir) {
  try {
    const response = await fetch(`${API_BASE}/config/projects-dir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: projectsDir })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, projectsDir: data.projectsDir };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to set projects directory' };
    }
  } catch (error) {
    console.error('Failed to set projects directory:', error);
    return { success: false, error: error.message || 'Failed to connect to server' };
  }
}

// Save project preference
async function saveProject(projectName, variantName = null) {
  await chrome.storage.local.set({ 
    selectedProject: projectName,
    selectedVariant: variantName
  });
}

// Save auto-inject preference
async function saveAutoInject(enabled) {
  await chrome.storage.local.set({ autoInject: enabled });
}

// Fetch projects from server
async function fetchProjects() {
  try {
    const response = await fetch(`${API_BASE}/projects`);
    const data = await response.json();
    const projects = data.projects || [];
    
    // If projects don't have variants, fetch them individually
    for (const project of projects) {
      if (!project.variants || project.variants.length === 0) {
        try {
          const variantsResponse = await fetch(`${API_BASE}/project/${project.name}/variants`);
          const variantsData = await variantsResponse.json();
          project.variants = variantsData.variants || [];
          console.log(`[ELI] Fetched variants for ${project.name}:`, project.variants);
        } catch (e) {
          console.warn(`[ELI] Could not fetch variants for ${project.name}:`, e);
          project.variants = [];
        }
      }
    }
    
    return projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    showStatus('Error: Could not connect to server. Make sure the server is running.', 'error');
    return [];
  }
}

// Check if current URL matches project patterns
function urlMatchesPattern(url, pattern) {
  if (pattern === '*://*/*') return true;
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

function urlMatchesAnyPattern(url, patterns) {
  if (!patterns || patterns.length === 0) return true;
  return patterns.some(pattern => urlMatchesPattern(url, pattern));
}

// Populate variant dropdown
function populateVariants(project) {
  const variantSelect = document.getElementById('variantSelect');
  const variantLabel = document.getElementById('variantSelectLabel');
  
  console.log('[ELI] populateVariants called with project:', project);
  console.log('[ELI] project.variants:', project?.variants);
  
  if (!project || !project.variants || project.variants.length === 0) {
    console.warn('[ELI] No variants to display, hiding dropdown');
    variantSelect.style.display = 'none';
    variantLabel.style.display = 'none';
    variantSelect.innerHTML = '<option value="">-- No variants available --</option>';
    return;
  }
  
  console.log('[ELI] Showing variant dropdown with', project.variants.length, 'variants');
  variantSelect.style.display = 'block';
  variantLabel.style.display = 'block';
  variantSelect.innerHTML = '<option value="">-- Select a variant --</option>';
  
  project.variants.forEach(variantName => {
    const option = document.createElement('option');
    option.value = variantName;
    option.textContent = variantName;
    variantSelect.appendChild(option);
  });
}

// Populate project dropdown
function populateProjects(projectList) {
  const select = document.getElementById('projectSelect');
  select.innerHTML = '<option value="">-- Select a project --</option>';
  
  projectList.forEach(project => {
    const option = document.createElement('option');
    option.value = project.name;
    option.textContent = project.displayName || project.name;
    option.dataset.project = JSON.stringify(project);
    select.appendChild(option);
  });
  
  // Restore saved preferences
  loadSavedPreferences().then(async prefs => {
    if (prefs.project) {
      const project = projectList.find(p => p.name === prefs.project);
      if (project) {
        select.value = prefs.project;
        selectedProject = prefs.project;
        populateVariants(project);
        
        // Restore selected variant
        if (prefs.variant && project.variants && project.variants.includes(prefs.variant)) {
          document.getElementById('variantSelect').value = prefs.variant;
          selectedVariant = prefs.variant;
        } else if (project.variants && project.variants.length > 0) {
          // Auto-select first variant if available
          selectedVariant = project.variants[0];
          document.getElementById('variantSelect').value = selectedVariant;
        }
      }
    }
    document.getElementById('autoInjectCheck').checked = prefs.autoInject;
    updateInjectButtonState();
  });
}

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Update inject button state
function updateInjectButtonState() {
  const injectBtn = document.getElementById('injectBtn');
  injectBtn.disabled = !selectedProject || !selectedVariant;
}

// Check if URL is injectable (not chrome://, chrome-extension://, about:, etc.)
function isInjectableUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.toLowerCase();
    // Block chrome://, chrome-extension://, about:, moz-extension://, etc.
    const restrictedProtocols = ['chrome:', 'chrome-extension:', 'about:', 'moz-extension:', 'edge:', 'opera:', 'brave:'];
    return !restrictedProtocols.includes(protocol);
  } catch (e) {
    // If URL parsing fails, assume it's not injectable
    return false;
  }
}

// Inject script into current tab
async function injectScript(projectName, variantName) {
  try {
    // Check if extension is enabled
    const prefs = await loadSavedPreferences();
    if (!prefs.extensionEnabled) {
      showStatus('Extension is disabled. Enable it to inject scripts.', 'error');
      return;
    }
    
    if (!variantName) {
      showStatus('Please select a variant to inject', 'error');
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('No active tab found', 'error');
      return;
    }

    // Check if the URL is injectable
    if (!isInjectableUrl(tab.url)) {
      showStatus('Cannot inject scripts into this page. Chrome://, about://, and extension pages are not supported.', 'error');
      return;
    }

    // Get project info to check URL patterns (but allow manual injection regardless)
    const project = projects.find(p => p.name === projectName);
    if (project && tab.url) {
      const matches = urlMatchesAnyPattern(tab.url, project.urlPatterns || []);
      if (!matches) {
        // Warn but still allow injection
        showStatus(`Warning: URL doesn't match project patterns, but injecting anyway...`, 'info');
      }
    }

    // Get script with cache busting
    const timestamp = Date.now();
    const scriptUrl = `${API_BASE}/project/${projectName}/${variantName}/script.js?v=${timestamp}`;
    
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.statusText}`);
    }
    
    const scriptText = await response.text();
    
    // Inject the script using data URL to bypass CSP restrictions
    // Data URLs are often allowed by CSP when blob URLs are not
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN', // Execute in main world
        func: (code, projectName, variantName) => {
          try {
            const injectionKey = `${projectName}/${variantName}`;
            
            // Check if a script with this exact injection key already exists in the DOM
            const existingScript = document.querySelector(`script[data-eli-injected="${injectionKey}"]`);
            if (existingScript) {
              // For manual injection, remove the old one first to allow re-injection
              existingScript.remove();
            }
            
            // Set the flag IMMEDIATELY to prevent race conditions
            // For manual injection, we always want to inject (user requested it)
            window.__eli_last_injected = injectionKey;
            
            // Remove any previously injected ELI scripts with different keys to prevent conflicts
            const existingScripts = document.querySelectorAll('script[data-eli-injected]');
            existingScripts.forEach(script => {
              if (script.getAttribute('data-eli-injected') !== injectionKey) {
                script.remove();
              }
            });
            
            // Also remove any script tags with data URLs that look like ELI scripts (legacy cleanup)
            const allScripts = document.querySelectorAll('script[src^="data:text/javascript"]');
            allScripts.forEach(script => {
              if ((script.src.includes('base64') || script.hasAttribute('data-eli-injected')) && 
                  script.getAttribute('data-eli-injected') !== injectionKey) {
                script.remove();
              }
            });
            
            // Mark that we've injected (store in window for tracking)
            if (!window.__eli_injected) {
              window.__eli_injected = [];
            }
            
            // Try data URL first (base64 encoded)
            // This often works better than blob URLs with strict CSP
            const base64Code = btoa(unescape(encodeURIComponent(code)));
            const dataUrl = `data:text/javascript;base64,${base64Code}`;
            
            // Create and inject script element with data URL
            const script = document.createElement('script');
            script.src = dataUrl;
            script.setAttribute('data-eli-injected', injectionKey);
            script.onload = () => {
              window.__eli_injected.push(Date.now());
              window.__eli_last_injected = injectionKey;
            };
            script.onerror = (error) => {
              console.error('[ELI] Data URL script loading failed, trying blob URL:', error);
              
              // Fallback to blob URL if data URL fails
              try {
                const blob = new Blob([code], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                
                const blobScript = document.createElement('script');
                blobScript.src = blobUrl;
                blobScript.setAttribute('data-eli-injected', injectionKey);
                blobScript.onload = () => {
                  URL.revokeObjectURL(blobUrl);
                  window.__eli_injected.push(Date.now());
                  window.__eli_last_injected = injectionKey;
                };
                blobScript.onerror = (blobError) => {
                  URL.revokeObjectURL(blobUrl);
                  console.error('[ELI] Both data URL and blob URL failed. CSP may be blocking all script injection methods:', blobError);
                };
                
                document.head.appendChild(blobScript);
              } catch (blobError) {
                console.error('[ELI] Failed to create blob URL fallback:', blobError);
              }
            };
            
            document.head.appendChild(script);
          } catch (error) {
            console.error('[ELI] Script injection error:', error);
          }
        },
        args: [scriptText, projectName, variantName]
      });
    } catch (scriptingError) {
      // Handle Chrome scripting API errors (e.g., chrome:// URLs)
      if (scriptingError.message && scriptingError.message.includes('chrome://')) {
        throw new Error('Cannot inject scripts into Chrome internal pages (chrome:// URLs). Please navigate to a regular web page.');
      } else if (scriptingError.message && scriptingError.message.includes('Cannot access')) {
        throw new Error('Cannot access this page. Chrome://, about://, and extension pages are not supported.');
      }
      throw scriptingError;
    }
    
    await saveProject(projectName, variantName);
    selectedProject = projectName;
    selectedVariant = variantName;
    showStatus(`Injected: ${project?.displayName || projectName} - ${variantName}`, 'success');
  } catch (error) {
    console.error('Injection error:', error);
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.message.includes('chrome://') || error.message.includes('Cannot access')) {
      errorMessage = 'Cannot inject scripts into this page. Please navigate to a regular web page (http:// or https://).';
    }
    showStatus(`Error: ${errorMessage}`, 'error');
  }
}

// Reload current page
async function reloadCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.reload(tab.id);
      showStatus('Page reloaded', 'success');
    }
  } catch (error) {
    showStatus('Error reloading page', 'error');
  }
}

// Update UI based on extension enabled state
function updateUIForExtensionState(enabled) {
  const contentArea = document.getElementById('contentArea');
  const injectBtn = document.getElementById('injectBtn');
  const autoInjectCheck = document.getElementById('autoInjectCheck');
  
  if (enabled) {
    contentArea.classList.remove('disabled-overlay');
    injectBtn.disabled = !selectedProject || !selectedVariant;
  } else {
    contentArea.classList.add('disabled-overlay');
    injectBtn.disabled = true;
    autoInjectCheck.disabled = true;
  }
}

// Initialize popup
async function init() {
  // Load and display current projects directory
  const projectsDirInput = document.getElementById('projectsDirInput');
  const setProjectsDirBtn = document.getElementById('setProjectsDirBtn');
  const projectsDirStatus = document.getElementById('projectsDirStatus');
  const extensionToggle = document.getElementById('extensionToggle');
  
  // Load saved preferences
  const prefs = await loadSavedPreferences();
  
  // Set extension toggle state
  extensionToggle.checked = prefs.extensionEnabled;
  updateUIForExtensionState(prefs.extensionEnabled);
  
  // Handle extension toggle
  extensionToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await saveExtensionEnabled(enabled);
    updateUIForExtensionState(enabled);
    showStatus(enabled ? 'Extension enabled' : 'Extension disabled', enabled ? 'success' : 'info');
  });
  
  // Fetch current projects directory from server
  const currentProjectsDir = await fetchProjectsDir();
  
  // If we have a saved preference and it's different from the server's current directory,
  // automatically set it on the server to restore the user's preference
  if (prefs.projectsDir && prefs.projectsDir !== currentProjectsDir) {
    projectsDirInput.value = prefs.projectsDir;
    projectsDirStatus.textContent = '⏳ Restoring saved directory...';
    projectsDirStatus.className = 'status-text';
    
    // Automatically set the saved directory on the server
    const result = await setProjectsDirOnServer(prefs.projectsDir);
    if (result.success) {
      projectsDirInput.value = result.projectsDir;
      projectsDirStatus.textContent = `✓ Restored: ${result.projectsDir}`;
      projectsDirStatus.className = 'status-text success';
    } else {
      // If setting failed, show the saved value but indicate it needs to be set
      projectsDirInput.value = prefs.projectsDir;
      projectsDirStatus.textContent = `⚠ Saved: ${prefs.projectsDir} (click Set to apply)`;
      projectsDirStatus.className = 'status-text warning';
    }
  } else if (currentProjectsDir) {
    // Use the server's current directory
    projectsDirInput.value = currentProjectsDir;
    projectsDirStatus.textContent = '';
    projectsDirStatus.className = 'status-text';
    
    // Save it if it's not already saved
    if (!prefs.projectsDir || prefs.projectsDir !== currentProjectsDir) {
      await saveProjectsDir(currentProjectsDir);
    }
  } else if (prefs.projectsDir) {
    // We have a saved preference but couldn't fetch from server
    projectsDirInput.value = prefs.projectsDir;
    projectsDirStatus.textContent = `⚠ Saved: ${prefs.projectsDir} (click Set to apply)`;
    projectsDirStatus.className = 'status-text warning';
  } else {
    // No saved preference and couldn't fetch from server
    projectsDirStatus.textContent = 'No directory configured';
    projectsDirStatus.className = 'status-text';
  }
  
  // Function to set projects directory
  async function handleSetProjectsDir() {
    const projectsDir = projectsDirInput.value.trim();
    if (!projectsDir) {
      showStatus('Please enter a projects directory path', 'error');
      return;
    }
    
    setProjectsDirBtn.disabled = true;
    setProjectsDirBtn.textContent = 'Setting...';
    projectsDirStatus.textContent = '⏳ Setting directory...';
    projectsDirStatus.className = 'status-text';
    
    const result = await setProjectsDirOnServer(projectsDir);
    
    if (result.success) {
      await saveProjectsDir(result.projectsDir);
      projectsDirInput.value = result.projectsDir;
      projectsDirStatus.textContent = `✓ Set to: ${result.projectsDir}`;
      projectsDirStatus.className = 'status-text success';
      showStatus('Projects directory updated successfully', 'success');
      
      // Reload projects after directory change
      projects = await fetchProjects();
      populateProjects(projects);
    } else {
      projectsDirStatus.textContent = `✗ Error: ${result.error}`;
      projectsDirStatus.className = 'status-text error';
      showStatus(`Failed to set projects directory: ${result.error}`, 'error');
    }
    
    setProjectsDirBtn.disabled = false;
    setProjectsDirBtn.textContent = 'Set Directory';
  }
  
  // Handle set projects directory button
  setProjectsDirBtn.addEventListener('click', handleSetProjectsDir);
  
  // Handle Enter key in projects directory input
  projectsDirInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSetProjectsDir();
    }
  });
  
  // Load projects
  projects = await fetchProjects();
  populateProjects(projects);
  
  // Enable/disable inject button based on selection
  const select = document.getElementById('projectSelect');
  const injectBtn = document.getElementById('injectBtn');
  
  const variantSelect = document.getElementById('variantSelect');
  
  select.addEventListener('change', async (e) => {
    selectedProject = e.target.value;
    selectedVariant = null;
    
    if (selectedProject) {
      const project = projects.find(p => p.name === selectedProject);
      if (project) {
        console.log('[ELI] Selected project:', project.name, 'Variants:', project.variants);
        populateVariants(project);
        // Auto-select first variant if available
        if (project.variants && project.variants.length > 0) {
          selectedVariant = project.variants[0];
          variantSelect.value = selectedVariant;
          console.log('[ELI] Auto-selected variant:', selectedVariant);
        } else {
          console.warn('[ELI] No variants found for project:', project.name);
        }
      }
    } else {
      variantSelect.style.display = 'none';
      document.getElementById('variantSelectLabel').style.display = 'none';
    }
    updateInjectButtonState();
  });
  
  variantSelect.addEventListener('change', async (e) => {
    const previousVariant = selectedVariant;
    selectedVariant = e.target.value;
    updateInjectButtonState();
    
    // If variant changed and we have a project selected, refresh the page
    if (selectedVariant && selectedVariant !== previousVariant && selectedProject) {
      await saveProject(selectedProject, selectedVariant);
      await reloadCurrentPage();
    }
  });
  
  // Inject button
  injectBtn.addEventListener('click', async () => {
    if (selectedProject && selectedVariant) {
      await injectScript(selectedProject, selectedVariant);
    }
  });
  
  // Auto-inject checkbox
  const autoInjectCheck = document.getElementById('autoInjectCheck');
  autoInjectCheck.disabled = !prefs.extensionEnabled;
  autoInjectCheck.addEventListener('change', async (e) => {
    const prefs = await loadSavedPreferences();
    if (!prefs.extensionEnabled) {
      e.target.checked = false;
      showStatus('Enable the extension first to use auto-inject', 'error');
      return;
    }
    await saveAutoInject(e.target.checked);
    showStatus(e.target.checked ? 'Auto-inject enabled' : 'Auto-inject disabled', 'success');
  });
}

// Run initialization
init();

