import { SCALE, COLOR_WHITE, COLOR_GREEN } from './constants.js';
import { drawRectCanvas, drawText } from './renderer.js';

// Powerup type configs
export const POWERUP_TYPES = ['health', 'speed', 'rapid_fire', 'triple_shot'];
const DROP_CHANCE = 0.3; // 30% per enemy kill

const CONFIG = {
  health:      { color: '#44ff44', icon: '+HP',  label: 'HEALTH PACK'  },
  speed:       { color: '#4ae8e8', icon: 'SPD',  label: 'SPEED BOOST'  },
  rapid_fire:  { color: '#ffe066', icon: 'RFR',  label: 'RAPID FIRE'   },
  triple_shot: { color: '#ff8800', icon: '3X',   label: 'TRIPLE SHOT'  },
};

const COLLECT_RADIUS = 7; // logical pixels

class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type   = type;
    this.config = CONFIG[type];
    this.alive  = true;
    this.timer  = 0;  // for pulsing animation
    this.radius = 5;
    this.lifetime = 12; // despawn after 12 seconds
  }

  update(delta) {
    this.timer    += delta;
    this.lifetime -= delta;
    if (this.lifetime <= 0) this.alive = false;
  }

  draw() {
    const pulse = 0.8 + Math.sin(this.timer * 4) * 0.2;
    const cx = Math.floor(this.x * SCALE);
    const cy = Math.floor(this.y * SCALE);
    const r  = Math.floor(this.radius * SCALE * pulse);

    // outer glow ring
    const cfg = this.config;
    _drawCircle(cx, cy, r + 3, cfg.color, 0.25);
    // main body
    _drawCircle(cx, cy, r, cfg.color, 1.0);
    // dark inner
    _drawCircle(cx, cy, Math.floor(r * 0.55), '#000000', 0.7);

    // flashing outline when about to despawn
    if (this.lifetime < 3 && Math.floor(this.timer * 6) % 2 === 0) {
      _drawCircle(cx, cy, r + 1, COLOR_WHITE, 0.6);
    }

    // icon label drawn in canvas coords
    const fs = r < 16 ? 8 : 10;
    drawText(cfg.icon, cx, cy - fs / 2, fs, COLOR_WHITE, 'center');
  }

  checkCollect(player) {
    if (!this.alive) return false;
    return Math.hypot(this.x - player.x, this.y - player.y) < COLLECT_RADIUS + player.radius;
  }
}

function _drawCircle(cx, cy, r, color, alpha) {
  // Approximated as a filled square (pixel art style)
  const ctx = _getCtx();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

let _ctx;
export function setPowerupContext(ctx) { _ctx = ctx; }
function _getCtx() { return _ctx; }

export class PowerupManager {
  constructor() { this.powerups = []; }

  maybeSpawn(x, y) {
    if (Math.random() < DROP_CHANCE) {
      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      this.powerups.push(new Powerup(x, y, type));
    }
  }

  update(delta, player, onCollect) {
    for (const p of this.powerups) {
      if (!p.alive) continue;
      p.update(delta);
      if (p.checkCollect(player)) {
        player.applyPowerup(p.type);
        onCollect(p.config.label, p.config.color);
        p.alive = false;
      }
    }
    this.powerups = this.powerups.filter(p => p.alive);
  }

  draw() {
    for (const p of this.powerups) p.draw();
  }

  clear() { this.powerups = []; }
}

// ── Pickup notification banner ──────────────────────────────────────────────
const notifications = [];

export function addPickupNotification(label, color) {
  notifications.push({ label, color, timer: 0, duration: 2.5 });
}

export function updateNotifications(delta) {
  for (const n of notifications) n.timer += delta;
  notifications.splice(0, notifications.length, ...notifications.filter(n => n.timer < n.duration));
}

export function drawNotifications(canvasWidth) {
  notifications.forEach((n, i) => {
    const alpha = n.timer < 0.3 ? n.timer / 0.3 : n.timer > n.duration - 0.5 ? (n.duration - n.timer) / 0.5 : 1;
    const y = 50 + i * 20;
    drawText(n.label + ' !', canvasWidth / 2, y, 16, `rgba(${_hexToRgb(n.color)},${alpha.toFixed(2)})`, 'center');
  });
}

function _hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
