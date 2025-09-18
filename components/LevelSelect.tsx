import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LevelData, PlatformData, CheckpointData, TrapData } from '../types';
import { getLevels, deleteLevel, saveLevel } from '../utils/levelStore';
import { useGamepadInput } from '../hooks/useGamepadInput';

interface LevelSelectProps {
    onPlayLevel: (level: LevelData) => void;
    onEditLevel: (level: LevelData) => void;
    onBack: () => void;
}

const isValidPlatform = (p: any): p is PlatformData =>
    typeof p.id === 'number' &&
    typeof p.position?.x === 'number' &&
    typeof p.position?.y === 'number' &&
    typeof p.width === 'number' &&
    typeof p.height === 'number' &&
    (p.movement === undefined || (
        typeof p.movement.speed === 'number' &&
        Array.isArray(p.movement.path) &&
        p.movement.path.length === 2 &&
        typeof p.movement.path[0]?.x === 'number' &&
        typeof p.movement.path[0]?.y === 'number' &&
        typeof p.movement.path[1]?.x === 'number' &&
        typeof p.movement.path[1]?.y === 'number'
    ));

const isValidLevelData = (data: any): data is LevelData => {
    return (
        data &&
        typeof data.name === 'string' &&
        Array.isArray(data.platforms) &&
        Array.isArray(data.checkpoints) &&
        (data.traps === undefined || Array.isArray(data.traps)) &&
        data.platforms.every(isValidPlatform) &&
        data.checkpoints.every((c: any): c is CheckpointData => 
            typeof c.id === 'number' &&
            typeof c.position?.x === 'number' &&
            typeof c.position?.y === 'number' &&
            typeof c.width === 'number' &&
            typeof c.height === 'number'
        ) &&
        (data.traps === undefined || data.traps.every((t: any): t is TrapData => 
            typeof t.id === 'number' &&
            typeof t.type === 'string' &&
            typeof t.position?.x === 'number' &&
            typeof t.position?.y === 'number' &&
            typeof t.width === 'number' &&
            typeof t.height === 'number' &&
            (t.platformId === undefined || t.platformId === null || typeof t.platformId === 'number')
        ))
    );
};

