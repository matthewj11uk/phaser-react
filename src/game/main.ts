import { MainMenu } from "./scenes/MainMenu";
import { JumpingGameScene } from "./scenes/JumpingGame";
import { Preloader } from "./scenes/Preloader";
import { Game, Scale } from "phaser";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 720,
  height: 1400,
  parent: "game-container",
  backgroundColor: "#000000",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300, x: 0 },
      debug: false,
    },
  },
  scene: [Preloader, JumpingGameScene, MainMenu],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
