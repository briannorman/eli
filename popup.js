const API_BASE = 'http://localhost:8000/api';

let projects = [];
let selectedProject = null;
let selectedVariant = null;

// Load saved preferences
async function loadSavedPreferences() {
  const result = await chrome.storage.local.get(['selectedProject', 'selectedVariant', 'autoInject']);
  return {
    project: result.selectedProject || null,
    variant: result.selectedVariant || null,
    autoInject: result.autoInject || false
  };
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
        
        await updateProjectInfo(project);
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

// Update project info display
async function updateProjectInfo(project) {
  const infoDiv = document.getElementById('projectInfo');
  
  if (project) {
    // Check if current page matches URL patterns
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let matchStatus = '';
    if (tab && tab.url) {
      const matches = urlMatchesAnyPattern(tab.url, project.urlPatterns || []);
      matchStatus = matches 
        ? ' ✓ URL matches' 
        : ' ⚠ URL does not match patterns';
    }
    
    const urlPatternsText = (project.urlPatterns || []).join(', ');
    infoDiv.innerHTML = `
      <div><strong>Active Project:</strong> ${project.displayName || project.name}</div>
      ${project.description ? `<div style="margin-top: 5px; font-size: 11px; color: #888;">${project.description}</div>` : ''}
      <div style="margin-top: 5px; font-size: 11px; color: #666;">
        <strong>URL Patterns:</strong> ${urlPatternsText || 'All URLs'}
        ${matchStatus ? `<span style="color: ${matchStatus.includes('✓') ? '#28a745' : '#ffc107'};">${matchStatus}</span>` : ''}
      </div>
    `;
    infoDiv.style.display = 'block';
  } else {
    infoDiv.style.display = 'none';
  }
}

// Update inject button state
function updateInjectButtonState() {
  const injectBtn = document.getElementById('injectBtn');
  injectBtn.disabled = !selectedProject || !selectedVariant;
}

// Inject script into current tab
async function injectScript(projectName, variantName) {
  try {
    if (!variantName) {
      showStatus('Please select a variant to inject', 'error');
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('No active tab found', 'error');
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
    
    // Inject the script directly in MAIN world to bypass CSP completely
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN', // Execute in main world - this bypasses CSP restrictions
      func: (code) => {
        try {
          // Mark that we've injected (store in window for tracking)
          if (!window.__eli_injected) {
            window.__eli_injected = [];
          }
          
          // Execute the code directly - this works in MAIN world and bypasses CSP
          // Wrap in IIFE to avoid polluting global scope
          (function() {
            'use strict';
            eval(code);
          })();
          
          window.__eli_injected.push(Date.now());
          // console.log('[ELI] Script executed successfully in MAIN world');
        } catch (error) {
          console.error('[ELI] Script execution error:', error);
          // Try alternative execution method
          try {
            const func = new Function(code);
            func();
            console.log('[ELI] Script executed using Function constructor');
          } catch (fallbackError) {
            console.error('[ELI] All execution methods failed:', fallbackError);
          }
        }
      },
      args: [scriptText]
    });
    
    await saveProject(projectName, variantName);
    selectedProject = projectName;
    selectedVariant = variantName;
    if (project) {
      await updateProjectInfo(project);
    }
    showStatus(`Injected: ${project?.displayName || projectName} - ${variantName}`, 'success');
  } catch (error) {
    console.error('Injection error:', error);
    showStatus(`Error: ${error.message}`, 'error');
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

// Initialize popup
async function init() {
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
        await updateProjectInfo(project);
      }
    } else {
      variantSelect.style.display = 'none';
      document.getElementById('variantSelectLabel').style.display = 'none';
      updateProjectInfo(null);
    }
    updateInjectButtonState();
  });
  
  variantSelect.addEventListener('change', (e) => {
    selectedVariant = e.target.value;
    updateInjectButtonState();
  });
  
  // Inject button
  injectBtn.addEventListener('click', async () => {
    if (selectedProject && selectedVariant) {
      await injectScript(selectedProject, selectedVariant);
    }
  });
  
  // Refresh projects button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    projects = await fetchProjects();
    populateProjects(projects);
    
    // If a project is selected, refresh its variant list
    if (selectedProject) {
      const project = projects.find(p => p.name === selectedProject);
      if (project) {
        populateVariants(project);
        // Re-select the variant if it still exists
        if (selectedVariant && project.variants && project.variants.includes(selectedVariant)) {
          document.getElementById('variantSelect').value = selectedVariant;
        } else if (project.variants && project.variants.length > 0) {
          selectedVariant = project.variants[0];
          document.getElementById('variantSelect').value = selectedVariant;
        }
        updateInjectButtonState();
      }
    }
    showStatus('Projects refreshed', 'success');
  });
  
  // Reload page button
  document.getElementById('reloadBtn').addEventListener('click', reloadCurrentPage);
  
  // Auto-inject checkbox
  document.getElementById('autoInjectCheck').addEventListener('change', async (e) => {
    await saveAutoInject(e.target.checked);
    showStatus(e.target.checked ? 'Auto-inject enabled' : 'Auto-inject disabled', 'success');
  });
}

// Run initialization
init();

