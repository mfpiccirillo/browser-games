import {
  LOGICAL_WIDTH, LOGICAL_HEIGHT,
  PLAYER_SPEED, PLAYER_MAX_HEALTH, PLAYER_SHOOT_COOLDOWN, PLAYER_RADIUS,
  COLOR_PLAYER, COLOR_PLAYER_EYE, COLOR_GUN
} from './constants.js';
import { drawSpriteRotated, drawGun } from './renderer.js';

const P = COLOR_PLAYER;
const E = COLOR_PLAYER_EYE;
const _ = null;

const SPRITE_IDLE = [
  [_, P, P, P, P, _],
  [P, P, E, E, P, P],
  [P, P, P, P, P, P],
  [P, P, P, P, P, P],
  [_, P, P, P, P, _],
  [_, P, _, _, P, _],
  [_, P, _, _, P, _],
  [_, _, _, _, _, _],
];

const SPRITE_WALK_A = [
  [_, P, P, P, P, _],
  [P, P, E, E, P, P],
  [P, P, P, P, P, P],
  [P, P, P, P, P, P],
  [_, P, P, P, P, _],
  [P, _, P, P, _, P],
  [P, _, _, _, _, P],
  [_, _, _, _, _, _],
];

const SPRITE_WALK_B = [
  [_, P, P, P, P, _],
  [P, P, E, E, P, P],
  [P, P, P, P, P, P],
  [P, P, P, P, P, P],
  [_, P, P, P, P, _],
  [_, P, _, _, P, _],
  [P, _, _, _, _, P],
  [_, _, _, _, _, _],
];

const WALK_FRAMES = [SPRITE_WALK_A, SPRITE_WALK_B];

// Active powerup effect timers (seconds remaining)
const EFFECT_DURATION = {
  speed:       8,
  rapid_fire:  8,
  triple_shot: 8,
};

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.gunAngle = 0;
    this.shootCooldown = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.isMoving = false;
    this.alive = true;
    this.invincibleTimer = 0;
    this.radius = PLAYER_RADIUS;

    // active effect timers (0 = inactive)
    this.effects = { speed: 0, rapid_fire: 0, triple_shot: 0 };
  }

  get speed()           { return PLAYER_SPEED * (this.effects.speed > 0 ? 1.9 : 1.0); }
  get baseCooldown()    { return PLAYER_SHOOT_COOLDOWN * (this.effects.rapid_fire > 0 ? 0.35 : 1.0); }
  get bulletCount()     { return this.effects.triple_shot > 0 ? 3 : 1; }

  update(delta, input, bulletManager, particleSystem) {
    this._handleMovement(delta, input);
    this._handleAiming(input);
    this._handleShooting(delta, input, bulletManager, particleSystem);
    this._updateAnimation(delta);
    this._tickEffects(delta);

    if (this.invincibleTimer > 0) this.invincibleTimer -= delta;
    if (this.shootCooldown > 0)   this.shootCooldown   -= delta;

    const margin = 4;
    this.x = Math.max(margin, Math.min(LOGICAL_WIDTH  - margin, this.x));
    this.y = Math.max(margin, Math.min(LOGICAL_HEIGHT - margin, this.y));
  }

  _handleMovement(delta, input) {
    let dx = 0, dy = 0;
    if (input.keys['a'] || input.keys['arrowleft'])  dx -= 1;
    if (input.keys['d'] || input.keys['arrowright']) dx += 1;
    if (input.keys['w'] || input.keys['arrowup'])    dy -= 1;
    if (input.keys['s'] || input.keys['arrowdown'])  dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    if (input.joystick.active) { dx = input.joystick.dx; dy = input.joystick.dy; }
    this.x += dx * this.speed * delta;
    this.y += dy * this.speed * delta;
    this.isMoving = dx !== 0 || dy !== 0;
  }

  _handleAiming(input) {
    this.gunAngle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
  }

  _handleShooting(delta, input, bulletManager, particleSystem) {
    if (this.shootCooldown > 0) return;
    // spacebar fires; holding it auto-fires
    if (!input.keys[' ']) return;

    const count = this.bulletCount;
    const spread = count > 1 ? 0.22 : 0;  // radians between spread bullets

    for (let i = 0; i < count; i++) {
      const offset = (i - Math.floor(count / 2)) * spread;
      const angle  = this.gunAngle + offset;
      const muzzleX = this.x + Math.cos(angle) * 7;
      const muzzleY = this.y + Math.sin(angle) * 7;
      bulletManager.spawn(this.x, this.y, angle);
      particleSystem.spawnMuzzleFlash(muzzleX, muzzleY, angle);
    }
    this.shootCooldown = this.baseCooldown;
  }

  _updateAnimation(delta) {
    if (!this.isMoving) { this.animFrame = 0; this.animTimer = 0; return; }
    this.animTimer += delta;
    if (this.animTimer >= 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % WALK_FRAMES.length;
    }
  }

  _tickEffects(delta) {
    for (const k of Object.keys(this.effects)) {
      if (this.effects[k] > 0) this.effects[k] = Math.max(0, this.effects[k] - delta);
    }
  }

  applyPowerup(type) {
    if (type === 'health') {
      this.health = Math.min(this.maxHealth, this.health + 30);
    } else if (EFFECT_DURATION[type] !== undefined) {
      this.effects[type] = EFFECT_DURATION[type];
    }
  }

  takeDamage(amount) {
    if (this.invincibleTimer > 0) return;
    this.health -= amount;
    this.invincibleTimer = 0.5;
    if (this.health <= 0) { this.health = 0; this.alive = false; }
  }

  draw() {
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 12) % 2 === 0) return;

    // tint sprite cyan during speed boost
    const sprite = this.isMoving ? WALK_FRAMES[this.animFrame] : SPRITE_IDLE;
    drawSpriteRotated(sprite, this.x, this.y, 0);
    drawGun(this.x, this.y, this.gunAngle);
  }
}
