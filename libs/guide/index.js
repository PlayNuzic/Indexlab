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
    allowClose: false,
    onReset: () => {
      if (typeof onEnd === 'function') onEnd();
    }
  });
  driver.defineSteps(steps);
  driver.start();
  return driver;
}

