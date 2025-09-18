import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlatformData, Theme } from '../types';
import type { EditorTool } from './GameView';
import type { GamepadState } from '../hooks/useGamepadInput';

interface EditorSidebarProps {
    theme: Theme;
    onSetTheme: (theme: Theme) => void;
    onDeleteSelected: () => void;
    isObjectSelected: boolean;
    onSave: () => void;
    onExport: () => void;
    onExit: () => void;
    onRequestTestLevel: () => void;
    levelName: string;
    onLevelNameChange: (newName: string) => void;
    saveStatus: 'idle' | 'saving' | 'saved';
    selectedObject: {id: number, type: 'platform', data: PlatformData } | null;
    onUpdatePlatform: (id: number, updates: Partial<PlatformData>) => void;
    activeTool: EditorTool;
    onSetTool: (tool: EditorTool) => void;
    gamepadState: GamepadState;
    prevGamepadState: GamepadState;
    isSidebarFocused: boolean;
    onSetIsSidebarFocused: (isFocused: boolean) => void;
    onClose: () => void;
}

// --- SVG Icons for Tools ---
const SelectIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h-2v-3c0-2.206-1.794-4-4-4s-4 1.794-4 4v3H8v-3c0-3.309 2.691-6 6-6s6 2.691 6 6v3z"/></svg>
const PlatformIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 10h16v4H4z" /></svg>
const CheckpointIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
const TrapIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 4 10 16H2L12 4z" /></svg>
const DeleteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const TestIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
const SaveIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" /></svg>;
const ExitIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" /></svg>;
const ExportIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;


const SidebarSection: React.FC<{title?: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
    <div className={`flex flex-col gap-2 border-t border-gray-700 pt-3 ${className}`}>
        {title && <h3 className="text-lg font-bold text-gray-300 px-1 mb-1">{title}</h3>}
        {children}
    </div>
);

const ToolButton: React.FC<{ onClick: () => void, label: string, icon: React.ReactNode, active?: boolean, disabled?: boolean, isFocused?: boolean }> = ({ onClick, label, icon, active, disabled, isFocused }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all transform hover:scale-105
        ${active ? 'bg-blue-600 shadow-md' : 'bg-gray-700 hover:bg-gray-600'}
        ${disabled ? 'opacity-40 cursor-not-allowed hover:scale-100' : 'shadow-sm'}
        ${isFocused ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800' : ''}`}
    >
        <div className="w-10 h-10 text-white">{icon}</div>
        <span className="mt-1 text-xs font-semibold">{label}</span>
    </button>
);

const getSaveButtonText = (status: 'idle' | 'saving' | 'saved') => {
    switch (status) {
        case 'saving': return 'Saving...';
        case 'saved': return 'Saved!';
        default: return 'Save';
    }
};

const PanelInput: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex items-center justify-between px-1">
        <label className="text-sm text-gray-300">{label}</label>
        {children}
    </div>
);

