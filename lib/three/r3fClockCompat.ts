'use client';

import { getConsoleFunction, setConsoleFunction } from 'three';

/** Full message prefix from three.js `warn('Clock: …')`. */
const CLOCK_DEPRECATION_PREFIX = 'THREE.Clock: This module has been deprecated';

let installed = false;

/**
 * `@react-three/fiber` v9 still calls `new THREE.Clock()`, which logs a deprecation
 * warning in three.js r183+. `THREE.Clock` is a getter-only export — cannot be
 * replaced at runtime. Filter the known warning via `setConsoleFunction` instead.
 * @see https://github.com/pmndrs/react-three-fiber/issues/3741
 */
function installThreeClockDeprecationFilter() {
  if (installed) return;
  installed = true;

  const previous = getConsoleFunction();

  setConsoleFunction((type, message, ...params) => {
    if (type === 'warn' && message.includes(CLOCK_DEPRECATION_PREFIX)) {
      return;
    }

    if (previous) {
      previous(type, message, ...params);
      return;
    }

    console[type](message, ...params);
  });
}

installThreeClockDeprecationFilter();
