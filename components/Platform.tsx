
import React from 'react';
import { PlatformData } from '../types';

interface PlatformProps extends PlatformData {
  isSelected: boolean;
  isEditable: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onResizeHandleMouseDown: (e: React.MouseEvent, direction: 'left' | 'right') => void;
  onResizeHandleTouchStart: (e: React.TouchEvent, direction: 'left' | 'right') => void;
  isHovered: boolean;
  isTouchDevice: boolean;
  isBeingDragged: boolean;
  activeHandle: 'left' | 'right' | null;
}

export const Platform: React.FC<PlatformProps> = ({ position, width, height, isSelected, isEditable, onMouseDown, onTouchStart, onResizeHandleMouseDown, onResizeHandleTouchStart, isHovered, isTouchDevice, isBeingDragged, activeHandle }) => {
  
  const getBoxShadow = () => {
    if (isSelected) return '0 0 15px 5px rgba(59, 130, 246, 0.7)';
    if (isHovered) return '0 0 15px 5px rgba(255, 255, 255, 0.5)';
    return undefined;
  };
  
  const interactionStyle = {
    boxShadow: getBoxShadow(),
  };

  const cursorStyle = isEditable ? 'cursor-move' : '';
  
  const handleSizeClass = isTouchDevice ? 'w-6 h-6' : 'w-3 h-3';
  const leftHandlePosClass = isTouchDevice ? '-left-3' : '-left-1.5';
  const rightHandlePosClass = isTouchDevice ? '-right-3' : '-right-1.5';

  return (
    <div
      className={`absolute bg-green-500 border-2 border-green-800 rounded-lg ${cursorStyle} transition-transform duration-100 ${isBeingDragged ? 'z-50' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        borderBottomWidth: '8px',
        filter: 'drop-shadow(5px 8px 4px rgba(0,0,0,0.3))',
        transform: `rotateX(5deg) ${isBeingDragged ? 'scale(1.1)' : 'scale(1)'}`,
        willChange: 'left, top, width, transform',
        ...interactionStyle
      }}
      onMouseDown={isEditable ? onMouseDown : undefined}
      onTouchStart={isEditable ? onTouchStart : undefined}
    >
      <div className="absolute w-full h-1 bg-green-400 top-1 rounded-full opacity-50"/>
      {isSelected && (
        <>
          <div 
            className={`absolute top-1/2 -translate-y-1/2 bg-blue-500 rounded-full border-2 border-white cursor-ew-resize transition-transform duration-100 ${handleSizeClass} ${leftHandlePosClass} ${activeHandle === 'left' ? 'scale-150' : ''}`}
            onMouseDown={(e) => onResizeHandleMouseDown(e, 'left')}
            onTouchStart={(e) => onResizeHandleTouchStart(e, 'left')}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 bg-blue-500 rounded-full border-2 border-white cursor-ew-resize transition-transform duration-100 ${handleSizeClass} ${rightHandlePosClass} ${activeHandle === 'right' ? 'scale-150' : ''}`}
            onMouseDown={(e) => onResizeHandleMouseDown(e, 'right')}
            onTouchStart={(e) => onResizeHandleTouchStart(e, 'right')}
          />
        </>
      )}
    </div>
  );
};
