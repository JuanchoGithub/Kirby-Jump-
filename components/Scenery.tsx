import React from 'react';
import { SceneryData } from '../types';
import { GAME_WIDTH } from '../constants';

interface SceneryProps extends SceneryData {}

const Cloud1: React.FC = () => (
    <div className="w-full h-full opacity-80">
        <svg viewBox="0 0 150 100" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <filter id="cloudBlurFilter1" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
                </filter>
            </defs>
            <g filter="url(#cloudBlurFilter1)">
                <circle cx="75" cy="50" r="30" fill="white" />
                <circle cx="45" cy="55" r="25" fill="white" />
                <circle cx="105" cy="55" r="25" fill="white" />
                <circle cx="75" cy="35" r="20" fill="white" />
            </g>
        </svg>
    </div>
);

const Cloud2: React.FC = () => (
    <div className="w-full h-full opacity-70">
        <svg viewBox="0 0 120 80" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <filter id="cloudBlurFilter2" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                </filter>
            </defs>
            <g filter="url(#cloudBlurFilter2)">
                <circle cx="60" cy="40" r="25" fill="white" />
                <circle cx="85" cy="45" r="20" fill="white" />
                <circle cx="35" cy="45" r="18" fill="white" />
            </g>
        </svg>
    </div>
);

const Hill1: React.FC = () => (
    <div className="w-full h-full opacity-80">
        <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            className="w-full h-full"
            aria-hidden="true"
        >
            {/* This path creates the darker green "border" by being slightly larger and behind the main fill. */}
            <path 
                d="M 0 100 L 0 20 Q 50 -20 100 20 L 100 100 Z"
                fill="#2f855a" // Darker green, original border color
            />
            {/* This path is the main hill color, positioned slightly lower to reveal the "border" path above it. */}
            <path 
                d="M 0 100 L 0 24 Q 50 -16 100 24 L 100 100 Z"
                fill="#4ade80" // Lighter green, original fill color
            />
        </svg>
    </div>
);

const Sun: React.FC = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ overflow: 'visible' }} aria-hidden="true">
        <defs>
            <radialGradient id="sunGlowGradient">
                <stop offset="20%" stopColor="rgba(253, 224, 71, 0.4)" />
                <stop offset="60%" stopColor="rgba(253, 224, 71, 0)" />
            </radialGradient>
        </defs>
        <g className="animate-glow" style={{ transformOrigin: '50% 50%' }}>
            {/* Glow layer */}
            <circle cx="50" cy="50" r="100" fill="url(#sunGlowGradient)" />
        </g>
        {/* Solid sun layer */}
        <circle cx="50" cy="50" r="50" fill="#fde047" /> {/* Tailwind yellow-300 */}
    </svg>
);


const Bird: React.FC = () => (
    <div className="w-full h-full animate-fly">
        <div className="absolute w-1/2 h-full border-t-4 border-black origin-bottom-right -rotate-45" />
        <div className="absolute right-0 w-1/2 h-full border-t-4 border-black origin-bottom-left rotate-45" />
    </div>
);

const Moon: React.FC = () => (
    <div className="w-full h-full bg-gray-200 rounded-full animate-moon-glow" />
);

const Star: React.FC = () => (
    <div className="w-full h-full bg-white rounded-full" />
);

const Planet: React.FC = () => (
    <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-full h-full bg-amber-600 rounded-full" />
        <div className="absolute w-[160%] h-[20%] border-2 border-amber-300 rounded-full animate-ring-rotate" />
    </div>
);

const ShootingStar: React.FC = () => (
    <div className="w-24 h-0.5 bg-gradient-to-r from-white/80 to-transparent transform rotate-[135deg]" />
);


const assetMap: { [key in SceneryData['asset']]: React.ReactElement } = {
    cloud1: <Cloud1 />,
    cloud2: <Cloud2 />,
    hill1: <Hill1 />,
    sun: <Sun />,
    bird: <Bird />,
    moon: <Moon />,
    star: <Star />,
    planet: <Planet />,
    shootingStar: <ShootingStar />,
};

export const Scenery: React.FC<SceneryProps> = ({ id, asset, position, width, height }) => {
  const wrapperStyle: React.CSSProperties = {};
  let wrapperClassName = '';

  if (asset === 'cloud1' || asset === 'cloud2') {
    wrapperClassName = position.x < GAME_WIDTH / 2 ? 'animate-drift' : 'animate-drift-reverse';
    wrapperStyle.animationDuration = `${15 + (id % 15)}s`;
  } else if (asset === 'star') {
    wrapperClassName = 'animate-twinkle';
    wrapperStyle.animationDelay = `${(id % 30) / 10}s`;
    wrapperStyle.animationDuration = `${2 + (id % 20) / 10}s`;
  } else if (asset === 'shootingStar') {
    wrapperClassName = 'animate-shoot';
    wrapperStyle.animationDelay = `${(id % 80) / 10}s`;
    wrapperStyle.animationDuration = `${1.5 + (id % 20) / 10}s`;
  }

  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        zIndex: 0
      }}
    >
        <div className={wrapperClassName} style={wrapperStyle}>
            {assetMap[asset]}
        </div>
    </div>
  );
};