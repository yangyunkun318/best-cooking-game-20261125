// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a small scripted cook (add what the first ticket needs, serve when the
// plate matches), so every frame is what a short game really looks like and
// the same seed always gives the same frame.

import { STEP } from './config.js';
import { EVENT_OVER, matches } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 18;
const SERVE_SECONDS = 8;
const END_LIMIT_SECONDS = 600;

/** Add the next ingredient the first ticket still needs, if the plate has room. */
function feedFirstTicket(world) {
  const order = world.state.orders[0];
  if (!order) return;
  const counts = {};
  for (const id of world.state.plate) counts[id] = (counts[id] ?? 0) + 1;
  for (const id of order.needs) {
    if ((counts[id] ?? 0) < order.needs.filter((n) => n === id).length) {
      world.addIngredient(id);
      return;
    }
  }
}

/** Run the world for `seconds`, feeding the first ticket at the given times. */
function runFor(world, seconds, feedAt) {
  const steps = Math.round(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    const t = index * STEP;
    if (feedAt.some((at) => Math.abs(t - at) < STEP / 2)) feedFirstTicket(world);
    if (world.step(STEP, 'play') & EVENT_OVER) break;
  }
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, 'title');
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.begin();
  if (name === 'play') {
    // Eighteen seconds in: two tickets on the board, the plate holding the
    // first two ingredients of the first dish — a dish mid-assembly.
    runFor(world, PLAY_SECONDS, [2, 6]);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // Eight seconds in: the plate holds the whole first dish, its ticket lit
    // up and waiting for SERVE — a plate ready to serve.
    runFor(world, SERVE_SECONDS, [1, 2.5, 4, 5.5, 7]);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // End: cook the whole shift on autopilot — feed tickets, serve full plates —
  // until the timer runs out, so the frame is a real game-over screen.
  for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
    if (index % Math.round(1.5 / STEP) === 0) {
      const ready = world.state.orders.some((order) => matches(world.state.plate, order.needs));
      if (ready) world.serve();
      else feedFirstTicket(world);
    }
    if (world.step(STEP, 'play') & EVENT_OVER) break;
  }
  return { screen: SCREEN_OVER, best: world.state.score };
}
