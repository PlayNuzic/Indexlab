import { init as initCards } from '../../../libs/cards/index.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('components-area');
  initCards(container, { notes: [0,2,4,5], scaleLen: 7, orientation: 'column', help: true });
});
