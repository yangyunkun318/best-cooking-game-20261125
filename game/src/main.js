// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, LAYOUT, STEP, binRect, ticketRect } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_SERVED, EVENT_TIMEOUT } from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_PAUSE,
  ACTION_RESTART,
  ACTION_TRASH,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

/** The screen the loop is on, kept at module scope so the test handle can read it. */
let screen = SCREEN_TITLE;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    world.begin();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve orders before their tickets run out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${world.state.score}. Best ${best}.`);
  }

  /** One click during play: bins add, tickets serve, SERVE serves, trash clears. */
  function handleClick(point) {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (inside(point, LAYOUT.serve)) {
      const result = world.serve();
      if (result.served) announce(`Served! +${result.points}. Score ${world.state.score}.`);
      return;
    }
    if (inside(point, LAYOUT.trash)) {
      world.clearPlate();
      return;
    }
    for (let slot = 0; slot < 3; slot += 1) {
      if (inside(point, ticketRect(slot))) {
        const result = world.serveTicket(slot);
        if (result.served) announce(`Served! +${result.points}. Score ${world.state.score}.`);
        return;
      }
    }
    for (let index = 0; index < 6; index += 1) {
      if (inside(point, binRect(index))) {
        world.addIngredient(['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'][index]);
        return;
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    for (const index of input.takeBins()) {
      if (screen === SCREEN_PLAY) {
        world.addIngredient(['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'][index]);
      }
    }
    for (const point of input.takeClicks()) handleClick(point);
    if (actions & ACTION_CONFIRM && screen === SCREEN_PLAY) {
      const result = world.serve();
      if (result.served) announce(`Served! +${result.points}. Score ${world.state.score}.`);
    } else if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (actions & ACTION_TRASH && screen === SCREEN_PLAY) world.clearPlate();
    if (actions & ACTION_RESTART && screen === SCREEN_OVER) startGame();
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const events = world.step(STEP, 'play');
    if (events & EVENT_OVER) endGame();
    else if (events & EVENT_SERVED) announce(`Served! Score ${world.state.score}.`);
    else if (events & EVENT_TIMEOUT) announce(`An order timed out. Score ${world.state.score}.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        if (screen === SCREEN_TITLE) world.step(STEP, 'title');
        else step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, now / 1000);
  }

  // Leaving the tab pauses a running game rather than letting tickets run out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Golden Ladle. Press Space or click to start.');
  requestAnimationFrame(frame);
}

// A handle for play-testing from the console or a test driver.
window.__ladle = { world, getScreen: () => screen };

if (shot) runShot(shot);
else runGame();
