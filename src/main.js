// npm.cmd run dev

import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#18283a',

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y:550 },
      debug: false
    }
  },

  scene: {
    create: create,
    update: update
  }
};

// Player settings
const playerSpeed = 200;
const jumpVelocity = -300;
const playerWidth = 31;
const playerHeight = 48;

// Level settings
const deathY = 500;
const warningDuration = 2000;

// Game objects
let player;
let platforms;

let cursors;
let wasd;
let restartKey;

let exit;
let exitMessage;

let artifact;

// Game state
let levelComplete = false;
let hasArtifact = false;
let warningActive = false;


// Level data
const levelPlatforms = [
  { x: 125, y: 382.5, width: 190, height: 25 },
  { x: 340, y: 322.5, width: 150, height: 25 },
  { x: 540, y: 262.5, width: 150, height: 25 },
  { x: 722.5, y: 202.5, width: 120, height: 25 },
];

function create() {
  // Level parameter
  levelComplete = false;
  hasArtifact = false;
  warningActive = false;

  // Restart key implementation
  restartKey = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.R
  );

  // Create player
  player = this.add.rectangle(100, 346, playerWidth, playerHeight, 0xe9b44c);
  
  // Enable player physics
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(false);

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
  });

  // Create artifact
  artifact = this.add.circle(540, 225, 12, 0xfacc15);

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

  // Stop movement after winning
  if (levelComplete) {
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
  if (cursors.left.isDown || wasd.A.isDown) {
    player.body.setVelocityX(-playerSpeed);
  } else if (cursors.right.isDown || wasd.D.isDown) {
    player.body.setVelocityX(playerSpeed);
  } else {
    player.body.setVelocityX(0)
  }

  // Vertical movement
  if (jumpPressed && grounded) {
    player.body.setVelocityY(jumpVelocity);
  }

  if (player.y > deathY) {
    this.scene.restart()
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

new Phaser.Game(config)