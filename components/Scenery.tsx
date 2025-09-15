import React from 'react';
import { SceneryData } from '../types';

interface SceneryProps extends SceneryData {
    cameraY: number;
}

const Cloud1: React.FC = () => (
    <div className="w-full h-full bg-white rounded-full opacity-80 filter blur-sm">
        <div className="absolute w-1/2 h-1/2 bg-white rounded-full -top-1/4 left-1/4" />
        <div className="absolute w-3/5 h-3/5 bg-white rounded-full -bottom-1/4 left-1/8" />
        <div className="absolute w-2/5 h-2/5 bg-white rounded-full -bottom-1/4 right-1/4" />
    </div>
);

const Cloud2: React.FC = () => (
    <div className="w-full h-full bg-white rounded-full opacity-70 filter blur-sm">
        <div className="absolute w-3/4 h-3/4 bg-white rounded-full top-0 right-0" />
    </div>
);

const Hill1: React.FC = () => (
    <div className="w-full h-full bg-green-400 opacity-80 rounded-t-full" style={{
        borderTop: '10px solid #2f855a'
    }}>
    </div>
);

const Sun: React.FC = () => (
    <div className="w-full h-full bg-yellow-300 rounded-full" style={{
        boxShadow: '0 0 50px 20px rgba(253, 224, 71, 0.5)'
    }}/>
);

const Bird: React.FC = () => (
    <div className="w-full h-full animate-fly">
        <div className="absolute w-1/2 h-full border-t-4 border-black origin-bottom-right -rotate-45" />
        <div className="absolute right-0 w-1/2 h-full border-t-4 border-black origin-bottom-left rotate-45" />
    </div>
);

const Moon: React.FC = () => (
    <div className="w-full h-full bg-gray-200 rounded-full" style={{
        boxShadow: '0 0 30px 5px rgba(229, 231, 235, 0.3)'
    }} />
);

const Star: React.FC = () => (
    <div className="w-full h-full bg-white rounded-full animate-pulse" />
);

const Planet: React.FC = () => (
    <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-full h-full bg-amber-600 rounded-full" />
        <div className="absolute w-[160%] h-[20%] border-2 border-amber-300 rounded-full rotate-[-30deg]" />
    </div>
);


const assetMap = {
    cloud1: <Cloud1 />,
    cloud2: <Cloud2 />,
    hill1: <Hill1 />,
    sun: <Sun />,
    bird: <Bird />,
    moon: <Moon />,
    star: <Star />,
    planet: <Planet />,
};

export const Scenery: React.FC<SceneryProps> = ({ asset, position, width, height, depth, cameraY }) => {
  const parallaxY = cameraY / depth;

  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        transform: `translateY(${parallaxY}px)`,
        zIndex: -depth
      }}
    >
        {assetMap[asset]}
    </div>
  );
};
