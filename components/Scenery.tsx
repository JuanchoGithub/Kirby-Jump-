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
    <svg viewBox="0 0 40 20" className="w-full h-full text-black" style={{ overflow: 'visible' }} aria-hidden="true">
        <path 
            d="M0 10 Q 20 0 40 10" 
            stroke="currentColor" 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round" 
            className="animate-flap"
        />
    </svg>
);

const Moon: React.FC = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ overflow: 'visible' }} aria-hidden="true">
        <defs>
            <radialGradient id="moonGlowGradient">
                <stop offset="30%" stopColor="rgba(229, 231, 235, 0.4)" />
                <stop offset="80%" stopColor="rgba(229, 231, 235, 0)" />
            </radialGradient>
        </defs>
        <g className="animate-moon-glow" style={{ transformOrigin: '50% 50%' }}>
            <circle cx="50" cy="50" r="75" fill="url(#moonGlowGradient)" />
        </g>
        <circle cx="50" cy="50" r="50" fill="#e5e7eb" /> {/* gray-200 */}
    </svg>
);

const Star: React.FC = () => (
    <svg viewBox="0 0 20 20" className="w-full h-full" aria-hidden="true">
        <circle cx="10" cy="10" r="10" fill="white" />
    </svg>
);

const Planet: React.FC = () => (
    <svg viewBox="0 0 100 60" className="w-full h-full" style={{ overflow: 'visible' }} aria-hidden="true">
        <g className="animate-ring-rotate" style={{ transformOrigin: '50% 50%'}}>
            <circle cx="50" cy="30" r="28" fill="#d97706" /> {/* amber-600 */}
            <ellipse cx="50" cy="30" rx="45" ry="10" fill="none" stroke="#fcd34d" strokeWidth="3" /> {/* amber-300 */}
        </g>
    </svg>
);

const ShootingStar: React.FC = () => (
    <svg viewBox="0 0 100 2" className="w-24 h-0.5" preserveAspectRatio="none" style={{ transform: 'rotate(135deg)', overflow: 'visible' }}>
        <defs>
            <linearGradient id="starTailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
        </defs>
        <line x1="0" y1="1" x2="100" y2="1" stroke="url(#starTailGradient)" strokeWidth="2" />
    </svg>
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
  } else if (asset === 'bird') {
    wrapperClassName = position.x < GAME_WIDTH / 2 ? 'animate-fly-across-right' : 'animate-fly-across-left';
    wrapperStyle.animationDuration = `${12 + (id % 8)}s`;
    wrapperStyle.animationDelay = `${(id % 60) / 10}s`;
    wrapperStyle.animationTimingFunction = 'linear';
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