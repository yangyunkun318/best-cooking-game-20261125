// The game's rules and state, with no drawing and no browser in it: orders
// arriving on the board, the plate being assembled, serving, timeouts, the
// shift timer and the score. step() advances one fixed step and returns what
// happened as bit flags, so the caller can react without the world knowing
// about screens or sound. Nothing here allocates after createWorld returns.

import {
  DISHES,
  MAX_ORDERS,
  ORDER_EVERY,
  ORDER_SECONDS,
  PLATE_MAX,
  SERVE_POINTS,
  SHIFT_SECONDS,
  TIMEOUT_POINTS,
  WRONG_SERVE_POINTS,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_TIMEOUT = 2;
export const EVENT_OVER = 4;
export const EVENT_WRONG = 8;

/** True when two ingredient lists hold the same items, order aside. */
export function matches(plate, needs) {
  if (plate.length !== needs.length) return false;
  const counts = {};
  for (const id of plate) counts[id] = (counts[id] ?? 0) + 1;
  for (const id of needs) {
    if (!counts[id]) return false;
    counts[id] -= 1;
  }
  return true;
}

export function createWorld(random) {
  const state = {
    mode: 'title',
    score: 0,
    served: 0,
    lost: 0,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    orders: [],
    plate: [],
    popups: [],
    flash: 0,
    shake: 0,
    nextOrderId: 1,
    spawnTimer: ORDER_EVERY,
  };

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const dish = DISHES[Math.floor(random() * DISHES.length)];
    state.orders.push({
      id: state.nextOrderId,
      dish: dish.name,
      needs: [...dish.needs],
      timeLeft: ORDER_SECONDS,
      maxTime: ORDER_SECONDS,
    });
    state.nextOrderId += 1;
  }

  function reset() {
    state.mode = 'title';
    state.score = 0;
    state.served = 0;
    state.lost = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.orders = [];
    state.plate = [];
    state.popups = [];
    state.flash = 0;
    state.shake = 0;
    state.nextOrderId = 1;
    state.spawnTimer = ORDER_EVERY;
    spawnOrder();
  }

  function begin() {
    state.mode = 'play';
  }

  function popup(text, x, y) {
    state.popups.push({ text, x, y, ttl: 1.2 });
  }

  /** Put one ingredient on the plate. False when the plate is already full. */
  function addIngredient(id) {
    if (state.mode !== 'play') return false;
    if (state.plate.length >= PLATE_MAX) return false;
    state.plate.push(id);
    return true;
  }

  function clearPlate() {
    state.plate = [];
  }

  /** Serve the plate to the first order it matches. Returns what happened. */
  function serve() {
    if (state.mode !== 'play') return { served: false };
    for (let index = 0; index < state.orders.length; index += 1) {
      const order = state.orders[index];
      if (!matches(state.plate, order.needs)) continue;
      const points = SERVE_POINTS + Math.ceil(order.timeLeft);
      state.score += points;
      state.served += 1;
      state.orders.splice(index, 1);
      state.plate = [];
      popup(`+${points}`, 640, 300);
      return { served: true, points };
    }
    state.score = Math.max(0, state.score - WRONG_SERVE_POINTS);
    state.flash = 0.5;
    state.shake = 0.4;
    popup(`-${WRONG_SERVE_POINTS}`, 640, 300);
    return { served: false };
  }

  /** Serve the plate to one ticket in particular. Wrong ticket: a flash, no serve. */
  function serveTicket(slot) {
    if (state.mode !== 'play') return { served: false };
    const order = state.orders[slot];
    if (!order) return { served: false };
    if (!matches(state.plate, order.needs)) {
      state.score = Math.max(0, state.score - WRONG_SERVE_POINTS);
      state.flash = 0.5;
      state.shake = 0.4;
      popup(`-${WRONG_SERVE_POINTS}`, 640, 300);
      return { served: false };
    }
    const points = SERVE_POINTS + Math.ceil(order.timeLeft);
    state.score += points;
    state.served += 1;
    state.orders.splice(slot, 1);
    state.plate = [];
    popup(`+${points}`, 640, 300);
    return { served: true, points };
  }

  /**
   * One fixed step. In 'title' mode the kitchen idles: orders arrive and sit,
   * nothing times out and the shift never runs down. In 'play' mode the shift
   * timer runs, orders time out, and the shift ends at zero.
   */
  function step(dt, mode) {
    let events = 0;
    for (let index = state.popups.length - 1; index >= 0; index -= 1) {
      state.popups[index].ttl -= dt;
      state.popups[index].y -= 30 * dt;
      if (state.popups[index].ttl <= 0) state.popups.splice(index, 1);
    }
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (mode === 'title') {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnOrder();
        state.spawnTimer += ORDER_EVERY;
      }
      return events;
    }
    if (state.mode !== 'play') return events;
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.mode = 'over';
      return events | EVENT_OVER;
    }
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      state.spawnTimer += ORDER_EVERY;
    }
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.timeLeft -= dt;
      if (order.timeLeft > 0) continue;
      state.orders.splice(index, 1);
      state.lost += 1;
      state.score = Math.max(0, state.score - TIMEOUT_POINTS);
      popup(`Too slow! -${TIMEOUT_POINTS}`, 640, 200);
      events |= EVENT_TIMEOUT;
    }
    return events;
  }

  reset();
  return { state, reset, begin, step, spawnOrder, addIngredient, clearPlate, serve, serveTicket };
}
