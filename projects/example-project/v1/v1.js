import v1Html from './v1.html';
import v1Scss from './v1.scss';
import shared from '../shared.js';
import utils from '@eli/utils';

// run the shared code (optional)
shared();

// insert the html and scss
document.body.insertAdjacentHTML('afterbegin', v1Html);
document.head.insertAdjacentHTML('beforeend', `<style>${v1Scss}</style>`);

// use the utils to wait for an element to appear and then change the text content
utils.waitForElement('body h1').then(bodyH1 => {
  bodyH1.textContent = 'ELI: example-project - v1 loaded!';
  console.log('ELI: bodyH1 found!');
});

// use the utils to wait until a condition is met
utils.waitUntil(() => window.localStorage.getItem('example-storage-item')).then(() => {
  console.log('ELI: example-storage-item found!');
});

// set a timeout to set an item in localStorage that will be checked by the utils.waitUntil() function
setTimeout(() => {
  window.localStorage.setItem('example-storage-item', 'example-storage-item-value');
  console.log('ELI: example-storage-item set!');
}, 5000);

console.log('ELI: example-project - v1 loaded!');