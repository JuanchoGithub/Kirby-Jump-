
import React from 'react';
import { PlayerState } from '../types';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants';

interface PlayerProps {
  playerState: PlayerState;
}

export const Player: React.FC<PlayerProps> = ({ playerState }) => {
  const { position, isJumping, isFalling, velocity } = playerState;

  const playerFace = () => {
    if (isJumping) return 'o';
    if (isFalling) return '>';
    return '^';
  };

  const faceRotationClass = velocity.x > 0 ? '' : velocity.x < 0 ? 'scale-x-[-1]' : '';

  return (
    <div
      className="absolute transition-transform duration-100"
      style={{
        left: position.x,
        top: position.y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        transform: `
          scaleY(${isJumping ? 1.1 : isFalling ? 0.9 : 1})
          scaleX(${isJumping || isFalling ? 0.95 : 1})
        `,
        willChange: 'left, top, transform'
      }}
    >
      <div 
        className={`w-full h-full bg-pink-400 rounded-full border-2 border-black flex items-center justify-center text-black font-bold text-lg transition-transform duration-100 ${faceRotationClass}`}
        style={{ filter: 'drop-shadow(5px 5px 3px rgba(0,0,0,0.3))' }}
      >
        <div className="flex gap-1 items-center">
            <span className="w-2 h-4 bg-black rounded-full" />
            <span>{playerFace()}</span>
            <span className="w-2 h-4 bg-black rounded-full" />
        </div>
      </div>
      {/* Feet */}
      <div className="absolute -bottom-1 left-1 w-4 h-4 bg-red-600 rounded-full border-2 border-black" />
      <div className="absolute -bottom-1 right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-black" />
    </div>
  );
};
