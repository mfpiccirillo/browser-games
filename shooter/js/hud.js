import {
  CANVAS_WIDTH,
  COLOR_WHITE, COLOR_GREEN, COLOR_ORANGE, COLOR_RED
} from './constants.js';
import { drawRectCanvas, strokeRectCanvas, drawText } from './renderer.js';

const EFFECT_COLORS = {
  speed:       '#4ae8e8',
  rapid_fire:  '#ffe066',
  triple_shot: '#ff8800',
};
const EFFECT_LABELS = {
  speed:       'SPD',
  rapid_fire:  'RFR',
  triple_shot: '3X',
};
const EFFECT_DURATION = 8;

export function drawHUD(player, score, levelNumber, totalLevels) {
  // ── Health bar ────────────────────────────────────────────────
  const bx = 10, by = 18, bw = 90, bh = 10;
  drawRectCanvas(bx - 1, by - 1, bw + 2, bh + 2, '#111');
  const ratio = player.health / player.maxHealth;
  const barColor = ratio > 0.5 ? COLOR_GREEN : ratio > 0.25 ? COLOR_ORANGE : COLOR_RED;
  drawRectCanvas(bx, by, Math.round(ratio * bw), bh, barColor);
  strokeRectCanvas(bx - 1, by - 1, bw + 2, bh + 2, COLOR_WHITE);
  drawText('HP', bx, by - 12, 9, COLOR_WHITE, 'left');

  // ── Score ─────────────────────────────────────────────────────
  drawText(`SCORE  ${score}`, CANVAS_WIDTH - 10, 10, 11, COLOR_WHITE, 'right');

  // ── Level ─────────────────────────────────────────────────────
  drawText(`LVL ${levelNumber}/${totalLevels}`, CANVAS_WIDTH / 2, 10, 11, COLOR_WHITE, 'center');

  // ── Active powerup effects (bottom-left) ──────────────────────
  const effects = player.effects;
  let slotX = 10;
  const slotY = CANVAS_WIDTH > 400 ? 460 : 440; // near bottom
  for (const [key, remaining] of Object.entries(effects)) {
    if (remaining <= 0) continue;
    const color = EFFECT_COLORS[key];
    const label = EFFECT_LABELS[key];
    const barW  = 48;
    const ratio  = remaining / EFFECT_DURATION;

    // Background strip
    drawRectCanvas(slotX, slotY - 2, barW, 16, '#111111');
    // Fill bar
    drawRectCanvas(slotX, slotY - 2, Math.round(ratio * barW), 16, color + '55');
    strokeRectCanvas(slotX, slotY - 2, barW, 16, color);
    // Label
    drawText(label, slotX + barW / 2, slotY, 9, color, 'center');

    slotX += barW + 6;
  }

  // ── Controls reminder (bottom-right, small) ───────────────────
  drawText('ARROWS: MOVE  MOUSE: AIM  SPACE: SHOOT', CANVAS_WIDTH - 10, 468, 8, '#444444', 'right');
}
