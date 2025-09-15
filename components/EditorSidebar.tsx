import React from 'react';
import { PlatformData, Theme } from '../types';

interface EditorSidebarProps {
    mode: 'play' | 'edit';
    theme: Theme;
    onToggleMode: () => void;
    onSetTheme: (theme: Theme) => void;
    onAddPlatform: () => void;
    onAddCheckpoint: () => void;
    onAddTrap: () => void;
    onDeleteSelected: () => void;
    isObjectSelected: boolean;
    onSave: () => void;
    onExport: () => void;
    onExit: () => void;
    levelName: string;
    onLevelNameChange: (newName: string) => void;
    saveStatus: 'idle' | 'saving' | 'saved';
    selectedObject: {id: number, type: 'platform', data: PlatformData } | null;
    onUpdatePlatform: (id: number, updates: Partial<PlatformData>) => void;
}

const SidebarSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="flex flex-col gap-2 border-t border-gray-700 pt-3">
        <h3 className="text-lg font-bold text-gray-300 px-1 mb-1">{title}</h3>
        {children}
    </div>
);

const SidebarButton: React.FC<{ onClick?: () => void, disabled?: boolean, children: React.ReactNode, active?: boolean }> = ({ onClick, disabled, children, active }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-3 py-2 rounded-lg transition-colors text-white text-sm text-left
        ${active ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
);

const ThemeButton: React.FC<{ onClick: () => void, active: boolean, children: React.ReactNode }> = ({ onClick, active, children }) => (
    <button
        onClick={onClick}
        className={`w-full py-2 rounded-lg transition-colors text-white text-sm
        ${active ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
    >
        {children}
    </button>
);


const getSaveButtonText = (status: 'idle' | 'saving' | 'saved') => {
    switch (status) {
        case 'saving': return 'Saving...';
        case 'saved': return 'Saved!';
        default: return 'Save Level';
    }
};

const PanelInput: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex items-center justify-between px-1">
        <label className="text-sm text-gray-300">{label}</label>
        {children}
    </div>
);

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  theme, onSetTheme, onAddPlatform, onAddCheckpoint, onAddTrap,
  onDeleteSelected, isObjectSelected, onSave, onExport, onExit, levelName, onLevelNameChange, 
  saveStatus, onToggleMode, selectedObject, onUpdatePlatform
}) => {
    const platform = selectedObject?.data;
    const isMoving = !!platform?.movement;

    const handleToggleMovement = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!platform) return;
        if (e.target.checked) {
            onUpdatePlatform(platform.id, {
                movement: {
                    path: [platform.position, { x: platform.position.x + 100, y: platform.position.y }],
                    speed: 50,
                }
            });
        } else {
            onUpdatePlatform(platform.id, { movement: undefined });
        }
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!platform?.movement) return;
        const newSpeed = parseInt(e.target.value, 10);
        if (!isNaN(newSpeed) && newSpeed >= 0) {
            onUpdatePlatform(platform.id, {
                movement: { ...platform.movement, speed: newSpeed }
            });
        }
    };

    return (
        <div className="w-72 bg-gray-800 text-white rounded-lg shadow-2xl p-4 flex flex-col gap-3 h-[816px] overflow-y-auto">
            <div className="flex flex-col gap-2">
                 <h2 className="text-2xl font-bold text-center text-white pb-2 border-b border-gray-700">Editor</h2>
                <SidebarButton onClick={onExit}>{'< Back to Menu'}</SidebarButton>
                <SidebarButton onClick={onToggleMode}>Test Level</SidebarButton>
            </div>
            
            <SidebarSection title="Level">
                <input 
                    type="text"
                    value={levelName}
                    onChange={(e) => onLevelNameChange(e.target.value)}
                    className="bg-gray-700 text-white text-md font-bold rounded-md px-2 py-2 w-full transition-colors focus:bg-gray-600 focus:outline-none"
                    placeholder="Level Name"
                />
                <div className="flex gap-2">
                    <SidebarButton onClick={onSave} disabled={saveStatus !== 'idle'}>{getSaveButtonText(saveStatus)}</SidebarButton>
                    <SidebarButton onClick={onExport}>Export</SidebarButton>
                </div>
            </SidebarSection>
            
            <SidebarSection title="Tools">
                <SidebarButton onClick={onAddPlatform}>+ Add Platform</SidebarButton>
                <SidebarButton onClick={onAddCheckpoint}>+ Add Checkpoint</SidebarButton>
                <SidebarButton onClick={onAddTrap}>+ Add Trap</SidebarButton>
                <SidebarButton onClick={onDeleteSelected} disabled={!isObjectSelected}>Delete Selected</SidebarButton>
            </SidebarSection>

            <SidebarSection title="Properties">
                {selectedObject?.type === 'platform' && platform ? (
                    <div className="space-y-3 p-2 bg-gray-900/50 rounded-lg">
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
                ) : (
                    <p className="text-sm text-gray-400 italic px-1">Select a platform to edit.</p>
                )}
            </SidebarSection>
            
            <SidebarSection title="Theme">
                <div className="grid grid-cols-2 gap-2">
                    <ThemeButton onClick={() => onSetTheme('day')} active={theme === 'day'}>Day</ThemeButton>
                    <ThemeButton onClick={() => onSetTheme('afternoon')} active={theme === 'afternoon'}>Afternoon</ThemeButton>
                    <ThemeButton onClick={() => onSetTheme('night')} active={theme === 'night'}>Night</ThemeButton>
                    <ThemeButton onClick={() => onSetTheme('twilight')} active={theme === 'twilight'}>Twilight</ThemeButton>
                </div>
            </SidebarSection>
        </div>
    );
};
