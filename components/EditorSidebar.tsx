import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlatformData, SignData, Theme, SignVariant } from '../types';
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
    selectedObject: {id: number, type: 'platform', data: PlatformData } | {id: number, type: 'sign', data: SignData } | null;
    onUpdatePlatform: (id: number, updates: Partial<PlatformData>) => void;
    onUpdateSign: (id: number, updates: Partial<SignData>) => void;
    activeTool: EditorTool;
    onSetTool: (tool: EditorTool) => void;
    gamepadState: GamepadState;
    prevGamepadState: GamepadState;
    isSidebarFocused: boolean;
    onSetIsSidebarFocused: (isFocused: boolean) => void;
    onClose: () => void;
}

// --- SVG Icons for Tools ---
const SelectIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM12 13c-3.132 0-5.823 2.02-6.718 4.786a.75.75 0 00.686.964H18.03a.75.75 0 00.687-.964C17.823 15.02 15.132 13 12 13z"></path></svg>;
const PlatformIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3v18h18V3zm-2 16H5V5h14v14z"></path></svg>;
const CheckpointIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"></path></svg>;
const TrapIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 20H2L12 4l10 16zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></svg>;
const SignIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"></path><path d="M6 14h12v2H6z M11 10h2v2h-2z M20 7V5h-2v2h-2V5h-2v2h-2V5H8v2H6V5H4v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2z"></path><rect x="4" y="18" width="16" height="2"/><path d="M11 16h2v-2h-2v2zm-4 0h2v-2H7v2zm8 0h2v-2h-2v2zM12 7.5l-3.5 3.5h7L12 7.5zM18 4H6v2h12V4z"/></svg>;


const THEMES: Theme[] = ['day', 'afternoon', 'night', 'twilight'];
const TOOLS: { id: EditorTool; icon: React.ReactNode; name: string }[] = [
    { id: 'select', icon: <SelectIcon />, name: 'Select' },
    { id: 'add-platform', icon: <PlatformIcon />, name: 'Platform' },
    { id: 'add-checkpoint', icon: <CheckpointIcon />, name: 'Checkpoint' },
    { id: 'add-trap', icon: <TrapIcon />, name: 'Trap' },
    { id: 'add-sign', icon: <SignIcon />, name: 'Sign' },
];
const SIGN_VARIANTS: SignVariant[] = ['effortless', 'easy', 'medium', 'hard', 'impossible', 'extreme'];
const SIGN_VARIANT_NAMES: Record<SignVariant, string> = {
  effortless: 'Effortless',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  impossible: 'Impossible',
  extreme: 'Extreme',
};

