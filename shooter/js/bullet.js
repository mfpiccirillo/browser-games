import { BULLET_DAMAGE, BULLET_RADIUS, BULLET_LIFETIME, PLAYER_BULLET_SPEED, COLOR_BULLET, LOGICAL_WIDTH, LOGICAL_HEIGHT } from './constants.js';
import { drawRect } from './renderer.js';

class Bullet {
  constructor() { this.active = false; }

  init(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * PLAYER_BULLET_SPEED;
    this.vy = Math.sin(angle) * PLAYER_BULLET_SPEED;
    this.damage = BULLET_DAMAGE;
    this.radius = BULLET_RADIUS;
    this.lifetime = BULLET_LIFETIME;
    this.active = true;
  }
}

export class BulletManager {
  constructor() {
    this.pool = Array.from({ length: 200 }, () => new Bullet());
  }

  spawn(x, y, angle) {
    const b = this.pool.find(b => !b.active);
    if (b) b.init(x, y, angle);
  }

  update(delta, enemies, particleSystem, onScore) {
    for (const b of this.pool) {
      if (!b.active) continue;
      b.x += b.vx * delta;
      b.y += b.vy * delta;
      b.lifetime -= delta;

      if (b.lifetime <= 0 || _oob(b)) { b.active = false; continue; }

      for (const e of enemies) {
        if (!e.alive) continue;
        if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
          e.takeDamage(b.damage, particleSystem);
          if (!e.alive) onScore(e.scoreValue, e.x, e.y);
          b.active = false;
          break;
        }
      }
    }
  }

  draw() {
    for (const b of this.pool) {
      if (!b.active) continue;
      drawRect(b.x - b.radius / 2, b.y - b.radius / 2, b.radius, b.radius, COLOR_BULLET);
    }
  }

  clear() {
    for (const b of this.pool) b.active = false;
  }
}

function _oob(b) {
  return b.x < -10 || b.x > LOGICAL_WIDTH + 10 || b.y < -10 || b.y > LOGICAL_HEIGHT + 10;
}
