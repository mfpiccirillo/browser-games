import { PARTICLE_LIFETIME, MUZZLE_FLASH_LIFETIME, COLOR_PARTICLE, COLOR_WHITE, COLOR_BULLET } from './constants.js';
import { drawParticle } from './renderer.js';

function rand(min, max) { return min + Math.random() * (max - min); }

class Particle {
  constructor() { this.active = false; }

  init(x, y, vx, vy, color, lifetime, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = size;
    this.active = true;
  }
}

export class ParticleSystem {
  constructor() {
    this.pool = Array.from({ length: 500 }, () => new Particle());
  }

  _spawn(x, y, vx, vy, color, lifetime, size) {
    const p = this.pool.find(p => !p.active);
    if (p) p.init(x, y, vx, vy, color, lifetime, size);
  }

  spawnDeathExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + rand(-0.3, 0.3);
      const speed = rand(30, 80);
      this._spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, PARTICLE_LIFETIME, rand(1, 2));
    }
    for (let i = 0; i < 6; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(10, 40);
      this._spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        COLOR_PARTICLE, PARTICLE_LIFETIME * 0.5, 1);
    }
  }

  spawnMuzzleFlash(x, y, angle) {
    for (let i = 0; i < 5; i++) {
      const spread = rand(-0.35, 0.35);
      const speed  = rand(40, 90);
      this._spawn(x, y,
        Math.cos(angle + spread) * speed,
        Math.sin(angle + spread) * speed,
        COLOR_BULLET, MUZZLE_FLASH_LIFETIME, 1);
    }
  }

  spawnHitSpark(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(20, 50);
      this._spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        COLOR_WHITE, 0.15, 1);
    }
  }

  update(delta) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vx *= Math.pow(0.92, delta * 60); // frame-rate-independent friction
      p.vy *= Math.pow(0.92, delta * 60);
      p.lifetime -= delta;
      if (p.lifetime <= 0) p.active = false;
    }
  }

  draw() {
    for (const p of this.pool) {
      if (!p.active) continue;
      drawParticle(p.x, p.y, p.size, p.color, p.lifetime / p.maxLifetime);
    }
  }
}
