// Everything the player sees: the kitchen wall, the order board, the stove,
// the assembly plate, the serve button and the ingredient counter, drawn on
// one canvas. No images and no fonts are loaded: every ingredient is drawn
// from paths, so the game runs with no network request at all.

import {
  FIELD,
  INGREDIENTS,
  LAYOUT,
  PALETTE,
  FONT,
  SHIFT_SECONDS,
  binRect,
  ticketRect,
} from './config.js';
import { matches } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Draw one ingredient, centred at (cx, cy), about `size` pixels across. */
export function drawIngredient(ctx, id, cx, cy, size) {
  const s = size / 2;
  if (id === 'bun') {
    ctx.fillStyle = '#e8b25c';
    ctx.beginPath();
    ctx.arc(cx, cy, s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a3d';
    ctx.fillRect(cx - s, cy - 2, s * 2, 6);
    ctx.fillStyle = '#fff2cc';
    for (const [dx, dy] of [[-s * 0.45, -s * 0.45], [0, -s * 0.6], [s * 0.45, -s * 0.45]]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx, cy + dy, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = '#8a5a33';
    rr(ctx, cx - s, cy - s * 0.55, s * 2, s * 1.1, 8);
    ctx.fill();
    ctx.strokeStyle = '#5d3a1e';
    ctx.lineWidth = 3;
    for (const dy of [-s * 0.25, 0, s * 0.25]) {
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.7, cy + dy);
      ctx.lineTo(cx + s * 0.7, cy + dy);
      ctx.stroke();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#6fbf4a';
    for (const [dx, dy, r] of [[-s * 0.45, 0, s * 0.55], [0, -s * 0.2, s * 0.6], [s * 0.45, 0, s * 0.55]]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#4a8f2f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.6, cy + s * 0.3);
    ctx.quadraticCurveTo(cx, cy - s * 0.5, cx + s * 0.6, cy + s * 0.3);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.9);
    ctx.lineTo(cx - s * 0.4, cy - s * 0.45);
    ctx.lineTo(cx + s * 0.4, cy - s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2f7a38';
    ctx.fillRect(cx - 2, cy - s * 1.15, 4, s * 0.4);
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + s * 0.6);
    ctx.lineTo(cx + s, cy + s * 0.6);
    ctx.lineTo(cx + s, cy - s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a92c';
    for (const [dx, dy] of [[s * 0.3, s * 0.1], [s * 0.55, -s * 0.25]]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'onion') {
    ctx.fillStyle = '#b388d9';
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#efe6f7';
    ctx.lineWidth = 3;
    for (const r of [s * 0.6, s * 0.35]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#8e63b8';
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.9, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawWall() {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.wallTile;
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 10; x += 1) {
        ctx.fillRect(8 + x * 128 + (y % 2) * 32, 8 + y * 44, 120, 36);
      }
    }
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 540, FIELD.width, 180);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x < FIELD.width; x += 96) ctx.fillRect(x, 540, 2, 180);
  }

  function drawTopBar(state) {
    const bar = LAYOUT.topBar;
    ctx.fillStyle = 'rgba(20,12,6,0.85)';
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    text(ctx, 'GOLDEN LADLE', 24, 30, 26, PALETTE.gold, 'left');
    text(ctx, 'BISTRO RUSH', 250, 32, 15, PALETTE.muted, 'left');
    const left = state.timeLeft;
    const frac = left / SHIFT_SECONDS;
    text(ctx, `TIME ${formatTime(left)}`, 640, 22, 24, left < 15 ? PALETTE.danger : PALETTE.text, 'center');
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    rr(ctx, 520, 40, 240, 8, 4);
    ctx.fill();
    ctx.fillStyle = left < 15 ? PALETTE.danger : PALETTE.serve;
    rr(ctx, 520, 40, 240 * frac, 8, 4);
    ctx.fill();
    text(ctx, `SCORE ${state.score}`, 920, 30, 24, PALETTE.text, 'left');
    text(ctx, `SERVED ${state.served}`, 1256, 30, 20, PALETTE.muted, 'right');
  }

  function drawBoard(state) {
    const board = LAYOUT.board;
    ctx.fillStyle = PALETTE.board;
    rr(ctx, board.x - 8, board.y - 8, board.w + 16, board.h + 16, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.boardEdge;
    rr(ctx, board.x - 8, board.y - 8, board.w + 16, 10, 6);
    ctx.fill();
    for (let slot = 0; slot < 3; slot += 1) {
      const rect = ticketRect(slot);
      const order = state.orders[slot];
      ctx.fillStyle = order ? PALETTE.ticket : 'rgba(253,246,227,0.25)';
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      if (!order) {
        text(ctx, 'waiting for the next order…', rect.x + rect.w / 2, rect.y + rect.h / 2, 16, 'rgba(58,42,24,0.6)', 'center');
        continue;
      }
      const ready = matches(state.plate, order.needs);
      if (ready) {
        ctx.strokeStyle = PALETTE.serveGlow;
        ctx.lineWidth = 5;
        rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
        ctx.stroke();
      }
      text(ctx, order.dish.toUpperCase(), rect.x + 16, rect.y + 24, 20, PALETTE.ticketInk, 'left');
      if (ready) text(ctx, 'SERVE!', rect.x + rect.w - 16, rect.y + 24, 20, '#2f7a38', 'right');
      // What the ticket still needs: icons ticked off as the plate fills.
      const counts = {};
      for (const id of state.plate) counts[id] = (counts[id] ?? 0) + 1;
      const seen = {};
      let ix = rect.x + 40;
      for (const id of order.needs) {
        seen[id] = (seen[id] ?? 0) + 1;
        const done = (counts[id] ?? 0) >= seen[id];
        drawIngredient(ctx, id, ix, rect.y + 62, 44);
        if (done) {
          ctx.strokeStyle = '#2f7a38';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ix - 12, rect.y + 62);
          ctx.lineTo(ix - 3, rect.y + 71);
          ctx.lineTo(ix + 13, rect.y + 52);
          ctx.stroke();
        }
        ix += 56;
      }
      const frac = Math.max(0, order.timeLeft / order.maxTime);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      rr(ctx, rect.x + 16, rect.y + rect.h - 20, rect.w - 32, 10, 5);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#3f9e4d' : frac > 0.25 ? '#e8a13c' : PALETTE.danger;
      rr(ctx, rect.x + 16, rect.y + rect.h - 20, (rect.w - 32) * frac, 10, 5);
      ctx.fill();
    }
  }

  function drawStove() {
    const stove = LAYOUT.stove;
    ctx.fillStyle = PALETTE.stove;
    rr(ctx, stove.x, stove.y, stove.w, stove.h, 12);
    ctx.fill();
    text(ctx, 'STOVE', stove.x + 16, stove.y + 22, 14, '#c9ccd2', 'left');
    for (const bx of [stove.x + 70, stove.x + 210]) {
      ctx.fillStyle = '#23262b';
      ctx.beginPath();
      ctx.ellipse(bx, stove.y + 120, 58, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#565b63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(bx, stove.y + 120, 44, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#3a6ea5';
      ctx.beginPath();
      ctx.ellipse(bx, stove.y + 108, 40, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fb3d5';
      ctx.beginPath();
      ctx.ellipse(bx - 8, stove.y + 104, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, 'soup simmers here', stove.x + stove.w / 2, stove.y + stove.h - 18, 13, '#c9ccd2', 'center');
  }

  function drawPlate(state, now) {
    const plate = LAYOUT.plate;
    const shakeX = state.shake > 0 ? Math.sin(now * 40) * 6 * state.shake : 0;
    const cx = plate.x + shakeX;
    const cy = plate.y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 52, 150, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 150, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plateEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 150, 62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 112, 44, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (state.plate.length === 0) {
      text(ctx, 'your plate — click ingredients below', cx, cy, 15, '#9a8f80', 'center');
    } else {
      state.plate.forEach((id, index) => {
        drawIngredient(ctx, id, cx, cy - 8 - index * 26, 72);
      });
    }
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(229,72,77,${0.25 * state.flash})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 150, 62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, 'ASSEMBLY PLATE', cx, cy + 84, 13, PALETTE.muted, 'center');
  }

  function drawServe(state) {
    const serve = LAYOUT.serve;
    const ready = state.orders.some((order) => matches(state.plate, order.needs));
    ctx.fillStyle = ready ? PALETTE.serve : '#5c665e';
    rr(ctx, serve.x, serve.y, serve.w, serve.h, 12);
    ctx.fill();
    if (ready) {
      ctx.strokeStyle = PALETTE.serveGlow;
      ctx.lineWidth = 4;
      rr(ctx, serve.x, serve.y, serve.w, serve.h, 12);
      ctx.stroke();
    }
    text(ctx, 'SERVE', serve.x + serve.w / 2, serve.y + serve.h / 2, 28, '#ffffff', 'center');
    const trash = LAYOUT.trash;
    ctx.fillStyle = PALETTE.trash;
    rr(ctx, trash.x, trash.y, trash.w, trash.h, 10);
    ctx.fill();
    text(ctx, 'TRASH PLATE  (X)', trash.x + trash.w / 2, trash.y + trash.h / 2, 16, '#f5efe4', 'center');
    text(ctx, 'click a ticket to serve it, or SERVE', serve.x + serve.w / 2, serve.y + serve.h + 78, 13, PALETTE.muted, 'center');
  }

  function drawBins() {
    const bins = LAYOUT.bins;
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, bins.x - 8, bins.y - 8, bins.w + 16, bins.h + 16, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, bins.x - 8, bins.y - 8, bins.w + 16, 14, 6);
    ctx.fill();
    text(ctx, 'COUNTER — CLICK AN INGREDIENT TO ADD IT TO THE PLATE', bins.x + 4, bins.y - 22, 13, PALETTE.muted, 'left');
    INGREDIENTS.forEach((item, index) => {
      const rect = binRect(index);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.stroke();
      drawIngredient(ctx, item.id, rect.x + rect.w / 2, rect.y + 52, 64);
      text(ctx, item.name, rect.x + rect.w / 2, rect.y + 104, 18, PALETTE.text, 'center');
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rr(ctx, rect.x + 10, rect.y + 10, 26, 26, 6);
      ctx.fill();
      text(ctx, item.key, rect.x + 23, rect.y + 24, 16, '#ffffff', 'center');
    });
  }

  function drawPopups(state) {
    for (const popup of state.popups) {
      const alpha = Math.max(0, Math.min(1, popup.ttl));
      ctx.fillStyle = popup.text.startsWith('+') ? PALETTE.gold : PALETTE.danger;
      ctx.globalAlpha = alpha;
      text(ctx, popup.text, popup.x, popup.y, 30, popup.text.startsWith('+') ? PALETTE.gold : PALETTE.danger, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(15,8,4,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#2c1c10';
    rr(ctx, 290, 130, 700, 460, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    rr(ctx, 290, 130, 700, 460, 16);
    ctx.stroke();
    text(ctx, 'GOLDEN LADLE', 640, 205, 64, PALETTE.gold, 'center');
    text(ctx, 'BISTRO RUSH', 640, 258, 28, PALETTE.text, 'center');
    text(ctx, 'Orders fly in — build each dish on your plate', 640, 320, 20, PALETTE.text, 'center');
    text(ctx, 'and serve it before its ticket runs out.', 640, 350, 20, PALETTE.text, 'center');
    text(ctx, 'Click ingredients (or keys 1–6) · Space serves · X clears the plate', 640, 400, 17, PALETTE.muted, 'center');
    text(ctx, `Best score: ${best}`, 640, 445, 20, PALETTE.gold, 'center');
    text(ctx, 'CLICK OR PRESS SPACE TO START', 640, 520, 24, '#ffffff', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(15,8,4,0.65)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'PAUSED', 640, 340, 56, PALETTE.text, 'center');
    text(ctx, 'press P or click to keep cooking', 640, 400, 20, PALETTE.muted, 'center');
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(15,8,4,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#2c1c10';
    rr(ctx, 340, 170, 600, 380, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    rr(ctx, 340, 170, 600, 380, 16);
    ctx.stroke();
    text(ctx, 'SHIFT OVER!', 640, 235, 52, PALETTE.gold, 'center');
    text(ctx, `SCORE  ${state.score}`, 640, 310, 36, PALETTE.text, 'center');
    text(ctx, `Dishes served: ${state.served}    Orders lost: ${state.lost}`, 640, 365, 20, PALETTE.text, 'center');
    text(ctx, `Best score: ${best}`, 640, 405, 20, PALETTE.gold, 'center');
    text(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', 640, 490, 22, '#ffffff', 'center');
  }

  function draw(state, screen, best, now) {
    drawWall();
    drawTopBar(state);
    drawBoard(state);
    drawStove();
    drawPlate(state, now);
    drawServe(state);
    drawBins();
    drawPopups(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw };
}
