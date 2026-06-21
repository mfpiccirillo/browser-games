# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the games

**Pixel Shooter** — requires an HTTP server (ES modules block on `file://`):
```bash
cd shooter && python3 -m http.server 8080
# open http://localhost:8080
```

**Tic Tac Toe** — open directly:
```bash
open tic-tac-toe.html
```

**Syntax check** (no build step, no test suite):
```bash
node --check shooter/js/*.js
```

## Git workflow

**Commit and push after every meaningful unit of work** — a feature added, a bug fixed, a file created. Never let multiple unrelated changes accumulate in one commit. The goal is a clean history the user can revert to at any point.

```bash
git add <files>
git commit -m "verb: short description of what changed and why"
git push
```

Rules:
- Commit before starting a significant change (clean checkpoint) and again when it's done (working checkpoint).
- One logical change per commit — don't bundle unrelated edits.
- Push immediately after every commit. Local-only commits defeat the purpose.
- Commit messages use an imperative verb: `add`, `fix`, `update`, `remove`, `refactor`.

Remote: `https://github.com/mfpiccirillo/browser-games` (branch `main`).

## Shooter architecture

The shooter is a vanilla HTML5 Canvas game using ES modules. There is no bundler — all files are served as-is.

### Coordinate system
All game logic operates in **logical coordinates** (160×120). `renderer.js` multiplies every position by `SCALE = 4` before drawing, yielding a 640×480 canvas. All values in `constants.js` are in logical units. Never mix logical and canvas coordinates — `renderer.js` functions take logical coords; `drawRectCanvas` / `drawText` / `strokeRectCanvas` take canvas coords and are used only for the HUD and UI overlays.

### Module responsibilities
- **`constants.js`** — single source of truth for all numbers and the 8-color palette. Change tuning values (speeds, damage, cooldowns) here only.
- **`renderer.js`** — holds the shared `ctx` reference (set once via `setContext`). All drawing goes through its exported functions; no other module touches `ctx` directly except `powerup.js` (which has its own `setPowerupContext`).
- **`input.js`** — exports a single mutable `InputState` object read every frame. `clearFrameInput()` must be called at the end of each game loop tick to consume one-shot events (`mouseClicked`). Controls: arrow keys / WASD move, mouse aims, **spacebar shoots**.
- **`main.js`** — owns the game loop (`requestAnimationFrame`), the state machine (`MENU → PLAYING → LEVEL_COMPLETE / GAME_OVER / VICTORY`), and wires all systems together. State transitions happen inside `render()` for screen transitions (drawXxxScreen returns `true` when the user advances).
- **`level.js`** — `LEVELS` array defines all 5 levels as wave configs (`{ type, count, spawnInterval }`). `LevelManager` drains a shuffled spawn queue on a timer; sets `levelComplete = true` when queue and `activeEnemies` are both empty.
- **`enemy.js`** — `Enemy` base class + `Grunt` / `Speeder` / `Tank` subclasses. Add new enemy types here as subclasses. `ENEMY_CLASSES` map is what `LevelManager` uses to instantiate by string name. `spawnFromEdge()` picks a random screen edge.
- **`bullet.js`** / **`particle.js`** / **`powerup.js`** — all use object pools to avoid GC pressure. Pool sizes: 200 bullets, 500 particles. Powerups drop with 30% probability on kill; 4 types: `health`, `speed`, `rapid_fire`, `triple_shot`.
- **`player.js`** — active powerup effects stored in `this.effects = { speed, rapid_fire, triple_shot }` (seconds remaining). Computed getters (`speed`, `baseCooldown`, `bulletCount`) derive current stats from those timers. `applyPowerup(type)` is the entry point for pickups.

### Sprite format
Sprites are 2D arrays of color strings (`null` = transparent), defined inline in each entity file. `drawSpriteRotated(sprite, cx, cy, angle)` centers the sprite on the logical position. The gun is drawn separately via `drawGun(cx, cy, angle)` in `renderer.js`.

### Adding a level
Edit the `LEVELS` array in `level.js`. Each entry needs `number`, `title`, and `waves`. Each wave entry: `{ enemies: [{ type: 'Grunt'|'Speeder'|'Tank', count: N }], spawnInterval: seconds }`.

### Adding an enemy type
1. Define sprite frames and a subclass in `enemy.js`.
2. Add it to the `ENEMY_CLASSES` map.
3. Reference it by string name in `level.js` wave configs.

### Adding a powerup type
1. Add a key to `POWERUP_TYPES` array and `CONFIG` object in `powerup.js`.
2. Handle the effect in `Player.applyPowerup()` and add a timer key to `this.effects` in `player.js`.
3. Use the timer in the relevant computed getter (`speed`, `baseCooldown`, `bulletCount`, or a new one).
