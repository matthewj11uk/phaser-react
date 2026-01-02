import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { BackgroundScrollingPostFxPipeline } from "./background-scrolling-post-fx-pipeline";

export class MainMenu extends Scene {
  #bgImage!: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  #pipeline!: BackgroundScrollingPostFxPipeline;

  // Speed control variables
  #scrollSpeedX: number = 0;
  #scrollSpeedY: number = 0;
  readonly #maxSpeed: number = 0.5;

  // Touch control variables
  #touchStartX: number = 0;
  #touchStartY: number = 0;

  background: GameObjects.Image;
  rocket: GameObjects.Sprite;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("MainMenu");
  }

  create() {
    this.#setupPipelines();

    this.background = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "galaxy",
    );
    this.background.setDisplaySize(this.scale.width, this.scale.height);
    this.background.setPostPipeline(BackgroundScrollingPostFxPipeline.name);
    this.#pipeline = this.background.getPostPipeline(
      BackgroundScrollingPostFxPipeline,
    ) as BackgroundScrollingPostFxPipeline;

    this.rocket = this.add
      .sprite(this.scale.width / 2, this.scale.height / 2, "rocket", 4)
      .setDepth(100);

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

  update(): void {
    if (this.input.activePointer.isDown) {
      this.emitter.start();
      const pointer = this.input.activePointer;
      const dirX = pointer.x - this.#touchStartX;
      const dirY = pointer.y - this.#touchStartY;
      const dist = Math.sqrt(dirX * dirX + dirY * dirY);
      if (dist > 0) {
        // Set speed to maxSpeed in the direction of movement
        const normX = dirX / dist;
        const normY = dirY / dist;
        this.#scrollSpeedX = normX * this.#maxSpeed;
        this.#scrollSpeedY = -normY * this.#maxSpeed;

        this.rocket.rotation =
          Phaser.Math.Angle.Between(
            0,
            0,
            this.#scrollSpeedX,
            -this.#scrollSpeedY,
          ) +
          Math.PI / 2;
      } else {
        this.#scrollSpeedX = 0;
        this.#scrollSpeedY = 0;
        this.emitter.stop();
      }
    }

    const offset = this.rocket.displayHeight / 2;
    const x = this.rocket.x - Math.sin(this.rocket.rotation) * offset;
    const y = this.rocket.y + Math.cos(this.rocket.rotation) * offset;

    this.emitter.setPosition(x, y);
    this.emitter.setAngle(this.rocket.angle + 90);

    // Update pipeline
    if (this.#pipeline) {
      this.#pipeline.speedX = this.#scrollSpeedX;
      this.#pipeline.speedY = this.#scrollSpeedY;
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
