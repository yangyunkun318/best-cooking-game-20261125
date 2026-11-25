// Golden Ladle — Bistro Rush. Every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Length of one shift, in seconds. */
export const SHIFT_SECONDS = 90;

/** How long an order waits on the board before it times out. */
export const ORDER_SECONDS = 25;

/** Seconds between new orders arriving, while the board has room. */
export const ORDER_EVERY = 7;

/** At most this many orders on the board at once. */
export const MAX_ORDERS = 3;

/** Points for serving a dish, plus one point per second left on its ticket. */
export const SERVE_POINTS = 20;

/** Points lost when an order times out, or when serving a plate that matches nothing. */
export const TIMEOUT_POINTS = 10;
export const WRONG_SERVE_POINTS = 5;

/** The most ingredients one plate holds. */
export const PLATE_MAX = 4;

export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8b25c' },
  { id: 'patty', name: 'Patty', key: '2', color: '#8a5a33' },
  { id: 'lettuce', name: 'Lettuce', key: '3', color: '#6fbf4a' },
  { id: 'tomato', name: 'Tomato', key: '4', color: '#e5484d' },
  { id: 'cheese', name: 'Cheese', key: '5', color: '#f2c94c' },
  { id: 'onion', name: 'Onion', key: '6', color: '#b388d9' },
];

export const DISHES = [
  { name: 'Sunny Burger', needs: ['bun', 'patty', 'lettuce'] },
  { name: 'Garden Salad', needs: ['lettuce', 'tomato', 'cheese'] },
  { name: 'Melt Toast', needs: ['bun', 'cheese', 'tomato'] },
  { name: 'Tomato Soup', needs: ['tomato', 'onion'] },
  { name: 'Cheesy Stack', needs: ['bun', 'patty', 'cheese'] },
];

/** Where the fixed rectangles of the kitchen live, in logical pixels. */
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  board: { x: 24, y: 68, w: 1232, h: 108 },
  plate: { x: 640, y: 330 },
  serve: { x: 1072, y: 288, w: 168, h: 64 },
  trash: { x: 1072, y: 368, w: 168, h: 48 },
  stove: { x: 40, y: 240, w: 300, h: 200 },
  bins: { x: 24, y: 560, w: 1232, h: 136 },
};

/** The rectangle of one order ticket on the board, by its slot (0, 1, 2). */
export function ticketRect(slot) {
  const gap = 16;
  const w = (LAYOUT.board.w - gap * (MAX_ORDERS - 1)) / MAX_ORDERS;
  return {
    x: LAYOUT.board.x + slot * (w + gap),
    y: LAYOUT.board.y,
    w,
    h: LAYOUT.board.h,
  };
}

/** The rectangle of one ingredient bin on the counter, by its index (0..5). */
export function binRect(index) {
  const gap = 12;
  const count = INGREDIENTS.length;
  const w = (LAYOUT.bins.w - gap * (count - 1)) / count;
  return {
    x: LAYOUT.bins.x + index * (w + gap),
    y: LAYOUT.bins.y,
    w,
    h: LAYOUT.bins.h,
  };
}

export const PALETTE = {
  wall: '#3d2b1f',
  wallTile: '#4a3626',
  floor: '#2c2118',
  board: '#6b4a2f',
  boardEdge: '#54371f',
  ticket: '#fdf6e3',
  ticketInk: '#3a2a18',
  counter: '#8a5a33',
  counterTop: '#a9713f',
  plate: '#f5f0e6',
  plateEdge: '#d8cfc0',
  stove: '#3c3f45',
  steel: '#9aa0a8',
  serve: '#3f9e4d',
  serveGlow: '#7ed491',
  trash: '#7a4a3a',
  text: '#f5efe4',
  muted: '#c9b8a3',
  danger: '#e5484d',
  gold: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'golden-ladle.best';
