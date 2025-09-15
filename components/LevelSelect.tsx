import React, { useState, useEffect, useRef } from 'react';
import { LevelData, PlatformData, CheckpointData } from '../types';
import { getLevels, deleteLevel, saveLevel } from '../utils/levelStore';

interface LevelSelectProps {
    onPlayLevel: (level: LevelData) => void;
    onEditLevel: (level: LevelData) => void;
    onBack: () => void;
}

const isValidLevelData = (data: any): data is LevelData => {
    return (
        data &&
        typeof data.name === 'string' &&
        Array.isArray(data.platforms) &&
        Array.isArray(data.checkpoints) &&
        data.platforms.every((p: any): p is PlatformData => 
            typeof p.id === 'number' &&
            typeof p.position?.x === 'number' &&
            typeof p.position?.y === 'number' &&
            typeof p.width === 'number' &&
            typeof p.height === 'number'
        ) &&
        data.checkpoints.every((c: any): c is CheckpointData => 
            typeof c.id === 'number' &&
            typeof c.position?.x === 'number' &&
            typeof c.position?.y === 'number' &&
            typeof c.width === 'number' &&
            typeof c.height === 'number'
        )
    );
};

export const LevelSelect: React.FC<LevelSelectProps> = ({ onPlayLevel, onEditLevel, onBack }) => {
    const [levels, setLevels] = useState<LevelData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLevels(getLevels());
    }, []);

    const handleDelete = (levelName: string) => {
        if (window.confirm(`Are you sure you want to delete "${levelName}"?`)) {
            deleteLevel(levelName); // The side-effect: remove from storage
            // Update state directly from the previous state for a guaranteed UI update
            setLevels(prevLevels => prevLevels.filter(level => level.name !== levelName));
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
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
                    setLevels(getLevels()); // Re-fetch after import
                    alert(`Level "${parsedData.name}" imported successfully!`);
                } else {
                    throw new Error("Invalid level file format.");
                }
            } catch (error) {
                console.error("Failed to import level:", error);
                alert(`Error importing level: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                // Reset file input to allow importing the same file again
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="w-full max-w-2xl bg-gray-800 bg-opacity-70 p-8 rounded-2xl shadow-2xl text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">My Levels</h1>
                <div className="flex gap-4">
                    <button onClick={handleImportClick} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                        Import Level
                    </button>
                    <button onClick={onBack} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                        &lt; Back to Menu
                    </button>
                </div>
            </div>
           
            <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                {levels.length > 0 ? (
                    levels.map(level => (
                        <div key={level.name} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                            <span className="font-semibold text-lg">{level.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => onPlayLevel(level)} className="px-3 py-1 bg-green-500 rounded hover:bg-green-400 transition-colors">Play</button>
                                <button onClick={() => onEditLevel(level)} className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-400 transition-colors">Edit</button>
                                <button onClick={() => handleDelete(level.name)} className="px-3 py-1 bg-red-600 rounded hover:bg-red-500 transition-colors">Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400 italic">No custom levels found. Create one in the editor!</p>
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