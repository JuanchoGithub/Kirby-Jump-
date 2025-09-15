// FIX: Removed self-import of Vector2D which caused a conflict.
export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: number;
  position: Vector2D;
  width: number;
  height: number;
}

export interface PlatformData extends GameObject {
  movement?: {
    path: [Vector2D, Vector2D]; // Start and end points
    speed: number; // pixels per second
  };
}

export interface CheckpointData extends GameObject {}

export type TrapType = 'spikes';

export interface TrapData extends GameObject {
  type: TrapType;
  platformId?: number | null;
}

export type Theme = 'day' | 'afternoon' | 'night' | 'twilight';

export interface SceneryData extends GameObject {
  depth: number;
  asset: 'cloud1' | 'cloud2' | 'hill1' | 'sun' | 'bird' | 'moon' | 'star' | 'planet';
}

export interface PlayerState {
  position: Vector2D;
  velocity: Vector2D;
  isGrounded: boolean;
  lastCheckpoint: Vector2D;
  isJumping: boolean;
  isFalling: boolean;
  groundedOnPlatformId?: number | null;
}

export interface LevelData {
  name: string;
  platforms: PlatformData[];
  checkpoints: CheckpointData[];
  traps: TrapData[];
}