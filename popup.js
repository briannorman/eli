const API_BASE = 'http://localhost:8000/api';

let projects = [];
let selectedProject = null;
let selectedFile = null;

// Load saved preferences
async function loadSavedPreferences() {
  const result = await chrome.storage.local.get(['selectedProject', 'selectedFile', 'autoInject']);
  return {
    project: result.selectedProject || null,
    file: result.selectedFile || null,
    autoInject: result.autoInject || false
  };
}

// Save project preference
async function saveProject(projectName, filename = null) {
  await chrome.storage.local.set({ 
    selectedProject: projectName,
    selectedFile: filename
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
    return data.projects || [];
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

// Populate file dropdown
function populateFiles(project) {
  const fileSelect = document.getElementById('fileSelect');
  const fileLabel = document.getElementById('fileSelectLabel');
  
  if (!project || !project.files || project.files.length === 0) {
    fileSelect.style.display = 'none';
    fileLabel.style.display = 'none';
    fileSelect.innerHTML = '<option value="">-- No files available --</option>';
    return;
  }
  
  fileSelect.style.display = 'block';
  fileLabel.style.display = 'block';
  fileSelect.innerHTML = '<option value="">-- Select a file --</option>';
  
  project.files.forEach(filename => {
    const option = document.createElement('option');
    option.value = filename;
    option.textContent = filename;
    fileSelect.appendChild(option);
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
        populateFiles(project);
        
        // Restore selected file
        if (prefs.file && project.files && project.files.includes(prefs.file)) {
          document.getElementById('fileSelect').value = prefs.file;
          selectedFile = prefs.file;
        } else if (project.files && project.files.length > 0) {
          // Auto-select first file if available
          selectedFile = project.files[0];
          document.getElementById('fileSelect').value = selectedFile;
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
  injectBtn.disabled = !selectedProject || !selectedFile;
}

// Inject script into current tab
async function injectScript(projectName, filename) {
  try {
    if (!filename) {
      showStatus('Please select a file to inject', 'error');
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
    const scriptUrl = `${API_BASE}/project/${projectName}/${filename}?v=${timestamp}`;
    
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
          console.log('[ELI] Script executed successfully in MAIN world');
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
    
    await saveProject(projectName, filename);
    selectedProject = projectName;
    selectedFile = filename;
    if (project) {
      await updateProjectInfo(project);
    }
    showStatus(`Injected: ${project?.displayName || projectName} - ${filename}`, 'success');
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
  
  const fileSelect = document.getElementById('fileSelect');
  
  select.addEventListener('change', async (e) => {
    selectedProject = e.target.value;
    selectedFile = null;
    
    if (selectedProject) {
      const project = projects.find(p => p.name === selectedProject);
      if (project) {
        populateFiles(project);
        // Auto-select first file if available
        if (project.files && project.files.length > 0) {
          selectedFile = project.files[0];
          fileSelect.value = selectedFile;
        }
        await updateProjectInfo(project);
      }
    } else {
      fileSelect.style.display = 'none';
      document.getElementById('fileSelectLabel').style.display = 'none';
      updateProjectInfo(null);
    }
    updateInjectButtonState();
  });
  
  fileSelect.addEventListener('change', (e) => {
    selectedFile = e.target.value;
    updateInjectButtonState();
  });
  
  // Inject button
  injectBtn.addEventListener('click', async () => {
    if (selectedProject && selectedFile) {
      await injectScript(selectedProject, selectedFile);
    }
  });
  
  // Refresh projects button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    projects = await fetchProjects();
    populateProjects(projects);
    
    // If a project is selected, refresh its file list
    if (selectedProject) {
      const project = projects.find(p => p.name === selectedProject);
      if (project) {
        populateFiles(project);
        // Re-select the file if it still exists
        if (selectedFile && project.files && project.files.includes(selectedFile)) {
          document.getElementById('fileSelect').value = selectedFile;
        } else if (project.files && project.files.length > 0) {
          selectedFile = project.files[0];
          document.getElementById('fileSelect').value = selectedFile;
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

