// Keyboard and pointer input. One-shot presses (start, serve, pause, trash)
// are queued and taken once by the loop, so a press between two frames is
// never lost and never counted twice. Clicks come back as logical canvas
// coordinates, so the caller can hit-test them against the kitchen layout.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_TRASH = 8;
export const ACTION_RESTART = 16;

const BIN_KEYS = new Map([
  ['Digit1', 0],
  ['Digit2', 1],
  ['Digit3', 2],
  ['Digit4', 3],
  ['Digit5', 4],
  ['Digit6', 5],
]);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const TRASH = new Set(['KeyX', 'Backspace']);
const RESTART = new Set(['KeyR']);

export function createInput(canvas) {
  let actions = 0;
  let bins = [];
  let clicks = [];

  function logical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (BIN_KEYS.has(event.code)) {
      if (!event.repeat) bins.push(BIN_KEYS.get(event.code));
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (TRASH.has(event.code)) {
      if (!event.repeat) actions |= ACTION_TRASH;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });
  canvas.addEventListener('pointerdown', (event) => {
    clicks.push(logical(event));
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Bin indexes tapped by number key since the last call. */
    takeBins() {
      const taken = bins;
      bins = [];
      return taken;
    },
    /** Pointer clicks since the last call, in logical coordinates. */
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
  };
}
