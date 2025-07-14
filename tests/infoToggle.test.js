/** @jest-environment jsdom */

test('info toggle hides and shows the help card', () => {
  document.body.innerHTML = `
    <button id="infoToggle">Mostra informació</button>
    <div id="infoCard" hidden></div>
  `;
  const infoToggle = document.getElementById('infoToggle');
  const infoCard = document.getElementById('infoCard');

  const handler = () => {
    const hidden = infoCard.hasAttribute('hidden');
    if (hidden) {
      infoCard.removeAttribute('hidden');
      infoToggle.textContent = 'Amaga informació';
    } else {
      infoCard.setAttribute('hidden', '');
      infoToggle.textContent = 'Mostra informació';
    }
  };

  infoToggle.onclick = handler;

  expect(infoCard.hasAttribute('hidden')).toBe(true);

  infoToggle.click();
  expect(infoCard.hasAttribute('hidden')).toBe(false);
  expect(infoToggle.textContent).toBe('Amaga informació');

  infoToggle.click();
  expect(infoCard.hasAttribute('hidden')).toBe(true);
  expect(infoToggle.textContent).toBe('Mostra informació');
});

