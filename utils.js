// ELI Utils - Utility functions for web experiments
// This file can be imported in variant code using: import utils from '@eli/utils';

export default {
  /**
   * Wait for an element to appear in the DOM
   * @param {string|Element} selector - CSS selector or element
   * @returns {Promise<Element>} Promise that resolves with the element (waits indefinitely)
   */
  waitForElement: function(selector) {
    return new Promise((resolve) => {
      // If selector is already an element, return it immediately
      if (selector instanceof Element) {
        resolve(selector);
        return;
      }

      // Check if element already exists
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      // Set up MutationObserver to watch for element
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  },

  /**
   * Wait until a condition function returns true
   * @param {Function} condition - Function that returns a boolean
   * @param {number} interval - Check interval in milliseconds (default: 100)
   * @returns {Promise} Promise that resolves when condition is met (waits indefinitely)
   */
  waitUntil: function(condition, interval = 100) {
    return new Promise((resolve, reject) => {
      const checkCondition = () => {
        try {
          if (condition()) {
            resolve();
          } else {
            setTimeout(checkCondition, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkCondition();
    });
  },

  /**
   * Get a cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  getCookie: function(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  },

  /**
   * Set a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Number of days until expiration (default: 365)
   * @param {string} path - Cookie path (default: '/')
   */
  setCookie: function(name, value, days = 365, path = '/') {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=${path}`;
  },

  /**
   * Get a URL query parameter value
   * @param {string} name - Parameter name
   * @param {string} url - Optional URL (defaults to current window location)
   * @returns {string|null} Parameter value or null if not found
   */
  getQueryParam: function(name, url = window.location.href) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(name);
  },

  /**
   * Trigger a custom event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @param {Element|string} target - Target element (defaults to document)
   */
  triggerEvent: function(eventName, data = {}, target = document) {
    const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
    if (targetEl) {
      const event = new CustomEvent(eventName, { detail: data });
      targetEl.dispatchEvent(event);
    }
  },

  /**
   * Select a single element
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (defaults to document)
   * @returns {Element|null} Element or null if not found
   */
  select: function(selector, context = document) {
    return context.querySelector(selector);
  },

  /**
   * Select multiple elements
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (defaults to document)
   * @returns {NodeList} NodeList of elements
   */
  selectAll: function(selector, context = document) {
    return context.querySelectorAll(selector);
  },

  /**
   * Add a class to an element
   * @param {Element|string} element - Element or selector
   * @param {string} className - Class name to add
   */
  addClass: function(element, className) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.add(className);
  },

  /**
   * Remove a class from an element
   * @param {Element|string} element - Element or selector
   * @param {string} className - Class name to remove
   */
  removeClass: function(element, className) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.remove(className);
  },

  /**
   * Toggle a class on an element
   * @param {Element|string} element - Element or selector
   * @param {string} className - Class name to toggle
   */
  toggleClass: function(element, className) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.toggle(className);
  },

  /**
   * Check if an element has a class
   * @param {Element|string} element - Element or selector
   * @param {string} className - Class name to check
   * @returns {boolean} True if element has the class
   */
  hasClass: function(element, className) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    return el ? el.classList.contains(className) : false;
  },

  /**
   * Add an event listener
   * @param {Element|string} element - Element or selector
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on: function(element, event, handler) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.addEventListener(event, handler);
  },

  /**
   * Remove an event listener
   * @param {Element|string} element - Element or selector
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off: function(element, event, handler) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.removeEventListener(event, handler);
  },

  /**
   * Event delegation - attach event to parent, handle on children
   * @param {Element|string} parent - Parent element or selector
   * @param {string} selector - Child selector to match
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  delegate: function(parent, selector, event, handler) {
    const parentEl = typeof parent === 'string' ? document.querySelector(parent) : parent;
    if (parentEl) {
      parentEl.addEventListener(event, (e) => {
        if (e.target.matches(selector) || e.target.closest(selector)) {
          handler(e);
        }
      });
    }
  },

  /**
   * Get the viewport dimensions
   * @returns {Object} Object with width and height
   */
  getViewport: function() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  },

  /**
   * Check if element is in viewport
   * @param {Element|string} element - Element or selector
   * @param {number} threshold - Visibility threshold (0-1, default: 0)
   * @returns {boolean} True if element is in viewport
   */
  isInViewport: function(element, threshold = 0) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const viewport = this.getViewport();

    return (
      rect.top >= -threshold * rect.height &&
      rect.left >= -threshold * rect.width &&
      rect.bottom <= viewport.height + threshold * rect.height &&
      rect.right <= viewport.width + threshold * rect.width
    );
  },

  /**
   * Scroll element into view
   * @param {Element|string} element - Element or selector
   * @param {Object} options - ScrollIntoView options
   */
  scrollIntoView: function(element, options = { behavior: 'smooth', block: 'center' }) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.scrollIntoView(options);
  }
};

