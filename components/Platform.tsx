import React from 'react';
import { PlatformData } from '../types';

interface PlatformProps extends PlatformData {
  isSelected: boolean;
  isEditable: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeHandleMouseDown: (e: React.MouseEvent, direction: 'left' | 'right') => void;
  isHovered: boolean;
}

export const Platform: React.FC<PlatformProps> = ({ position, width, height, isSelected, isEditable, onMouseDown, onResizeHandleMouseDown, isHovered }) => {
  
  const getBoxShadow = () => {
    if (isSelected) return '0 0 15px 5px rgba(59, 130, 246, 0.7)';
    if (isHovered) return '0 0 15px 5px rgba(255, 255, 255, 0.5)';
    return undefined;
  };
  
  const interactionStyle = {
    boxShadow: getBoxShadow(),
  };

  const cursorStyle = isEditable ? 'cursor-move' : '';

  return (
    <div
      className={`absolute bg-green-500 border-2 border-green-800 rounded-lg ${cursorStyle}`}
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        borderBottomWidth: '8px',
        filter: 'drop-shadow(5px 8px 4px rgba(0,0,0,0.3))',
        transform: 'rotateX(5deg)',
        ...interactionStyle
      }}
      onMouseDown={isEditable ? onMouseDown : undefined}
    >
      <div className="absolute w-full h-1 bg-green-400 top-1 rounded-full opacity-50"/>
      {isSelected && (
        <>
          <div 
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-ew-resize"
            onMouseDown={(e) => onResizeHandleMouseDown(e, 'left')}
          />
          <div
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-ew-resize"
            onMouseDown={(e) => onResizeHandleMouseDown(e, 'right')}
          />
        </>
      )}
    </div>
  );
};
