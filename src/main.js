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
      gravity: { y:500 },
      debug: false
    }
  },

  scene: {
    create: create,
    update: update
  }
};

let player;
let cursors;
let wasd;
let platforms;
let exit;
let levelComplete = false;

const levelPlatforms = [
  { x: 125, y: 382.5, width: 190, height: 25 },
  { x: 340, y: 322.5, width: 150, height: 25 },
  { x: 540, y: 262.5, width: 150, height: 25 },
  { x: 722.5, y: 202.5, width: 120, height: 25 },
];

function create() {
  // Level parameter
  levelComplete = false;

  if (levelComplete) {
    player.body.setVelocity(0 ,0);
    return;
  }

  // Create player
  player = this.add.rectangle(100, 346, 31, 48, 0xe9b44c);
  
  // Enable player physics
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(false);

  // Keyboard controls
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys('W,A,S,D');
  
  // Create platforms
  platforms = this.physics.add.staticGroup();

  // Create first platform
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

  // Create exit 
  exit = this.add.rectangle(735, 167.5, 22, 45, 0x5dbb8a)
  this.physics.add.existing(exit, true);
  this.physics.add.overlap(player, exit, reachExit, null, this);
   
  // Enable player-platform collision
  this.physics.add.collider(player, platforms);
}

function update() {
  const playerSpeed = 200;
  const jumpVelocity = -300;

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

  if (player.y > 500) {
    this.scene.restart()
  }
}

function reachExit() {
  if (levelComplete) {
    return;
  }

  levelComplete = true;

  exit.setFillStyle(0xff0000);

  this.add.text(400, 225, 'Level Complete!', {
    fontSize: '36px',
    color: '#ffffff',
    fontFamily: 'monospace'
  }).setOrigin(0.5);

  console.log('level complete!');
}

new Phaser.Game(config)