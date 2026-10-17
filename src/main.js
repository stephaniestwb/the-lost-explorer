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

function create() {
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
  const platform1 = this.add.rectangle(125, 382.5, 190, 25, 0x748579);
  platforms.add(platform1);

  // Create second platform
  const platform2 = this.add.rectangle(340, 322.5, 150, 25, 0x748579);
  platforms.add(platform2);

  // Create third platform
  const platform3 = this.add.rectangle(540, 262.5, 150, 25, 0x748579);
  platforms.add(platform3);

  // Exit platform
  const platform4 = this.add.rectangle(722.5, 202.5, 120, 25, 0x748579);
  platforms.add(platform4);

  // Create exit marker
  exit = this.add.rectangle(735, 167.5, 22, 45, 0x5dbb8a)
   
  // Enable player-platform collision
  this.physics.add.collider(player, platforms);
}

function update() {
  const playerSpeed = 200;
  const jumpVelocity = -350;

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

new Phaser.Game(config)