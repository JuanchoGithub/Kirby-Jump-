import { PlatformData, CheckpointData, SceneryData } from '../types';
import { GAME_WIDTH, LEVEL_HEIGHT_MAX } from '../constants';

export const LEVEL_PLATFORMS: PlatformData[] = [
  // Starting area
  { id: 0, position: { x: 0, y: LEVEL_HEIGHT_MAX - 20 }, width: GAME_WIDTH, height: 20 },
  { id: 1, position: { x: 100, y: LEVEL_HEIGHT_MAX - 150 }, width: 150, height: 20 },
  { id: 2, position: { x: 350, y: LEVEL_HEIGHT_MAX - 280 }, width: 150, height: 20 },
  { id: 3, position: { x: 150, y: LEVEL_HEIGHT_MAX - 420 }, width: 200, height: 20 },
  
  // First Checkpoint area
  { id: 4, position: { x: 400, y: LEVEL_HEIGHT_MAX - 550 }, width: 150, height: 20 },
  { 
    id: 5, 
    position: { x: 150, y: LEVEL_HEIGHT_MAX - 650 }, 
    width: 100, 
    height: 20,
    movement: {
        path: [
            { x: 150, y: LEVEL_HEIGHT_MAX - 650 },
            { x: 300, y: LEVEL_HEIGHT_MAX - 650 }
        ],
        speed: 50 // pixels per second
    }
  },
  { id: 6, position: { x: 250, y: LEVEL_HEIGHT_MAX - 780 }, width: 180, height: 20 },

  // Higher up
  { id: 7, position: { x: 50, y: LEVEL_HEIGHT_MAX - 920 }, width: 120, height: 20 },
  { id: 8, position: { x: 300, y: LEVEL_HEIGHT_MAX - 1050 }, width: 100, height: 20 },
  { id: 9, position: { x: 200, y: LEVEL_HEIGHT_MAX - 1180 }, width: 200, height: 20 },

  // Second Checkpoint area
  { id: 10, position: { x: 0, y: LEVEL_HEIGHT_MAX - 1330 }, width: 150, height: 20 },
    { 
    id: 11,
    position: { x: 400, y: LEVEL_HEIGHT_MAX - 1480 },
    width: 150,
    height: 20,
    movement: {
        path: [
            { x: 400, y: LEVEL_HEIGHT_MAX - 1480 },
            { x: 400, y: LEVEL_HEIGHT_MAX - 1380 }
        ],
        speed: 40
    }
  },
  { id: 12, position: { x: 200, y: LEVEL_HEIGHT_MAX - 1600 }, width: 100, height: 20 },

  // Path to victory
  { id: 13, position: { x: 50, y: LEVEL_HEIGHT_MAX - 1750 }, width: 80, height: 20 },
  { id: 14, position: { x: 250, y: LEVEL_HEIGHT_MAX - 1850 }, width: 80, height: 20 },
  { id: 15, position: { x: 450, y: LEVEL_HEIGHT_MAX - 1950 }, width: 80, height: 20 },
  { id: 16, position: { x: 200, y: LEVEL_HEIGHT_MAX - 2050 }, width: 200, height: 20 },
];

export const LEVEL_CHECKPOINTS: CheckpointData[] = [
  // Adding a start checkpoint so the player starts at the bottom
  { id: 100, position: { x: 50, y: LEVEL_HEIGHT_MAX - 60 }, width: 40, height: 40 },
  { id: 101, position: { x: 290, y: LEVEL_HEIGHT_MAX - 820 }, width: 40, height: 40 },
  { id: 102, position: { x: 230, y: LEVEL_HEIGHT_MAX - 1640 }, width: 40, height: 40 },
  { id: 103, position: { x: 280, y: LEVEL_HEIGHT_MAX - 2120 }, width: 40, height: 40 }, // Victory checkpoint
];