const PropertiesPanel: React.FC<Pick<EditorSidebarProps, 'selectedObject' | 'onUpdatePlatform' | 'onUpdateSign'>> = ({ selectedObject, onUpdatePlatform, onUpdateSign }) => {
    if (!selectedObject) {
        return <div className="text-gray-400 italic text-center p-4">Select an object to edit its properties.</div>;
    }

    const { type, data } = selectedObject;

    const handleMovementToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type !== 'platform') return;
        if (e.target.checked) {
            onUpdatePlatform(data.id, {
                movement: {
                    path: [data.position, { x: data.position.x + 100, y: data.position.y }],
                    speed: 50,
                },
            });
        } else {
            onUpdatePlatform(data.id, { movement: undefined });
        }
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type !== 'platform' || !data.movement) return;
        onUpdatePlatform(data.id, {
            movement: { ...data.movement, speed: Number(e.target.value) },
        });
    };
    
    const handleSignVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (type !== 'sign') return;
        onUpdateSign(data.id, { variant: e.target.value as SignVariant });
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 capitalize">{type} Properties</h3>
            
            {type === 'platform' && (
                <div className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2 text-gray-300">
                            <input type="checkbox" checked={!!data.movement} onChange={handleMovementToggle} className="w-4 h-4 rounded text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-600"/>
                            Enable Movement
                        </label>
                    </div>
                    {data.movement && (
                         <div>
                            <label htmlFor="speed" className="block text-sm font-medium text-gray-300 mb-1">Movement Speed</label>
                            <div className="flex items-center gap-2">
                                <input id="speed" type="range" min="10" max="200" value={data.movement.speed} onChange={handleSpeedChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                                <span className="text-white font-mono w-12 text-center">{data.movement.speed}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {type === 'sign' && (
                <div>
                    <label htmlFor="sign-variant" className="block text-sm font-medium text-gray-300 mb-1">Sign Variant</label>
                    <select
                        id="sign-variant"
                        value={data.variant}
                        onChange={handleSignVariantChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 capitalize"
                    >
                        {SIGN_VARIANTS.map(variant => (
                            <option key={variant} value={variant}>{SIGN_VARIANT_NAMES[variant]}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};


export const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
    const { onSave, onExport, onExit, onRequestTestLevel, levelName, onLevelNameChange, saveStatus, onDeleteSelected, isObjectSelected, theme, onSetTheme, activeTool, onSetTool, gamepadState, prevGamepadState, isSidebarFocused, onSetIsSidebarFocused, onClose } = props;
    
    const [focusedIndex, setFocusedIndex] = useState(0);
    const lastNavTime = useRef(0);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);

    const focusableItems = useMemo(() => {
        const items = [
            { id: 'levelName', type: 'input' },
            { id: 'save', type: 'button', action: onSave },
            { id: 'test', type: 'button', action: onRequestTestLevel },
            { id: 'export', type: 'button', action: onExport },
            { id: 'exit', type: 'button', action: onExit },
            { id: 'theme-day', type: 'button', action: () => onSetTheme('day') },
            { id: 'theme-afternoon', type: 'button', action: () => onSetTheme('afternoon') },
            { id: 'theme-night', type: 'button', action: () => onSetTheme('night') },
            { id: 'theme-twilight', type: 'button', action: () => onSetTheme('twilight') },
            ...TOOLS.map(tool => ({ id: `tool-${tool.id}`, type: 'button' as const, action: () => onSetTool(tool.id) })),
        ];
        if (isObjectSelected) {
            items.push({ id: 'delete', type: 'button', action: onDeleteSelected });
        }
        return items;
    }, [isObjectSelected, onSave, onRequestTestLevel, onExport, onExit, onSetTheme, onSetTool, onDeleteSelected]);
    
    useEffect(() => {
        if (!isSidebarFocused) return;
        const now = Date.now();
        const navCooldown = 150;
        
        const dpadUp = gamepadState.buttons[12]?.pressed && !prevGamepadState.buttons[12]?.pressed;
        const dpadDown = gamepadState.buttons[13]?.pressed && !prevGamepadState.buttons[13]?.pressed;
        const aButtonPressed = gamepadState.buttons[0]?.pressed && !prevGamepadState.buttons[0]?.pressed;
        const bButtonPressed = gamepadState.buttons[1]?.pressed && !prevGamepadState.buttons[1]?.pressed;
        
        if (bButtonPressed) {
            onSetIsSidebarFocused(false);
            return;
        }
        
        if (now - lastNavTime.current > navCooldown) {
            if (dpadDown) {
                setFocusedIndex(i => (i + 1) % focusableItems.length);
                lastNavTime.current = now;
            } else if (dpadUp) {
                setFocusedIndex(i => (i - 1 + focusableItems.length) % focusableItems.length);
                lastNavTime.current = now;
            }
        }
        
        if (aButtonPressed && focusableItems[focusedIndex]) {
            const item = focusableItems[focusedIndex];
            if (item.type === 'input') {
                itemRefs.current[focusedIndex]?.focus();
            } else if (item.type === 'button') {
                item.action();
            }
        }
    }, [gamepadState, prevGamepadState, isSidebarFocused, onSetIsSidebarFocused, focusableItems]);
    
    useEffect(() => {
        if (isSidebarFocused) {
            const focusedItem = itemRefs.current[focusedIndex];
            if (focusedItem && document.activeElement !== focusedItem && focusableItems[focusedIndex].type === 'button') {
                focusedItem.focus();
            }
        }
    }, [focusedIndex, isSidebarFocused, focusableItems]);


    return (
        <div className="h-full flex flex-col text-white" onFocus={() => onSetIsSidebarFocused(true)} onBlur={() => onSetIsSidebarFocused(false)}>
            <div className="p-4 bg-gray-900 flex justify-between items-center">
                <h2 className="text-xl font-bold">Level Editor</h2>
                 <button onClick={onClose} className="lg:hidden p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {/* General Controls */}
                <div className="p-4 space-y-3 border-b border-gray-700">
                    <div>
                        <label htmlFor="levelName" className="block text-sm font-medium text-gray-300 mb-1">Level Name</label>
                        <input
                            ref={el => itemRefs.current[0] = el}
                            type="text"
                            id="levelName"
                            value={levelName}
                            onChange={e => onLevelNameChange(e.target.value)}
                            className={`w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 ${isSidebarFocused && focusedIndex === 0 ? 'ring-2 ring-yellow-400' : ''}`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button ref={el => itemRefs.current[1] = el as HTMLElement} onClick={onSave} className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${isSidebarFocused && focusedIndex === 1 ? 'ring-2 ring-yellow-400' : ''} ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`} disabled={saveStatus === 'saving'}>
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
                        </button>
                        <button ref={el => itemRefs.current[2] = el as HTMLElement} onClick={onRequestTestLevel} className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors bg-green-600 hover:bg-green-500 ${isSidebarFocused && focusedIndex === 2 ? 'ring-2 ring-yellow-400' : ''}`}>Test</button>
                        <button ref={el => itemRefs.current[3] = el as HTMLElement} onClick={onExport} className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-500 ${isSidebarFocused && focusedIndex === 3 ? 'ring-2 ring-yellow-400' : ''}`}>Export</button>
                        <button ref={el => itemRefs.current[4] = el as HTMLElement} onClick={onExit} className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors bg-gray-600 hover:bg-gray-500 ${isSidebarFocused && focusedIndex === 4 ? 'ring-2 ring-yellow-400' : ''}`}>Exit</button>
                    </div>
                </div>

                {/* Theme Selector */}
                <div className="p-4 border-b border-gray-700">
                     <h3 className="text-lg font-semibold text-white mb-2">Theme</h3>
                     <div className="grid grid-cols-2 gap-2">
                         {THEMES.map((t, i) => (
                             <button
                                ref={el => itemRefs.current[5 + i] = el as HTMLElement}
                                key={t}
                                onClick={() => onSetTheme(t)}
                                className={`px-4 py-2 rounded-lg capitalize transition-colors text-sm ${theme === t ? 'bg-yellow-500 font-bold' : 'bg-gray-700 hover:bg-gray-600'} ${isSidebarFocused && focusedIndex === 5+i ? 'ring-2 ring-yellow-400' : ''}`}
                             >
                                 {t}
                             </button>
                         ))}
                     </div>
                </div>
                
                {/* Tools */}
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Tools</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {TOOLS.map((tool, i) => (
                            <button
                                ref={el => itemRefs.current[9 + i] = el as HTMLElement}
                                key={tool.id}
                                onClick={() => onSetTool(tool.id)}
                                className={`p-2 rounded-lg flex items-center justify-center transition-colors ${activeTool === tool.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'} ${isSidebarFocused && focusedIndex === 9 + i ? 'ring-2 ring-yellow-400' : ''}`}
                                title={tool.name}
                                aria-label={tool.name}
                            >
                                <div className="w-6 h-6">{tool.icon}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Properties Panel */}
                <PropertiesPanel {...props} />
            </div>

            {isObjectSelected && (
                <div className="p-4 border-t border-gray-700">
                    <button
                        ref={el => itemRefs.current[focusableItems.length - 1] = el as HTMLElement}
                        onClick={onDeleteSelected}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors bg-rose-600 hover:bg-rose-500 ${isSidebarFocused && focusedIndex === focusableItems.length - 1 ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                        Delete Selected
                    </button>
                </div>
            )}
        </div>
    );
};
