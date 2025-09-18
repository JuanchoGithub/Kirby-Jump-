import React from 'react';
import { TrapData } from '../types';

interface TrapProps extends TrapData {
  isSelected: boolean;
  isEditable: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onResizeHandleMouseDown: (e: React.MouseEvent, direction: 'left' | 'right') => void;
  onResizeHandleTouchStart: (e: React.TouchEvent, direction: 'left' | 'right') => void;
  isHovered: boolean;
}

const Spikes: React.FC<{width: number, height: number}> = ({ width, height }) => {
    const spikeCount = Math.max(1, Math.floor(width / (height * 0.8)));
    const spikeWidth = width / spikeCount;
    const points = Array.from({ length: spikeCount }).map((_, i) => {
        const startX = i * spikeWidth;
        const midX = startX + spikeWidth / 2;
        const endX = startX + spikeWidth;
        return `${startX},${height} ${midX},0 ${endX},${height}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <polygon points={points} className="fill-current text-gray-500" stroke="black" strokeWidth="1" strokeLinejoin="round" />
        </svg>
    );
};

const assetMap = {
    spikes: Spikes,
};

export const Trap: React.FC<TrapProps> = ({ type, position, width, height, isSelected, isEditable, onMouseDown, onTouchStart, onResizeHandleMouseDown, onResizeHandleTouchStart, isHovered }) => {
  const getFilter = () => {
    if (isSelected) return 'drop-shadow(0px 0px 8px rgba(239, 68, 68, 0.9))';
    if (isHovered) return 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
    return undefined;
  }
  
  const interactionStyle = {
    filter: getFilter(),
  };

  const cursorStyle = isEditable ? 'cursor-move' : '';
  const TrapComponent = assetMap[type];

  return (
    <div
      className={`absolute ${cursorStyle}`}
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        ...interactionStyle
      }}
      onMouseDown={isEditable ? onMouseDown : undefined}
      onTouchStart={isEditable ? onTouchStart : undefined}
    >
      <TrapComponent width={width} height={height} />
      {isSelected && (
        <>
          <div 
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white cursor-ew-resize"
            onMouseDown={(e) => onResizeHandleMouseDown(e, 'left')}
            onTouchStart={(e) => onResizeHandleTouchStart(e, 'left')}
          />
          <div
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white cursor-ew-resize"
            onMouseDown={(e) => onResizeHandleMouseDown(e, 'right')}
            onTouchStart={(e) => onResizeHandleTouchStart(e, 'right')}
          />
        </>
      )}
    </div>
  );
};
