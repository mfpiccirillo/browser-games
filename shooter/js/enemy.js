import {
  LOGICAL_WIDTH, LOGICAL_HEIGHT,
  COLOR_ENEMY_A, COLOR_ENEMY_B, COLOR_ENEMY_C,
  COLOR_WHITE, COLOR_RED, COLOR_GREEN, SCALE
} from './constants.js';
import { drawSpriteRotated, drawRectCanvas, strokeRectCanvas } from './renderer.js';

function rand(min, max) { return min + Math.random() * (max - min); }

// ─── Sprite definitions ────────────────────────────────────────────────────────

const R = COLOR_ENEMY_A;  // Grunt red
const C = COLOR_ENEMY_B;  // Speeder cyan
const T = COLOR_ENEMY_C;  // Tank purple
const _ = null;

// Grunt — 8×8 humanoid blob
const GRUNT_FRAMES = [
  [
    [_, R, R, R, R, _],
    [R, R, R, R, R, R],
    [R, _, R, R, _, R],
    [R, R, R, R, R, R],
    [_, R, R, R, R, _],
    [_, R, _, _, R, _],
    [_, R, _, _, R, _],
    [_, _, _, _, _, _],
  ],
  [
    [_, R, R, R, R, _],
    [R, R, R, R, R, R],
    [R, _, R, R, _, R],
    [R, R, R, R, R, R],
    [_, R, R, R, R, _],
    [R, _, _, _, _, R],
    [R, _, _, _, _, R],
    [_, _, _, _, _, _],
  ],
];

// Speeder — 6×6 compact diamond
const SPEEDER_FRAMES = [
  [
    [_, C, C, C, C, _],
    [C, C, C, C, C, C],
    [C, _, C, C, _, C],
    [C, C, C, C, C, C],
    [_, C, C, C, C, _],
    [_, _, C, C, _, _],
  ],
  [
    [_, C, C, C, C, _],
    [C, C, C, C, C, C],
    [C, _, C, C, _, C],
    [C, C, C, C, C, C],
    [_, C, C, C, C, _],
    [_, C, _, _, C, _],
  ],
];

// Tank — 8×8 large blocky rect
const TANK_FRAMES = [
  [
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, _, _, _, _, T, T],
    [T, T, _, T, T, _, T, T],
    [T, T, _, T, T, _, T, T],
    [T, T, _, _, _, _, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
  [
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, _, _, _, _, T, T],
    [T, T, _, _, _, _, T, T],
    [T, T, _, _, _, _, T, T],
    [T, T, _, _, _, _, T, T],
    [T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T],
  ],
];

// ─── Base Enemy ───────────────────────────────────────────────────────────────

class Enemy {
  constructor(x, y, config) {
    this.x = x; this.y = y;
    this.speed     = config.speed;
    this.health    = config.health;
    this.maxHealth = config.health;
    this.damage    = config.damage;
    this.radius    = config.radius;
    this.scoreValue= config.scoreValue;
    this.frames    = config.frames;
    this.showHealthBar = config.showHealthBar || false;
    this.alive     = true;
    this.animTimer = 0;
    this.animFrame = 0;
  }

  update(delta, player) {
    this._moveToward(delta, player.x, player.y);
    this.animTimer += delta;
    if (this.animTimer >= 0.2) { this.animFrame ^= 1; this.animTimer = 0; }
  }

  _moveToward(delta, tx, ty) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * delta;
      this.y += (dy / dist) * this.speed * delta;
    }
  }

  takeDamage(amount, particleSystem) {
    this.health -= amount;
    particleSystem.spawnHitSpark(this.x, this.y);
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      particleSystem.spawnDeathExplosion(this.x, this.y, this.frames[0][0].find(c => c !== null));
    }
  }

  draw() {
    drawSpriteRotated(this.frames[this.animFrame], this.x, this.y, 0);
    if (this.showHealthBar) this._drawHealthBar();
  }

  _drawHealthBar() {
    const bw = 20, bh = 3;
    const bx = Math.floor(this.x * SCALE) - bw / 2;
    const by = Math.floor(this.y * SCALE) - this.radius * SCALE - 6;
    drawRectCanvas(bx - 1, by - 1, bw + 2, bh + 2, '#000');
    drawRectCanvas(bx, by, bw, bh, '#440000');
    const fill = Math.round((this.health / this.maxHealth) * bw);
    drawRectCanvas(bx, by, fill, bh, COLOR_RED);
    strokeRectCanvas(bx - 1, by - 1, bw + 2, bh + 2, COLOR_WHITE);
  }
}

// ─── Grunt ────────────────────────────────────────────────────────────────────

export class Grunt extends Enemy {
  constructor(x, y) {
    super(x, y, { speed: 40, health: 40, damage: 10, radius: 5, scoreValue: 100, frames: GRUNT_FRAMES });
  }
}

// ─── Speeder ──────────────────────────────────────────────────────────────────

export class Speeder extends Enemy {
  constructor(x, y) {
    super(x, y, { speed: 90, health: 20, damage: 15, radius: 4, scoreValue: 150, frames: SPEEDER_FRAMES });
    this.zigzagTimer  = 0;
    this.zigzagOffset = 0;
  }

  update(delta, player) {
    this.zigzagTimer += delta;
    if (this.zigzagTimer >= 0.4) {
      this.zigzagTimer  = 0;
      this.zigzagOffset = (Math.random() - 0.5) * 60;
    }
    // move toward player with perpendicular zigzag
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      const nx = dx / dist, ny = dy / dist;
      const px = -ny, py = nx; // perpendicular
      this.x += (nx * this.speed + px * this.zigzagOffset) * delta;
      this.y += (ny * this.speed + py * this.zigzagOffset) * delta;
    }
    this.animTimer += delta;
    if (this.animTimer >= 0.12) { this.animFrame ^= 1; this.animTimer = 0; }
  }
}

// ─── Tank ─────────────────────────────────────────────────────────────────────

export class Tank extends Enemy {
  constructor(x, y) {
    super(x, y, { speed: 22, health: 120, damage: 25, radius: 7, scoreValue: 300, frames: TANK_FRAMES, showHealthBar: true });
  }
}

// ─── Spawn helper ─────────────────────────────────────────────────────────────

export function spawnFromEdge(EnemyClass) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  const W = LOGICAL_WIDTH, H = LOGICAL_HEIGHT;
  if (edge === 0) { x = rand(0, W); y = -12; }
  else if (edge === 1) { x = W + 12; y = rand(0, H); }
  else if (edge === 2) { x = rand(0, W); y = H + 12; }
  else                 { x = -12;     y = rand(0, H); }
  return new EnemyClass(x, y);
}

export const ENEMY_CLASSES = { Grunt, Speeder, Tank };
