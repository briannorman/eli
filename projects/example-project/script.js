// Example project script
console.log('HEY BRIAN Example project loaded!');
document.body.style.border = '5px solid blue';

// Add a visual indicator
const indicator = document.createElement('div');
indicator.textContent = 'Example Project Active';
indicator.style.cssText = 'position: fixed; top: 10px; right: 10px; background: blue; color: white; padding: 10px; z-index: 99999; border-radius: 5px;';
document.body.appendChild(indicator);

