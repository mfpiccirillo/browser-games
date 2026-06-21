import { CANVAS_WIDTH, CANVAS_HEIGHT, MAX_DELTA, LOGICAL_WIDTH, LOGICAL_HEIGHT } from './constants.js';
import { InputState, initInput, clearFrameInput } from './input.js';
import { setContext, clearCanvas, drawBackground } from './renderer.js';
import { Player } from './player.js';
import { BulletManager } from './bullet.js';
import { ParticleSystem } from './particle.js';
import { LevelManager, LEVELS } from './level.js';
import { drawHUD } from './hud.js';
import {
  PowerupManager, setPowerupContext,
  addPickupNotification, updateNotifications, drawNotifications
} from './powerup.js';
import {
  drawMenuScreen, drawLevelCompleteScreen,
  drawGameOverScreen, drawVictoryScreen, drawWaveBanner
} from './screens.js';

// ─── Canvas setup ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
setContext(ctx);
setPowerupContext(ctx);
initInput(canvas);

// ─── Game state ───────────────────────────────────────────────────────────────

const STATE = { MENU: 0, PLAYING: 1, LEVEL_COMPLETE: 2, GAME_OVER: 3, VICTORY: 4 };
let state = STATE.MENU;
let score = 0;
let highScore = 0;
let currentLevelIndex = 0;
let transitionTimer = 0;
let waveBannerTimer = 99;

let player, bulletManager, particleSystem, levelManager, powerupManager;

function startGame() {
  score = 0;
  currentLevelIndex = 0;
  player         = new Player(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
  bulletManager  = new BulletManager();
  particleSystem = new ParticleSystem();
  levelManager   = new LevelManager();
  powerupManager = new PowerupManager();
  levelManager.startLevel(0);
  waveBannerTimer = 0;
  state = STATE.PLAYING;
}

// ─── Update ───────────────────────────────────────────────────────────────────

function update(delta) {
  switch (state) {
    case STATE.MENU:
      break;

    case STATE.PLAYING: {
      player.update(delta, InputState, bulletManager, particleSystem);
      levelManager.update(delta);
      waveBannerTimer += delta;

      for (const e of levelManager.activeEnemies) {
        e.update(delta, player);
        // contact damage — one hit per invincibility window
        if (Math.hypot(e.x - player.x, e.y - player.y) < e.radius + player.radius) {
          player.takeDamage(e.damage);
        }
      }

      bulletManager.update(delta, levelManager.activeEnemies, particleSystem, (pts, x, y) => {
        score += pts;
        powerupManager.maybeSpawn(x, y);
      });

      powerupManager.update(delta, player, (label, color) => {
        addPickupNotification(label, color);
      });
      updateNotifications(delta);

      particleSystem.update(delta);

      if (!player.alive) {
        highScore = Math.max(highScore, score);
        state = STATE.GAME_OVER;
        transitionTimer = 0;
      }

      if (levelManager.levelComplete) {
        transitionTimer = 0;
        state = currentLevelIndex >= LEVELS.length - 1 ? STATE.VICTORY : STATE.LEVEL_COMPLETE;
      }
      break;
    }

    case STATE.LEVEL_COMPLETE:
    case STATE.GAME_OVER:
    case STATE.VICTORY:
      transitionTimer += delta;
      particleSystem.update(delta);
      break;
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render() {
  clearCanvas();

  switch (state) {
    case STATE.MENU:
      if (drawMenuScreen(InputState)) startGame();
      break;

    case STATE.PLAYING:
      drawBackground();
      powerupManager.draw();
      for (const e of levelManager.activeEnemies) e.draw();
      bulletManager.draw();
      player.draw();
      particleSystem.draw();
      drawHUD(player, score, currentLevelIndex + 1, LEVELS.length);
      drawNotifications(CANVAS_WIDTH);
      drawWaveBanner(levelManager.currentWaveIndex + 1, waveBannerTimer);
      break;

    case STATE.LEVEL_COMPLETE:
      drawBackground();
      powerupManager.draw();
      for (const e of levelManager.activeEnemies) e.draw();
      player.draw();
      particleSystem.draw();
      drawHUD(player, score, currentLevelIndex + 1, LEVELS.length);
      if (drawLevelCompleteScreen(InputState, levelManager.currentLevel.title, score, transitionTimer)) {
        currentLevelIndex++;
        levelManager.startLevel(currentLevelIndex);
        bulletManager.clear();
        powerupManager.clear();
        waveBannerTimer = 0;
        state = STATE.PLAYING;
        transitionTimer = 0;
      }
      break;

    case STATE.GAME_OVER:
      if (drawGameOverScreen(InputState, score, highScore, transitionTimer)) startGame();
      break;

    case STATE.VICTORY:
      if (drawVictoryScreen(InputState, score, transitionTimer)) startGame();
      break;
  }
}

// ─── Game loop ────────────────────────────────────────────────────────────────

let lastTime = 0;

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 1000, MAX_DELTA);
  lastTime = timestamp;
  update(delta);
  render();
  clearFrameInput();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(t => { lastTime = t; requestAnimationFrame(gameLoop); });
