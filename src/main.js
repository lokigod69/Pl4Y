import Phaser from 'phaser';
import HubScene from './scenes/HubScene.js';
import GravityGardenScene from './scenes/GravityGardenScene.js';
import EchoSnakeScene from './scenes/EchoSnakeScene.js';
import VoidJumperScene from './scenes/VoidJumperScene.js';
import SynesthesiaRainScene from './scenes/SynesthesiaRainScene.js';
import ImpossibleCorridorScene from './scenes/ImpossibleCorridorScene.js';
import './style.css';

window.themes = [
  {
    name: 'Muted',
    bg: 0xF4F4F9,
    portal: 0xA8B5E2,
    text: 0x2D3748,
    accent: 0xF7FAFC
  },
  {
    name: 'Neon',
    bg: 0x0A0A0A,
    portal: 0x00FFFF,
    text: 0xFF00FF,
    accent: 0xFFFFFF
  },
  {
    name: 'Purple',
    bg: 0x1A0033,
    portal: 0x663399,
    text: 0xE6CCFF,
    accent: 0xFF69B4
  },
  {
    name: 'Gold',
    bg: 0x1A0D00,
    portal: 0xFFD700,
    text: 0x8B4513,
    accent: 0xFF1493
  },
  {
    name: 'Mono',
    bg: 0xFFFFFF,
    portal: 0x000000,
    text: 0x000000,
    accent: 0x808080
  }
];
window.currentTheme = 0;

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#000011',
  scene: [HubScene, GravityGardenScene, EchoSnakeScene, VoidJumperScene, SynesthesiaRainScene, ImpossibleCorridorScene]
};

const game = new Phaser.Game(config);
