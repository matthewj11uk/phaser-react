import * as Phaser from "phaser";

// The GLSL fragment shader code as a string.
const fragShader = `
precision mediump float;

// --- UNIFORMS ---
// These are the inputs from our Phaser code to the shader.

// The main texture
uniform sampler2D uMainSampler;
// The pre-calculated scroll offset (0 to 1 range)
uniform vec2 u_scroll;

// --- VARYING ---
// This is the texture coordinate passed from the vertex shader.
varying vec2 outTexCoord;

void main(void) {
  // Calculate the new texture coordinates by adding the pre-calculated offset.
  vec2 scrolledCoords = outTexCoord + u_scroll;

  // Use fract() to wrap the coordinates, creating a seamless tiling effect.
  vec2 wrappedCoords = fract(scrolledCoords);

  // Sample the texture at the new, wrapped coordinates.
  gl_FragColor = texture2D(uMainSampler, wrappedCoords);
}
`;

/**
 * A PostFX pipeline that applies a background scrolling effect.
 */
export class BackgroundScrollingPostFxPipeline
  extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
{
  /**
   * A 2D vector controlling the speed and direction of the scroll.
   * X for horizontal speed, Y for vertical speed.
   * Positive values scroll right/down, negative values scroll left/up.
   */
  #speedX: number = 0;
  #speedY: number = 0.05;
  #scrollX: number = 0;
  #scrollY: number = 0;

  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader,
    });
  }

  set speedX(val: number) {
    this.#speedX = val;
  }

  set speedY(val: number) {
    this.#speedY = val;
  }

  /**
   * Called before the pipeline is rendered. Sets the uniforms required by the shader.
   */
  public onPreRender(): void {
    // Calculate the scroll offset by integrating speed over time
    const delta = this.game.loop.delta / 1000;

    this.#scrollX += this.#speedX * delta;
    this.#scrollY += this.#speedY * delta;

    // Keep values small (between -1 and 1)
    this.#scrollX %= 1;
    this.#scrollY %= 1;

    this.set2f("u_scroll", this.#scrollX, this.#scrollY);
  }
}
