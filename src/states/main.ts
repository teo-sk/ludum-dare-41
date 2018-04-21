import * as Assets from '../assets';


export default class Main extends Phaser.State {

  private bird: Phaser.Sprite;

  private ball: Phaser.Sprite;

  private pipes: Phaser.Group;

  private breakables: Phaser.Group;

  private timer: Phaser.TimerEvent;

  private score: number;

  private hasBall: boolean;

  private justShot: boolean;

  private labelScore: Phaser.Text;

  private jumpSound: Phaser.Sound;

  private hitSound: Phaser.Sound;

  public preload(): void {

    // Change the background color of the game
    this.game.stage.backgroundColor = '#71c5cf';

  }

  public create(): void {
    this.hasBall = false;
    this.justShot = false;

    // Set the physics system
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    // Display the bird on the screen
    this.bird = this.game.add.sprite(100, 245, Assets.Images.ImagesBird.getName());

    // Add gravity to the bird to make it fall
    this.game.physics.arcade.enable(this.bird);
    this.bird.body.gravity.y = 1000;
    this.bird.anchor.setTo(-0.2, 0.5);

    // Display the ball
    this.ball = this.game.add.sprite(150, 300, Assets.Images.ImagesBall.getName());

    // Add some gravity to the ball as well
    this.game.physics.arcade.enable(this.ball);
    this.ball.body.gravity.y = 300;
    this.ball.body.bounce.setTo(1, 1);

    // Call the 'jump' function when the spacekey is hit
    let spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.add(this.jump, this);

    let enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    enterKey.onDown.add(this.shoot, this);

    this.pipes = this.game.add.group();
    this.pipes.enableBody = true;
    this.pipes.createMultiple(30, Assets.Images.ImagesPipe.getName());

    this.breakables = this.game.add.group();
    this.breakables.enableBody = true;
    this.breakables.createMultiple(3, Assets.Images.ImagesBreakable.getName());

    this.timer = this.game.time.events.loop(3000, this.addRowOfPipes, this);

    this.score = 0;
    this.labelScore = this.game.add.text(20, 20, '0', {font: '30px Arial', fill: '#ffffff'});

    this.jumpSound = this.game.add.audio(Assets.Audio.AudioJump.getName());
    this.hitSound = this.game.add.audio(Assets.Audio.AudioHit.getName());
  }

  public update(): void {
    // If the bird is out of the world (too high or too low), call the 'restartGame' function
    if (this.bird.inWorld === false) {
      this.restartGame();
    }

    this.game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);
    this.game.physics.arcade.overlap(this.bird, this.breakables, this.hitPipe, null, this);
    this.game.physics.arcade.overlap(this.bird, this.ball, this.catchBall, null, this);

    this.game.physics.arcade.collide(this.pipes, this.ball);
    this.game.physics.arcade.collide(this.breakables, this.ball, this.breakBreakable, null, this);

    if (this.bird.angle < 20) {
      this.bird.angle += 1;
    }

    if (this.hasBall) {
      let speed = (Math.abs(this.bird.body.velocity.y) < 100) ? 30 : 200;
      this.game.physics.arcade.moveToObject(this.ball, this.bird, speed);
    }
  }

  private jump(): void {
    if (this.bird.alive === false) {
      return;
    }

    this.bird.body.velocity.y = -300;

    this.game.add.tween(this.bird).to({angle: -20}, 100).start();

    this.jumpSound.play();
  }

  private shoot(): void {
    if (!this.hasBall) {
      return;
    }

    this.hasBall = false;
    this.justShot = true;
    this.game.time.events.add(500, () => this.justShot = false);
    this.ball.body.velocity.y = -250;
    this.ball.body.velocity.x = 500;
  }

  private restartGame(): void {
    // Start the 'main' state, which restarts the game
    this.game.state.start('main');
  }

  private addOnePipe(x, y): void {
    let pipe: Phaser.Sprite = this.pipes.getFirstDead();

    pipe.reset(x, y);

    pipe.body.velocity.x = -120;
    pipe.body.immovable = true;

    pipe.checkWorldBounds = true;
    pipe.outOfBoundsKill = true;
  }

  private addOneBreakable(x, y): void {
    let breakable: Phaser.Sprite = this.breakables.getFirstDead();

    breakable.reset(x, y);
    breakable.anchor.setTo(0.5, 0.5);
    breakable.body.gravity.y = 0;
    breakable.rotation = 0;
    breakable.body.velocity.x = -120;
    breakable.body.mass = 4;

    breakable.checkWorldBounds = true;
    breakable.outOfBoundsKill = true;
  }

  private addRowOfPipes(): void {
    let hole = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < 10; i++) {
      if (i !== hole && i !== hole + 1) {
        this.addOnePipe(800, i * 60 + 10);
      }
      if (i === hole) {
        this.addOneBreakable(825, i * 60 + 65);
      }
    }

    this.score += 1;
    this.labelScore.text = this.score.toString();
  }

  private hitPipe(): void {
    if (this.bird.alive === false) {
      return;
    }

    this.bird.alive = false;
    this.game.time.events.remove(this.timer);

    this.pipes.forEachAlive((p) => {
      p.body.velocity.x = 0;
    }, this);

    this.breakables.forEachAlive((b) => {
      b.body.velocity.x = 0;
    }, this);

    this.hitSound.play();
  }

  private catchBall(): void {
    if (this.hasBall || this.justShot) {
      return;
    }
    this.hasBall = true;
  }

  private breakBreakable(ball: Phaser.Sprite, wall: Phaser.Sprite): void {
    this.game.add.tween(wall).to({angle: -1080}, 1500).start();
    wall.body.gravity.y = 500;
  }
}
