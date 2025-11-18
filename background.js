// Check if URL matches pattern
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

// Auto-inject selected project on page load (optional feature)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only auto-inject on complete page loads (not iframes)
  if (changeInfo.status === 'complete' && tab.url && tabId && tab.url.startsWith('http')) {
    // Check if auto-inject is enabled and get selected project
    const result = await chrome.storage.local.get(['autoInject', 'selectedProject', 'selectedFile']);
    
    if (result.autoInject && result.selectedProject && result.selectedFile) {
      try {
        // Get project config to check URL patterns
        const configResponse = await fetch(`http://localhost:8000/api/project/${result.selectedProject}/config`);
        let shouldInject = true;
        
        if (configResponse.ok) {
          const config = await configResponse.json();
          // Check if URL matches patterns
          if (config.urlPatterns && config.urlPatterns.length > 0) {
            shouldInject = urlMatchesAnyPattern(tab.url, config.urlPatterns);
          }
          // Check if project is enabled
          if (config.enabled === false) {
            shouldInject = false;
          }
        }
        
        if (shouldInject) {
          const timestamp = Date.now();
          const scriptUrl = `http://localhost:8000/api/project/${result.selectedProject}/${result.selectedFile}?v=${timestamp}`;
          
          const response = await fetch(scriptUrl);
          if (response.ok) {
            const scriptText = await response.text();
            
            chrome.scripting.executeScript({
              target: { tabId: tabId },
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
                  // console.log('[ELI] Script auto-executed successfully in MAIN world');
                } catch (error) {
                  console.error('[ELI] Auto-execution error:', error);
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
          }
        }
      } catch (e) {
        // Silently fail for auto-inject (user can manually inject via popup)
        console.debug('Auto-inject failed:', e);
      }
    }
  }
});
