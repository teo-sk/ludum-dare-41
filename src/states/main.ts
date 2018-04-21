import * as Assets from '../assets';


export default class Main extends Phaser.State {

  bird: Phaser.Sprite;

  pipes: Phaser.Group;

  timer: Phaser.TimerEvent;

  score: number;

  labelScore: Phaser.Text;

  jumpSound: Phaser.Sound;

  hitSound: Phaser.Sound;

  preload() {

    // Change the background color of the game
    this.game.stage.backgroundColor = '#71c5cf';

  }

  create() {
  // Set the physics system
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    // Display the bird on the screen
    this.bird = this.game.add.sprite(100, 245, Assets.Images.ImagesBird.getName());

    // Add gravity to the bird to make it fall
    this.game.physics.arcade.enable(this.bird);
    this.bird.body.gravity.y = 1000;
    this.bird.anchor.setTo(-0.2, 0.5);

    // Call the 'jump' function when the spacekey is hit
    let spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.add(this.jump, this);

    this.pipes = this.game.add.group();
    this.pipes.enableBody = true;
    this.pipes.createMultiple(30, Assets.Images.ImagesPipe.getName());

    this.timer = this.game.time.events.loop(1500, this.addRowOfPipes, this);

    this.score = 0;
    this.labelScore = this.game.add.text(20, 20, '0', {font: '30px Arial', fill: '#ffffff'});

    this.jumpSound = this.game.add.audio(Assets.Audio.AudioJump.getName());
    this.hitSound = this.game.add.audio(Assets.Audio.AudioHit.getName());
  }

  update() {
    // If the bird is out of the world (too high or too low), call the 'restartGame' function
    if (this.bird.inWorld === false)
      this.restartGame();

    this.game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);

    if (this.bird.angle < 20)
      this.bird.angle += 1;
  }

  jump() {
    if (this.bird.alive === false)
      return;

    this.bird.body.velocity.y = -350;

    this.game.add.tween(this.bird).to({angle: -20}, 100).start();

    this.jumpSound.play();
  }

  restartGame() {
    // Start the 'main' state, which restarts the game
    this.game.state.start('main');
  }

  addOnePipe(x, y) {
    let pipe = this.pipes.getFirstDead();

    pipe.reset(x, y);

    pipe.body.velocity.x = -200;

    pipe.checkWorldBounds = true;
    pipe.outOfBoundsKill = true;
  }

  addRowOfPipes() {
    let hole = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < 10; i++)
      if (i !== hole && i !== hole + 1)
        this.addOnePipe(800, i * 60 + 10);
        this.score += 1;
        this.labelScore.text = this.score.toString();
  }

  hitPipe() {
    if (this.bird.alive === false)
      return;

    this.bird.alive = false;
    this.game.time.events.remove(this.timer);

    this.pipes.forEachAlive((p) => {
      p.body.velocity.x = 0;
    }, this);

    this.hitSound.play();
  }
}