export const DAY_SCENERY: SceneryData[] = [
    // Ground level
    { id: 204, asset: 'hill1', position: { x: -50, y: LEVEL_HEIGHT_MAX - 250 }, width: 400, height: 250, depth: 10 },
    { id: 207, asset: 'hill1', position: { x: 350, y: LEVEL_HEIGHT_MAX - 350 }, width: 350, height: 350, depth: 12 },
    
    // Low Sky
    { id: 201, asset: 'cloud1', position: { x: 100, y: LEVEL_HEIGHT_MAX - 400 }, width: 150, height: 75, depth: 5 },
    { id: 202, asset: 'cloud2', position: { x: 400, y: LEVEL_HEIGHT_MAX - 700 }, width: 120, height: 60, depth: 4 },
    { id: 208, asset: 'cloud2', position: { x: 200, y: LEVEL_HEIGHT_MAX - 550 }, width: 180, height: 90, depth: 6 },
    { id: 209, asset: 'bird', position: { x: 500, y: LEVEL_HEIGHT_MAX - 600 }, width: 30, height: 20, depth: 3 },

    // Mid Sky
    { id: 203, asset: 'cloud1', position: { x: 50, y: LEVEL_HEIGHT_MAX - 1100 }, width: 180, height: 90, depth: 5 },
    { id: 205, asset: 'cloud2', position: { x: 300, y: LEVEL_HEIGHT_MAX - 1500 }, width: 150, height: 75, depth: 3 },
    { id: 210, asset: 'cloud1', position: { x: 450, y: LEVEL_HEIGHT_MAX - 1300 }, width: 140, height: 70, depth: 4 },
    { id: 211, asset: 'bird', position: { x: 100, y: LEVEL_HEIGHT_MAX - 1400 }, width: 30, height: 20, depth: 2 },
    { id: 212, asset: 'bird', position: { x: 150, y: LEVEL_HEIGHT_MAX - 1420 }, width: 30, height: 20, depth: 2.5 },


    // High Sky
    { id: 206, asset: 'cloud1', position: { x: 150, y: LEVEL_HEIGHT_MAX - 1900 }, width: 120, height: 60, depth: 4 },
    { id: 213, asset: 'cloud2', position: { x: 350, y: LEVEL_HEIGHT_MAX - 2200 }, width: 200, height: 100, depth: 6 },
    { id: 214, asset: 'cloud1', position: { x: 50, y: LEVEL_HEIGHT_MAX - 2500 }, width: 150, height: 75, depth: 5 },
    { id: 215, asset: 'cloud2', position: { x: 400, y: LEVEL_HEIGHT_MAX - 2800 }, width: 130, height: 65, depth: 3 },

    // Upper Atmosphere
    { id: 216, asset: 'cloud1', position: { x: 200, y: LEVEL_HEIGHT_MAX - 3200 }, width: 160, height: 80, depth: 4 },
    { id: 217, asset: 'cloud2', position: { x: 50, y: LEVEL_HEIGHT_MAX - 3500 }, width: 120, height: 60, depth: 5 },
    { id: 218, asset: 'cloud1', position: { x: 400, y: LEVEL_HEIGHT_MAX - 3800 }, width: 180, height: 90, depth: 6 },
    { id: 219, asset: 'sun', position: { x: 50, y: 100 }, width: 150, height: 150, depth: 20 },
];

