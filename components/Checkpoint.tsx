import React from 'react';
import { CheckpointData } from '../types';

interface CheckpointProps extends CheckpointData {
  isActive: boolean;
  isSelected: boolean;
  isEditable: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  isHovered: boolean;
}

// FIX: Added 'style' to the component's props to allow passing style attributes to the underlying SVG element.
const StarIcon: React.FC<{className?: string; style?: React.CSSProperties}> = ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"/>
    </svg>
);


export const Checkpoint: React.FC<CheckpointProps> = ({ position, width, height, isActive, isSelected, isEditable, onMouseDown, onTouchStart, isHovered }) => {
  const colorClass = isActive ? 'text-yellow-400' : 'text-gray-500';
  const animationClass = isActive ? 'animate-pulse' : 'opacity-60';
  
  const getFilter = () => {
    const baseShadow = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))';
    if (isSelected) return 'drop-shadow(0px 0px 10px rgba(59, 130, 246, 0.9))';
    if (isHovered) return 'drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.8))';
    return baseShadow;
  };

  const interactionStyle = {
    filter: getFilter(),
  };
  
  const cursorStyle = isEditable ? 'cursor-move' : '';

  return (
    <div
      className={`absolute flex items-center justify-center ${cursorStyle}`}
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
      }}
      onMouseDown={isEditable ? onMouseDown : undefined}
      onTouchStart={isEditable ? onTouchStart : undefined}
    >
      <StarIcon 
        className={`w-full h-full ${colorClass} ${animationClass} transition-colors duration-500`} 
        style={interactionStyle} 
      />
    </div>
  );
};
