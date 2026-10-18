// npm.cmd run dev

import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#18283a',

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y:550 },
      debug: false
    }
  },

  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// Player settings
const playerSpeed = 200;
const jumpVelocity = -300;

const playerWidth = 31;
const playerHeight = 48;
const playerColor = 0xe9b44c;
const damageColor = 0xe05252; 

const knockbackY = -220;
const knockbackX = 180;
const knockbackDuration = 250;

// Health variables
const maxHealth = 3;
const damageCooldown = 1000;
const damageFlashDuration = 200;

// Level settings
const deathY = 500;
const warningDuration = 2000;

// Game objects
let player;
let platforms;
let artifact;
let spikes;
let explorerSprite;

let cursors;
let wasd;
let restartKey;

let exit;
let exitMessage;

let healthText;

// Game state
let levelComplete = false;
let hasArtifact = false;
let warningActive = false;
let gameOver = false;

let health = maxHealth;
let isInvulnerable = false;

let lastMoveDirection = 1;
let isKnockedBack = false;

// Level data
const levelPlatforms = [
  // First platform
  { x: 125, y: 382.5, width: 190, height: 25 },

  // Exit path
  { x: 315, y: 322.5, width: 150, height: 25 },
  { x: 510, y: 262.5, width: 160, height: 25 },
  { x: 690, y: 202.5, width: 160, height: 25 },

  // Upper exploration path
  { x: 280, y: 202.5, width: 145, height: 25 },
  { x: 445, y: 132.5, width: 140, height: 25 },
];

const levelHazards = [
  { x: 510, y: 245, width: 50, height: 10 },
  { x: 315, y: 305, width: 40, height: 10 },
];

function create() {
  // Reset game state
  levelComplete = false;
  gameOver = false;
  hasArtifact = false;
  warningActive = false;
  isKnockedBack = false;
  lastMoveDirection = 1;

  // Background
  const jungleBackground = this.add.rectangle(400, 225, 800, 450, 0x203c35);
  jungleBackground.setDepth(-10);
  
  // Jungle silhouettes
  const distantJungle = this.add.graphics();
  distantJungle.fillStyle(0x2f5545);
  distantJungle.fillEllipse(100, 360, 250, 300);
  distantJungle.fillEllipse(350, 380, 300, 350);
  distantJungle.fillEllipse(650, 350, 320, 300);

  distantJungle.setDepth(-9);

  // Create columns
  drawStoneColumn(this, 85, 170, 180);
  drawStoneColumn(this, 630, 110, 200);

  // Reset player health
  health = maxHealth;
  isInvulnerable = false;

  // Restart key implementation
  restartKey = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.R
  );

  // Create player
  player = this.add.rectangle(100, 346, playerWidth, playerHeight, playerColor);
  
  //pixel player
  explorerSprite = this.add.image(
    player.x,
    player.y,
    'rugged-explorer'
  );

  explorerSprite.setScale(1);
  explorerSprite.setDepth(5);

  player.setVisible(false);

  // Enable player physics
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(false);

  // Create health text
  healthText = this.add.text(20, 20, '', {
    fontSize: '28px',
    color: '#e05252',
    fontFamily: 'Arial'
  });

  updateHealthDisplay();

  // Keyboard controls
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys('W,A,S,D');
  
  // Create platforms
  platforms = this.physics.add.staticGroup();

  levelPlatforms.forEach((platformData) => {
    const platform = this.add.rectangle(
      platformData.x,
      platformData.y,
      platformData.width,
      platformData.height,
      0x748579
    );
    platforms.add(platform);
    platform.setVisible(false);
    drawStonePlatform(
      this,
      platformData.x - platformData.width / 2,
      platformData.y - platformData.height / 2,
      platformData.width,
      platformData.height,
    );
  });

  // Create spike hazards
  spikes = this.physics.add.staticGroup();

  levelHazards.forEach((spikeData) => {
    const spike = this.add.rectangle(
      spikeData.x,
      spikeData.y,
      spikeData.width,
      spikeData.height,
      damageColor
    );
    spikes.add(spike)
  });
  
  // Detect collisions with any spike
  this.physics.add.overlap(player, spikes, hitSpikes, null, this);

  // Create artifact
  artifact = this.add.circle(445, 100, 12, 0xfacc15);

  // Enable artifact physics
  this.physics.add.existing(artifact, true);
  this.physics.add.overlap(player, artifact, collectArtifact, null, this);

  // Create exit 
  exit = this.add.rectangle(735, 167.5, 22, 45, 0x5dbb8a)
  this.physics.add.existing(exit, true);
  this.physics.add.overlap(player, exit, reachExit, null, this);
   
  exitMessage = this.add.text(400, 225, 'Find the artifact first!', {
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: 'monospace'
  }).setOrigin(0.5);

  exitMessage.setVisible(false);
  // Enable player-platform collision
  this.physics.add.collider(player, platforms);
}

