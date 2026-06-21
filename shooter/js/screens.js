import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_WHITE, COLOR_BULLET, COLOR_GREEN, COLOR_RED, COLOR_ACCENT, COLOR_BG
} from './constants.js';
import { drawText, drawRectCanvas } from './renderer.js';

function blink() { return Math.floor(Date.now() / 500) % 2 === 0; }

export function drawMenuScreen(input) {
  drawRectCanvas(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000000');

  // Title
  drawText('PIXEL SHOOTER', CANVAS_WIDTH / 2, 100, 44, COLOR_BULLET, 'center');
  drawText('A TOP-DOWN SURVIVAL GAME', CANVAS_WIDTH / 2, 158, 14, '#aaaaaa', 'center');

  // Blinking start prompt
  if (blink()) {
    drawText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 240, 18, COLOR_WHITE, 'center');
  }

  // Controls
  drawText('ARROWS / WASD — MOVE   MOUSE — AIM', CANVAS_WIDTH / 2, 310, 12, '#777777', 'center');
  drawText('SPACE — SHOOT (hold to auto-fire)', CANVAS_WIDTH / 2, 328, 12, '#777777', 'center');

  // Enemy legend
  drawText('RED = GRUNT   CYAN = SPEEDER   PURPLE = TANK', CANVAS_WIDTH / 2, 370, 11, '#555555', 'center');

  return input.keys['enter'] || input.mouseClicked;
}

export function drawLevelCompleteScreen(input, levelTitle, score, transitionTimer) {
  drawRectCanvas(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'rgba(0,0,0,0.78)');

  drawText(levelTitle + ' — CLEAR!', CANVAS_WIDTH / 2, 160, 32, COLOR_GREEN, 'center');
  drawText(`SCORE: ${score}`, CANVAS_WIDTH / 2, 214, 22, COLOR_WHITE, 'center');

  if (transitionTimer > 1.5 && blink()) {
    drawText('PRESS ENTER TO CONTINUE', CANVAS_WIDTH / 2, 280, 16, COLOR_ACCENT, 'center');
  }

  return transitionTimer > 1.5 && (input.keys['enter'] || input.mouseClicked);
}

export function drawGameOverScreen(input, score, highScore, transitionTimer) {
  drawRectCanvas(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'rgba(0,0,0,0.85)');

  drawText('GAME OVER', CANVAS_WIDTH / 2, 150, 48, COLOR_RED, 'center');
  drawText(`SCORE:      ${score}`, CANVAS_WIDTH / 2, 222, 18, COLOR_WHITE, 'center');
  drawText(`HIGH SCORE: ${highScore}`, CANVAS_WIDTH / 2, 248, 18, COLOR_BULLET, 'center');

  if (transitionTimer > 1.5 && blink()) {
    drawText('PRESS ENTER TO RESTART', CANVAS_WIDTH / 2, 310, 16, COLOR_ACCENT, 'center');
  }

  return transitionTimer > 1.5 && (input.keys['enter'] || input.mouseClicked);
}

export function drawVictoryScreen(input, score, transitionTimer) {
  drawRectCanvas(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000000');

  drawText('YOU WIN!', CANVAS_WIDTH / 2, 140, 52, COLOR_BULLET, 'center');
  drawText('ALL SECTORS CLEARED', CANVAS_WIDTH / 2, 208, 18, COLOR_GREEN, 'center');
  drawText(`FINAL SCORE: ${score}`, CANVAS_WIDTH / 2, 248, 20, COLOR_WHITE, 'center');

  if (transitionTimer > 2 && blink()) {
    drawText('PRESS ENTER TO PLAY AGAIN', CANVAS_WIDTH / 2, 320, 16, COLOR_ACCENT, 'center');
  }

  return transitionTimer > 2 && (input.keys['enter'] || input.mouseClicked);
}

export function drawWaveBanner(waveNumber, timer) {
  if (timer > 2.0) return;
  const alpha = timer < 0.3 ? timer / 0.3 : timer > 1.7 ? (2.0 - timer) / 0.3 : 1;
  drawRectCanvas(0, CANVAS_HEIGHT / 2 - 24, CANVAS_WIDTH, 48, `rgba(0,0,0,${alpha * 0.7})`);
  const ctx_alpha_hack = `rgba(255,255,255,${alpha})`;
  drawText(`— WAVE ${waveNumber} —`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10, 22, ctx_alpha_hack, 'center');
}
