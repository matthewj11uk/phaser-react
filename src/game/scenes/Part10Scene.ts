import { Scene } from "phaser";
import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { BackgroundScrollingPostFxPipeline } from "./background-scrolling-post-fx-pipeline";

export class Part10Scene extends Scene {
  #bgImage!: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  #pipeline!: BackgroundScrollingPostFxPipeline;
  player: Phaser.Physics.Arcade.Sprite;
  stars: Phaser.Physics.Arcade.Group;
  bombs: Phaser.Physics.Arcade.Group;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  score: number = 0;
  gameOver: boolean = false;
  scoreText: Phaser.GameObjects.Text;
  isLeftDown: boolean = false;
  isRightDown: boolean = false;
  isJumpDown: boolean = false;

  constructor() {
    super("Part10Scene");
  }

  preload() {
    this.load.image("background", "assets/bg.png");
    this.load.image("galaxy", "assets/galaxy.png");
    this.load.setPath("assets");
    this.load.image("sky", "sky.png");
    this.load.image("ground", "platform.png");
    this.load.image("star", "star.png");
    this.load.image("bomb", "bomb.png");
    this.load.spritesheet("dude", "dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    const { width, height } = this.scale;

    this.scale.on("resize", this.resize, this);
    this.scale.on("orientationchange", this.checkOrientation, this);
    this.checkOrientation(this.scale.orientation);

    this.#setupPipelines();
    this.#createMainBg();
    //  A simple background for our game
    //this.add.image(width / 2, height / 2, "sky").setDisplaySize(width, height);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    this.platforms
      .create(width / 2, height - 128, "ground")
      .setScale((width / 400) * 1.1)
      .refreshBody();

    //  Now let's create some ledges
    this.platforms.create(width * 0.75, height * 0.6, "ground");
    this.platforms.create(width * 0.1, height * 0.4, "ground");
    this.platforms.create(width * 0.9, height * 0.25, "ground");

    // The player and its settings
    this.player = this.physics.add.sprite(100, height - 250, "dude");

    //  Player physics properties. Give the little guy a slight bounce.
    this.player.setBounce(0.6);
    this.player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    //  Input Events
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    const stepX = width / 12;
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: stepX },
    });

    this.stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
      //  Give each star a slightly different bounce
      const c = child as Phaser.Physics.Arcade.Image;
      c.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      return true;
    });

    this.bombs = this.physics.add.group();

    //  The score
    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      color: "#000",
    });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      undefined,
      this,
    );

    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      undefined,
      this,
    );

    this.createControls();

    EventBus.emit("current-scene-ready", this);
  }

  createControls() {
    const { width, height } = this.scale;
    const controlY = height - height / 3;

    // Left
    const leftZone = this.add
      .rectangle(100, controlY, 200, 100, 0xffffff, 0.5)
      .setInteractive()
      .setScrollFactor(0);
    this.add
      .text(100, controlY, "Left", { fontSize: "24px", color: "#000" })
      .setOrigin(0.5)
      .setScrollFactor(0);

    leftZone.on("pointerdown", () => {
      this.isLeftDown = true;
    });
    leftZone.on("pointerup", () => {
      this.isLeftDown = false;
    });
    leftZone.on("pointerout", () => {
      this.isLeftDown = false;
    });

    // Right
    const rightZone = this.add
      .rectangle(310, controlY, 200, 100, 0xffffff, 0.5)
      .setInteractive()
      .setScrollFactor(0);
    this.add
      .text(310, controlY, "Right15", { fontSize: "24px", color: "#000" })
      .setOrigin(0.5)
      .setScrollFactor(0);

    rightZone.on("pointerdown", () => {
      this.isRightDown = true;
    });
    rightZone.on("pointerup", () => {
      this.isRightDown = false;
    });
    rightZone.on("pointerout", () => {
      this.isRightDown = false;
    });

    // Jump
    const jumpZone = this.add
      .rectangle(width - 100, controlY, 200, 100, 0xffffff, 0.5)
      .setInteractive()
      .setScrollFactor(0);
    this.add
      .text(width - 100, controlY, "Jump", { fontSize: "24px", color: "#000" })
      .setOrigin(0.5)
      .setScrollFactor(0);

    jumpZone.on("pointerdown", () => {
      this.isJumpDown = true;
    });
    jumpZone.on("pointerup", () => {
      this.isJumpDown = false;
    });
    jumpZone.on("pointerout", () => {
      this.isJumpDown = false;
    });
  }

  update() {
    if (this.gameOver) {
      return;
    }

    const leftDown = this.cursors?.left.isDown || this.isLeftDown;
    const rightDown = this.cursors?.right.isDown || this.isRightDown;
    const upDown = this.cursors?.up.isDown || this.isJumpDown;

    if (leftDown) {
      this.player.setVelocityX(-160);

      this.player.anims.play("left", true);
    } else if (rightDown) {
      this.player.setVelocityX(160);

      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    if (upDown && this.player.body?.touching.down) {
      this.player.setVelocityY(-600);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collectStar(player: any, star: any) {
    star.disableBody(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.stars.children.iterate((child: any) => {
        child.enableBody(true, child.x, 0, true, true);
        return true;
      });

      const x =
        player.x < this.scale.width / 2
          ? Phaser.Math.Between(this.scale.width / 2, this.scale.width)
          : Phaser.Math.Between(0, this.scale.width / 2);

      const bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  hitBomb(player: any, _bomb: any) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play("turn");

    this.gameOver = true;
  }

  changeScene() {
    this.scene.start("MainMenu");
  }

  #setupPipelines(): void {
    const renderer = this.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (!renderer.pipelines.get(BackgroundScrollingPostFxPipeline.name)) {
      renderer.pipelines.addPostPipeline(
        BackgroundScrollingPostFxPipeline.name,
        BackgroundScrollingPostFxPipeline,
      );
    }
  }

  /**
   * Creates the main background image which the shader will be applied to.
   */
  #createMainBg(): void {
    this.#bgImage = this.add
      .image(0, 0, "galaxy")
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
      .setOrigin(0)
      .setPostPipeline(BackgroundScrollingPostFxPipeline.name);

    this.#pipeline = this.#bgImage.getPostPipeline(
      BackgroundScrollingPostFxPipeline.name,
    ) as BackgroundScrollingPostFxPipeline;
  }

  checkOrientation(orientation: Phaser.Scale.Orientation) {
    if (
      !this.game.device.os.desktop &&
      orientation === Phaser.Scale.Orientation.LANDSCAPE
    ) {
      this.physics.pause();
    } else {
      if (!this.gameOver) {
        this.physics.resume();
      }
      this.time.delayedCall(100, () => {
        this.scale.refresh();
      });
    }
  }

  resize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;

    this.cameras.main.setViewport(0, 0, width, height);

    if (this.#bgImage) {
      this.#bgImage.setDisplaySize(width, height);
    }

    this.checkOrientation(this.scale.orientation);
  }
}
