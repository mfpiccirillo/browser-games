import { spawnFromEdge, ENEMY_CLASSES } from './enemy.js';

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const LEVELS = [
  {
    number: 1, title: 'SECTOR 1',
    waves: [
      { enemies: [{ type: 'Grunt', count: 5 }], spawnInterval: 1.5 },
    ]
  },
  {
    number: 2, title: 'SECTOR 2',
    waves: [
      { enemies: [{ type: 'Grunt', count: 6 }, { type: 'Speeder', count: 2 }], spawnInterval: 1.2 },
    ]
  },
  {
    number: 3, title: 'SECTOR 3',
    waves: [
      { enemies: [{ type: 'Grunt', count: 8 }, { type: 'Speeder', count: 4 }], spawnInterval: 1.0 },
      { enemies: [{ type: 'Tank', count: 1 }, { type: 'Grunt', count: 4 }], spawnInterval: 1.5 },
    ]
  },
  {
    number: 4, title: 'SECTOR 4',
    waves: [
      { enemies: [{ type: 'Speeder', count: 8 }, { type: 'Tank', count: 2 }], spawnInterval: 0.8 },
      { enemies: [{ type: 'Grunt', count: 10 }, { type: 'Speeder', count: 4 }], spawnInterval: 0.7 },
    ]
  },
  {
    number: 5, title: 'FINAL SECTOR',
    waves: [
      { enemies: [{ type: 'Tank', count: 3 }, { type: 'Speeder', count: 6 }], spawnInterval: 0.6 },
      { enemies: [{ type: 'Grunt', count: 12 }, { type: 'Tank', count: 3 }, { type: 'Speeder', count: 6 }], spawnInterval: 0.5 },
    ]
  },
];

export class LevelManager {
  constructor() {
    this.currentLevelIndex = 0;
    this.currentWaveIndex  = 0;
    this.spawnQueue  = [];
    this.spawnTimer  = 0;
    this.activeEnemies = [];
    this.levelComplete = false;
  }

  startLevel(index) {
    this.currentLevelIndex = index;
    this.currentWaveIndex  = 0;
    this.activeEnemies = [];
    this.levelComplete = false;
    this._loadWave(0);
  }

  _loadWave(waveIndex) {
    const wave = LEVELS[this.currentLevelIndex].waves[waveIndex];
    const queue = [];
    for (const entry of wave.enemies) {
      for (let i = 0; i < entry.count; i++) queue.push(entry.type);
    }
    this.spawnQueue = shuffle(queue);
    this.spawnTimer = wave.spawnInterval;
    this.currentWaveIndex = waveIndex;
  }

  update(delta) {
    // spawn from queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        const type = this.spawnQueue.shift();
        this.activeEnemies.push(spawnFromEdge(ENEMY_CLASSES[type]));
        const wave = LEVELS[this.currentLevelIndex].waves[this.currentWaveIndex];
        this.spawnTimer = wave.spawnInterval;
      }
    }

    // prune dead
    this.activeEnemies = this.activeEnemies.filter(e => e.alive);

    // wave / level complete
    if (!this.levelComplete && this.spawnQueue.length === 0 && this.activeEnemies.length === 0) {
      const level = LEVELS[this.currentLevelIndex];
      if (this.currentWaveIndex < level.waves.length - 1) {
        this._loadWave(this.currentWaveIndex + 1);
      } else {
        this.levelComplete = true;
      }
    }
  }

  get currentLevel() { return LEVELS[this.currentLevelIndex]; }
}