function update() {
  // Check for restart key
  if (Phaser.Input.Keyboard.JustDown(restartKey)) {
    this.scene.restart();
    return;
  }

  explorerSprite.setPosition(player.x, player.y);

  // Stop movement after winning
  if (levelComplete || gameOver) {
    return;
  }

  // Check for jump key press
  const jumpPressed = 
    Phaser.Input.Keyboard.JustDown(cursors.space) ||
    Phaser.Input.Keyboard.JustDown(wasd.W);
  
  // Check if the player is standing on something
    const grounded = 
    player.body.blocked.down ||
    player.body.touching.down;

  // Horizontal movement
  if (!isKnockedBack){
    if (cursors.left.isDown || wasd.A.isDown) {
      player.body.setVelocityX(-playerSpeed);
      lastMoveDirection = -1;

      explorerSprite.setFlipX(true);

    } else if (cursors.right.isDown || wasd.D.isDown) {
      player.body.setVelocityX(playerSpeed);
      lastMoveDirection = 1;

      explorerSprite.setFlipX(false);

    } else {
      player.body.setVelocityX(0)
    }
  }

  // Vertical movement
  if (jumpPressed && grounded) {
    player.body.setVelocityY(jumpVelocity);
  }

  if (player.y > deathY) {
    triggerGameOver.call(this);
  }
}

function reachExit() {
  // Prevent repeated completion
  if (levelComplete) {
    return;
  }

  // Prevent completion without artifact
  if (!hasArtifact) {
    if (warningActive) {
      return;
    }

    warningActive = true;
    exitMessage.setVisible(true);

    this.time.delayedCall(warningDuration, () => {
      exitMessage.setVisible(false);
      warningActive = false;
    });

    return;
  }

  // Complete the level
  levelComplete = true;
  player.body.enable = false;
  exitMessage.setVisible(false);

  exit.setFillStyle(0xff0000);

  this.add.text(400, 225, 'Level Complete! Press R to Restart.', {
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: 'monospace'
  }).setOrigin(0.5);

  console.log('level complete!');
}

function collectArtifact() {
  if (hasArtifact) {
    return;
  }

  hasArtifact = true;
  artifact.destroy();

  exitMessage.setVisible(false);

  console.log('Artifact Collected!');
}

function hitSpikes() {
  if (isInvulnerable || levelComplete || gameOver) {
    return;
  }

  // Health decreases when the player touches the spikes
  health -= 1;
  isInvulnerable = true;
  explorerSprite.setTint(0xff5555);
  updateHealthDisplay();

  // Activate knockback
  isKnockedBack = true;

  // Push player away from the spike
  player.body.setVelocity(
    -lastMoveDirection * knockbackX,
    knockbackY
  );

  console.log('Health remaining:', health);

  this.time.delayedCall(knockbackDuration, () => {
    isKnockedBack = false;
  });

  if (health <= 0) {
    triggerGameOver.call(this);
    return;
  }

  // Remove red tint after 200ms
  this.time.delayedCall(damageFlashDuration, () => {
    explorerSprite.clearTint();
  });

  // Restore vulnerability after 1000ms
  this.time.delayedCall(damageCooldown, () => {
    isInvulnerable = false;
  });
}

function updateHealthDisplay() {
  const fullHearts = '♥ '.repeat(health);
  const emptyHearts = '♡ '.repeat(maxHealth - health);

  healthText.setText(fullHearts + emptyHearts);
}

function triggerGameOver() {
  if (gameOver) {
    return;
  }

  gameOver = true;

  player.body.setVelocity(0, 0);
  player.body.enable = false;

  this.add.text(400, 190, 'GAME OVER', {
    fontSize: '48px',
    color: '#e05252',
    fontFamily: 'monospace'
  }).setOrigin(0.5);

  this.add.text(400, 245, 'Press R to Restart', {
    fontSize: '22px',
    color: '#ffffff',
    fontFamily: 'monospace'
  }).setOrigin(0.5);
  
  this.add.text(400, 265, 'get good noob', {
    fontSize: '12px',
    color: '#ffffff',
    fontFamily: 'monospace'
  }).setOrigin(0.5);
}

function drawStoneColumn(scene, x, y, height) {
  const graphics = scene.add.graphics();

  // Main stone column
  graphics.fillStyle(0x64776a);
  graphics.fillRect(x, y, 32, height);

  // Stone caps
  graphics.fillStyle(0x829588);
  graphics.fillRect(x - 5, y - 5, 42, 11);
  graphics.fillRect(x - 5, y + height - 7, 42, 11);

  // Add cracks
  graphics.lineStyle(2, 0x3e5548)
  graphics.beginPath();
  graphics.moveTo(x + 12, y + 20);
  graphics.lineTo(x + 7, y + 45);
  graphics.lineTo(x + 17, y + 65);
  graphics.strokePath();

  graphics.setDepth(-8);
}

function drawStonePlatform(scene, x, y, width, height) {
  const graphics = scene.add.graphics();

  // Main body
  graphics.fillStyle(0x657569);
  graphics.fillRect(x, y, width, height);

  // Moss along the top
  graphics.fillStyle(0x65965c);
  graphics.fillRect(x, y, width, 6);

  graphics.setDepth(1);
}

function preload() {
  this.load.image(
    'rugged-explorer',
    '/assets/characters/rugged-explorer.png'
  )
}
new Phaser.Game(config)