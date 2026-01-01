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
                  
                  // For auto-inject: Check if already injected to prevent bfcache re-injection
                  // This is the only difference from manual injection
                  const existingScript = document.querySelector(`script[data-eli-injected="${injectionKey}"]`);
                  if (existingScript) {
                    // Already injected - skip to prevent redeclaration errors
                    return;
                  }
                  
                  // Check legacy flag as well
                  if (window.__eli_last_injected === injectionKey) {
                    const checkScript = document.querySelector(`script[data-eli-injected="${injectionKey}"]`);
                    if (checkScript) {
                      return;
                    }
                    // Flag exists but script doesn't - might be stale, allow injection
                  }
                  
                  // Set the flag IMMEDIATELY to prevent race conditions
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
                  script.onerror = () => {
                    // Data URL failed (expected on sites with strict CSP) - try blob URL fallback
                    // Don't log the error object to reduce console noise
                    
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
                      blobScript.onerror = () => {
                        URL.revokeObjectURL(blobUrl);
                        
                        // Try direct script text injection as final fallback
                        try {
                          const directScript = document.createElement('script');
                          directScript.textContent = code;
                          directScript.setAttribute('data-eli-injected', injectionKey);
                          document.head.appendChild(directScript);
                          
                          window.__eli_injected.push(Date.now());
                          window.__eli_last_injected = injectionKey;
                          console.log('[ELI] Script injected via direct textContent method (blob URL was blocked)');
                        } catch (directError) {
                          console.error('[ELI] All script injection methods failed. The page\'s Content Security Policy is blocking script injection.');
                        }
                      };
                      
                      document.head.appendChild(blobScript);
                    } catch (blobError) {
                      // Try direct script text injection as fallback
                      try {
                        const directScript = document.createElement('script');
                        directScript.textContent = code;
                        directScript.setAttribute('data-eli-injected', injectionKey);
                        document.head.appendChild(directScript);
                        
                        window.__eli_injected.push(Date.now());
                        window.__eli_last_injected = injectionKey;
                        console.log('[ELI] Script injected via direct textContent method (blob creation failed)');
                      } catch (directError) {
                        console.error('[ELI] Failed to create blob URL and direct injection also failed. The page\'s Content Security Policy may be blocking all script injection methods.');
                      }
                    }
                  };
                  
                  document.head.appendChild(script);
                } catch (error) {
                  console.error('[ELI] Script injection error:', error);
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
