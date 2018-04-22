import * as Assets from '../assets';


export default class Main extends Phaser.State {
  private background: Phaser.TileSprite;

  private bird: Phaser.Sprite;

  private ball: Phaser.Sprite;

  private intro: Phaser.Sprite;

  private pipes: Phaser.Group;

  private breakables: Phaser.Group;

  private timer: Phaser.TimerEvent;

  private score: number;

  private hasBall: boolean;

  private justShot: boolean;

  private justBounced: boolean;

  private labelScore: Phaser.Text;

  private emitter: Phaser.Particles.Arcade.Emitter;

  private jumpSound: Phaser.Sound;

  private jumpSounds: Phaser.Sound[];

  private deathSounds: Phaser.Sound[];

  private goalSounds: Phaser.Sound[];

  private bounceSounds: Phaser.Sound[];

  private kickSound: Phaser.Sound;
  
  private hitSound: Phaser.Sound;

  private cheerSound: Phaser.Sound;

  private music: Phaser.Sound;

  public preload(): void {

    // Change the background color of the game
    this.game.stage.backgroundColor = '#71c5cf';

  }

  public create(): void {
    this.hasBall = false;
    this.justShot = false;
    this.justBounced = false;

    this.background = this.game.add.tileSprite(0, 0, 800, 600, Assets.Images.ImagesGrass.getName());

    // Set the physics system
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.emitter = this.game.add.emitter(100, 245, 400);
    this.emitter.makeParticles(Assets.Images.ImagesGrassParticle.getName());
    this.emitter.gravity.y = 200;
    this.emitter.gravity.x = -400;
    this.emitter.setAlpha(1, 0, 3000);
    this.emitter.setScale(0.8, 0, 0.8, 0, 3000);

    this.emitter.start(false, 3000, 20);

    // Display the bird on the screen
    this.bird = this.game.add.sprite(100, 245, Assets.Images.ImagesBird.getName());

    // Add gravity to the bird to make it fall
    this.game.physics.arcade.enable(this.bird);
    this.bird.body.gravity.y = 1000;
    this.bird.anchor.setTo(-0.2, 0.5);

    // Display the ball
    this.ball = this.game.add.sprite(130, 300, Assets.Images.ImagesBall.getName());

    // Add some gravity to the ball as well
    this.game.physics.arcade.enable(this.ball);
    this.ball.body.gravity.y = 300;
    this.ball.body.bounce.setTo(1, 1);

    this.intro = this.game.add.sprite(this.game.world.centerX - 350, 150, Assets.Images.ImagesIntro.getName());
    this.game.time.events.add(2000, () => {
      this.game.add.tween(this.intro).to({y: 0}, 1500, Phaser.Easing.Linear.None, true);
      this.game.add.tween(this.intro).to({alpha: 0}, 1500, Phaser.Easing.Linear.None, true);
    }, this);

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
    this.hitSound = this.game.add.audio(Assets.Audio.AudioWhistle.getName());
    this.kickSound = this.game.add.audio(Assets.Audio.AudioKick.getName());
    this.cheerSound = this.game.add.audio(Assets.Audio.AudioCheer.getName());
    this.jumpSounds = [
      this.game.add.audio(Assets.Audio.AudioJump1.getName()),
      this.game.add.audio(Assets.Audio.AudioJump2.getName()),
      this.game.add.audio(Assets.Audio.AudioJump3.getName()),
      this.game.add.audio(Assets.Audio.AudioJump4.getName()),
    ];
    this.deathSounds = [
      this.game.add.audio(Assets.Audio.AudioDeath1.getName()),
      this.game.add.audio(Assets.Audio.AudioDeath2.getName()),
      this.game.add.audio(Assets.Audio.AudioDeath3.getName()),
      this.game.add.audio(Assets.Audio.AudioDeath4.getName()),
    ];
    this.goalSounds = [
      this.game.add.audio(Assets.Audio.AudioGoal1.getName()),
      this.game.add.audio(Assets.Audio.AudioGoal2.getName()),
      this.game.add.audio(Assets.Audio.AudioGoal3.getName()),
    ];
    this.bounceSounds = [
      this.game.add.audio(Assets.Audio.AudioBounce1.getName()),
      this.game.add.audio(Assets.Audio.AudioBounce2.getName()),
      this.game.add.audio(Assets.Audio.AudioBounce3.getName()),
    ];

    this.music = this.game.add.audio(Assets.Audio.AudioMusic.getName());
    this.music.play(null, null, 0.2, true);
  }

