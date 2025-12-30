import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { BackgroundScrollingPostFxPipeline } from "./background-scrolling-post-fx-pipeline";

export class ScrollBackground extends Scene {
  #bgImage!: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite;
  #pipeline!: BackgroundScrollingPostFxPipeline;

  constructor() {
    super("ScrollBackground");
  }

  public create(): void {
    this.#setupPipelines();
    this.#createMainBg();
    EventBus.emit("current-scene-ready", this);
  }

  /**
   * Adds the new custom shader pipeline to the Phaser Renderer so we can use
   * this pipeline on our game objects.
   */
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

  changeScene() {
    this.scene.start("MainMenu");
  }
}
