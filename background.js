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
              func: (code, projectName, variantName) => {
                try {
                  const injectionKey = `${projectName}/${variantName}`;
                  
                  // Check if a script with this exact injection key already exists in the DOM
                  // This prevents multiple injections on the same page load
                  const existingScript = document.querySelector(`script[data-eli-injected="${injectionKey}"]`);
                  if (existingScript) {
                    console.log(`[ELI] Skipping injection of ${injectionKey} - script already exists in DOM`);
                    return;
                  }
                  
                  // Check if we've already injected this exact project/variant combination
                  // This prevents redeclaration errors on SPA navigation where window persists
                  // On full page reloads, window is reset so this check will pass
                  if (window.__eli_last_injected === injectionKey) {
                    // Already injected this combination - skip to prevent redeclaration
                    console.log(`[ELI] Skipping injection of ${injectionKey} - already injected (window flag)`);
                    return;
                  }
                  
                  // Set the flag IMMEDIATELY to prevent race conditions from multiple listener fires
                  // This must happen before any async operations
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
                  console.error('[ELI] Auto-injection error:', error);
                }
              },
              args: [scriptText, result.selectedProject, result.selectedVariant]
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