export const AFTERNOON_SCENERY: SceneryData[] = [
    // Ground level
    { id: 305, asset: 'hill1', position: { x: -50, y: LEVEL_HEIGHT_MAX - 250 }, width: 400, height: 250, depth: 10 },
    { id: 306, asset: 'hill1', position: { x: 350, y: LEVEL_HEIGHT_MAX - 350 }, width: 350, height: 350, depth: 12 },

    // Low Sky
    { id: 302, asset: 'bird', position: { x: 200, y: LEVEL_HEIGHT_MAX - 400 }, width: 30, height: 20, depth: 4 },
    { id: 307, asset: 'bird', position: { x: 220, y: LEVEL_HEIGHT_MAX - 410 }, width: 30, height: 20, depth: 4.5 },
    { id: 308, asset: 'cloud1', position: { x: 100, y: LEVEL_HEIGHT_MAX - 500 }, width: 150, height: 75, depth: 6 },
    
    // Mid Sky
    { id: 303, asset: 'bird', position: { x: 400, y: LEVEL_HEIGHT_MAX - 950 }, width: 30, height: 20, depth: 5 },
    { id: 304, asset: 'bird', position: { x: 150, y: LEVEL_HEIGHT_MAX - 1250 }, width: 30, height: 20, depth: 3 },
    { id: 309, asset: 'cloud2', position: { x: 300, y: LEVEL_HEIGHT_MAX - 1400 }, width: 180, height: 90, depth: 7 },
    { id: 310, asset: 'bird', position: { x: 500, y: LEVEL_HEIGHT_MAX - 1600 }, width: 30, height: 20, depth: 4 },

    // High Sky
    { id: 311, asset: 'cloud1', position: { x: 50, y: LEVEL_HEIGHT_MAX - 1900 }, width: 200, height: 100, depth: 6 },
    { id: 312, asset: 'bird', position: { x: 350, y: LEVEL_HEIGHT_MAX - 2200 }, width: 30, height: 20, depth: 3 },
    { id: 313, asset: 'bird', position: { x: 370, y: LEVEL_HEIGHT_MAX - 2210 }, width: 30, height: 20, depth: 3.5 },
    { id: 314, asset: 'cloud2', position: { x: 150, y: LEVEL_HEIGHT_MAX - 2500 }, width: 150, height: 75, depth: 5 },

    // Upper Atmosphere
    { id: 315, asset: 'cloud1', position: { x: 400, y: LEVEL_HEIGHT_MAX - 3000 }, width: 160, height: 80, depth: 7 },
    { id: 316, asset: 'bird', position: { x: 100, y: LEVEL_HEIGHT_MAX - 3300 }, width: 30, height: 20, depth: 2 },
    { id: 317, asset: 'cloud2', position: { x: 200, y: LEVEL_HEIGHT_MAX - 3600 }, width: 140, height: 70, depth: 6 },
    { id: 301, asset: 'sun', position: { x: 450, y: 800 }, width: 120, height: 120, depth: 20 },
];

export const NIGHT_SCENERY: SceneryData[] = [
    // Low Sky
    { id: 402, asset: 'star', position: { x: 100, y: LEVEL_HEIGHT_MAX - 400 }, width: 10, height: 10, depth: 8 },
    { id: 408, asset: 'star', position: { x: 500, y: LEVEL_HEIGHT_MAX - 550 }, width: 15, height: 15, depth: 6 },
    { id: 409, asset: 'star', position: { x: 300, y: LEVEL_HEIGHT_MAX - 700 }, width: 10, height: 10, depth: 7 },

    // Mid Sky
    { id: 403, asset: 'star', position: { x: 200, y: LEVEL_HEIGHT_MAX - 1300 }, width: 10, height: 10, depth: 6 },
    { id: 404, asset: 'star', position: { x: 350, y: LEVEL_HEIGHT_MAX - 1200 }, width: 10, height: 10, depth: 7 },
    { id: 405, asset: 'star', position: { x: 500, y: LEVEL_HEIGHT_MAX - 1400 }, width: 15, height: 15, depth: 5 },
    { id: 410, asset: 'star', position: { x: 80, y: LEVEL_HEIGHT_MAX - 1550 }, width: 10, height: 10, depth: 8 },
    
    // High Sky
    { id: 406, asset: 'star', position: { x: 50, y: LEVEL_HEIGHT_MAX - 2500 }, width: 10, height: 10, depth: 8 },
    { id: 411, asset: 'star', position: { x: 550, y: LEVEL_HEIGHT_MAX - 2100 }, width: 10, height: 10, depth: 7 },
    { id: 412, asset: 'star', position: { x: 420, y: LEVEL_HEIGHT_MAX - 2300 }, width: 15, height: 15, depth: 5 },
    { id: 413, asset: 'star', position: { x: 150, y: LEVEL_HEIGHT_MAX - 2400 }, width: 10, height: 10, depth: 6 },
    { id: 414, asset: 'star', position: { x: 280, y: LEVEL_HEIGHT_MAX - 2600 }, width: 10, height: 10, depth: 8 },

    // Deep Space
    { id: 415, asset: 'star', position: { x: 120, y: LEVEL_HEIGHT_MAX - 3000 }, width: 10, height: 10, depth: 7 },
    { id: 416, asset: 'star', position: { x: 480, y: LEVEL_HEIGHT_MAX - 3200 }, width: 15, height: 15, depth: 5 },
    { id: 417, asset: 'star', position: { x: 300, y: LEVEL_HEIGHT_MAX - 3400 }, width: 10, height: 10, depth: 6 },
    { id: 418, asset: 'star', position: { x: 50, y: LEVEL_HEIGHT_MAX - 3600 }, width: 10, height: 10, depth: 8 },
    { id: 419, asset: 'star', position: { x: 550, y: LEVEL_HEIGHT_MAX - 3800 }, width: 15, height: 15, depth: 5 },
    { id: 407, asset: 'planet', position: { x: 150, y: 600 }, width: 60, height: 30, depth: 15 },
    { id: 401, asset: 'moon', position: { x: 450, y: 150 }, width: 80, height: 80, depth: 20 },
];