  public update(): void {
    // If the bird is out of the world (too high or too low), call the 'restartGame' function
    if (this.bird.inWorld === false) {
      this.restartGame();
    }

    if (this.bird.alive) {
      this.background.tilePosition.x -= 2;
    }

    this.game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);
    this.game.physics.arcade.overlap(this.bird, this.breakables, this.hitPipe, null, this);
    this.game.physics.arcade.overlap(this.bird, this.ball, this.catchBall, null, this);

    this.game.physics.arcade.collide(this.pipes, this.ball, this.bounceBall, null, this);
    this.game.physics.arcade.collide(this.breakables, this.ball, this.breakBreakable, null, this);

    if (this.bird.angle < 20) {
      this.bird.angle += 1;
    }

    if (this.hasBall) {
      let speed = (Math.abs(this.bird.body.velocity.y) < 100) ? 30 : 200;
      this.game.physics.arcade.moveToXY(this.ball, this.bird.position.x + 35, this.bird.position.y, speed);
    }

    this.emitter.emitX = this.bird.position.x + 35;
    this.emitter.emitY = this.bird.position.y + 10;
  }

  private jump(): void {
    if (this.bird.alive === false) {
      return;
    }

    this.bird.body.velocity.y = -300;

    this.game.add.tween(this.bird).to({angle: -20}, 100).start();
    
    Phaser.ArrayUtils.getRandomItem(this.jumpSounds).play();
  }

  private shoot(): void {
    if (!this.hasBall) {
      return;
    }
    this.bird.loadTexture(Assets.Images.ImagesBirdShoot.getName());
    this.hasBall = false;
    this.justShot = true;
    this.game.time.events.add(500, () => {
      this.justShot = false;
      if (this.bird.key === Assets.Images.ImagesBirdShoot.getName()) {
        this.bird.loadTexture(Assets.Images.ImagesBird.getName());
      }
    });
    this.ball.body.velocity.y = -250;
    this.ball.body.velocity.x = 500;
    this.kickSound.play();
  }

  private restartGame(): void {
    // Start the 'main' state, which restarts the game
    this.music.stop();
    this.game.state.start('main');
    this.emitter.on = true;
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
    this.bird.loadTexture(Assets.Images.ImagesBirdDead.getName());
    this.game.time.events.remove(this.timer);

    this.pipes.forEachAlive((p) => {
      p.body.velocity.x = 0;
    }, this);

    this.breakables.forEachAlive((b) => {
      b.body.velocity.x = 0;
    }, this);

    this.hitSound.play();
    Phaser.ArrayUtils.getRandomItem(this.deathSounds).play();

    this.emitter.on = false;
  }

  private catchBall(): void {
    if (this.hasBall || this.justShot) {
      return;
    }
    this.hasBall = true;
  }

  private breakBreakable(ball: Phaser.Sprite, wall: Phaser.Sprite): void {
    this.bird.loadTexture(Assets.Images.ImagesBirdGoal.getName());
    this.game.time.events.add(500, () => {
      if (this.bird.key === Assets.Images.ImagesBirdGoal.getName()) {
        this.bird.loadTexture(Assets.Images.ImagesBird.getName());
      }
    });
    this.game.add.tween(wall).to({angle: -1080}, 1000).start();
    wall.body.gravity.y = 1500;
    Phaser.ArrayUtils.getRandomItem(this.goalSounds).play();
    this.cheerSound.play(null, null, 0.2);
  }

  private bounceBall(): void {
    if (this.justBounced) {
      return;
    }
    Phaser.ArrayUtils.getRandomItem(this.bounceSounds).play();
    this.justBounced = true;
    this.game.time.events.add(500, () => this.justBounced = false);
  }
}
