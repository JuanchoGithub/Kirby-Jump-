import React from 'react';
import { SceneryData } from '../types';
import { GAME_WIDTH } from '../constants';

interface SceneryProps extends SceneryData {
    cameraY: number;
}

const Cloud1: React.FC = () => (
    <div className="w-full h-full filter blur-sm">
        <div className="relative w-full h-full bg-white rounded-full opacity-80">
            <div className="absolute w-1/2 h-1/2 bg-white rounded-full -top-1/4 left-1/4" />
            <div className="absolute w-3/5 h-3/5 bg-white rounded-full -bottom-1/4 left-1/8" />
            <div className="absolute w-2/5 h-2/5 bg-white rounded-full -bottom-1/4 right-1/4" />
        </div>
    </div>
);

const Cloud2: React.FC = () => (
    <div className="w-full h-full filter blur-sm">
        <div className="relative w-full h-full bg-white rounded-full opacity-70">
            <div className="absolute w-3/4 h-3/4 bg-white rounded-full top-0 right-0" />
        </div>
    </div>
);

const Hill1: React.FC = () => (
    <div className="w-full h-full bg-green-400 opacity-80 rounded-t-full" style={{
        borderTop: '10px solid #2f855a'
    }}>
    </div>
);

const Sun: React.FC = () => (
    <div className="w-full h-full bg-yellow-300 rounded-full animate-glow"/>
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

export const Scenery: React.FC<SceneryProps> = ({ id, asset, position, width, height, depth, cameraY }) => {
  // To counteract the main container's scroll (-cameraY), we apply a positive transform.
  // The amount of transform is proportional to the camera's position and inversely proportional to the depth.
  // This makes distant objects appear to scroll slower.
  const parallaxY = cameraY * (1 - 1 / depth);

  const wrapperStyle: React.CSSProperties = {
    // Force the element onto its own compositing layer to prevent rendering glitches
    // in complex, transformed/animated scenes.
    transform: 'translateZ(0px)',
  };
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
        transform: `translateY(${parallaxY}px)`,
        zIndex: 0
      }}
    >
        <div className={wrapperClassName} style={wrapperStyle}>
            {assetMap[asset]}
        </div>
    </div>
  );
};