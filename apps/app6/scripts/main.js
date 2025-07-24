import { init as initCards } from '../../../libs/cards/index.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('components-area');
  initCards(container, { notes: [0,2,1,2], scaleLen: 7, orientation: 'row', help: false });
});
