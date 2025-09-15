import { PlatformData, CheckpointData, SceneryData } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export const LEVEL_PLATFORMS: PlatformData[] = [
  // Starting area
  { id: 0, position: { x: 0, y: GAME_HEIGHT - 20 }, width: GAME_WIDTH, height: 20 },
  { id: 1, position: { x: 100, y: GAME_HEIGHT - 150 }, width: 150, height: 20 },
  { id: 2, position: { x: 350, y: GAME_HEIGHT - 280 }, width: 150, height: 20 },
  { id: 3, position: { x: 150, y: GAME_HEIGHT - 420 }, width: 200, height: 20 },
  
  // First Checkpoint area
  { id: 4, position: { x: 400, y: GAME_HEIGHT - 550 }, width: 150, height: 20 },
  { id: 5, position: { x: 150, y: GAME_HEIGHT - 650 }, width: 100, height: 20 },
  { id: 6, position: { x: 250, y: GAME_HEIGHT - 780 }, width: 180, height: 20 },

  // Higher up
  { id: 7, position: { x: 50, y: GAME_HEIGHT - 920 }, width: 120, height: 20 },
  { id: 8, position: { x: 300, y: GAME_HEIGHT - 1050 }, width: 100, height: 20 },
  { id: 9, position: { x: 200, y: GAME_HEIGHT - 1180 }, width: 200, height: 20 },

  // Second Checkpoint area
  { id: 10, position: { x: 0, y: GAME_HEIGHT - 1330 }, width: 150, height: 20 },
  { id: 11, position: { x: 300, y: GAME_HEIGHT - 1480 }, width: 150, height: 20 },
  { id: 12, position: { x: 200, y: GAME_HEIGHT - 1600 }, width: 100, height: 20 },

  // Path to victory
  { id: 13, position: { x: 50, y: GAME_HEIGHT - 1750 }, width: 80, height: 20 },
  { id: 14, position: { x: 250, y: GAME_HEIGHT - 1850 }, width: 80, height: 20 },
  { id: 15, position: { x: 450, y: GAME_HEIGHT - 1950 }, width: 80, height: 20 },
  { id: 16, position: { x: 200, y: GAME_HEIGHT - 2050 }, width: 200, height: 20 },
];

export const LEVEL_CHECKPOINTS: CheckpointData[] = [
  { id: 101, position: { x: 290, y: GAME_HEIGHT - 820 }, width: 40, height: 40 },
  { id: 102, position: { x: 230, y: GAME_HEIGHT - 1640 }, width: 40, height: 40 },
  { id: 103, position: { x: 280, y: GAME_HEIGHT - 2120 }, width: 40, height: 40 }, // Victory checkpoint
];

export const DAY_SCENERY: SceneryData[] = [
    { id: 201, asset: 'cloud1', position: { x: 100, y: GAME_HEIGHT - 400 }, width: 150, height: 75, depth: 5 },
    { id: 202, asset: 'cloud2', position: { x: 400, y: GAME_HEIGHT - 700 }, width: 120, height: 60, depth: 4 },
    { id: 203, asset: 'cloud1', position: { x: 50, y: GAME_HEIGHT - 1100 }, width: 180, height: 90, depth: 5 },
    { id: 204, asset: 'hill1', position: { x: -50, y: GAME_HEIGHT - 250 }, width: 400, height: 250, depth: 10 },
    { id: 205, asset: 'cloud2', position: { x: 300, y: GAME_HEIGHT - 1500 }, width: 150, height: 75, depth: 3 },
    { id: 206, asset: 'cloud1', position: { x: 150, y: GAME_HEIGHT - 1900 }, width: 120, height: 60, depth: 4 },
    { id: 207, asset: 'hill1', position: { x: 350, y: GAME_HEIGHT - 350 }, width: 350, height: 350, depth: 12 },
];

export const AFTERNOON_SCENERY: SceneryData[] = [
    { id: 301, asset: 'sun', position: { x: 50, y: 100 }, width: 100, height: 100, depth: 20 },
    { id: 302, asset: 'bird', position: { x: 200, y: 200 }, width: 30, height: 20, depth: 4 },
    { id: 303, asset: 'bird', position: { x: 400, y: 350 }, width: 30, height: 20, depth: 5 },
    { id: 304, asset: 'bird', position: { x: 150, y: 550 }, width: 30, height: 20, depth: 3 },
    { id: 305, asset: 'hill1', position: { x: -50, y: GAME_HEIGHT - 250 }, width: 400, height: 250, depth: 10 },
    { id: 306, asset: 'hill1', position: { x: 350, y: GAME_HEIGHT - 350 }, width: 350, height: 350, depth: 12 },
];

export const NIGHT_SCENERY: SceneryData[] = [
    { id: 401, asset: 'moon', position: { x: 450, y: 150 }, width: 80, height: 80, depth: 20 },
    { id: 402, asset: 'star', position: { x: 100, y: 100 }, width: 10, height: 10, depth: 8 },
    { id: 403, asset: 'star', position: { x: 200, y: 300 }, width: 10, height: 10, depth: 6 },
    { id: 404, asset: 'star', position: { x: 350, y: 200 }, width: 10, height: 10, depth: 7 },
    { id: 405, asset: 'star', position: { x: 500, y: 400 }, width: 10, height: 10, depth: 5 },
    { id: 406, asset: 'star', position: { x: 50, y: 500 }, width: 10, height: 10, depth: 8 },
    { id: 407, asset: 'planet', position: { x: 150, y: 600 }, width: 60, height: 30, depth: 15 },
];
