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
    // Check if extension is enabled
    const result = await chrome.storage.local.get(['extensionEnabled', 'autoInject', 'selectedProject', 'selectedVariant']);
    
    // Default to enabled if not set (for backward compatibility)
    const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
    
    if (extensionEnabled && result.autoInject && result.selectedProject && result.selectedVariant) {
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
          const scriptUrl = `http://localhost:8000/api/project/${result.selectedProject}/${result.selectedVariant}/script.js?v=${timestamp}`;
          
          const response = await fetch(scriptUrl);
          if (response.ok) {
            const scriptText = await response.text();
            
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              world: 'MAIN', // Execute in main world
              func: (code) => {
                try {
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
                  script.onload = () => {
                    window.__eli_injected.push(Date.now());
                  };
                  script.onerror = (error) => {
                    console.error('[ELI] Data URL script loading failed, trying blob URL:', error);
                    
                    // Fallback to blob URL if data URL fails
                    try {
                      const blob = new Blob([code], { type: 'application/javascript' });
                      const blobUrl = URL.createObjectURL(blob);
                      
                      const blobScript = document.createElement('script');
                      blobScript.src = blobUrl;
                      blobScript.onload = () => {
                        URL.revokeObjectURL(blobUrl);
                        window.__eli_injected.push(Date.now());
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
                  console.error('[ELI] Auto-injection error:', error);
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