export const TWILIGHT_SCENERY: SceneryData[] = [
    // Ground Level (Sunset)
    { id: 501, asset: 'hill1', position: { x: -50, y: LEVEL_HEIGHT_MAX - 250 }, width: 400, height: 250, depth: 10 },
    { id: 502, asset: 'hill1', position: { x: 350, y: LEVEL_HEIGHT_MAX - 350 }, width: 350, height: 350, depth: 12 },
    { id: 503, asset: 'cloud1', position: { x: 100, y: LEVEL_HEIGHT_MAX - 450 }, width: 150, height: 75, depth: 5 },
    
    // Low Sky (Dusk)
    { id: 504, asset: 'cloud2', position: { x: 400, y: LEVEL_HEIGHT_MAX - 800 }, width: 120, height: 60, depth: 4 },
    { id: 505, asset: 'bird', position: { x: 500, y: LEVEL_HEIGHT_MAX - 900 }, width: 30, height: 20, depth: 3 },
    { id: 506, asset: 'bird', position: { x: 520, y: LEVEL_HEIGHT_MAX - 910 }, width: 30, height: 20, depth: 3.5 },

    // Mid Sky (Twilight)
    { id: 507, asset: 'sun', position: { x: 50, y: LEVEL_HEIGHT_MAX - 1500 }, width: 120, height: 120, depth: 20 },
    { id: 508, asset: 'cloud1', position: { x: 50, y: LEVEL_HEIGHT_MAX - 1200 }, width: 180, height: 90, depth: 5 },
    { id: 509, asset: 'star', position: { x: 450, y: LEVEL_HEIGHT_MAX - 1600 }, width: 10, height: 10, depth: 8 },
    { id: 510, asset: 'star', position: { x: 300, y: LEVEL_HEIGHT_MAX - 1800 }, width: 10, height: 10, depth: 6 },

    // High Sky (Night)
    { id: 511, asset: 'star', position: { x: 100, y: LEVEL_HEIGHT_MAX - 2100 }, width: 15, height: 15, depth: 5 },
    { id: 512, asset: 'star', position: { x: 550, y: LEVEL_HEIGHT_MAX - 2300 }, width: 10, height: 10, depth: 7 },
    { id: 513, asset: 'star', position: { x: 250, y: LEVEL_HEIGHT_MAX - 2500 }, width: 10, height: 10, depth: 8 },

    // Upper Atmosphere (Space)
    { id: 514, asset: 'moon', position: { x: 450, y: LEVEL_HEIGHT_MAX - 3400 }, width: 80, height: 80, depth: 20 },
    { id: 515, asset: 'star', position: { x: 120, y: LEVEL_HEIGHT_MAX - 3000 }, width: 10, height: 10, depth: 7 },
    { id: 516, asset: 'star', position: { x: 480, y: LEVEL_HEIGHT_MAX - 3200 }, width: 15, height: 15, depth: 5 },
    { id: 517, asset: 'star', position: { x: 300, y: LEVEL_HEIGHT_MAX - 3400 }, width: 10, height: 10, depth: 6 },
    { id: 518, asset: 'star', position: { x: 50, y: LEVEL_HEIGHT_MAX - 3600 }, width: 10, height: 10, depth: 8 },
    { id: 519, asset: 'star', position: { x: 550, y: LEVEL_HEIGHT_MAX - 3800 }, width: 15, height: 15, depth: 5 },
    { id: 520, asset: 'planet', position: { x: 150, y: 200 }, width: 60, height: 30, depth: 15 },
];