import v2Html from './v2.html';
import v2Scss from './v2.scss';
import shared from '../shared.js';

// run the shared code (optional)   
shared();

// insert the html and scss
document.body.insertAdjacentHTML('afterbegin', v2Html);
document.head.insertAdjacentHTML('beforeend', `<style>${v2Scss}</style>`);

console.log('ELI:Project 1 v2 loaded!');