import React from 'react';
import { SignData } from '../types';

interface SignProps extends SignData {
  isSelected: boolean;
  isEditable: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  isHovered: boolean;
  isBeingDragged: boolean;
}

const SIGN_VARIANTS = {
  effortless: { text: 'Sin esfuerzo', bgColor: 'bg-white', textColor: 'text-black' },
  easy: { text: 'Facil', bgColor: 'bg-green-500', textColor: 'text-white' },
  medium: { text: 'Medio', bgColor: 'bg-yellow-400', textColor: 'text-black' },
  hard: { text: 'Dificil', bgColor: 'bg-red-600', textColor: 'text-white' },
  impossible: { text: 'Imposible', bgColor: 'bg-pink-500', textColor: 'text-white' },
  extreme: { text: 'Extremo', bgColor: 'bg-black', textColor: 'text-red-500' },
};

export const Sign: React.FC<SignProps> = React.memo(({ position, width, height, variant, isSelected, isEditable, onMouseDown, onTouchStart, isHovered, isBeingDragged }) => {
  const variantData = SIGN_VARIANTS[variant] || SIGN_VARIANTS.easy;

  const getFilter = () => {
    const baseShadow = 'drop-shadow(5px 5px 4px rgba(0,0,0,0.3))';
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
      className={`absolute flex flex-col items-center ${cursorStyle} transition-transform duration-100 ${isBeingDragged ? 'z-50' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        transform: isBeingDragged ? 'scale(1.2)' : 'scale(1)',
        willChange: 'left, top, transform',
        ...interactionStyle
      }}
      onMouseDown={isEditable ? onMouseDown : undefined}
      onTouchStart={isEditable ? onTouchStart : undefined}
    >
      {/* Sign Board */}
      <div 
        className={`w-full h-1/2 rounded-md border-4 border-yellow-800 flex items-center justify-center p-1 ${variantData.bgColor}`}
        style={{
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)',
        }}
      >
        <span className={`font-bold text-center ${variantData.textColor}`} style={{ fontSize: `${width / 8}px`, textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
            {variantData.text}
        </span>
      </div>
      {/* Sign Post */}
      <div 
        className="w-1/6 h-1/2 bg-yellow-900 border-x-2 border-yellow-950"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.2) 50%, transparent 50%)',
          backgroundSize: '8px 8px',
        }}
      />
    </div>
  );
});
