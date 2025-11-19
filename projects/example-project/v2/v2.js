import v2Html from './v2.html';
import v2Scss from './v2.scss';
import shared from '../shared.js';

// run the shared code (optional)   
shared();

// insert the html and scss
document.body.insertAdjacentHTML('afterbegin', v2Html);
document.head.insertAdjacentHTML('beforeend', `<style>${v2Scss}</style>`);

// modal functionality
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');

// close modal function
function closeModal() {
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
  }
}

// open modal function
function openModal() {
  if (modalOverlay) {
    modalOverlay.style.display = 'flex';
  }
}

// close button click handler
if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

// close on overlay click (but not on modal container)
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

// close on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display !== 'none') {
    closeModal();
  }
});

// open modal by default when page loads
openModal();

console.log('ELI:Project 1 v2 loaded!');