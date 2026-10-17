import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#18283a',

  scene: {
    create: create,
    update: update
  }
};

let player;
let cursors;
let wasd;

function create() {
  player = this.add.rectangle(400, 225, 31, 48, 0xe9b44c);
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys('W,A,S,D');
}

function update() {
  const speed = 5;

  if (cursors.left.isDown || wasd.A.isDown) {
    player.x -= speed;
  } else if (cursors.right.isDown || wasd.D.isDown) {
    player.x += speed;
  }
  
  player.x = Math.max(15.5, Math.min(784.5, player.x));

}



new Phaser.Game(config)