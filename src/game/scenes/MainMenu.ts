import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { BackgroundScrollingPostFxPipeline } from "./background-scrolling-post-fx-pipeline";

export class MainMenu extends Scene {
  #bgImage!: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  #pipeline!: BackgroundScrollingPostFxPipeline;

  // Speed control variables
  #scrollSpeedX: number = 0;
  #scrollSpeedY: number = 0.05;
  readonly #maxSpeed: number = 0.5;
  readonly #accel: number = 0.01;
  readonly #decel: number = 0.03;

  // Touch control variables
  #touchStartX: number = 0;
  #touchStartY: number = 0;

  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  logoTween: Phaser.Tweens.Tween | null;

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

    this.logo = this.add
      .image(this.scale.width / 2, this.scale.height * 0.3, "logo")
      .setDepth(100);

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
      const pointer = this.input.activePointer;

      // Calculate direction from touch start to current pointer position
      const dirX = pointer.x - this.#touchStartX;
      const dirY = pointer.y - this.#touchStartY;
      const dist = Math.sqrt(dirX * dirX + dirY * dirY);

      if (dist > 0) {
        // Normalize direction
        const normX = dirX / dist;
        const normY = dirY / dist;

        // Apply acceleration towards the touch direction
        // (Touch Right -> Rocket Right -> Background Left -> SpeedX increases)
        this.#scrollSpeedX += normX * this.#accel;
        this.#scrollSpeedY -= normY * this.#accel;
      }
    } else {
      // Decelerate when not touching
      const currentSpeed = Math.sqrt(
        this.#scrollSpeedX * this.#scrollSpeedX +
          this.#scrollSpeedY * this.#scrollSpeedY,
      );

      if (currentSpeed > 0) {
        const newSpeed = Math.max(0, currentSpeed - this.#decel);
        const scale = newSpeed / currentSpeed;
        this.#scrollSpeedX *= scale;
        this.#scrollSpeedY *= scale;
      }
    }

    // Clamp speed to max speed
    const currentSpeed = Math.sqrt(
      this.#scrollSpeedX * this.#scrollSpeedX +
        this.#scrollSpeedY * this.#scrollSpeedY,
    );
    if (currentSpeed > this.#maxSpeed) {
      const scale = this.#maxSpeed / currentSpeed;
      this.#scrollSpeedX *= scale;
      this.#scrollSpeedY *= scale;
    }

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
