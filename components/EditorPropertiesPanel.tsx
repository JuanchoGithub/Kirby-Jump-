import React from 'react';
import { PlatformData, Vector2D } from '../types';

interface EditorPropertiesPanelProps {
  selectedObject: {id: number, type: 'platform', data: PlatformData };
  onUpdatePlatform: (id: number, updates: Partial<PlatformData>) => void;
}

const PanelInput: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">{label}</label>
        {children}
    </div>
);

export const EditorPropertiesPanel: React.FC<EditorPropertiesPanelProps> = ({ selectedObject, onUpdatePlatform }) => {
    if (selectedObject.type !== 'platform') {
        return null;
    }

    const platform = selectedObject.data;
    const isMoving = !!platform.movement;

    const handleToggleMovement = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Add movement with default values
            onUpdatePlatform(platform.id, {
                movement: {
                    path: [platform.position, { x: platform.position.x + 100, y: platform.position.y }],
                    speed: 50,
                }
            });
        } else {
            // Remove movement
            onUpdatePlatform(platform.id, { movement: undefined });
        }
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!platform.movement) return;
        const newSpeed = parseInt(e.target.value, 10);
        if (!isNaN(newSpeed) && newSpeed >= 0) {
            onUpdatePlatform(platform.id, {
                movement: { ...platform.movement, speed: newSpeed }
            });
        }
    };

    return (
        <div 
            className="absolute top-28 right-2 bg-gray-800 text-white p-4 rounded-lg shadow-lg w-64 z-20" 
            onMouseDown={e => e.stopPropagation()}
            onMouseMove={e => e.stopPropagation()}
        >
            <h3 className="text-lg font-bold border-b border-gray-600 pb-2 mb-3">Platform Properties</h3>
            <div className="space-y-3">
                <PanelInput label="Enable Movement">
                    <input 
                        type="checkbox"
                        checked={isMoving}
                        onChange={handleToggleMovement}
                        className="w-5 h-5 accent-yellow-400"
                    />
                </PanelInput>
                
                {isMoving && platform.movement && (
                    <PanelInput label="Speed (px/s)">
                        <input
                            type="number"
                            value={platform.movement.speed}
                            onChange={handleSpeedChange}
                            className="bg-gray-700 rounded px-2 py-1 w-24 text-right"
                            min="0"
                        />
                    </PanelInput>
                )}
            </div>
        </div>
    );
};
