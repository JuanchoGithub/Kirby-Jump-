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

export interface PlatformData extends GameObject {}

export interface CheckpointData extends GameObject {}

export type Theme = 'day' | 'afternoon' | 'night';

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
}

export interface LevelData {
  name: string;
  platforms: PlatformData[];
  checkpoints: CheckpointData[];
}