const ControlHelp: React.FC<{ button: string | React.ReactNode, action: string }> = ({ button, action }) => (
    <div className="flex items-center justify-between text-sm text-gray-400 px-1 py-0.5">
        <span className="font-mono bg-gray-700 text-gray-200 px-2 py-0.5 rounded-md text-center min-w-[5rem] inline-block">{button}</span>
        <span className="text-right">{action}</span>
    </div>
);

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  theme, onSetTheme, onDeleteSelected, isObjectSelected, onSave, onExport, onExit, onRequestTestLevel,
  levelName, onLevelNameChange, saveStatus, selectedObject, onUpdatePlatform,
  activeTool, onSetTool, gamepadState, prevGamepadState, isSidebarFocused, onSetIsSidebarFocused, onClose,
}) => {
    const platform = selectedObject?.data;
    const isMoving = !!platform?.movement;
    
    const [focusedIndex, setFocusedIndex] = useState(0);
    const lastNavTimeRef = useRef(0);

    const focusableItems = useMemo(() => {
        const items = [
            { id: 'test', action: onRequestTestLevel, disabled: false },
            { id: 'exit', action: onExit, disabled: false },
            { id: 'select', action: () => onSetTool('select'), disabled: false },
            { id: 'add-platform', action: () => onSetTool('add-platform'), disabled: false },
            { id: 'add-checkpoint', action: () => onSetTool('add-checkpoint'), disabled: false },
            { id: 'add-trap', action: () => onSetTool('add-trap'), disabled: false },
            { id: 'delete', action: onDeleteSelected, disabled: !isObjectSelected },
            { id: 'save', action: onSave, disabled: saveStatus !== 'idle' },
            { id: 'export', action: onExport, disabled: false },
            { id: 'theme-day', action: () => onSetTheme('day'), disabled: false },
            { id: 'theme-afternoon', action: () => onSetTheme('afternoon'), disabled: false },
            { id: 'theme-night', action: () => onSetTheme('night'), disabled: false },
            { id: 'theme-twilight', action: () => onSetTheme('twilight'), disabled: false },
        ];
        return items;
    }, [isObjectSelected, onSetTool, onRequestTestLevel, onExit, onDeleteSelected, onSave, onExport, saveStatus, onSetTheme]);
    
    useEffect(() => {
        if (!isSidebarFocused) {
            setFocusedIndex(0);
            return;
        };

        const now = performance.now();
        const NAV_COOLDOWN = 150; // ms

        const dpadUp = gamepadState.buttons[12]?.pressed && !prevGamepadState.buttons[12]?.pressed;
        const dpadDown = gamepadState.buttons[13]?.pressed && !prevGamepadState.buttons[13]?.pressed;
        const aButtonPressed = gamepadState.buttons[0]?.pressed && !prevGamepadState.buttons[0]?.pressed;
        const bButtonPressed = gamepadState.buttons[1]?.pressed && !prevGamepadState.buttons[1]?.pressed;
        const viewButtonPressed = gamepadState.buttons[8]?.pressed && !prevGamepadState.buttons[8]?.pressed;
        
        if (now - lastNavTimeRef.current > NAV_COOLDOWN) {
            let moved = false;
            if (dpadDown) {
                setFocusedIndex(prev => (prev + 1) % focusableItems.length);
                moved = true;
            } else if (dpadUp) {
                setFocusedIndex(prev => (prev - 1 + focusableItems.length) % focusableItems.length);
                moved = true;
            }
            if (moved) lastNavTimeRef.current = now;
        }

        if (aButtonPressed) {
            const item = focusableItems[focusedIndex];
            if (item && !item.disabled) item.action();
        }
        
        if (bButtonPressed || viewButtonPressed) {
            onSetIsSidebarFocused(false);
            onClose();
        }

    }, [isSidebarFocused, gamepadState, prevGamepadState, focusableItems, focusedIndex, onSetIsSidebarFocused, onClose]);


    const handleToggleMovement = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!platform) return;
        if (e.target.checked) {
            onUpdatePlatform(platform.id, { movement: { path: [platform.position, { x: platform.position.x + 100, y: platform.position.y }], speed: 50 } });
        } else {
            onUpdatePlatform(platform.id, { movement: undefined });
        }
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!platform?.movement) return;
        const newSpeed = parseInt(e.target.value, 10);
        if (!isNaN(newSpeed) && newSpeed >= 0) {
            onUpdatePlatform(platform.id, { movement: { ...platform.movement, speed: newSpeed } });
        }
    };

    const renderControlHelp = () => {
        if (isSidebarFocused) {
            return (
                <>
                    <ControlHelp button="D-Pad" action="Navigate" />
                    <ControlHelp button="A" action="Select" />
                    <ControlHelp button="B / View" action="Back to Level" />
                </>
            );
        }

        return (
            <>
                <div className="text-center text-xs font-bold text-gray-500 mb-1">Controller</div>
                {isObjectSelected ? (
                    <>
                        {selectedObject?.type === 'platform' && ( <> <ControlHelp button="RT (hold)" action="Set Move Path" /> <ControlHelp button="D-Pad ↕" action="Change Speed" /> </> )}
                        <ControlHelp button="R Stick" action="Move Object" />
                        <ControlHelp button="D-Pad ↔" action="Resize Width" />
                        <ControlHelp button="B" action="Deselect" />
                    </>
                ) : (
                    <>
                        <ControlHelp button="L Stick" action="Move Cursor" />
                        <ControlHelp button="R Stick ↕" action="Pan View" />
                        <ControlHelp button="A" action="Place / Select" />
                        <ControlHelp button="LB/RB" action="Cycle Tools" />
                    </>
                )}
                <div className="border-t border-gray-700 my-1"/>
                <ControlHelp button="Y" action="Cycle Theme" />
                <ControlHelp button="Start" action="Test Level" />
                <ControlHelp button="View" action="Focus Sidebar" />

                <div className="text-center text-xs font-bold text-gray-500 mt-3 mb-1">Touch / Mouse</div>
                <ControlHelp button="Tap/Click" action="Place / Select" />
                <ControlHelp button="Drag" action="Move / Resize" />
                <ControlHelp button="Wheel/Pinch" action="Pan/Zoom View" />
                <ControlHelp button="Delete" action="Delete Selected" />
            </>
        )
    };

    return (
        <div className="w-full bg-gray-800 text-white p-4 flex flex-col gap-3 h-full overflow-y-auto">
            <div className="flex justify-between items-center pb-2">
                <h2 className="text-2xl font-bold text-white text-center">Editor</h2>
                <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
            </div>
             
            <SidebarSection className="border-t-0 pt-0">
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={onRequestTestLevel} className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-colors text-white font-bold bg-green-600 hover:bg-green-500 ${isSidebarFocused && focusableItems[focusedIndex].id === 'test' ? 'ring-2 ring-yellow-400' : ''}`} title="Test Level (Start Button)">
                        <div className="w-5 h-5"><TestIcon /></div>
                        Test
                    </button>
                    <button onClick={onExit} className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-white font-semibold bg-red-700 hover:bg-red-600 ${isSidebarFocused && focusableItems[focusedIndex].id === 'exit' ? 'ring-2 ring-yellow-400' : ''}`} title="Back to Menu">
                        <div className="w-5 h-5"><ExitIcon /></div>
                        Exit
                    </button>
                </div>
            </SidebarSection>
            
            <SidebarSection title="Tools">
                <div className="grid grid-cols-3 gap-2">
                    <ToolButton label="Select" icon={<SelectIcon/>} active={activeTool==='select'} onClick={()=>onSetTool('select')} isFocused={isSidebarFocused && focusableItems[focusedIndex].id === 'select'}/>
                    <ToolButton label="Platform" icon={<PlatformIcon/>} active={activeTool==='add-platform'} onClick={()=>onSetTool('add-platform')} isFocused={isSidebarFocused && focusableItems[focusedIndex].id === 'add-platform'}/>
                    <ToolButton label="Checkpoint" icon={<CheckpointIcon/>} active={activeTool==='add-checkpoint'} onClick={()=>onSetTool('add-checkpoint')} isFocused={isSidebarFocused && focusableItems[focusedIndex].id === 'add-checkpoint'}/>
                    <ToolButton label="Trap" icon={<TrapIcon/>} active={activeTool==='add-trap'} onClick={()=>onSetTool('add-trap')} isFocused={isSidebarFocused && focusableItems[focusedIndex].id === 'add-trap'}/>
                    <ToolButton label="Delete" icon={<DeleteIcon/>} disabled={!isObjectSelected} onClick={onDeleteSelected} isFocused={isSidebarFocused && focusableItems[focusedIndex].id === 'delete'}/>
                </div>
            </SidebarSection>

            <SidebarSection title="Level">
                <input 
                    type="text"
                    value={levelName}
                    onChange={(e) => onLevelNameChange(e.target.value)}
                    className="bg-gray-700 text-white text-md font-bold rounded-md px-3 py-2 w-full transition-colors focus:bg-gray-600 focus:outline-none"
                    placeholder="Level Name"
                />
                <div className="flex gap-2">
                    <button onClick={onSave} disabled={saveStatus !== 'idle'} className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-colors text-white font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${isSidebarFocused && focusableItems[focusedIndex].id === 'save' ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800' : ''}`}>
                        <div className="w-5 h-5"><SaveIcon /></div>
                        {getSaveButtonText(saveStatus)}
                    </button>
                    <button onClick={onExport} className={`flex-shrink-0 flex items-center justify-center p-3 rounded-lg transition-colors text-white font-bold bg-gray-600 hover:bg-gray-500 ${isSidebarFocused && focusableItems[focusedIndex].id === 'export' ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800' : ''}`} title="Export Level File">
                        <div className="w-5 h-5"><ExportIcon /></div>
                    </button>
                </div>
            </SidebarSection>
            
            <SidebarSection title="Properties">
                {selectedObject?.type === 'platform' && platform ? (
                    <div className="space-y-3 p-2 bg-gray-900/50 rounded-lg">
                        <PanelInput label="Enable Movement">
                            <input type="checkbox" checked={isMoving} onChange={handleToggleMovement} className="w-5 h-5 accent-yellow-400" />
                        </PanelInput>
                        
                        {isMoving && platform.movement && (
                            <PanelInput label="Speed (px/s)">
                                <input type="number" value={Math.round(platform.movement.speed)} onChange={handleSpeedChange} className="bg-gray-700 rounded px-2 py-1 w-24 text-right" min="0" />
                            </PanelInput>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-center text-gray-400 italic px-1 py-4">Select an object to edit its properties.</p>
                )}
            </SidebarSection>
            
            <SidebarSection title="Theme">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <button onClick={() => onSetTheme('day')} className={`py-2 rounded-lg transition-colors ${theme === 'day' ? 'bg-sky-500' : 'bg-gray-700 hover:bg-gray-600'} ${isSidebarFocused && focusableItems[focusedIndex].id === 'theme-day' ? 'ring-2 ring-yellow-400' : ''}`}>Day</button>
                    <button onClick={() => onSetTheme('afternoon')} className={`py-2 rounded-lg transition-colors ${theme === 'afternoon' ? 'bg-orange-500' : 'bg-gray-700 hover:bg-gray-600'} ${isSidebarFocused && focusableItems[focusedIndex].id === 'theme-afternoon' ? 'ring-2 ring-yellow-400' : ''}`}>Noon</button>
                    <button onClick={() => onSetTheme('night')} className={`py-2 rounded-lg transition-colors ${theme === 'night' ? 'bg-indigo-900' : 'bg-gray-700 hover:bg-gray-600'} ${isSidebarFocused && focusableItems[focusedIndex].id === 'theme-night' ? 'ring-2 ring-yellow-400' : ''}`}>Night</button>
                    <button onClick={() => onSetTheme('twilight')} className={`py-2 rounded-lg transition-colors ${theme === 'twilight' ? 'bg-purple-800' : 'bg-gray-700 hover:bg-gray-600'} ${isSidebarFocused && focusableItems[focusedIndex].id === 'theme-twilight' ? 'ring-2 ring-yellow-400' : ''}`}>Dusk</button>
                </div>
            </SidebarSection>
            
            <SidebarSection title="Controls">
                <div className="flex flex-col gap-1 p-2 bg-gray-900/50 rounded-lg">
                    {renderControlHelp()}
                </div>
            </SidebarSection>
        </div>
    );
};
