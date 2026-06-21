import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SCALE,
  COLOR_BG, COLOR_FLOOR_GRID, COLOR_GUN
} from './constants.js';

let ctx;

export function setContext(context) {
  ctx = context;
}

export function clearCanvas() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function drawBackground() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = COLOR_FLOOR_GRID;
  ctx.lineWidth = 1;
  const step = SCALE * 4; // one grid cell = 4 logical pixels
  for (let x = 0; x <= CANVAS_WIDTH; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
  }
}

// Draw a sprite (2D array of color strings, null = transparent)
// x, y are logical coordinates of the top-left corner
export function drawSprite(sprite, x, y) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const color = sprite[row][col];
      if (color === null) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.floor(x * SCALE) + col * SCALE,
        Math.floor(y * SCALE) + row * SCALE,
        SCALE, SCALE
      );
    }
  }
}

// Draw a sprite centered on (cx, cy) in logical coords, rotated by angle radians
export function drawSpriteRotated(sprite, cx, cy, angle) {
  const cols = sprite[0].length;
  const rows = sprite.length;
  ctx.save();
  ctx.translate(cx * SCALE, cy * SCALE);
  ctx.rotate(angle);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const color = sprite[row][col];
      if (color === null) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        (col - cols / 2) * SCALE,
        (row - rows / 2) * SCALE,
        SCALE, SCALE
      );
    }
  }
  ctx.restore();
}

// Draw a rotated gun barrel extending from (cx, cy) toward angle
export function drawGun(cx, cy, angle) {
  ctx.save();
  ctx.translate(cx * SCALE, cy * SCALE);
  ctx.rotate(angle);
  ctx.fillStyle = COLOR_GUN;
  // barrel: 7px long, 2px tall, offset so it starts at center
  ctx.fillRect(0, -SCALE / 2, 7 * SCALE / 2, SCALE);
  ctx.restore();
}

// Solid filled rectangle in logical coords
export function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
}

// Draw a single pixel (1×1 logical unit) as a SCALE×SCALE square
export function drawPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x * SCALE), Math.floor(y * SCALE), SCALE, SCALE);
}

export function drawParticle(x, y, size, color, alpha) {
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.floor(x * SCALE - size * SCALE / 2),
    Math.floor(y * SCALE - size * SCALE / 2),
    size * SCALE, size * SCALE
  );
  ctx.globalAlpha = 1;
}

// Text drawn in canvas (display) coordinates
export function drawText(text, x, y, size, color, align = 'left') {
  ctx.font = `${size}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

// Canvas-coordinate rectangle (for HUD elements)
export function drawRectCanvas(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function drawCircleCanvas(cx, cy, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function strokeRectCanvas(x, y, w, h, color, lineWidth = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