export const LevelSelect: React.FC<LevelSelectProps> = ({ onPlayLevel, onEditLevel, onBack }) => {
    const [levels, setLevels] = useState<LevelData[]>([]);
    const [isManaging, setIsManaging] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | HTMLButtonElement | null)[]>([]);

    const gamepadState = useGamepadInput();
    const prevGamepadState = useRef(gamepadState);
    const lastNavTime = useRef(0);
    const mountTime = useRef(Date.now());

    const focusableItems = useMemo(() => {
        const topButtons = [
            { id: 'import', action: () => fileInputRef.current?.click() },
            { id: 'manage', action: () => setIsManaging(m => !m) },
            { id: 'back', action: onBack },
        ];
        const levelItems = levels.flatMap(level => isManaging 
            ? [{ id: `remove-${level.name}`, action: () => handleRemove(level.name), level }]
            : [
                { id: `play-${level.name}`, action: () => onPlayLevel(level), level },
                { id: `edit-${level.name}`, action: () => onEditLevel(level), level }
            ]
        );
        return [...topButtons, ...levelItems];
    }, [levels, isManaging, onBack, onPlayLevel, onEditLevel]);
    
    useEffect(() => {
      itemRefs.current = itemRefs.current.slice(0, focusableItems.length);
    }, [focusableItems]);

    useEffect(() => {
        const focusedItem = itemRefs.current[focusedIndex];
        if (focusedItem && scrollContainerRef.current) {
            const containerRect = scrollContainerRef.current.getBoundingClientRect();
            const itemRect = focusedItem.getBoundingClientRect();
            if (itemRect.bottom > containerRect.bottom) {
                scrollContainerRef.current.scrollTop += itemRect.bottom - containerRect.bottom;
            } else if (itemRect.top < containerRect.top) {
                scrollContainerRef.current.scrollTop -= containerRect.top - itemRect.top;
            }
        }
    }, [focusedIndex]);

    useEffect(() => {
        const now = Date.now();
        const navCooldown = 150;
        const inputGracePeriod = 200;

        const dpadUp = gamepadState.buttons[12]?.pressed && !prevGamepadState.current.buttons[12]?.pressed;
        const dpadDown = gamepadState.buttons[13]?.pressed && !prevGamepadState.current.buttons[13]?.pressed;
        const dpadLeft = gamepadState.buttons[14]?.pressed && !prevGamepadState.current.buttons[14]?.pressed;
        const dpadRight = gamepadState.buttons[15]?.pressed && !prevGamepadState.current.buttons[15]?.pressed;
        const aButtonPressed = gamepadState.buttons[0]?.pressed && !prevGamepadState.current.buttons[0]?.pressed;
        const bButtonPressed = gamepadState.buttons[1]?.pressed && !prevGamepadState.current.buttons[1]?.pressed;

        if (bButtonPressed) {
            if (now - mountTime.current > inputGracePeriod) {
                onBack();
            }
        }

        if (now - lastNavTime.current > navCooldown) {
            let moved = false;
            if (dpadDown) {
                setFocusedIndex(i => (i + 1) % focusableItems.length);
                moved = true;
            } else if (dpadUp) {
                setFocusedIndex(i => (i - 1 + focusableItems.length) % focusableItems.length);
                moved = true;
            } else if (dpadRight) {
                // Special logic for horizontal nav on level buttons
                const currentItem = focusableItems[focusedIndex];
                if (currentItem && 'level' in currentItem && !isManaging) {
                    setFocusedIndex(i => Math.min(focusableItems.length - 1, i + 1));
                    moved = true;
                }
            } else if (dpadLeft) {
                 const currentItem = focusableItems[focusedIndex];
                if (currentItem && 'level' in currentItem && !isManaging) {
                    setFocusedIndex(i => Math.max(0, i - 1));
                    moved = true;
                }
            }
            if (moved) lastNavTime.current = now;
        }

        if (aButtonPressed && focusableItems[focusedIndex]) {
            if (now - mountTime.current > inputGracePeriod) {
                focusableItems[focusedIndex].action();
            }
        }

        prevGamepadState.current = gamepadState;

    }, [gamepadState, focusableItems, focusedIndex, onBack, isManaging]);


    useEffect(() => {
        setLevels(getLevels());
    }, []);
    
    useEffect(() => {
        // Reset focus when toggling manage mode to avoid being out of bounds
        setFocusedIndex(0);
    }, [isManaging]);

    const handleRemove = (levelName: string) => {
        if (window.confirm(`Are you sure you want to remove "${levelName}"? This action cannot be undone.`)) {
            deleteLevel(levelName);
            setLevels(getLevels());
        }
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') throw new Error("File is not readable");
                const parsedData = JSON.parse(result);
                
                if (isValidLevelData(parsedData)) {
                    saveLevel(parsedData);
                    setLevels(getLevels());
                    alert(`Level "${parsedData.name}" imported successfully!`);
                } else {
                    throw new Error("Invalid level file format.");
                }
            } catch (error) {
                console.error("Failed to import level:", error);
                alert(`Error importing level: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="w-full max-w-2xl bg-gray-800 bg-opacity-70 p-4 sm:p-8 rounded-2xl shadow-2xl text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl sm:text-4xl font-bold">My Levels</h1>
                <div className="flex gap-2 sm:gap-4">
                    {/* FIX: Changed ref callback to use a block body to prevent an implicit return value, which was causing a TypeScript error. */}
                    <button ref={(el) => { itemRefs.current[0] = el; }} onClick={() => focusableItems[0].action()} className={`px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors ${focusedIndex === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                        Import
                    </button>
                     {/* FIX: Changed ref callback to use a block body to prevent an implicit return value, which was causing a TypeScript error. */}
                     <button ref={(el) => { itemRefs.current[1] = el; }} onClick={() => focusableItems[1].action()} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isManaging ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'} ${focusedIndex === 1 ? 'ring-2 ring-yellow-400' : ''}`}>
                        {isManaging ? 'Done' : 'Manage'}
                    </button>
                    {/* FIX: Changed ref callback to use a block body to prevent an implicit return value, which was causing a TypeScript error. */}
                    <button ref={(el) => { itemRefs.current[2] = el; }} onClick={() => focusableItems[2].action()} className={`px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors ${focusedIndex === 2 ? 'ring-2 ring-yellow-400' : ''}`}>
                        &lt; Back
                    </button>
                </div>
            </div>
           
            <div ref={scrollContainerRef} className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {levels.length > 0 ? (
                    levels.map(level => {
                        const baseIndex = 3 + levels.findIndex(l => l.name === level.name) * (isManaging ? 1 : 2);
                        return (
                        // FIX: Changed ref callback to use a block body to prevent an implicit return value, which was causing a TypeScript error.
                        <div key={level.name} ref={(el) => { itemRefs.current[baseIndex] = el; }} className={`flex justify-between items-center gap-4 p-4 bg-gray-700 rounded-lg transition-colors ${(focusedIndex === baseIndex || (!isManaging && focusedIndex === baseIndex + 1)) ? 'bg-gray-600' : ''}`}>
                            <span className="font-semibold text-lg truncate min-w-0">{level.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {isManaging ? (
                                    <button 
                                        // FIX: Changed ref callback to use a block body to prevent an implicit return value, which was causing a TypeScript error.
                                        ref={(el) => { itemRefs.current[baseIndex] = el; }}
                                        onClick={() => handleRemove(level.name)} 
                                        className={`px-4 py-2 bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors text-white font-bold ${focusedIndex === baseIndex ? 'ring-2 ring-yellow-400' : ''}`}
                                        aria-label={`Remove level ${level.name}`}
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <>
                                        {/* FIX: Changed ref callback to use a block body to prevent an implicit return value, which was causing a TypeScript error. */}
                                        <button ref={(el) => { itemRefs.current[baseIndex] = el; }} onClick={() => onPlayLevel(level)} className={`px-3 py-1 bg-green-500 rounded hover:bg-green-400 transition-colors ${focusedIndex === baseIndex ? 'ring-2 ring-yellow-400' : ''}`}>Play</button>
                                        {/* FIX: Changed ref callback to use a block body to prevent an implicit return value, which was causing a TypeScript error. */}
                                        <button ref={(el) => { itemRefs.current[baseIndex + 1] = el; }} onClick={() => onEditLevel(level)} className={`px-3 py-1 bg-blue-500 rounded hover:bg-blue-400 transition-colors ${focusedIndex === baseIndex + 1 ? 'ring-2 ring-yellow-400' : ''}`}>Edit</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )})
                ) : (
                    <p className="text-center text-gray-400 italic py-8">No custom levels found. Create one in the editor!</p>
                )}
            </div>
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileImport}
            />
        </div>
    );
};
