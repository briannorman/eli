import v1Html from './v1.html';
import v1Scss from './v1.scss';
import shared from '../shared.js';

shared();
document.body.insertAdjacentHTML('afterbegin', v1Html);
document.head.insertAdjacentHTML('beforeend', `<style>${v1Scss}</style>`);
console.log('ELI:Project 1 v1 loaded!');