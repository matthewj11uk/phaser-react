import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { BackgroundScrollingPostFxPipeline } from "./background-scrolling-post-fx-pipeline";

export class MainMenu extends Scene {
  #bgImage!: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  #pipeline!: BackgroundScrollingPostFxPipeline;

  // Speed control variables
  readonly #maxSpeed: number = 300; // Physics velocity units

  // Touch control variables
  #touchStartX: number = 0;
  #touchStartY: number = 0;

  background: GameObjects.Image;
  rocket: Phaser.Physics.Arcade.Sprite;
  private levelTile!: Phaser.GameObjects.TileSprite;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("MainMenu");
  }

  create() {
    this.#setupPipelines();

    // Background setup
    this.background = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "galaxy",
    );
    this.background.setDisplaySize(this.scale.width, this.scale.height);
    this.background.setScrollFactor(0); // Fix background to camera
    this.background.setPostPipeline(BackgroundScrollingPostFxPipeline.name);
    this.#pipeline = this.background.getPostPipeline(
      BackgroundScrollingPostFxPipeline,
    ) as BackgroundScrollingPostFxPipeline;

    // Level setup (TileSprite for infinite scrolling)
    this.levelTile = this.add.tileSprite(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      "level"
    )
    .setScrollFactor(0)
    .setDepth(0);

    // Rocket setup
    this.rocket = this.physics.add
      .sprite(this.scale.width / 2, this.scale.height / 2, "rocket", 4)
      .setDepth(100);
    
    (this.rocket.body as Phaser.Physics.Arcade.Body).allowGravity = false;

    this.emitter = this.add.particles(0, 0, "flame", {
      speed: 100,
      lifespan: 100,
      scale: { start: 2, end: 1.6 },
      blendMode: "NORMAL",
      angle: { min: -40, max: 40 },
      frequency: 100,
    });
    this.emitter.stop();

    // Dev: Hidden touch area to switch scene
    this.add
      .zone(0, 0, 100, 100)
      .setOrigin(0)
      .setInteractive()
      .setScrollFactor(0) // Fix UI to camera
      .on("pointerdown", () => {
        this.scene.switch("JumpingGameScene");
      });

    EventBus.emit("current-scene-ready", this);

    this.events.on("wake", () => {
      EventBus.emit("current-scene-ready", this);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.#touchStartX = pointer.x;
      this.#touchStartY = pointer.y;
    });
  }

  update(_time: number, delta: number): void {
    let velocityX = 0;
    let velocityY = 0;

    if (this.input.activePointer.isDown) {
      this.emitter.start();
      const pointer = this.input.activePointer;
      const dirX = pointer.x - this.#touchStartX;
      const dirY = pointer.y - this.#touchStartY;
      const dist = Math.sqrt(dirX * dirX + dirY * dirY);
      
      if (dist > 0) {
        // Normalize direction
        const normX = dirX / dist;
        const normY = dirY / dist;
        
        // Calculate velocity
        velocityX = normX * this.#maxSpeed;
        velocityY = normY * this.#maxSpeed;

        this.rocket.rotation =
          Phaser.Math.Angle.Between(
            0,
            0,
            velocityX,
            velocityY,
          ) +
          Math.PI / 2;
      } 
    } else {
        this.emitter.stop();
    }

    const offset = this.rocket.displayHeight / 2;
    const x = this.rocket.x - Math.sin(this.rocket.rotation) * offset;
    const y = this.rocket.y + Math.cos(this.rocket.rotation) * offset;

    this.emitter.setPosition(x, y);
    this.emitter.setAngle(this.rocket.angle + 90);

    // Scroll the level tile to create movement illusion
    // If rocket moves RIGHT, background scrolls LEFT (increase tilePositionX)
    this.levelTile.tilePositionX += velocityX * (delta / 1000);
    this.levelTile.tilePositionY += velocityY * (delta / 1000);

    // Update pipeline to scroll stars based on velocity
    if (this.#pipeline) {
      // Map velocity (0-300) to shader speed (0-0.5 approx)
      const SHADER_SPEED_FACTOR = 0.0002;
      this.#pipeline.speedX = velocityX * SHADER_SPEED_FACTOR;
      this.#pipeline.speedY = -velocityY * SHADER_SPEED_FACTOR;
    }
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
}