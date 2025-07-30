import { driver } from '../vendor/driver.min.js';

export function startTour(steps) {
  const driverObj = driver({
    showProgress: true,
    allowClose: false,
    steps
  });
  driverObj.drive();
  return driverObj;
}

