// Driver.js is loaded globally via a script tag. This module provides a small
// helper around that global to keep the usage consistent across apps.
export function startTour(steps, onEnd) {
  const DriverCtor = window.Driver;
  if (!DriverCtor) {
    console.error('Driver.js not loaded');
    if (typeof onEnd === 'function') onEnd();
    return null;
  }
  const driver = new DriverCtor({
    showProgress: true,
    allowClose: true,
    onReset: onEnd
  });
  const validSteps = (steps || []).filter(step => {
    if (!step || !step.element) return false;
    return document.querySelector(step.element);
  });
  driver.defineSteps(validSteps);
  if (typeof driver.drive === 'function') {
    driver.drive();
  } else {
    driver.start();
  }
  return driver;
}

